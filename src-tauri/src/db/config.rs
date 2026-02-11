use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

/// 存储在 %APPDATA%\XinZuo\config.json 的配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    /// 用户数据根目录（XinZuoData 的父目录）
    pub data_dir: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        let documents = dirs::document_dir().unwrap_or_else(|| PathBuf::from("C:\\Users\\Public\\Documents"));
        Self {
            data_dir: documents.to_string_lossy().to_string(),
        }
    }
}

// ============================================================================
// 路径计算
// ============================================================================

/// %APPDATA%\XinZuo\config.json 的完整路径
fn config_file_path() -> Result<PathBuf, String> {
    let app_data = dirs::config_dir()
        .ok_or("无法获取 AppData 路径")?;
    Ok(app_data.join("XinZuo").join("config.json"))
}

/// 读取 config.json，不存在则返回默认值
pub fn load_config() -> Result<AppConfig, String> {
    let path = config_file_path()?;
    if !path.exists() {
        return Ok(AppConfig::default());
    }
    let content = fs::read_to_string(&path)
        .map_err(|e| format!("读取配置文件失败: {}", e))?;
    serde_json::from_str(&content)
        .map_err(|e| format!("解析配置文件失败: {}", e))
}

/// 保存 config.json
pub fn save_config(config: &AppConfig) -> Result<(), String> {
    let path = config_file_path()?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("创建配置目录失败: {}", e))?;
    }
    let json = serde_json::to_string_pretty(config)
        .map_err(|e| format!("序列化配置失败: {}", e))?;
    fs::write(&path, json)
        .map_err(|e| format!("写入配置文件失败: {}", e))
}

// ============================================================================
// 数据目录路径
// ============================================================================

/// XinZuoData 根目录：{data_dir}/XinZuoData/
pub fn xinzuo_data_dir(config: &AppConfig) -> PathBuf {
    Path::new(&config.data_dir).join("XinZuoData")
}

/// 全局库路径：XinZuoData/Library/global.db
pub fn global_db_path(config: &AppConfig) -> PathBuf {
    xinzuo_data_dir(config).join("Library").join("global.db")
}

/// 书籍目录根路径：XinZuoData/Books/
pub fn books_dir(config: &AppConfig) -> PathBuf {
    xinzuo_data_dir(config).join("Books")
}

/// 某本书的 book.db 路径：XinZuoData/Books/{book_name}/book.db
pub fn book_db_path(config: &AppConfig, book_storage_path: &str) -> PathBuf {
    books_dir(config).join(book_storage_path).join("book.db")
}

/// 某本书的里程碑目录：XinZuoData/Books/{book_name}/.milestones/
pub fn milestones_dir(config: &AppConfig, book_storage_path: &str) -> PathBuf {
    books_dir(config).join(book_storage_path).join(".milestones")
}

/// 确保所有必要目录存在
pub fn ensure_directories(config: &AppConfig) -> Result<(), String> {
    let dirs_to_create = [
        xinzuo_data_dir(config),
        xinzuo_data_dir(config).join("Library"),
        books_dir(config),
    ];
    for dir in &dirs_to_create {
        fs::create_dir_all(dir)
            .map_err(|e| format!("创建目录 {} 失败: {}", dir.display(), e))?;
    }
    Ok(())
}
