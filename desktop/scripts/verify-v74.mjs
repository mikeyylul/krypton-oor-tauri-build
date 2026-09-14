import fs from "node:fs";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
import * as XLSX from "xlsx";

const source = fs.readFileSync("../app/page.tsx", "utf8");
const sample = source.match(/const starterJobs: Job\[\] = (\[[\s\S]*?\n\]);/);
assert(sample, "Website fixture template");
const template = Function("return " + sample[1])()[0];
const day = (offset) => {
  const date = new Date(); date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};
const shortage = (id, dueDate, customerSupplied = false, complete = false) => ({
  id, kspNumber: "KSP-" + id, pnNumber: "PART-" + id, quantity: "10",
  dueDate, customerSupplied, complete, comments: "",
});
const jobs = Array.from({ length: 80 }, (_, index) => ({
  ...structuredClone(template), id: "test-" + index, division: "Commercial",
  customer: "Test Customer " + String(index).padStart(3, "0") + (index === 0 ? " " : ""),
  jobNumber: String(91000 + index), ksid: "KS-" + index, pnName: "Test Board " + index,
  pn: "TEST-PN-" + index, rev: "A", buildLevel: "PCBA", status: "Waiting on Parts",
  createdDate: day(-10), dueDate: day(30), customerDueDate: "",
  pcbDockDate: day(1), pcbArrived: false, allPartsReceivedDate: "",
  noShortageList: false, acceptedPartials: false, partialDeliveries: [],
  assemblyTurnDays: 0, specialProcesses: [], shortages: [], notes: [],
  workflowCompleted: [], followUpCadence: "", actionDeferredUntil: "",
}));
jobs[0].shortages = [shortage("dated", day(2)), shortage("undated", "")];
jobs[1].shortages = [shortage("old", day(-2)), shortage("future", day(20)), shortage("received", day(-1), false, true)];
jobs[2].shortages = [shortage("customer", day(-1), true), shortage("customer-future", day(20), true)];
jobs[3].noShortageList = true;
jobs[4].status = "Complete";
const folder = { id: "test-folder", name: "Large organization", division: "Commercial",
  collapsed: false, customers: jobs.map((job) => job.customer.trim()) };
