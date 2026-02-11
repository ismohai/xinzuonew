use crate::db;
use crate::db::config;
use crate::db::models::Chapter;
use rusqlite::params;

fn open_book(storage_path: &str) -> Result<rusqlite::Connection, String> {
    let cfg = config::load_config()?;
    db::open_book_db(&cfg, storage_path)
}

/// 创建章节
#[tauri::command]
pub async fn create_chapter(
    storage_path: String,
    volume_id: String,
    name: String,
) -> Result<Chapter, String> {
    let conn = open_book(&storage_path)?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let max_order: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(sort_order), -1) FROM chapters WHERE volume_id = ?1",
            params![volume_id],
            |r| r.get(0),
        )
        .map_err(|e| format!("查询排序失败: {}", e))?;

    conn.execute(
        "INSERT INTO chapters (id, volume_id, name, content, status, word_count, sort_order, created_at, updated_at)
         VALUES (?1, ?2, ?3, '', 'draft', 0, ?4, ?5, ?6)",
        params![id, volume_id, name, max_order + 1, now, now],
    )
    .map_err(|e| format!("创建章节失败: {}", e))?;

    Ok(Chapter {
        id,
        volume_id,
        name,
        content: String::new(),
        l2_summary: None,
        l3_title: None,
        status: "draft".into(),
        word_count: 0,
        sort_order: max_order + 1,
        created_at: now.clone(),
        updated_at: now,
    })
}

/// 获取某卷下所有章节（不含正文，用于目录树）
#[tauri::command]
pub async fn list_chapters(storage_path: String, volume_id: String) -> Result<Vec<Chapter>, String> {
    let conn = open_book(&storage_path)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, volume_id, name, '', l2_summary, l3_title, status, word_count, sort_order, created_at, updated_at
             FROM chapters WHERE volume_id = ?1 ORDER BY sort_order ASC",
        )
        .map_err(|e| format!("查询章节失败: {}", e))?;

    let chapters = stmt
        .query_map(params![volume_id], |row| {
            Ok(Chapter {
                id: row.get(0)?,
                volume_id: row.get(1)?,
                name: row.get(2)?,
                content: row.get(3)?,
                l2_summary: row.get(4)?,
                l3_title: row.get(5)?,
                status: row.get(6)?,
                word_count: row.get(7)?,
                sort_order: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        })
        .map_err(|e| format!("读取章节失败: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("解析章节失败: {}", e))?;

    Ok(chapters)
}

/// 获取单个章节（含正文）
#[tauri::command]
pub async fn get_chapter(storage_path: String, id: String) -> Result<Chapter, String> {
    let conn = open_book(&storage_path)?;
    conn.query_row(
        "SELECT id, volume_id, name, content, l2_summary, l3_title, status, word_count, sort_order, created_at, updated_at
         FROM chapters WHERE id = ?1",
        params![id],
        |row| {
            Ok(Chapter {
                id: row.get(0)?,
                volume_id: row.get(1)?,
                name: row.get(2)?,
                content: row.get(3)?,
                l2_summary: row.get(4)?,
                l3_title: row.get(5)?,
                status: row.get(6)?,
                word_count: row.get(7)?,
                sort_order: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        },
    )
    .map_err(|e| format!("获取章节失败: {}", e))
}

/// 更新章节内容（自动计算字数，自动创建快照）
#[tauri::command]
pub async fn update_chapter(
    storage_path: String,
    id: String,
    content: String,
) -> Result<(), String> {
    let conn = open_book(&storage_path)?;
    let now = chrono::Utc::now().to_rfc3339();
    let word_count = content.chars().count() as i64;

    // 如果当前状态是 complete，编辑后变为 dirty
    conn.execute(
        "UPDATE chapters SET content = ?1, word_count = ?2, updated_at = ?3,
         status = CASE WHEN status = 'complete' THEN 'dirty' ELSE status END
         WHERE id = ?4",
        params![content, word_count, now, id],
    )
    .map_err(|e| format!("更新章节失败: {}", e))?;

    // 自动创建快照
    let snap_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO snapshots (id, chapter_id, snapshot_content, created_at) VALUES (?1, ?2, ?3, ?4)",
        params![snap_id, id, content, now],
    )
    .map_err(|e| format!("创建快照失败: {}", e))?;

    // 清理超出限制的旧快照（默认保留 20 条）
    conn.execute(
        "DELETE FROM snapshots WHERE chapter_id = ?1 AND id NOT IN (
            SELECT id FROM snapshots WHERE chapter_id = ?1 ORDER BY created_at DESC LIMIT 20
        )",
        params![id],
    )
    .map_err(|e| format!("清理旧快照失败: {}", e))?;

    Ok(())
}

/// 重命名章节
#[tauri::command]
pub async fn rename_chapter(storage_path: String, id: String, name: String) -> Result<(), String> {
    let conn = open_book(&storage_path)?;
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE chapters SET name = ?1, updated_at = ?2 WHERE id = ?3",
        params![name, now, id],
    )
    .map_err(|e| format!("重命名章节失败: {}", e))?;
    Ok(())
}

/// 重排章节顺序
#[tauri::command]
pub async fn reorder_chapters(storage_path: String, ids: Vec<String>) -> Result<(), String> {
    let conn = open_book(&storage_path)?;
    for (i, id) in ids.iter().enumerate() {
        conn.execute(
            "UPDATE chapters SET sort_order = ?1 WHERE id = ?2",
            params![i as i64, id],
        )
        .map_err(|e| format!("排序章节失败: {}", e))?;
    }
    Ok(())
}

/// 移动章节到另一个分卷
#[tauri::command]
pub async fn move_chapter(
    storage_path: String,
    id: String,
    target_volume_id: String,
) -> Result<(), String> {
    let conn = open_book(&storage_path)?;
    let now = chrono::Utc::now().to_rfc3339();

    let max_order: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(sort_order), -1) FROM chapters WHERE volume_id = ?1",
            params![target_volume_id],
            |r| r.get(0),
        )
        .map_err(|e| format!("查询排序失败: {}", e))?;

    conn.execute(
        "UPDATE chapters SET volume_id = ?1, sort_order = ?2, updated_at = ?3 WHERE id = ?4",
        params![target_volume_id, max_order + 1, now, id],
    )
    .map_err(|e| format!("移动章节失败: {}", e))?;

    Ok(())
}

