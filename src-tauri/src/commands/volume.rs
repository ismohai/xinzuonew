use crate::db;
use crate::db::config;
use crate::db::models::Volume;
use rusqlite::params;

/// 辅助：打开某本书的 book.db
fn open_book(storage_path: &str) -> Result<rusqlite::Connection, String> {
    let cfg = config::load_config()?;
    db::open_book_db(&cfg, storage_path)
}

/// 创建分卷
#[tauri::command]
pub async fn create_volume(storage_path: String, name: String) -> Result<Volume, String> {
    let conn = open_book(&storage_path)?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    // 新分卷排在最后
    let max_order: i64 = conn
        .query_row("SELECT COALESCE(MAX(sort_order), -1) FROM volumes", [], |r| r.get(0))
        .map_err(|e| format!("查询排序失败: {}", e))?;

    conn.execute(
        "INSERT INTO volumes (id, name, sort_order, created_at) VALUES (?1, ?2, ?3, ?4)",
        params![id, name, max_order + 1, now],
    )
    .map_err(|e| format!("创建分卷失败: {}", e))?;

    Ok(Volume {
        id,
        name,
        sort_order: max_order + 1,
        created_at: now,
    })
}

/// 获取所有分卷
#[tauri::command]
pub async fn list_volumes(storage_path: String) -> Result<Vec<Volume>, String> {
    let conn = open_book(&storage_path)?;
    let mut stmt = conn
        .prepare("SELECT id, name, sort_order, created_at FROM volumes ORDER BY sort_order ASC")
        .map_err(|e| format!("查询分卷失败: {}", e))?;

    let volumes = stmt
        .query_map([], |row| {
            Ok(Volume {
                id: row.get(0)?,
                name: row.get(1)?,
                sort_order: row.get(2)?,
                created_at: row.get(3)?,
            })
        })
        .map_err(|e| format!("读取分卷失败: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("解析分卷失败: {}", e))?;

    Ok(volumes)
}

/// 重命名分卷
#[tauri::command]
pub async fn rename_volume(storage_path: String, id: String, name: String) -> Result<(), String> {
    let conn = open_book(&storage_path)?;
    conn.execute("UPDATE volumes SET name = ?1 WHERE id = ?2", params![name, id])
        .map_err(|e| format!("重命名分卷失败: {}", e))?;
    Ok(())
}

/// 重新排序分卷（传入按新顺序排列的 ID 列表）
#[tauri::command]
pub async fn reorder_volumes(storage_path: String, ids: Vec<String>) -> Result<(), String> {
    let conn = open_book(&storage_path)?;
    for (i, id) in ids.iter().enumerate() {
        conn.execute(
            "UPDATE volumes SET sort_order = ?1 WHERE id = ?2",
            params![i as i64, id],
        )
        .map_err(|e| format!("排序分卷失败: {}", e))?;
    }
    Ok(())
}

/// 删除分卷（将分卷及其下所有章节移入回收站）
#[tauri::command]
pub async fn delete_volume(storage_path: String, id: String) -> Result<(), String> {
    let conn = open_book(&storage_path)?;
    let now = chrono::Utc::now().to_rfc3339();

    // 先把该卷下所有章节移入回收站
    let mut stmt = conn
        .prepare("SELECT id, volume_id, name, content, l2_summary, l3_title, status, word_count, sort_order, created_at, updated_at FROM chapters WHERE volume_id = ?1")
        .map_err(|e| format!("查询章节失败: {}", e))?;

    let chapters: Vec<(String, String)> = stmt
        .query_map(params![id], |row| {
            let ch_id: String = row.get(0)?;
            // 序列化整行为 JSON
            let data = serde_json::json!({
                "id": ch_id,
                "volume_id": row.get::<_, String>(1)?,
                "name": row.get::<_, String>(2)?,
                "content": row.get::<_, String>(3)?,
                "l2_summary": row.get::<_, Option<String>>(4)?,
                "l3_title": row.get::<_, Option<String>>(5)?,
                "status": row.get::<_, String>(6)?,
                "word_count": row.get::<_, i64>(7)?,
                "sort_order": row.get::<_, i64>(8)?,
                "created_at": row.get::<_, String>(9)?,
                "updated_at": row.get::<_, String>(10)?,
            });
            Ok((ch_id, data.to_string()))
        })
        .map_err(|e| format!("读取章节失败: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("解析章节失败: {}", e))?;

    for (ch_id, data_json) in &chapters {
        let trash_id = uuid::Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO trash (id, original_table, original_id, data_json, deleted_at, deleted_by) VALUES (?1, 'chapters', ?2, ?3, ?4, 'user')",
            params![trash_id, ch_id, data_json, now],
        )
        .map_err(|e| format!("移入回收站失败: {}", e))?;
    }

    // 删除章节
    conn.execute("DELETE FROM chapters WHERE volume_id = ?1", params![id])
        .map_err(|e| format!("删除章节失败: {}", e))?;

    // 将分卷本身移入回收站
    let vol_data: String = conn
        .query_row(
            "SELECT json_object('id', id, 'name', name, 'sort_order', sort_order, 'created_at', created_at) FROM volumes WHERE id = ?1",
            params![id],
            |row| row.get(0),
        )
        .map_err(|e| format!("序列化分卷失败: {}", e))?;

    let trash_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO trash (id, original_table, original_id, data_json, deleted_at, deleted_by) VALUES (?1, 'volumes', ?2, ?3, ?4, 'user')",
        params![trash_id, id, vol_data, now],
    )
    .map_err(|e| format!("分卷移入回收站失败: {}", e))?;

    conn.execute("DELETE FROM volumes WHERE id = ?1", params![id])
        .map_err(|e| format!("删除分卷失败: {}", e))?;

    Ok(())
}
