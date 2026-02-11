use crate::db;
use crate::db::config;
use crate::db::models::Setting;
use rusqlite::params;

/// 获取所有设置
#[tauri::command]
pub async fn get_settings() -> Result<Vec<Setting>, String> {
    let conn = db::init_global_db()?;
    let mut stmt = conn
        .prepare("SELECT key, value FROM settings ORDER BY key ASC")
        .map_err(|e| format!("查询设置失败: {}", e))?;

    let settings = stmt
        .query_map([], |row| {
            Ok(Setting {
                key: row.get(0)?,
                value: row.get(1)?,
            })
        })
        .map_err(|e| format!("读取设置失败: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("解析设置失败: {}", e))?;

    Ok(settings)
}

/// 获取单个设置值
#[tauri::command]
pub async fn get_setting(key: String) -> Result<Option<String>, String> {
    let conn = db::init_global_db()?;
    let result = conn.query_row(
        "SELECT value FROM settings WHERE key = ?1",
        params![key],
        |row| row.get(0),
    );
    match result {
        Ok(value) => Ok(Some(value)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("读取设置失败: {}", e)),
    }
}

/// 更新设置（不存在则创建）
#[tauri::command]
pub async fn update_setting(key: String, value: String) -> Result<(), String> {
    let conn = db::init_global_db()?;
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = ?2",
        params![key, value],
    )
    .map_err(|e| format!("更新设置失败: {}", e))?;
    Ok(())
}

/// 获取当前数据目录路径
#[tauri::command]
pub async fn get_data_dir() -> Result<String, String> {
    let cfg = config::load_config()?;
    Ok(config::xinzuo_data_dir(&cfg).to_string_lossy().to_string())
}

/// 设置数据目录路径（需要重启生效）
#[tauri::command]
pub async fn set_data_dir(new_dir: String) -> Result<(), String> {
    let mut cfg = config::load_config()?;
    cfg.data_dir = new_dir;
    config::save_config(&cfg)
}