/// 删除章节（移入回收站）
#[tauri::command]
pub async fn delete_chapter(storage_path: String, id: String) -> Result<(), String> {
    let conn = open_book(&storage_path)?;
    let now = chrono::Utc::now().to_rfc3339();

    let data_json: String = conn
        .query_row(
            "SELECT json_object('id', id, 'volume_id', volume_id, 'name', name, 'content', content,
             'l2_summary', l2_summary, 'l3_title', l3_title, 'status', status,
             'word_count', word_count, 'sort_order', sort_order,
             'created_at', created_at, 'updated_at', updated_at) FROM chapters WHERE id = ?1",
            params![id],
            |row| row.get(0),
        )
        .map_err(|e| format!("序列化章节失败: {}", e))?;

    let trash_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO trash (id, original_table, original_id, data_json, deleted_at, deleted_by) VALUES (?1, 'chapters', ?2, ?3, ?4, 'user')",
        params![trash_id, id, data_json, now],
    )
    .map_err(|e| format!("移入回收站失败: {}", e))?;

    conn.execute("DELETE FROM chapters WHERE id = ?1", params![id])
        .map_err(|e| format!("删除章节失败: {}", e))?;

    Ok(())
}

/// 标记章节完成状态
#[tauri::command]
pub async fn set_chapter_status(
    storage_path: String,
    id: String,
    status: String,
) -> Result<(), String> {
    let conn = open_book(&storage_path)?;
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE chapters SET status = ?1, updated_at = ?2 WHERE id = ?3",
        params![status, now, id],
    )
    .map_err(|e| format!("更新章节状态失败: {}", e))?;
    Ok(())
}
