pub mod book;
pub mod config;
pub mod global;
pub mod models;

use rusqlite::Connection;
use std::fs;

use config::AppConfig;

/// 应用启动时调用：加载配置 -> 确保目录 -> 初始化 global.db
pub fn init_global_db() -> Result<Connection, String> {
    let cfg = config::load_config()?;
    config::ensure_directories(&cfg)?;

    // 首次运行时保存默认配置
    config::save_config(&cfg)?;

    let db_path = config::global_db_path(&cfg);
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("打开 global.db 失败 ({}): {}", db_path.display(), e))?;

    global::initialize(&conn)?;
    Ok(conn)
}

/// 打开某本书的 book.db（如果不存在则创建并初始化）
pub fn open_book_db(cfg: &AppConfig, storage_path: &str) -> Result<Connection, String> {
    let db_path = config::book_db_path(cfg, storage_path);

    // 确保书籍目录存在
    if let Some(parent) = db_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("创建书籍目录失败: {}", e))?;
    }

    let conn = Connection::open(&db_path)
        .map_err(|e| format!("打开 book.db 失败 ({}): {}", db_path.display(), e))?;

    book::initialize(&conn)?;
    Ok(conn)
}
