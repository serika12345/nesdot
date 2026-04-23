use serde::{Deserialize, Serialize};
use std::env;
use std::fs::{create_dir_all, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use tauri::Emitter;

#[cfg(target_os = "macos")]
use tauri::menu::{
    AboutMetadataBuilder, CheckMenuItem, IsMenuItem, Menu, MenuItem, MenuItemKind, Submenu,
    SubmenuBuilder,
};

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
const MENU_ID_VIEW_THEME_LIGHT: &str = "view-theme-light";
const MENU_ID_VIEW_THEME_DARK: &str = "view-theme-dark";
const MENU_ID_VIEW_THEME_SYSTEM: &str = "view-theme-system";
const MENU_ID_HELP_CHECK_FOR_UPDATES: &str = "help-check-for-updates";

const MENU_EVENT_SHARE_EXPORT_CHR: &str = "file-menu://share-export-chr";
const MENU_EVENT_SHARE_EXPORT_PNG: &str = "file-menu://share-export-png";
const MENU_EVENT_SHARE_EXPORT_SVG: &str = "file-menu://share-export-svg";
const MENU_EVENT_SHARE_SAVE_PROJECT: &str = "file-menu://share-save-project";
const MENU_EVENT_SHARE_EXPORT_CHARACTER_JSON: &str = "file-menu://share-export-character-json";
const MENU_EVENT_RESTORE_IMPORT: &str = "file-menu://restore-import";
const MENU_EVENT_EDIT_UNDO: &str = "edit-menu://undo";
const MENU_EVENT_EDIT_REDO: &str = "edit-menu://redo";
const MENU_EVENT_MODE_SPRITE: &str = "mode-menu://switch-sprite";
const MENU_EVENT_MODE_CHARACTER: &str = "mode-menu://switch-character";
const MENU_EVENT_MODE_BG: &str = "mode-menu://switch-bg";
const MENU_EVENT_MODE_SCREEN: &str = "mode-menu://switch-screen";
const MENU_EVENT_VIEW_THEME_LIGHT: &str = "view-menu://set-theme-light";
const MENU_EVENT_VIEW_THEME_DARK: &str = "view-menu://set-theme-dark";
const MENU_EVENT_VIEW_THEME_SYSTEM: &str = "view-menu://set-theme-system";
const MENU_EVENT_HELP_CHECK_FOR_UPDATES: &str = "help-menu://check-for-updates";
const VERIFY_TAURI_CSP_DIAGNOSTICS_FILE_ENV: &str = "NESDOT_VERIFY_TAURI_CSP_DIAGNOSTICS_FILE";
const VERIFY_TAURI_CSP_SELF_TEST_ENV: &str = "NESDOT_VERIFY_TAURI_CSP_SELF_TEST";

#[derive(Clone, Copy, Serialize)]
#[serde(rename_all = "kebab-case")]
enum RuntimeDiagnosticsSelfTest {
    None,
    Console,
    Style,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct RuntimeDiagnosticsConfig {
    enabled: bool,
    self_test: RuntimeDiagnosticsSelfTest,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct RuntimeDiagnosticPayload {
    kind: String,
    message: String,
    details: Option<String>,
    time: String,
}

#[derive(Clone, Copy, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
enum ThemePreference {
    Light,
    Dark,
    System,
}

#[derive(Clone, Copy, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
enum WorkModeSelection {
    Sprite,
    Character,
    Bg,
    Screen,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct NativeMenuSelectionState {
    edit_mode: WorkModeSelection,
    theme_preference: ThemePreference,
}

fn runtime_diagnostics_path() -> Option<PathBuf> {
    env::var_os(VERIFY_TAURI_CSP_DIAGNOSTICS_FILE_ENV).map(PathBuf::from)
}

fn runtime_diagnostics_self_test() -> RuntimeDiagnosticsSelfTest {
    match env::var(VERIFY_TAURI_CSP_SELF_TEST_ENV).ok().as_deref() {
        Some("console") => RuntimeDiagnosticsSelfTest::Console,
        Some("style") => RuntimeDiagnosticsSelfTest::Style,
        _ => RuntimeDiagnosticsSelfTest::None,
    }
}

#[tauri::command]
fn get_runtime_diagnostics_config() -> RuntimeDiagnosticsConfig {
    RuntimeDiagnosticsConfig {
        enabled: runtime_diagnostics_path().is_some(),
        self_test: runtime_diagnostics_self_test(),
    }
}

#[tauri::command]
fn record_runtime_diagnostic(payload: RuntimeDiagnosticPayload) -> Result<(), String> {
    let Some(diagnostics_path) = runtime_diagnostics_path() else {
        return Ok(());
    };

    if payload.message.trim().is_empty() {
        return Err("runtime diagnostic message must not be empty".into());
    }

    if let Some(parent_directory) = diagnostics_path.parent() {
        create_dir_all(parent_directory)
            .map_err(|error| format!("failed to create diagnostics directory: {error}"))?;
    }

    let serialized_payload = serde_json::to_string(&payload)
        .map_err(|error| format!("failed to serialize runtime diagnostic payload: {error}"))?;
    let line = format!("{serialized_payload}\n");
    let mut diagnostics_file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&diagnostics_path)
        .map_err(|error| format!("failed to open runtime diagnostics file: {error}"))?;

    diagnostics_file
        .write_all(line.as_bytes())
        .map_err(|error| format!("failed to write runtime diagnostic payload: {error}"))?;

    Ok(())
}

#[cfg(target_os = "macos")]
fn find_check_menu_item_in_items<R: tauri::Runtime>(
    items: &[MenuItemKind<R>],
    id: &str,
) -> Result<Option<CheckMenuItem<R>>, String> {
    items.iter().try_fold(None, |found_item, item| {
        if found_item.is_some() {
            return Ok(found_item);
        }

        match item {
            MenuItemKind::Check(check_menu_item) if check_menu_item.id() == id => {
                Ok(Some(check_menu_item.clone()))
            }
            MenuItemKind::Submenu(submenu) => submenu
                .items()
                .map_err(|error| format!("failed to read native submenu items for `{id}`: {error}"))
                .and_then(|submenu_items| find_check_menu_item_in_items(&submenu_items, id)),
            _ => Ok(None),
        }
    })
}

#[cfg(target_os = "macos")]
fn set_check_menu_item_state<R: tauri::Runtime>(
    menu: &Menu<R>,
    id: &str,
    checked: bool,
) -> Result<(), String> {
    let menu_items = menu
        .items()
        .map_err(|error| format!("failed to read native menu items for `{id}`: {error}"))?;
    let Some(check_menu_item) = find_check_menu_item_in_items(&menu_items, id)? else {
        return Err(format!("missing native menu item: {id}"));
    };

    check_menu_item
        .set_checked(checked)
        .map_err(|error| format!("failed to update native menu item `{id}`: {error}"))
}

#[tauri::command]
fn sync_native_menu_selection_state<R: tauri::Runtime>(
    app_handle: tauri::AppHandle<R>,
    state: NativeMenuSelectionState,
) -> Result<(), String> {
    #[cfg(not(target_os = "macos"))]
    {
        let _ = app_handle;
        let _ = state;

        Ok(())
    }

    #[cfg(target_os = "macos")]
    {
        let Some(menu) = app_handle.menu() else {
            return Ok(());
        };

        set_check_menu_item_state(
            &menu,
            MENU_ID_MODE_SPRITE,
            matches!(state.edit_mode, WorkModeSelection::Sprite),
        )?;
        set_check_menu_item_state(
            &menu,
            MENU_ID_MODE_CHARACTER,
            matches!(state.edit_mode, WorkModeSelection::Character),
        )?;
        set_check_menu_item_state(
            &menu,
            MENU_ID_MODE_BG,
            matches!(state.edit_mode, WorkModeSelection::Bg),
        )?;
        set_check_menu_item_state(
            &menu,
            MENU_ID_MODE_SCREEN,
            matches!(state.edit_mode, WorkModeSelection::Screen),
        )?;
        set_check_menu_item_state(
            &menu,
            MENU_ID_VIEW_THEME_LIGHT,
            matches!(state.theme_preference, ThemePreference::Light),
        )?;
        set_check_menu_item_state(
            &menu,
            MENU_ID_VIEW_THEME_DARK,
            matches!(state.theme_preference, ThemePreference::Dark),
        )?;
        set_check_menu_item_state(
            &menu,
            MENU_ID_VIEW_THEME_SYSTEM,
            matches!(state.theme_preference, ThemePreference::System),
        )?;

        Ok(())
    }
}

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

    let share_export_chr = MenuItem::with_id(
        app,
        MENU_ID_SHARE_EXPORT_CHR,
        "CHRエクスポート",
        true,
        None::<&str>,
    )?;
    let share_export_png = MenuItem::with_id(
        app,
        MENU_ID_SHARE_EXPORT_PNG,
        "PNGエクスポート",
        true,
        None::<&str>,
    )?;
    let share_export_svg = MenuItem::with_id(
        app,
        MENU_ID_SHARE_EXPORT_SVG,
        "SVGエクスポート",
        true,
        None::<&str>,
    )?;
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
    let mode_sprite = CheckMenuItem::with_id(
        app,
        MENU_ID_MODE_SPRITE,
        "スプライト編集",
        true,
        true,
        None::<&str>,
    )?;
    let mode_character = CheckMenuItem::with_id(
        app,
        MENU_ID_MODE_CHARACTER,
        "キャラクター編集",
        true,
        false,
        None::<&str>,
    )?;
    let mode_bg =
        CheckMenuItem::with_id(app, MENU_ID_MODE_BG, "BG編集", true, false, None::<&str>)?;
    let mode_screen = CheckMenuItem::with_id(
        app,
        MENU_ID_MODE_SCREEN,
        "画面配置",
        true,
        false,
        None::<&str>,
    )?;
    let view_theme_light = CheckMenuItem::with_id(
        app,
        MENU_ID_VIEW_THEME_LIGHT,
        "ライト",
        true,
        false,
        None::<&str>,
    )?;
    let view_theme_dark = CheckMenuItem::with_id(
        app,
        MENU_ID_VIEW_THEME_DARK,
        "ダーク",
        true,
        false,
        None::<&str>,
    )?;
    let view_theme_system = CheckMenuItem::with_id(
        app,
        MENU_ID_VIEW_THEME_SYSTEM,
        "システムに合わせる",
        true,
        true,
        None::<&str>,
    )?;
    let help_check_for_updates = MenuItem::with_id(
        app,
        MENU_ID_HELP_CHECK_FOR_UPDATES,
        "更新を確認",
        true,
        None::<&str>,
    )?;
    let share_items: Vec<&(dyn IsMenuItem<R> + 'static)> = vec![
        &share_export_chr,
        &share_export_png,
        &share_export_svg,
        &share_save_project,
        &share_export_character_json,
    ];
    let mode_items: Vec<&(dyn IsMenuItem<R> + 'static)> =
        vec![&mode_sprite, &mode_character, &mode_bg, &mode_screen];
    let view_items: Vec<&(dyn IsMenuItem<R> + 'static)> =
        vec![&view_theme_light, &view_theme_dark, &view_theme_system];
    let edit_items: Vec<&(dyn IsMenuItem<R> + 'static)> = vec![&edit_undo, &edit_redo];

    let share_submenu = Submenu::with_items(app, "共有", true, share_items.as_slice())?;

    let mode_submenu = Submenu::with_items(app, "作業モード", true, mode_items.as_slice())?;
    let view_submenu = Submenu::with_items(app, "表示", true, view_items.as_slice())?;
    let edit_submenu = Submenu::with_items(app, "編集", true, edit_items.as_slice())?;
    let file_items: Vec<&(dyn IsMenuItem<R> + 'static)> = vec![&share_submenu, &restore_import];
    let help_items: Vec<&(dyn IsMenuItem<R> + 'static)> = vec![&help_check_for_updates];
    let file_submenu = Submenu::with_items(app, "ファイル", true, file_items.as_slice())?;
    let help_submenu = Submenu::with_items(app, "ヘルプ", true, help_items.as_slice())?;
    let menu_items: Vec<&(dyn IsMenuItem<R> + 'static)> = vec![
        &app_submenu,
        &mode_submenu,
        &edit_submenu,
        &view_submenu,
        &file_submenu,
        &help_submenu,
    ];
    let menu = Menu::with_items(app, menu_items.as_slice())?;
    app.set_menu(menu)?;

    Ok(())
}

fn emit_file_menu_event<R: tauri::Runtime>(app_handle: &tauri::AppHandle<R>, event_name: &str) {
    let _ = app_handle.emit(event_name, ());
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_context = tauri::generate_context!("tauri.conf.json");
    let builder = tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_runtime_diagnostics_config,
            record_runtime_diagnostic,
            sync_native_menu_selection_state
        ])
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
            MENU_ID_VIEW_THEME_LIGHT => {
                emit_file_menu_event(app_handle, MENU_EVENT_VIEW_THEME_LIGHT)
            }
            MENU_ID_VIEW_THEME_DARK => emit_file_menu_event(app_handle, MENU_EVENT_VIEW_THEME_DARK),
            MENU_ID_VIEW_THEME_SYSTEM => {
                emit_file_menu_event(app_handle, MENU_EVENT_VIEW_THEME_SYSTEM)
            }
            MENU_ID_HELP_CHECK_FOR_UPDATES => {
                emit_file_menu_event(app_handle, MENU_EVENT_HELP_CHECK_FOR_UPDATES)
            }
            _ => {}
        })
        .run(app_context)
        .expect("error while running tauri application");
}
