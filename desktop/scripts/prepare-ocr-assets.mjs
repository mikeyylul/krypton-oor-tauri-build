import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const desktopRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(desktopRoot, "public/tesseract");
const coreSource = path.join(desktopRoot, "node_modules/tesseract.js-core");
const workerSource = path.join(
  desktopRoot,
  "node_modules/tesseract.js/dist/worker.min.js",
);
const languageSource = path.join(
  desktopRoot,
  "node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz",
);

fs.mkdirSync(path.join(publicRoot, "core"), { recursive: true });
fs.mkdirSync(path.join(publicRoot, "lang"), { recursive: true });
fs.copyFileSync(workerSource, path.join(publicRoot, "worker.min.js"));

for (const name of fs.readdirSync(coreSource)) {
  if (/^tesseract-core(?:-[a-z-]+)?\.wasm(?:\.js)?$/.test(name)) {
    fs.copyFileSync(path.join(coreSource, name), path.join(publicRoot, "core", name));
  }
}

fs.writeFileSync(
  path.join(publicRoot, "lang/eng.traineddata"),
  gunzipSync(fs.readFileSync(languageSource)),
);

console.log("Prepared packaged OCR worker, engine, and English language data.");
