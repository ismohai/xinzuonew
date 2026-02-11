use rusqlite::Connection;

/// 当前程序内置的 global.db schema 版本号
const CURRENT_VERSION: u32 = 2;

/// 初始化 global.db：建表 + 执行迁移
pub fn initialize(conn: &Connection) -> Result<(), String> {
    let version = get_user_version(conn)?;

    if version == 0 {
        create_tables_v1(conn)?;
        set_user_version(conn, CURRENT_VERSION)?;
    } else if version < CURRENT_VERSION {
        migrate(conn, version)?;
    }

    // 开启 WAL 模式，提升并发读写性能
    conn.execute_batch("PRAGMA journal_mode=WAL;")
        .map_err(|e| format!("设置 WAL 模式失败: {}", e))?;

    Ok(())
}

// ============================================================================
// Schema v1：初始建表
// ============================================================================

fn create_tables_v1(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "
        -- 书籍元数据
        CREATE TABLE IF NOT EXISTS books (
            id              TEXT PRIMARY KEY,
            name            TEXT NOT NULL,
            author_name     TEXT NOT NULL DEFAULT '',
            cover_path      TEXT,
            storage_path    TEXT NOT NULL,
            created_at      TEXT NOT NULL,
            updated_at      TEXT NOT NULL,
            deleted_at      TEXT
        );

        -- 全局设置（key-value）
        CREATE TABLE IF NOT EXISTS settings (
            key     TEXT PRIMARY KEY,
            value   TEXT NOT NULL
        );

        -- 每日写作统计
        CREATE TABLE IF NOT EXISTS daily_stats (
            id                  TEXT PRIMARY KEY,
            date                TEXT NOT NULL UNIQUE,
            word_count          INTEGER NOT NULL DEFAULT 0,
            duration_seconds    INTEGER NOT NULL DEFAULT 0,
            daily_goal          INTEGER NOT NULL DEFAULT 0
        );

        -- 跨书实体暂存架
        CREATE TABLE IF NOT EXISTS entity_shelf (
            id                  TEXT PRIMARY KEY,
            name                TEXT NOT NULL,
            entity_type         TEXT NOT NULL,
            attributes_json     TEXT NOT NULL DEFAULT '{}',
            source_book_name    TEXT NOT NULL DEFAULT '',
            created_at          TEXT NOT NULL
        );

        -- 默认设置
        INSERT OR IGNORE INTO settings (key, value) VALUES ('theme', 'system');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('font_size', '16');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('auto_save_interval', '30');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('compression_mode', 'auto');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('snapshot_limit', '20');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('trash_retention_days', '30');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('daily_goal', '0');
        ",
    )
    .map_err(|e| format!("创建 global.db 表失败: {}", e))
}

// ============================================================================
// 版本迁移
// ============================================================================

fn migrate(conn: &Connection, from_version: u32) -> Result<(), String> {
    let mut current = from_version;
    while current < CURRENT_VERSION {
        match current {
            1 => {
                migrate_v1_to_v2(conn)?;
                current = 2;
            }
            _ => {
                return Err(format!(
                    "global.db 版本 {} 无对应迁移脚本，目标版本 {}",
                    current, CURRENT_VERSION
                ));
            }
        }
    }
    set_user_version(conn, CURRENT_VERSION)?;
    Ok(())
}

/// v1 → v2: 给 books 表添加 deleted_at 列（用于软删除/回收站）
fn migrate_v1_to_v2(conn: &Connection) -> Result<(), String> {
    conn.execute_batch("ALTER TABLE books ADD COLUMN deleted_at TEXT;")
        .map_err(|e| format!("迁移 v1→v2 失败: {}", e))
}

// ============================================================================
// PRAGMA user_version 辅助
// ============================================================================

fn get_user_version(conn: &Connection) -> Result<u32, String> {
    conn.query_row("PRAGMA user_version;", [], |row| row.get(0))
        .map_err(|e| format!("读取 global.db user_version 失败: {}", e))
}

fn set_user_version(conn: &Connection, version: u32) -> Result<(), String> {
    conn.execute_batch(&format!("PRAGMA user_version = {};", version))
        .map_err(|e| format!("设置 global.db user_version 失败: {}", e))
}
