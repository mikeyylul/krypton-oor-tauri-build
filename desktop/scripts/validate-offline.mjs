import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const desktopRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = path.join(desktopRoot, "dist");
const releaseRoot = process.argv[2] ? path.resolve(process.argv[2]) : null;

function requireFile(filePath, minimumBytes = 1) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    throw new Error(`Missing required file: ${filePath}`);
  }
  if (fs.statSync(filePath).size < minimumBytes) {
    throw new Error(`Required file is unexpectedly small: ${filePath}`);
  }
}

const requiredOfflineFiles = [
  "index.html",
  "tesseract/worker.min.js",
  "tesseract/core/tesseract-core.wasm.js",
  "tesseract/core/tesseract-core.wasm",
  "tesseract/core/tesseract-core-simd.wasm.js",
  "tesseract/core/tesseract-core-simd.wasm",
  "tesseract/core/tesseract-core-lstm.wasm.js",
  "tesseract/core/tesseract-core-lstm.wasm",
  "tesseract/core/tesseract-core-simd-lstm.wasm.js",
  "tesseract/core/tesseract-core-simd-lstm.wasm",
  "tesseract/lang/eng.traineddata",
];

for (const relative of requiredOfflineFiles) {
  requireFile(path.join(distRoot, relative));
}

const indexHtml = fs.readFileSync(path.join(distRoot, "index.html"), "utf8");
if (!indexHtml.includes("Content-Security-Policy") || !indexHtml.includes("connect-src 'self' blob:")) {
  throw new Error("The local-only Content Security Policy is missing from index.html.");
}

for (const match of indexHtml.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const reference = match[1];
  if (reference.startsWith("data:") || reference.startsWith("#")) continue;
  if (/^[a-z]+:/i.test(reference) || reference.startsWith("//")) {
    throw new Error(`Remote document reference is not allowed: ${reference}`);
  }
  const relative = reference.replace(/^\//, "").split("?")[0];
  requireFile(path.join(distRoot, relative));
}

const appSource = fs.readFileSync(path.join(desktopRoot, "src/App.tsx"), "utf8");
if (!appSource.includes("const starterJobs: Job[] = [];")) {
  throw new Error("The offline package must start without sample or customer jobs.");
}
if (appSource.includes("https://make.powerautomate.com")) {
  throw new Error("The offline application still contains an internet-only Power Automate action.");
}

if (releaseRoot) {
  const releaseRequired = [
    "START-KRYPTON.cmd",
    "KryptonLauncher.ps1",
    "README-FIRST.txt",
    ...requiredOfflineFiles.map((relative) => path.join("app", relative)),
  ];
  for (const relative of releaseRequired) {
    requireFile(path.join(releaseRoot, relative));
  }
  const executable = fs
    .readdirSync(releaseRoot, { recursive: true })
    .find((relative) => String(relative).toLowerCase().endsWith(".exe"));
  if (executable) {
    throw new Error(`Unexpected custom executable found in release: ${executable}`);
  }
}

console.log(
  releaseRoot
    ? "Validated offline Windows release, local autosave configuration, and OCR assets."
    : "Validated offline desktop build and local-only configuration.",
);
