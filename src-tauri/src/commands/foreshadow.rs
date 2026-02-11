use crate::db;
use crate::db::config;
use crate::db::models::Foreshadow;
use rusqlite::params;

fn open_book(storage_path: &str) -> Result<rusqlite::Connection, String> {
    let cfg = config::load_config()?;
    db::open_book_db(&cfg, storage_path)
}

/// 创建伏笔
#[tauri::command]
pub async fn create_foreshadow(
    storage_path: String,
    description: String,
    plant_chapter_id: Option<String>,
) -> Result<Foreshadow, String> {
    let conn = open_book(&storage_path)?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO foreshadows (id, description, plant_chapter_id, status, created_at, updated_at)
         VALUES (?1, ?2, ?3, 'open', ?4, ?5)",
        params![id, description, plant_chapter_id, now, now],
    )
    .map_err(|e| format!("创建伏笔失败: {}", e))?;

    Ok(Foreshadow {
        id,
        description,
        plant_chapter_id,
        reap_chapter_id: None,
        status: "open".into(),
        created_at: now.clone(),
        updated_at: now,
    })
}

/// 获取伏笔列表
#[tauri::command]
pub async fn list_foreshadows(storage_path: String) -> Result<Vec<Foreshadow>, String> {
    let conn = open_book(&storage_path)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, description, plant_chapter_id, reap_chapter_id, status, created_at, updated_at
             FROM foreshadows ORDER BY created_at DESC",
        )
        .map_err(|e| format!("查询伏笔失败: {}", e))?;

    let items = stmt
        .query_map([], |row| {
            Ok(Foreshadow {
                id: row.get(0)?,
                description: row.get(1)?,
                plant_chapter_id: row.get(2)?,
                reap_chapter_id: row.get(3)?,
                status: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
        .map_err(|e| format!("读取伏笔失败: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("解析伏笔失败: {}", e))?;

    Ok(items)
}

/// 回收伏笔（标记为已回收，关联回收章节）
#[tauri::command]
pub async fn resolve_foreshadow(
    storage_path: String,
    id: String,
    reap_chapter_id: String,
) -> Result<(), String> {
    let conn = open_book(&storage_path)?;
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE foreshadows SET status = 'resolved', reap_chapter_id = ?1, updated_at = ?2 WHERE id = ?3",
        params![reap_chapter_id, now, id],
    )
    .map_err(|e| format!("回收伏笔失败: {}", e))?;
    Ok(())
}

/// 删除伏笔
#[tauri::command]
pub async fn delete_foreshadow(storage_path: String, id: String) -> Result<(), String> {
    let conn = open_book(&storage_path)?;
    conn.execute("DELETE FROM foreshadows WHERE id = ?1", params![id])
        .map_err(|e| format!("删除伏笔失败: {}", e))?;
    Ok(())
}
