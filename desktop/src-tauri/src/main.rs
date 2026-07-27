#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{
    path::{Path, PathBuf},
    process::Command,
};
use tauri::{
    utils::config::WebviewUrl,
    webview::{NewWindowResponse, WebviewWindowBuilder},
};

const RFQ_SHORTCUT_EXTENSIONS: [&str; 4] = ["lnk", "exe", "cmd", "bat"];

fn validate_rfq_shortcut(path: &Path) -> Result<(), String> {
    if !path.is_file() {
        return Err("The assigned RFQ shortcut no longer exists.".to_string());
    }
    let extension = path
        .extension()
        .and_then(|value| value.to_str())
        .map(str::to_ascii_lowercase)
        .ok_or_else(|| "Select a Windows shortcut or executable file.".to_string())?;
    if !RFQ_SHORTCUT_EXTENSIONS.contains(&extension.as_str()) {
        return Err("Select a .lnk, .exe, .cmd, or .bat file.".to_string());
    }
    Ok(())
}

#[tauri::command]
fn pick_rfq_shortcut(division: String) -> Result<Option<String>, String> {
    let title = format!("Assign {division} RFQ Folder Task");
    let script = r#"
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.OpenFileDialog
$dialog.Title = [string]$args[0]
$dialog.Filter = 'Windows shortcuts and tasks (*.lnk;*.exe;*.cmd;*.bat)|*.lnk;*.exe;*.cmd;*.bat'
$dialog.CheckFileExists = $true
$dialog.Multiselect = $false
if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
    [Console]::Out.Write($dialog.FileName)
}
"#;
    let output = Command::new("powershell.exe")
        .args(["-NoProfile", "-Sta", "-Command", script, &title])
        .output()
        .map_err(|error| format!("Could not open the Windows shortcut picker: {error}"))?;
    if !output.status.success() {
        return Err("The Windows shortcut picker could not be opened.".to_string());
    }
    let selected = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if selected.is_empty() {
        return Ok(None);
    }
    let path = PathBuf::from(&selected);
    validate_rfq_shortcut(&path)?;
    Ok(Some(selected))
}

#[tauri::command]
fn run_rfq_shortcut(shortcut_path: String, _division: String) -> Result<(), String> {
    let path = PathBuf::from(shortcut_path);
    validate_rfq_shortcut(&path)?;
    Command::new("explorer.exe")
        .arg(path)
        .spawn()
        .map_err(|error| format!("Could not run the assigned RFQ shortcut: {error}"))?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            pick_rfq_shortcut,
            run_rfq_shortcut
        ])
        .setup(|app| {
            WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
                .title("Krypton Solutions OOR")
                .inner_size(1440.0, 900.0)
                .min_inner_size(1100.0, 700.0)
                .resizable(true)
                .on_navigation(|url| {
                    let packaged_app = url.scheme() == "tauri"
                        || matches!(url.host_str(), Some("tauri.localhost"));
                    let local_development = cfg!(debug_assertions)
                        && matches!(url.host_str(), Some("localhost") | Some("127.0.0.1"));
                    packaged_app || local_development
                })
                .on_new_window(|_, _| NewWindowResponse::Deny)
                .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Krypton Solutions OOR could not start");
}
