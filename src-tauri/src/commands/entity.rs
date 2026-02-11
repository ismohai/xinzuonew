use crate::db;
use crate::db::config;
use crate::db::models::Entity;
use rusqlite::params;

fn open_book(storage_path: &str) -> Result<rusqlite::Connection, String> {
    let cfg = config::load_config()?;
    db::open_book_db(&cfg, storage_path)
}

/// 创建实体
#[tauri::command]
pub async fn create_entity(
    storage_path: String,
    name: String,
    entity_type: String,
    attributes_json: String,
    inbox: bool,
) -> Result<Entity, String> {
    let conn = open_book(&storage_path)?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO entities (id, name, entity_type, attributes_json, status, inbox, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, 'alive', ?5, ?6, ?7)",
        params![id, name, entity_type, attributes_json, inbox as i32, now, now],
    )
    .map_err(|e| format!("创建实体失败: {}", e))?;

    Ok(Entity {
        id,
        name,
        entity_type,
        attributes_json,
        status: "alive".into(),
        inbox,
        first_chapter_id: None,
        last_chapter_id: None,
        created_at: now.clone(),
        updated_at: now,
    })
}

/// 获取实体列表（可按类型过滤）
#[tauri::command]
pub async fn list_entities(
    storage_path: String,
    entity_type: Option<String>,
    inbox_only: Option<bool>,
) -> Result<Vec<Entity>, String> {
    let conn = open_book(&storage_path)?;

    let sql = match (&entity_type, inbox_only) {
        (Some(_), Some(true)) => "SELECT id, name, entity_type, attributes_json, status, inbox, first_chapter_id, last_chapter_id, created_at, updated_at FROM entities WHERE entity_type = ?1 AND inbox = 1 ORDER BY created_at DESC",
        (Some(_), _) => "SELECT id, name, entity_type, attributes_json, status, inbox, first_chapter_id, last_chapter_id, created_at, updated_at FROM entities WHERE entity_type = ?1 ORDER BY created_at DESC",
        (None, Some(true)) => "SELECT id, name, entity_type, attributes_json, status, inbox, first_chapter_id, last_chapter_id, created_at, updated_at FROM entities WHERE inbox = 1 ORDER BY created_at DESC",
        _ => "SELECT id, name, entity_type, attributes_json, status, inbox, first_chapter_id, last_chapter_id, created_at, updated_at FROM entities ORDER BY created_at DESC",
    };

    let mut stmt = conn.prepare(sql).map_err(|e| format!("查询实体失败: {}", e))?;

    let map_row = |row: &rusqlite::Row| -> rusqlite::Result<Entity> {
        Ok(Entity {
            id: row.get(0)?,
            name: row.get(1)?,
            entity_type: row.get(2)?,
            attributes_json: row.get(3)?,
            status: row.get(4)?,
            inbox: row.get::<_, i32>(5)? != 0,
            first_chapter_id: row.get(6)?,
            last_chapter_id: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
        })
    };

    let entities = if let Some(et) = &entity_type {
        stmt.query_map(params![et], map_row)
    } else {
        stmt.query_map([], map_row)
    }
    .map_err(|e| format!("读取实体失败: {}", e))?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| format!("解析实体失败: {}", e))?;

    Ok(entities)
}

/// 获取单个实体
#[tauri::command]
pub async fn get_entity(storage_path: String, id: String) -> Result<Entity, String> {
    let conn = open_book(&storage_path)?;
    conn.query_row(
        "SELECT id, name, entity_type, attributes_json, status, inbox, first_chapter_id, last_chapter_id, created_at, updated_at
         FROM entities WHERE id = ?1",
        params![id],
        |row| {
            Ok(Entity {
                id: row.get(0)?,
                name: row.get(1)?,
                entity_type: row.get(2)?,
                attributes_json: row.get(3)?,
                status: row.get(4)?,
                inbox: row.get::<_, i32>(5)? != 0,
                first_chapter_id: row.get(6)?,
                last_chapter_id: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        },
    )
    .map_err(|e| format!("获取实体失败: {}", e))
}

/// 更新实体
#[tauri::command]
pub async fn update_entity(
    storage_path: String,
    id: String,
    name: Option<String>,
    attributes_json: Option<String>,
    status: Option<String>,
    inbox: Option<bool>,
) -> Result<(), String> {
    let conn = open_book(&storage_path)?;
    let now = chrono::Utc::now().to_rfc3339();

    if let Some(n) = name {
        conn.execute("UPDATE entities SET name = ?1, updated_at = ?2 WHERE id = ?3", params![n, now, id])
            .map_err(|e| format!("更新实体名称失败: {}", e))?;
    }
    if let Some(a) = attributes_json {
        conn.execute("UPDATE entities SET attributes_json = ?1, updated_at = ?2 WHERE id = ?3", params![a, now, id])
            .map_err(|e| format!("更新实体属性失败: {}", e))?;
    }
    if let Some(s) = status {
        conn.execute("UPDATE entities SET status = ?1, updated_at = ?2 WHERE id = ?3", params![s, now, id])
            .map_err(|e| format!("更新实体状态失败: {}", e))?;
    }
    if let Some(i) = inbox {
        conn.execute("UPDATE entities SET inbox = ?1, updated_at = ?2 WHERE id = ?3", params![i as i32, now, id])
            .map_err(|e| format!("更新实体 inbox 失败: {}", e))?;
    }

    Ok(())
}

/// 删除实体（移入回收站）
#[tauri::command]
pub async fn delete_entity(storage_path: String, id: String) -> Result<(), String> {
    let conn = open_book(&storage_path)?;
    let now = chrono::Utc::now().to_rfc3339();

    let data_json: String = conn
        .query_row(
            "SELECT json_object('id', id, 'name', name, 'entity_type', entity_type,
             'attributes_json', attributes_json, 'status', status, 'inbox', inbox,
             'first_chapter_id', first_chapter_id, 'last_chapter_id', last_chapter_id,
             'created_at', created_at, 'updated_at', updated_at) FROM entities WHERE id = ?1",
            params![id],
            |row| row.get(0),
        )
        .map_err(|e| format!("序列化实体失败: {}", e))?;

    let trash_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO trash (id, original_table, original_id, data_json, deleted_at, deleted_by) VALUES (?1, 'entities', ?2, ?3, ?4, 'user')",
        params![trash_id, id, data_json, now],
    )
    .map_err(|e| format!("移入回收站失败: {}", e))?;

    // 同时删除关联的时间线节点
    conn.execute("DELETE FROM timeline WHERE entity_id = ?1", params![id])
        .map_err(|e| format!("删除时间线失败: {}", e))?;

    conn.execute("DELETE FROM entities WHERE id = ?1", params![id])
        .map_err(|e| format!("删除实体失败: {}", e))?;

    Ok(())
}
