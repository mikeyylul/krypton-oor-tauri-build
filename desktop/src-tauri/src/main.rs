#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{
    fs,
    path::PathBuf,
    process::Command,
};
use tauri::{
    utils::config::WebviewUrl,
    webview::{NewWindowResponse, WebviewWindowBuilder},
};

fn validate_folder_name(folder_name: &str) -> Result<&str, String> {
    let trimmed = folder_name.trim();
    if trimmed.is_empty() {
        return Err("Enter a folder name.".to_string());
    }
    if trimmed == "." || trimmed == ".." {
        return Err("Enter a valid folder name.".to_string());
    }
    if trimmed
        .chars()
        .any(|character| matches!(character, '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*'))
        || trimmed.ends_with(' ')
        || trimmed.ends_with('.')
    {
        return Err("The folder name contains characters Windows does not allow.".to_string());
    }
    let reserved = trimmed
        .split('.')
        .next()
        .unwrap_or_default()
        .to_ascii_uppercase();
    if matches!(
        reserved.as_str(),
        "CON" | "PRN" | "AUX" | "NUL"
            | "COM1" | "COM2" | "COM3" | "COM4" | "COM5" | "COM6" | "COM7" | "COM8" | "COM9"
            | "LPT1" | "LPT2" | "LPT3" | "LPT4" | "LPT5" | "LPT6" | "LPT7" | "LPT8" | "LPT9"
    ) {
        return Err("That folder name is reserved by Windows.".to_string());
    }
    Ok(trimmed)
}

#[tauri::command]
fn create_rfq_folder(division: String, folder_name: String) -> Result<String, String> {
    let root = match division.as_str() {
        "Commercial" => PathBuf::from(r"Q:\Customer RFQs"),
        "Aerospace" => PathBuf::from(r"P:\RFQs"),
        _ => return Err("Choose Commercial or Aerospace.".to_string()),
    };
    if !root.is_dir() {
        return Err(format!(
            "The {division} RFQ location is not available: {}. Connect the network drive and try again.",
            root.display()
        ));
    }
    let folder_name = validate_folder_name(&folder_name)?;
    let main_folder = root.join(folder_name);
    if main_folder.exists() {
        return Err(format!(
            "That folder already exists: {}",
            main_folder.display()
        ));
    }
    fs::create_dir(&main_folder).map_err(|error| {
        format!(
            "Could not create the {division} RFQ folder at {}: {error}",
            main_folder.display()
        )
    })?;
    for child in ["Customer Data", "Customer Request"] {
        if let Err(error) = fs::create_dir(main_folder.join(child)) {
            let _ = fs::remove_dir_all(&main_folder);
            return Err(format!(
                "Could not create the required {child} folder: {error}"
            ));
        }
    }
    Command::new("explorer.exe")
        .arg(&main_folder)
        .spawn()
        .map_err(|error| {
            format!(
                "The folder was created at {}, but Windows Explorer could not open it: {error}",
                main_folder.display()
            )
        })?;
    Ok(main_folder.to_string_lossy().into_owned())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![create_rfq_folder])
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
