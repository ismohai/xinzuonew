use crate::db;
use crate::db::config;
use rusqlite::params;
use std::fs;

fn open_book(storage_path: &str) -> Result<rusqlite::Connection, String> {
    let cfg = config::load_config()?;
    db::open_book_db(&cfg, storage_path)
}

/// 导出全书为 TXT 文件
#[tauri::command]
pub async fn export_txt(storage_path: String, output_path: String) -> Result<(), String> {
    let conn = open_book(&storage_path)?;

    let mut output = String::new();

    // 获取所有分卷
    let mut vol_stmt = conn
        .prepare("SELECT id, name FROM volumes ORDER BY sort_order ASC")
        .map_err(|e| format!("查询分卷失败: {}", e))?;

    let volumes: Vec<(String, String)> = vol_stmt
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
        .map_err(|e| format!("读取分卷失败: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("解析分卷失败: {}", e))?;

    for (vol_id, vol_name) in &volumes {
        output.push_str(&format!("【{}】\n\n", vol_name));

        let mut ch_stmt = conn
            .prepare(
                "SELECT name, content FROM chapters WHERE volume_id = ?1 ORDER BY sort_order ASC",
            )
            .map_err(|e| format!("查询章节失败: {}", e))?;

        let chapters: Vec<(String, String)> = ch_stmt
            .query_map(params![vol_id], |row| Ok((row.get(0)?, row.get(1)?)))
            .map_err(|e| format!("读取章节失败: {}", e))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("解析章节失败: {}", e))?;

        for (ch_name, ch_content) in &chapters {
            output.push_str(&format!("{}\n\n", ch_name));
            output.push_str(ch_content);
            output.push_str("\n\n");
        }
    }

    fs::write(&output_path, output).map_err(|e| format!("写入文件失败: {}", e))?;
    Ok(())
}

/// 导入 TXT 文件为新分卷（按空行分章）
#[tauri::command]
pub async fn import_txt(
    storage_path: String,
    file_path: String,
    volume_name: String,
) -> Result<String, String> {
    let conn = open_book(&storage_path)?;
    let now = chrono::Utc::now().to_rfc3339();

    // 读取文件
    let content = fs::read_to_string(&file_path).map_err(|e| format!("读取文件失败: {}", e))?;

    // 创建新分卷
    let vol_id = uuid::Uuid::new_v4().to_string();
    let max_vol_order: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(sort_order), -1) FROM volumes",
            [],
            |r| r.get(0),
        )
        .map_err(|e| format!("查询排序失败: {}", e))?;

    conn.execute(
        "INSERT INTO volumes (id, name, sort_order, created_at) VALUES (?1, ?2, ?3, ?4)",
        params![vol_id, volume_name, max_vol_order + 1, now],
    )
    .map_err(|e| format!("创建分卷失败: {}", e))?;

    // 按连续两个换行分割为章节
    let paragraphs: Vec<&str> = content.split("\n\n").collect();

    // 每段作为一个章节（如果内容很短则合并）
    let mut chapter_idx = 0;
    for para in &paragraphs {
        let trimmed = para.trim();
        if trimmed.is_empty() {
            continue;
        }

        chapter_idx += 1;
        let ch_id = uuid::Uuid::new_v4().to_string();
        let ch_name = format!("第{}章", chapter_idx);
        let word_count = trimmed.chars().count() as i64;

        conn.execute(
            "INSERT INTO chapters (id, volume_id, name, content, status, word_count, sort_order, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, 'draft', ?5, ?6, ?7, ?8)",
            params![ch_id, vol_id, ch_name, trimmed, word_count, chapter_idx - 1, now, now],
        )
        .map_err(|e| format!("创建章节失败: {}", e))?;
    }

    Ok(vol_id)
}
