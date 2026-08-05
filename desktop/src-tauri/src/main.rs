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

fn rfq_root(division: &str) -> Result<PathBuf, String> {
    match division {
        "Commercial" => Ok(PathBuf::from(r"Q:\Customer RFQs")),
        "Aerospace" => Ok(PathBuf::from(r"P:\RFQs")),
        _ => Err("Choose Commercial or Aerospace.".to_string()),
    }
}

fn available_rfq_root(division: &str) -> Result<PathBuf, String> {
    let root = rfq_root(division)?;
    if !root.is_dir() {
        return Err(format!(
            "The {division} RFQ location is not available: {}. Connect the network drive and try again.",
            root.display()
        ));
    }
    root.canonicalize().map_err(|error| {
        format!(
            "The {division} RFQ location could not be opened: {} ({error})",
            root.display()
        )
    })
}

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
fn select_rfq_customer_folder(division: String) -> Result<Option<String>, String> {
    let root = available_rfq_root(&division)?;
    let title = format!("Select the {division} customer folder");
    let script = format!(
        "$shell = New-Object -ComObject Shell.Application; \
         $folder = $shell.BrowseForFolder(0, '{}', 0, '{}'); \
         if ($null -ne $folder) {{ [Console]::Out.Write($folder.Self.Path) }}",
        title.replace('\'', "''"),
        root.to_string_lossy().replace('\'', "''"),
    );
    let output = Command::new("powershell.exe")
        .args([
            "-NoProfile",
            "-STA",
            "-WindowStyle",
            "Hidden",
            "-Command",
            &script,
        ])
        .output()
        .map_err(|error| {
            format!(
                "The Windows customer-folder picker could not be opened: {error}"
            )
        })?;
    if !output.status.success() {
        let details = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(if details.is_empty() {
            "The Windows customer-folder picker closed unexpectedly.".to_string()
        } else {
            format!("The Windows customer-folder picker failed: {details}")
        });
    }
    let selected_text = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if selected_text.is_empty() {
        return Ok(None);
    }
    let selected = PathBuf::from(selected_text);
    let selected = selected.canonicalize().map_err(|error| {
        format!(
            "The selected customer folder could not be opened: {} ({error})",
            selected.display()
        )
    })?;
    if selected == root || !selected.starts_with(&root) {
        return Err(format!(
            "Select an existing customer folder inside {}.",
            root.display()
        ));
    }
    Ok(Some(selected.to_string_lossy().into_owned()))
}

#[tauri::command]
fn create_rfq_folder(
    division: String,
    customer_folder: String,
    folder_name: String,
) -> Result<String, String> {
    let root = available_rfq_root(&division)?;
    let customer_folder = PathBuf::from(customer_folder)
        .canonicalize()
        .map_err(|error| format!("The selected customer folder is unavailable: {error}"))?;
    if customer_folder == root || !customer_folder.starts_with(&root) {
        return Err(format!(
            "Select an existing customer folder inside {}.",
            root.display()
        ));
    }
    let folder_name = validate_folder_name(&folder_name)?;
    let main_folder = customer_folder.join(folder_name);
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
        .invoke_handler(tauri::generate_handler![
            select_rfq_customer_folder,
            create_rfq_folder
        ])
        .setup(|app| {
            WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
                .title("Krypton Solutions OOR")
                .inner_size(1440.0, 900.0)
                .min_inner_size(1100.0, 700.0)
                .resizable(true)
                .disable_drag_drop_handler()
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
