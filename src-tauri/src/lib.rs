use tauri::Emitter;

#[cfg(target_os = "macos")]
use tauri::menu::{AboutMetadataBuilder, Menu, MenuItem, Submenu, SubmenuBuilder};

const MENU_ID_SHARE_EXPORT_CHR: &str = "share-export-chr";
const MENU_ID_SHARE_EXPORT_PNG: &str = "share-export-png";
const MENU_ID_SHARE_EXPORT_SVG: &str = "share-export-svg";
const MENU_ID_SHARE_SAVE_PROJECT: &str = "share-save-project";
const MENU_ID_SHARE_EXPORT_CHARACTER_JSON: &str = "share-export-character-json";
const MENU_ID_RESTORE_IMPORT: &str = "restore-import";
const MENU_ID_EDIT_UNDO: &str = "edit-undo";
const MENU_ID_EDIT_REDO: &str = "edit-redo";
const MENU_ID_MODE_SPRITE: &str = "mode-sprite";
const MENU_ID_MODE_CHARACTER: &str = "mode-character";
const MENU_ID_MODE_BG: &str = "mode-bg";
const MENU_ID_MODE_SCREEN: &str = "mode-screen";

const MENU_EVENT_SHARE_EXPORT_CHR: &str = "file-menu://share-export-chr";
const MENU_EVENT_SHARE_EXPORT_PNG: &str = "file-menu://share-export-png";
const MENU_EVENT_SHARE_EXPORT_SVG: &str = "file-menu://share-export-svg";
const MENU_EVENT_SHARE_SAVE_PROJECT: &str = "file-menu://share-save-project";
const MENU_EVENT_SHARE_EXPORT_CHARACTER_JSON: &str =
    "file-menu://share-export-character-json";
const MENU_EVENT_RESTORE_IMPORT: &str = "file-menu://restore-import";
const MENU_EVENT_EDIT_UNDO: &str = "edit-menu://undo";
const MENU_EVENT_EDIT_REDO: &str = "edit-menu://redo";
const MENU_EVENT_MODE_SPRITE: &str = "mode-menu://switch-sprite";
const MENU_EVENT_MODE_CHARACTER: &str = "mode-menu://switch-character";
const MENU_EVENT_MODE_BG: &str = "mode-menu://switch-bg";
const MENU_EVENT_MODE_SCREEN: &str = "mode-menu://switch-screen";

