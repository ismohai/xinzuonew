use rusqlite::Connection;

/// 当前程序内置的 book.db schema 版本号
const CURRENT_VERSION: u32 = 1;

/// 初始化 book.db：建表 + 执行迁移
pub fn initialize(conn: &Connection) -> Result<(), String> {
    let version = get_user_version(conn)?;

    if version == 0 {
        create_tables_v1(conn)?;
        set_user_version(conn, CURRENT_VERSION)?;
    } else if version < CURRENT_VERSION {
        migrate(conn, version)?;
    }

    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")
        .map_err(|e| format!("设置 book.db PRAGMA 失败: {}", e))?;

    Ok(())
}

// ============================================================================
// Schema v1：初始建表
// ============================================================================

fn create_tables_v1(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "
        -- 分卷
        CREATE TABLE IF NOT EXISTS volumes (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            sort_order  INTEGER NOT NULL DEFAULT 0,
            created_at  TEXT NOT NULL
        );

        -- 章节
        CREATE TABLE IF NOT EXISTS chapters (
            id          TEXT PRIMARY KEY,
            volume_id   TEXT NOT NULL REFERENCES volumes(id),
            name        TEXT NOT NULL,
            content     TEXT NOT NULL DEFAULT '',
            l2_summary  TEXT,
            l3_title    TEXT,
            status      TEXT NOT NULL DEFAULT 'draft',
            word_count  INTEGER NOT NULL DEFAULT 0,
            sort_order  INTEGER NOT NULL DEFAULT 0,
            created_at  TEXT NOT NULL,
            updated_at  TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_chapters_volume ON chapters(volume_id);
        CREATE INDEX IF NOT EXISTS idx_chapters_status ON chapters(status);

        -- 设定集实体（人物/道具/地点/势力）
        CREATE TABLE IF NOT EXISTS entities (
            id                  TEXT PRIMARY KEY,
            name                TEXT NOT NULL,
            entity_type         TEXT NOT NULL,
            attributes_json     TEXT NOT NULL DEFAULT '{}',
            status              TEXT NOT NULL DEFAULT 'alive',
            inbox               INTEGER NOT NULL DEFAULT 0,
            first_chapter_id    TEXT,
            last_chapter_id     TEXT,
            created_at          TEXT NOT NULL,
            updated_at          TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type);
        CREATE INDEX IF NOT EXISTS idx_entities_inbox ON entities(inbox);

        -- 时间线节点
        CREATE TABLE IF NOT EXISTS timeline (
            id              TEXT PRIMARY KEY,
            entity_id       TEXT NOT NULL REFERENCES entities(id),
            chapter_id      TEXT NOT NULL REFERENCES chapters(id),
            event           TEXT NOT NULL,
            status_change   TEXT,
            created_at      TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_timeline_entity ON timeline(entity_id);
        CREATE INDEX IF NOT EXISTS idx_timeline_chapter ON timeline(chapter_id);

        -- 伏笔追踪
        CREATE TABLE IF NOT EXISTS foreshadows (
            id                  TEXT PRIMARY KEY,
            description         TEXT NOT NULL,
            plant_chapter_id    TEXT REFERENCES chapters(id),
            reap_chapter_id     TEXT REFERENCES chapters(id),
            status              TEXT NOT NULL DEFAULT 'open',
            created_at          TEXT NOT NULL,
            updated_at          TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_foreshadows_status ON foreshadows(status);

        -- L4 剧情弧
        CREATE TABLE IF NOT EXISTS rag_arcs (
            id                  TEXT PRIMARY KEY,
            start_chapter_id    TEXT NOT NULL REFERENCES chapters(id),
            end_chapter_id      TEXT NOT NULL REFERENCES chapters(id),
            summary             TEXT NOT NULL,
            created_at          TEXT NOT NULL,
            updated_at          TEXT NOT NULL
        );

        -- 章节快照（滚动保留，默认每章最多 20 条）
        CREATE TABLE IF NOT EXISTS snapshots (
            id                  TEXT PRIMARY KEY,
            chapter_id          TEXT NOT NULL REFERENCES chapters(id),
            snapshot_content    TEXT NOT NULL,
            created_at          TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_snapshots_chapter ON snapshots(chapter_id);

        -- 回收站（软删除，30 天后清理）
        CREATE TABLE IF NOT EXISTS trash (
            id              TEXT PRIMARY KEY,
            original_table  TEXT NOT NULL,
            original_id     TEXT NOT NULL,
            data_json       TEXT NOT NULL,
            deleted_at      TEXT NOT NULL,
            deleted_by      TEXT NOT NULL DEFAULT 'user'
        );
        CREATE INDEX IF NOT EXISTS idx_trash_deleted_at ON trash(deleted_at);
        ",
    )
    .map_err(|e| format!("创建 book.db 表失败: {}", e))
}

// ============================================================================
// 版本迁移
// ============================================================================

fn migrate(conn: &Connection, from_version: u32) -> Result<(), String> {
    let current = from_version;
    while current < CURRENT_VERSION {
        match current {
            // 未来版本在此添加迁移：
            // 1 => { migrate_v1_to_v2(conn)?; current = 2; }
            _ => {
                return Err(format!(
                    "book.db 版本 {} 无对应迁移脚本，目标版本 {}",
                    current, CURRENT_VERSION
                ));
            }
        }
    }
    set_user_version(conn, CURRENT_VERSION)?;
    Ok(())
}

// ============================================================================
// PRAGMA user_version 辅助
// ============================================================================

fn get_user_version(conn: &Connection) -> Result<u32, String> {
    conn.query_row("PRAGMA user_version;", [], |row| row.get(0))
        .map_err(|e| format!("读取 book.db user_version 失败: {}", e))
}

fn set_user_version(conn: &Connection, version: u32) -> Result<(), String> {
    conn.execute_batch(&format!("PRAGMA user_version = {};", version))
        .map_err(|e| format!("设置 book.db user_version 失败: {}", e))
}
