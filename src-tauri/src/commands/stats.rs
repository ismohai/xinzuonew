use crate::db;
use crate::db::models::DailyStat;
use rusqlite::params;

/// 获取每日统计（指定日期范围）
#[tauri::command]
pub async fn get_daily_stats(
    start_date: String,
    end_date: String,
) -> Result<Vec<DailyStat>, String> {
    let conn = db::init_global_db()?;
    let mut stmt = conn
        .prepare(
            "SELECT id, date, word_count, duration_seconds, daily_goal
             FROM daily_stats WHERE date >= ?1 AND date <= ?2 ORDER BY date ASC",
        )
        .map_err(|e| format!("查询统计失败: {}", e))?;

    let stats = stmt
        .query_map(params![start_date, end_date], |row| {
            Ok(DailyStat {
                id: row.get(0)?,
                date: row.get(1)?,
                word_count: row.get(2)?,
                duration_seconds: row.get(3)?,
                daily_goal: row.get(4)?,
            })
        })
        .map_err(|e| format!("读取统计失败: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("解析统计失败: {}", e))?;

    Ok(stats)
}

/// 更新今日字数统计（增量：在现有基础上加 delta）
#[tauri::command]
pub async fn update_daily_stats(
    date: String,
    word_count_delta: i64,
    duration_delta: i64,
) -> Result<(), String> {
    let conn = db::init_global_db()?;
    let id = uuid::Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO daily_stats (id, date, word_count, duration_seconds, daily_goal)
         VALUES (?1, ?2, ?3, ?4, 0)
         ON CONFLICT(date) DO UPDATE SET
            word_count = word_count + ?3,
            duration_seconds = duration_seconds + ?4",
        params![id, date, word_count_delta, duration_delta],
    )
    .map_err(|e| format!("更新统计失败: {}", e))?;

    Ok(())
}

/// 设置每日目标字数
#[tauri::command]
pub async fn set_daily_goal(goal: i64) -> Result<(), String> {
    let conn = db::init_global_db()?;
    conn.execute(
        "UPDATE settings SET value = ?1 WHERE key = 'daily_goal'",
        params![goal.to_string()],
    )
    .map_err(|e| format!("设置目标失败: {}", e))?;
    Ok(())
}
