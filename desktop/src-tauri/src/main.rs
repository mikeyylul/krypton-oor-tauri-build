#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    utils::config::WebviewUrl,
    webview::{NewWindowResponse, WebviewWindowBuilder},
};

fn main() {
    tauri::Builder::default()
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
