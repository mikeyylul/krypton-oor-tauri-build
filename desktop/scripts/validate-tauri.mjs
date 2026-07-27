import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const desktopRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = path.resolve(desktopRoot, "..");
const readText = (filePath) =>
  fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
const appSource = readText(path.join(siteRoot, "app/page.tsx"));
const desktopSource = readText(path.join(desktopRoot, "src/App.tsx"));
const config = JSON.parse(
  fs.readFileSync(path.join(desktopRoot, "src-tauri/tauri.conf.json"), "utf8"),
);
const rustSource = readText(
  path.join(desktopRoot, "src-tauri/src/main.rs"),
);

const normalizedDesktop = desktopSource
  .replace(
    "const starterJobs: Job[] = [];\nconst exampleJobs: Job[] = [",
    "const starterJobs: Job[] = [",
  )
  .replace(
    `              window.alert(\n                "Power Automate is not opened from the offline application. Export your data here, then open Power Automate separately when you choose to use an internet-connected workflow.",\n              )`,
    `              window.open(\n                "https://make.powerautomate.com",\n                "_blank",\n                "noopener,noreferrer",\n              )`,
  )
  .replace("            Offline application", "            Open Power Automate");

if (normalizedDesktop !== appSource) {
  throw new Error(
    "The offline Tauri interface no longer matches the latest website source outside the approved offline-only changes.",
  );
}

for (const fragment of [
  'workerPath: "/tesseract/worker.min.js"',
  'corePath: "/tesseract/core"',
  'langPath: "/tesseract/lang"',
  "gzip: false",
  "workerBlobURL: false",
]) {
  if (!desktopSource.includes(fragment)) {
    throw new Error(`Missing packaged OCR setting: ${fragment}`);
  }
}

if (config.identifier !== "com.kryptonsolutions.oor") {
  throw new Error("The stable local-data application identifier changed.");
}
if (config.bundle?.windows?.webviewInstallMode?.type !== "offlineInstaller") {
  throw new Error("The Windows installer must include the offline WebView2 installer.");
}
if (!String(config.app?.security?.csp).includes("connect-src 'self'")) {
  throw new Error("The Tauri application is missing its local-only network policy.");
}
if (!rustSource.includes("on_navigation") || !rustSource.includes("NewWindowResponse::Deny")) {
  throw new Error("The Tauri application is missing external navigation blocking.");
}
for (const fragment of [
  "Shell.Application",
  "BrowseForFolder",
  "powershell.exe",
  "fn create_rfq_folder",
  'PathBuf::from(r"Q:\\Customer RFQs")',
  'PathBuf::from(r"P:\\RFQs")',
  '["Customer Data", "Customer Request"]',
  'Command::new("explorer.exe")',
]) {
  if (!rustSource.includes(fragment)) {
    throw new Error(`Missing native RFQ folder creation behavior: ${fragment}`);
  }
}
for (const obsolete of [
  "pick_rfq_shortcut",
  "run_rfq_shortcut",
  "Assign RFQ Folder Task",
]) {
  if (rustSource.includes(obsolete) || desktopSource.includes(obsolete)) {
    throw new Error(`Obsolete RFQ shortcut behavior remains: ${obsolete}`);
  }
}

console.log(
  "Validated website parity, native RFQ folder creation, local autosave identity, packaged photo OCR, and Tauri offline restrictions.",
);