const dockSource = source.slice(source.indexOf("function materialsReadyDate("), source.indexOf("function pcbaReadyForKitting(")).replace("job: Job", "job");
const dock = Function("latestDate", dockSource + "; return materialsReadyDate;")((dates) => dates.sort().at(-1) || "");
assert.equal(dock(jobs[0]), day(2), "Undated items do not block dock date");
assert.equal(dock({ ...jobs[0], pcbDockDate: day(10) }), day(10), "PCB longest lead");
assert.equal(dock({ ...jobs[0], pcbDockDate: "", shortages: [shortage("a", day(5)), shortage("b", "")] }), day(5));
const server = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "dev"], { shell: true, stdio: "pipe" });
server.stdout.on("data", () => {}); server.stderr.on("data", () => {});
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 90; attempt++) {
    try { if ((await fetch("http://127.0.0.1:1420")).ok) { ready = true; break; } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  assert(ready, "Vite server started");
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true, timezoneId: "America/Chicago" });
  await context.addInitScript(({ jobs, folder }) => {
    const key = "projectflow-manufacturing-v3";
    if (!localStorage.getItem("v74-test-seeded")) {
      localStorage.setItem(key, JSON.stringify(jobs));
      localStorage.setItem("krypton-oor-customer-organization-folders-v1", JSON.stringify([folder]));
      localStorage.setItem("krypton-oor-quotes-v1", JSON.stringify([{ id: "obsolete-quote" }]));
      localStorage.setItem("v74-test-seeded", "1");
    }
    window.__KRYPTON_TEST__ = true;
    window.__saveCount = 0;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(k, v) {
      if (k === key) window.__saveCount++;
      return original.call(this, k, v);
    };
    Object.defineProperty(navigator, "clipboard", { value: {
      write: async (items) => { window.__copiedHtml = await (await items[0].getType("text/html")).text(); },
      writeText: async (text) => { window.__copiedHtml = text; },
    }, configurable: true });
  }, { jobs, folder });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:1420/?job=test-0");
  const comment = page.getByLabel("Shortage comments", { exact: true }).first();
  await comment.waitFor(); await page.waitForTimeout(1300);
  assert.equal(await page.getByRole("button", { name: "Quotes", exact: true }).count(), 0);
  assert.equal(await page.evaluate(() => localStorage.getItem("krypton-oor-quotes-v1")), null);
  assert.equal(await page.locator(".organization-folder-customers button").count(), 80);
  await page.evaluate(() => { window.__saveCount = 0; performance.clearMarks(); });
  await comment.pressSequentially("x".repeat(100), { delay: 1 });
  await page.waitForTimeout(850);
  const metrics = await page.evaluate(() => ({
    saves: window.__saveCount,
    actions: performance.getEntriesByName("krypton-action-recalculation").length,
    graphs: performance.getEntriesByName("krypton-graph-recalculation").length,
    comment: JSON.parse(localStorage.getItem("projectflow-manufacturing-v3"))[0].shortages[0].comments,
  }));
  assert.deepEqual(metrics, { saves: 1, actions: 1, graphs: 0, comment: "x".repeat(100) });
  console.log("100 keystrokes: one autosave, one deferred action recalculation, zero assembly graph recalculations.");
  await page.getByLabel("Customer supplied PART-dated", { exact: true }).check();
  assert.equal(await page.getByLabel("Shortage due date", { exact: true }).first().inputValue(), day(2));
  await page.getByRole("button", { name: "Copy Customer Table", exact: true }).click();
  assert.match(await page.evaluate(() => window.__copiedHtml), new RegExp(day(2).slice(0, 4)));
  await page.getByLabel("Shortage due date", { exact: true }).first().fill("");
  await page.getByRole("button", { name: "Copy Customer Table", exact: true }).click();
  assert.match(await page.evaluate(() => window.__copiedHtml), /Not Set/);
  await page.getByLabel("Status filter value", { exact: true }).selectOption("SMT");
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  assert((await page.evaluate(() => JSON.parse(localStorage.getItem("projectflow-manufacturing-v3"))[0].workflowCompleted)).includes("kitting"));
  await page.getByLabel("Status filter value", { exact: true }).selectOption("TH ASSY");
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  assert((await page.evaluate(() => JSON.parse(localStorage.getItem("projectflow-manufacturing-v3"))[0].workflowCompleted)).includes("smt"));
  await comment.fill("Flushed on focus loss");
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.reload(); await comment.waitFor();
  assert.equal(await comment.inputValue(), "Flushed on focus loss");
  assert.equal(await page.locator(".organization-folder-customers button").count(), 80);
  await page.goto("http://127.0.0.1:1420/");
  await page.getByRole("button", { name: "Shortage List Report", exact: true }).waitFor();
  await page.waitForTimeout(800);
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Shortage List Report", exact: true }).click();
  const download = await downloaded;
  const file = await download.path();
  const workbook = XLSX.readFile(file);
  assert.deepEqual(workbook.SheetNames, ["Commercial", "Aerospace", "Customer Supplied", "Need Shortage Report"]);
  const header = ["Customer Name", "Job #", "KSID", "PN Name", "PN and Rev", "Issue KSP#"];
  for (const name of workbook.SheetNames) assert.deepEqual(XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1 })[0], header);
  const report = JSON.stringify(workbook.Sheets);
  assert(report.includes("KSP-old")); assert(report.includes("KSP-customer"));
  assert(!report.includes("KSP-future")); assert(!report.includes("KSP-received")); assert(!report.includes("KSP-customer-future"));
  const need = JSON.stringify(workbook.Sheets["Need Shortage Report"]);
  assert(need.includes("91005")); assert(!need.includes("91003")); assert(!need.includes("91004"));
  const archive = XLSX.CFB.read(fs.readFileSync(file), { type: "buffer" });
  const styles = archive.FileIndex[archive.FullPaths.findIndex((path) => path.endsWith("/xl/styles.xml"))];
  assert(Buffer.from(styles.content).toString().includes('wrapText="1"'));
  await page.getByRole("button", { name: "List of Action Items", exact: true }).click();
  const head = page.locator(".grouped-action-head").first();
  assert.equal(await head.locator("span").nth(3).innerText(), "PN Name");
  assert.equal(await head.locator("span").nth(4).innerText(), "PN");
  assert.deepEqual(errors, []);
  console.log("PASS: 80 folder memberships survive reload; customer dates/copy; dock drivers; workflow completion; blur flush; four-sheet Excel filtering and wrap alignment; PN columns; quote removal.");
} finally {
  await browser?.close();
  if (process.platform === "win32") spawn("taskkill", ["/pid", String(server.pid), "/T", "/F"]);
  else server.kill();
}