#[cfg(target_os = "macos")]
fn install_macos_native_menu<R: tauri::Runtime>(app: &mut tauri::App<R>) -> tauri::Result<()> {
    let app_name = app.package_info().name.clone();
    let app_version = app.package_info().version.to_string();
    let app_about_metadata = AboutMetadataBuilder::new()
        .name(Some(app_name.clone()))
        .version(Some(app_version.clone()))
        .short_version(Some(app_version))
        .icon(app.default_window_icon().cloned())
        .build();

    let app_submenu = SubmenuBuilder::new(app, app_name)
        .about(Some(app_about_metadata))
        .build()?;

    let share_export_chr =
        MenuItem::with_id(app, MENU_ID_SHARE_EXPORT_CHR, "CHRエクスポート", true, None::<&str>)?;
    let share_export_png =
        MenuItem::with_id(app, MENU_ID_SHARE_EXPORT_PNG, "PNGエクスポート", true, None::<&str>)?;
    let share_export_svg =
        MenuItem::with_id(app, MENU_ID_SHARE_EXPORT_SVG, "SVGエクスポート", true, None::<&str>)?;
    let share_save_project =
        MenuItem::with_id(app, MENU_ID_SHARE_SAVE_PROJECT, "保存", true, None::<&str>)?;
    let share_export_character_json = MenuItem::with_id(
        app,
        MENU_ID_SHARE_EXPORT_CHARACTER_JSON,
        "キャラクターJSON書き出し",
        true,
        None::<&str>,
    )?;
    let restore_import =
        MenuItem::with_id(app, MENU_ID_RESTORE_IMPORT, "復元", true, None::<&str>)?;
    let edit_undo = MenuItem::with_id(
        app,
        MENU_ID_EDIT_UNDO,
        "アンドゥ",
        true,
        Some("CmdOrCtrl+Z"),
    )?;
    let edit_redo = MenuItem::with_id(
        app,
        MENU_ID_EDIT_REDO,
        "リドゥ",
        true,
        Some("CmdOrCtrl+Shift+Z"),
    )?;
    let mode_sprite =
        MenuItem::with_id(app, MENU_ID_MODE_SPRITE, "スプライト編集", true, None::<&str>)?;
    let mode_character = MenuItem::with_id(
        app,
        MENU_ID_MODE_CHARACTER,
        "キャラクター編集",
        true,
        None::<&str>,
    )?;
    let mode_bg = MenuItem::with_id(app, MENU_ID_MODE_BG, "BG編集", true, None::<&str>)?;
    let mode_screen =
        MenuItem::with_id(app, MENU_ID_MODE_SCREEN, "画面配置", true, None::<&str>)?;

    let share_submenu = Submenu::with_items(
        app,
        "共有",
        true,
        &[
            &share_export_chr,
            &share_export_png,
            &share_export_svg,
            &share_save_project,
            &share_export_character_json,
        ],
    )?;

    let mode_submenu = Submenu::with_items(
        app,
        "作業モード",
        true,
        &[&mode_sprite, &mode_character, &mode_bg, &mode_screen],
    )?;
    let edit_submenu = Submenu::with_items(app, "編集", true, &[&edit_undo, &edit_redo])?;
    let file_submenu = Submenu::with_items(app, "ファイル", true, &[&share_submenu, &restore_import])?;
    let menu = Menu::with_items(app, &[&app_submenu, &mode_submenu, &edit_submenu, &file_submenu])?;
    app.set_menu(menu)?;

    Ok(())
}

fn emit_file_menu_event<R: tauri::Runtime>(app_handle: &tauri::AppHandle<R>, event_name: &str) {
    let _ = app_handle.emit(event_name, ());
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build());

    #[cfg(target_os = "macos")]
    let builder = builder.setup(|app| {
        install_macos_native_menu(app)?;
        Ok(())
    });

    builder
        .on_menu_event(|app_handle, event| match event.id().as_ref() {
            MENU_ID_SHARE_EXPORT_CHR => {
                emit_file_menu_event(app_handle, MENU_EVENT_SHARE_EXPORT_CHR)
            }
            MENU_ID_SHARE_EXPORT_PNG => {
                emit_file_menu_event(app_handle, MENU_EVENT_SHARE_EXPORT_PNG)
            }
            MENU_ID_SHARE_EXPORT_SVG => {
                emit_file_menu_event(app_handle, MENU_EVENT_SHARE_EXPORT_SVG)
            }
            MENU_ID_SHARE_SAVE_PROJECT => {
                emit_file_menu_event(app_handle, MENU_EVENT_SHARE_SAVE_PROJECT)
            }
            MENU_ID_SHARE_EXPORT_CHARACTER_JSON => {
                emit_file_menu_event(app_handle, MENU_EVENT_SHARE_EXPORT_CHARACTER_JSON)
            }
            MENU_ID_RESTORE_IMPORT => emit_file_menu_event(app_handle, MENU_EVENT_RESTORE_IMPORT),
            MENU_ID_EDIT_UNDO => emit_file_menu_event(app_handle, MENU_EVENT_EDIT_UNDO),
            MENU_ID_EDIT_REDO => emit_file_menu_event(app_handle, MENU_EVENT_EDIT_REDO),
            MENU_ID_MODE_SPRITE => emit_file_menu_event(app_handle, MENU_EVENT_MODE_SPRITE),
            MENU_ID_MODE_CHARACTER => emit_file_menu_event(app_handle, MENU_EVENT_MODE_CHARACTER),
            MENU_ID_MODE_BG => emit_file_menu_event(app_handle, MENU_EVENT_MODE_BG),
            MENU_ID_MODE_SCREEN => emit_file_menu_event(app_handle, MENU_EVENT_MODE_SCREEN),
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
