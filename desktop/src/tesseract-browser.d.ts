declare module "tesseract.js/dist/tesseract.esm.min.js" {
  import type * as Tesseract from "tesseract.js";

  const TesseractBrowser: typeof Tesseract;
  export default TesseractBrowser;
}
