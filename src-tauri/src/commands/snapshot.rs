use crate::db;
use crate::db::config;
use crate::db::models::{Snapshot, TrashItem};
use rusqlite::params;

fn open_book(storage_path: &str) -> Result<rusqlite::Connection, String> {
    let cfg = config::load_config()?;
    db::open_book_db(&cfg, storage_path)
}

// ============================================================================
// 快照
// ============================================================================

/// 获取某章节的快照列表
#[tauri::command]
pub async fn list_snapshots(storage_path: String, chapter_id: String) -> Result<Vec<Snapshot>, String> {
    let conn = open_book(&storage_path)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, chapter_id, snapshot_content, created_at
             FROM snapshots WHERE chapter_id = ?1 ORDER BY created_at DESC",
        )
        .map_err(|e| format!("查询快照失败: {}", e))?;

    let items = stmt
        .query_map(params![chapter_id], |row| {
            Ok(Snapshot {
                id: row.get(0)?,
                chapter_id: row.get(1)?,
                snapshot_content: row.get(2)?,
                created_at: row.get(3)?,
            })
        })
        .map_err(|e| format!("读取快照失败: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("解析快照失败: {}", e))?;

    Ok(items)
}

/// 从快照恢复章节内容
#[tauri::command]
pub async fn restore_snapshot(storage_path: String, snapshot_id: String) -> Result<(), String> {
    let conn = open_book(&storage_path)?;
    let now = chrono::Utc::now().to_rfc3339();

    // 读取快照内容
    let (chapter_id, content): (String, String) = conn
        .query_row(
            "SELECT chapter_id, snapshot_content FROM snapshots WHERE id = ?1",
            params![snapshot_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|e| format!("读取快照失败: {}", e))?;

    let word_count = content.chars().count() as i64;

    // 写回章节
    conn.execute(
        "UPDATE chapters SET content = ?1, word_count = ?2, updated_at = ?3 WHERE id = ?4",
        params![content, word_count, now, chapter_id],
    )
    .map_err(|e| format!("恢复快照失败: {}", e))?;

    Ok(())
}

// ============================================================================
// 里程碑
// ============================================================================

/// 创建里程碑（复制整个 book.db）
#[tauri::command]
pub async fn create_milestone(storage_path: String, name: String) -> Result<String, String> {
    let cfg = config::load_config()?;
    let src = config::book_db_path(&cfg, &storage_path);
    let milestones = config::milestones_dir(&cfg, &storage_path);
    std::fs::create_dir_all(&milestones)
        .map_err(|e| format!("创建里程碑目录失败: {}", e))?;

    let ts = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    let filename = format!("{}_{}.db", name, ts);
    let dest = milestones.join(&filename);

    std::fs::copy(&src, &dest)
        .map_err(|e| format!("复制数据库失败: {}", e))?;

    Ok(filename)
}

// ============================================================================
// 回收站
// ============================================================================

/// 获取回收站列表
#[tauri::command]
pub async fn list_trash(storage_path: String) -> Result<Vec<TrashItem>, String> {
    let conn = open_book(&storage_path)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, original_table, original_id, data_json, deleted_at, deleted_by
             FROM trash ORDER BY deleted_at DESC",
        )
        .map_err(|e| format!("查询回收站失败: {}", e))?;

    let items = stmt
        .query_map([], |row| {
            Ok(TrashItem {
                id: row.get(0)?,
                original_table: row.get(1)?,
                original_id: row.get(2)?,
                data_json: row.get(3)?,
                deleted_at: row.get(4)?,
                deleted_by: row.get(5)?,
            })
        })
        .map_err(|e| format!("读取回收站失败: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("解析回收站失败: {}", e))?;

    Ok(items)
}

/// 从回收站恢复记录
#[tauri::command]
pub async fn restore_from_trash(storage_path: String, trash_id: String) -> Result<(), String> {
    let conn = open_book(&storage_path)?;

    let (original_table, data_json): (String, String) = conn
        .query_row(
            "SELECT original_table, data_json FROM trash WHERE id = ?1",
            params![trash_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|e| format!("读取回收站记录失败: {}", e))?;

    let data: serde_json::Value = serde_json::from_str(&data_json)
        .map_err(|e| format!("解析回收站数据失败: {}", e))?;

    // 根据原始表名恢复数据
    match original_table.as_str() {
        "chapters" => restore_chapter(&conn, &data)?,
        "volumes" => restore_volume(&conn, &data)?,
        "entities" => restore_entity(&conn, &data)?,
        _ => return Err(format!("不支持恢复表: {}", original_table)),
    }

    // 删除回收站记录
    conn.execute("DELETE FROM trash WHERE id = ?1", params![trash_id])
        .map_err(|e| format!("删除回收站记录失败: {}", e))?;

    Ok(())
}

/// 清空过期的回收站记录
#[tauri::command]
pub async fn clean_expired_trash(storage_path: String, retention_days: i64) -> Result<i64, String> {
    let conn = open_book(&storage_path)?;
    let cutoff = chrono::Utc::now() - chrono::Duration::days(retention_days);
    let cutoff_str = cutoff.to_rfc3339();

    let count = conn
        .execute(
            "DELETE FROM trash WHERE deleted_at < ?1",
            params![cutoff_str],
        )
        .map_err(|e| format!("清理回收站失败: {}", e))?;

    Ok(count as i64)
}

// ============================================================================
// 恢复辅助函数
// ============================================================================

fn restore_chapter(conn: &rusqlite::Connection, data: &serde_json::Value) -> Result<(), String> {
    conn.execute(
        "INSERT OR REPLACE INTO chapters (id, volume_id, name, content, l2_summary, l3_title, status, word_count, sort_order, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            data["id"].as_str().unwrap_or_default(),
            data["volume_id"].as_str().unwrap_or_default(),
            data["name"].as_str().unwrap_or_default(),
            data["content"].as_str().unwrap_or_default(),
            data["l2_summary"].as_str(),
            data["l3_title"].as_str(),
            data["status"].as_str().unwrap_or("draft"),
            data["word_count"].as_i64().unwrap_or(0),
            data["sort_order"].as_i64().unwrap_or(0),
            data["created_at"].as_str().unwrap_or_default(),
            data["updated_at"].as_str().unwrap_or_default(),
        ],
    )
    .map_err(|e| format!("恢复章节失败: {}", e))?;
    Ok(())
}

fn restore_volume(conn: &rusqlite::Connection, data: &serde_json::Value) -> Result<(), String> {
    conn.execute(
        "INSERT OR REPLACE INTO volumes (id, name, sort_order, created_at) VALUES (?1, ?2, ?3, ?4)",
        params![
            data["id"].as_str().unwrap_or_default(),
            data["name"].as_str().unwrap_or_default(),
            data["sort_order"].as_i64().unwrap_or(0),
            data["created_at"].as_str().unwrap_or_default(),
        ],
    )
    .map_err(|e| format!("恢复分卷失败: {}", e))?;
    Ok(())
}

fn restore_entity(conn: &rusqlite::Connection, data: &serde_json::Value) -> Result<(), String> {
    conn.execute(
        "INSERT OR REPLACE INTO entities (id, name, entity_type, attributes_json, status, inbox, first_chapter_id, last_chapter_id, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            data["id"].as_str().unwrap_or_default(),
            data["name"].as_str().unwrap_or_default(),
            data["entity_type"].as_str().unwrap_or_default(),
            data["attributes_json"].as_str().unwrap_or("{}"),
            data["status"].as_str().unwrap_or("alive"),
            data["inbox"].as_i64().unwrap_or(0),
            data["first_chapter_id"].as_str(),
            data["last_chapter_id"].as_str(),
            data["created_at"].as_str().unwrap_or_default(),
            data["updated_at"].as_str().unwrap_or_default(),
        ],
    )
    .map_err(|e| format!("恢复实体失败: {}", e))?;
    Ok(())
}
