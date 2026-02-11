use crate::db;
use crate::db::config;
use crate::db::models::Setting;
use rusqlite::params;
use std::fs;
use std::path::Path;

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

/// 设置数据目录路径，自动迁移旧数据
#[tauri::command]
pub async fn set_data_dir(new_dir: String) -> Result<(), String> {
    let cfg = config::load_config()?;
    let old_data = config::xinzuo_data_dir(&cfg);
    let new_data = Path::new(&new_dir).join("XinZuoData");

    // 如果目录相同则跳过
    if old_data == new_data {
        return Ok(());
    }

    // 旧目录存在则迁移
    if old_data.exists() {
        // 确保新目录的父目录存在
        if let Some(parent) = new_data.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("创建目标目录失败: {}", e))?;
        }

        // 尝试 rename（同一文件系统下是原子操作，最快）
        if fs::rename(&old_data, &new_data).is_err() {
            // 跨分区时 rename 会失败，退回递归复制+删除
            copy_dir_recursive(&old_data, &new_data)?;
            fs::remove_dir_all(&old_data)
                .map_err(|e| format!("删除旧数据目录失败: {}", e))?;
        }
    }

    // 保存新配置
    let mut cfg = cfg;
    cfg.data_dir = new_dir;
    config::save_config(&cfg)
}

/// 递归复制目录
fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<(), String> {
    fs::create_dir_all(dst)
        .map_err(|e| format!("创建目录 {} 失败: {}", dst.display(), e))?;

    for entry in fs::read_dir(src).map_err(|e| format!("读取目录 {} 失败: {}", src.display(), e))? {
        let entry = entry.map_err(|e| format!("读取目录项失败: {}", e))?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)
                .map_err(|e| format!("复制文件 {} 失败: {}", src_path.display(), e))?;
        }
    }
    Ok(())
}
