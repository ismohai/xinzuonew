use crate::db;
use crate::db::config;
use crate::db::models::Book;
use rusqlite::params;
use std::fs;

/// 创建新书籍：在 global.db 插入记录 + 创建书籍目录 + 初始化 book.db
#[tauri::command]
pub async fn create_book(name: String, author_name: String) -> Result<Book, String> {
    let cfg = config::load_config()?;
    let global_conn = db::init_global_db()?;

    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    // 用书名做目录名（去除不安全字符）
    let safe_name = sanitize_dir_name(&name);
    let storage_path = ensure_unique_dir(&cfg, &safe_name)?;

    // 创建书籍目录 + 初始化 book.db
    let book_dir = config::books_dir(&cfg).join(&storage_path);
    fs::create_dir_all(&book_dir)
        .map_err(|e| format!("创建书籍目录失败: {}", e))?;
    db::open_book_db(&cfg, &storage_path)?;

    // 插入 global.db
    global_conn
        .execute(
            "INSERT INTO books (id, name, author_name, cover_path, storage_path, created_at, updated_at)
             VALUES (?1, ?2, ?3, NULL, ?4, ?5, ?6)",
            params![id, name, author_name, storage_path, now, now],
        )
        .map_err(|e| format!("插入书籍记录失败: {}", e))?;

    Ok(Book {
        id,
        name,
        author_name,
        cover_path: None,
        storage_path,
        created_at: now.clone(),
        updated_at: now,
    })
}

/// 获取所有书籍列表
#[tauri::command]
pub async fn list_books() -> Result<Vec<Book>, String> {
    let conn = db::init_global_db()?;
    let mut stmt = conn
        .prepare("SELECT id, name, author_name, cover_path, storage_path, created_at, updated_at FROM books ORDER BY created_at DESC")
        .map_err(|e| format!("查询书籍失败: {}", e))?;

    let books = stmt
        .query_map([], |row| {
            Ok(Book {
                id: row.get(0)?,
                name: row.get(1)?,
                author_name: row.get(2)?,
                cover_path: row.get(3)?,
                storage_path: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
        .map_err(|e| format!("读取书籍数据失败: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("解析书籍数据失败: {}", e))?;

    Ok(books)
}

/// 更新书籍信息（书名、作者笔名、封面）
#[tauri::command]
pub async fn update_book(
    id: String,
    name: Option<String>,
    author_name: Option<String>,
    cover_path: Option<String>,
) -> Result<(), String> {
    let conn = db::init_global_db()?;
    let now = chrono::Utc::now().to_rfc3339();

    if let Some(n) = name {
        conn.execute(
            "UPDATE books SET name = ?1, updated_at = ?2 WHERE id = ?3",
            params![n, now, id],
        )
        .map_err(|e| format!("更新书名失败: {}", e))?;
    }
    if let Some(a) = author_name {
        conn.execute(
            "UPDATE books SET author_name = ?1, updated_at = ?2 WHERE id = ?3",
            params![a, now, id],
        )
        .map_err(|e| format!("更新作者笔名失败: {}", e))?;
    }
    if let Some(c) = cover_path {
        conn.execute(
            "UPDATE books SET cover_path = ?1, updated_at = ?2 WHERE id = ?3",
            params![c, now, id],
        )
        .map_err(|e| format!("更新封面失败: {}", e))?;
    }

    Ok(())
}

/// 删除书籍（从 global.db 移除记录，但保留磁盘文件让用户手动清理）
#[tauri::command]
pub async fn delete_book(id: String) -> Result<(), String> {
    let conn = db::init_global_db()?;
    conn.execute("DELETE FROM books WHERE id = ?1", params![id])
        .map_err(|e| format!("删除书籍失败: {}", e))?;
    Ok(())
}

// ============================================================================
// 辅助函数
// ============================================================================

/// 去除文件名中不安全的字符
fn sanitize_dir_name(name: &str) -> String {
    let re = regex::Regex::new(r#"[<>:"/\\|?*\x00-\x1f]"#).unwrap();
    let sanitized = re.replace_all(name.trim(), "_").to_string();
    if sanitized.is_empty() {
        "unnamed_book".to_string()
    } else {
        sanitized
    }
}

/// 确保目录名唯一（如果已存在则加数字后缀）
fn ensure_unique_dir(cfg: &config::AppConfig, base_name: &str) -> Result<String, String> {
    let books_dir = config::books_dir(cfg);
    let mut dir_name = base_name.to_string();
    let mut counter = 1u32;
    while books_dir.join(&dir_name).exists() {
        counter += 1;
        dir_name = format!("{}_{}", base_name, counter);
    }
    Ok(dir_name)
}
