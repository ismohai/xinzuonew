mod commands;
mod db;

use commands::{
    book, chapter, entity, foreshadow, io,
    settings, snapshot, stats, volume, window,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .setup(|_app| {
            db::init_global_db()
                .expect("初始化 global.db 失败");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // 窗口管理
            window::minimize_window,
            window::toggle_maximize_window,
            window::close_window,
            // 书籍
            book::create_book,
            book::list_books,
            book::update_book,
            book::delete_book,
            book::list_deleted_books,
            book::restore_book,
            book::permanently_delete_book,
            // 分卷
            volume::create_volume,
            volume::list_volumes,
            volume::rename_volume,
            volume::reorder_volumes,
            volume::delete_volume,
            // 章节
            chapter::create_chapter,
            chapter::list_chapters,
            chapter::get_chapter,
            chapter::update_chapter,
            chapter::rename_chapter,
            chapter::reorder_chapters,
            chapter::move_chapter,
            chapter::delete_chapter,
            chapter::set_chapter_status,
            chapter::search_chapters,
            // 设定集
            entity::create_entity,
            entity::list_entities,
            entity::get_entity,
            entity::update_entity,
            entity::delete_entity,
            // 伏笔
            foreshadow::create_foreshadow,
            foreshadow::list_foreshadows,
            foreshadow::resolve_foreshadow,
            foreshadow::delete_foreshadow,
            // 统计
            stats::get_daily_stats,
            stats::update_daily_stats,
            stats::set_daily_goal,
            // 快照 & 回收站
            snapshot::list_snapshots,
            snapshot::restore_snapshot,
            snapshot::create_milestone,
            snapshot::list_trash,
            snapshot::restore_from_trash,
            snapshot::clean_expired_trash,
            // 设置
            settings::get_settings,
            settings::get_setting,
            settings::update_setting,
            settings::get_data_dir,
            settings::set_data_dir,
            // 导入导出
            io::export_txt,
            io::import_txt,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
