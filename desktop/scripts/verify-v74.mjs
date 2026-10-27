import fs from "node:fs";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
import XLSX from "xlsx";

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
jobs[6].shortages = [shortage("today", day(0)), shortage("another", day(-1)), shortage("mixed-undated", "")];
jobs[6].workflowCompleted = ["fabrication-dock"];
jobs[7].shortages = [shortage("only-undated", "")];
jobs[8].workflowCompleted = ["shortage-list"];
jobs[9].shortages = [shortage("no-follow-up", day(-3))];
jobs[9].excludeFromFollowUps = true;
jobs[0].specialProcesses = ["Polymerics", "External Testing"];
jobs[0].specialProcessOrder = ["Polymerics", "External Testing"];
jobs[0].polymericsTurnDays = 2;
jobs[0].externalTestingTurnDays = 3;
jobs[0].kryptonDockDateOverride = day(12);
jobs[4].customer = jobs[0].customer;
const folder = { id: "test-folder", name: "Large organization", division: "Commercial",
  collapsed: false, customers: Array.from(new Set(jobs.map((job) => job.customer.trim()))) };
const dockSource = source.slice(source.indexOf("function materialsReadyDate("), source.indexOf("function pcbaReadyForKitting(")).replace("job: Job", "job");
const dock = Function("latestDate", dockSource + "; return materialsReadyDate;")((dates) => dates.sort().at(-1) || "");
assert.equal(dock(jobs[0]), day(2), "Undated items do not block dock date");
assert.equal(dock({ ...jobs[0], pcbDockDate: day(10) }), day(10), "PCB longest lead");
assert.equal(dock({ ...jobs[0], pcbDockDate: "", shortages: [shortage("a", day(5)), shortage("b", "")] }), day(5));
const server = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["exec", "--", "vite", "preview", "--host", "127.0.0.1", "--port", "1420"], { shell: true, stdio: "pipe" });
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
  assert.equal(await page.locator(".organization-folder-customers button").count(), 79);
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
  await page.evaluate(() => { window.__copiedHtml = undefined; });
  await page.getByRole("button", { name: "Copy Customer Table", exact: true }).click();
  await page.waitForFunction(() => typeof window.__copiedHtml === "string");
  assert.match(await page.evaluate(() => window.__copiedHtml), new RegExp(day(2).slice(0, 4)));
  await page.getByLabel("Shortage due date", { exact: true }).first().fill("");
  await page.evaluate(() => { window.__copiedHtml = undefined; });
  await page.getByRole("button", { name: "Copy Customer Table", exact: true }).click();
  await page.waitForFunction(() => typeof window.__copiedHtml === "string");
  assert.match(await page.evaluate(() => window.__copiedHtml), /Not Set/);
  await page.locator("label.drawer-field").filter({ hasText: "Status filter value" }).locator("select").selectOption("SMT");
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  assert((await page.evaluate(() => JSON.parse(localStorage.getItem("projectflow-manufacturing-v3"))[0].workflowCompleted)).includes("kitting"));
  await page.locator("label.drawer-field").filter({ hasText: "Status filter value" }).locator("select").selectOption("TH ASSY");
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  assert((await page.evaluate(() => JSON.parse(localStorage.getItem("projectflow-manufacturing-v3"))[0].workflowCompleted)).includes("smt"));
  await comment.fill("Flushed on focus loss");
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.reload(); await comment.waitFor();
  assert.equal(await comment.inputValue(), "Flushed on focus loss");
  assert.equal(await page.locator(".organization-folder-customers button").count(), 79);
  await page.goto("http://127.0.0.1:1420/");
  await page.getByRole("button", { name: "Weekly Report", exact: true }).waitFor();
  await page.waitForTimeout(800);
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Weekly Report", exact: true }).click();
  const download = await downloaded;
  const file = await download.path();
  const workbook = XLSX.readFile(file);
  assert.deepEqual(workbook.SheetNames, ["Commercial", "Aerospace", "Customer Supplied", "Need Shortage Report", "On Schedule Builds"]);
  const header = ["Customer Name", "Job #", "KSID", "PN Name", "PN and Rev", "Issue KSP#", "KS Purchasing Team Comments"];
  for (const name of workbook.SheetNames.slice(0, 4)) assert.deepEqual(XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1 })[0], header);
  assert.deepEqual(XLSX.utils.sheet_to_json(workbook.Sheets["On Schedule Builds"], { header: 1 })[0], [
    "Customer Name", "Job #", "KSID", "PN Name", "PN and Rev", "Project Creation Date",
    "Has Shortage Been Pulled", "PCB Dock Date Confirmed", "Krypton Dock Date",
  ]);
  const report = JSON.stringify(workbook.Sheets);
  assert(report.includes("KSP-old")); assert(report.includes("KSP-customer"));
  assert(!report.includes("KSP-future")); assert(!report.includes("KSP-received")); assert(!report.includes("KSP-customer-future"));
  assert(!report.includes("KSP-no-follow-up"), "No Follow Ups jobs are excluded from the shortage report");
  const need = JSON.stringify(workbook.Sheets["Need Shortage Report"]);
  assert(need.includes("91005")); assert(!need.includes("91003")); assert(!need.includes("91004")); assert(!need.includes("91008"));
  const commercialRows = XLSX.utils.sheet_to_json(workbook.Sheets.Commercial, { header: 1 }).slice(1);
  const grouped = commercialRows.filter((row) => row[1] === "91006");
  assert.equal(grouped.length, 1, "One row per job");
  assert.match(grouped[0][5], /KSP-today/);
  assert.match(grouped[0][5], /KSP-another/);
  const expectedDate = (value) => {
    const [year, month, date] = value.split("-");
    return month + "/" + date + "/" + year;
  };
  assert(grouped[0][5].includes(expectedDate(day(0))), "Issued due dates use MM/DD/YYYY");
  assert.equal(grouped[0][6] ?? "", "", "Purchasing comments column remains blank");
  assert(grouped[0][5].endsWith("Not Set"), "Undated bullet last");
  assert.equal(commercialRows.at(-1)[1], "91007", "Undated-only job sorted last");
  const onScheduleRows = XLSX.utils.sheet_to_json(workbook.Sheets["On Schedule Builds"], { header: 1 }).slice(1);
  const confirmedPcb = onScheduleRows.find((row) => row[1] === "91006");
  assert.equal(confirmedPcb[7], "Yes", "Fabrication workflow check confirms PCB Dock Date");
  assert(!onScheduleRows.some((row) => row[1] === "91009"), "No Follow Ups jobs stay out of Weekly Report");
  const archive = XLSX.CFB.read(fs.readFileSync(file), { type: "buffer" });
  const styles = archive.FileIndex[archive.FullPaths.findIndex((path) => path.endsWith("/xl/styles.xml"))];
  assert(Buffer.from(styles.content).toString().includes('wrapText="1"'));

  const exportStarted = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Excel", exact: true }).click();
  const exportDownload = await exportStarted;
  const exportFile = await exportDownload.path();
  const exportedJobs = XLSX.readFile(exportFile, { cellDates: true });
  assert.deepEqual(exportedJobs.SheetNames, ["Large organization", "Completed Jobs"]);
  const organizationRows = XLSX.utils.sheet_to_json(exportedJobs.Sheets["Large organization"], { header: 1 });
  assert.deepEqual(organizationRows[0], [
    "Customer Name", "Job#", "KSID", "PN Name", "PN and Rev", "Project Created",
    "PO#", "Quote#", "Current Status of Job", "Latest Note", "Krypton Dock Date", "Special Notes",
  ]);
  assert(organizationRows.some((row) => row[1] === "91009"), "All booked No Follow Ups jobs remain in Export Excel");
  const exportedJobZero = organizationRows.find((row) => row[1] === "91000");
  assert.match(exportedJobZero[11], /Special processes: Polymerics, External Testing/);
  assert.match(exportedJobZero[11], /Missing shortage dates/);
  const completedSheet = exportedJobs.Sheets["Completed Jobs"];
  assert.equal(completedSheet.H2.f.includes('I2="Job was completed on time"'), true);
  assert.equal(completedSheet.M2.f, 'COUNTIF(H2:H2,"Early")');
  const exportArchive = XLSX.CFB.read(fs.readFileSync(exportFile), { type: "buffer" });
  assert(exportArchive.FullPaths.some((path) => path.endsWith("/xl/charts/chart1.xml")), "Completed Jobs chart exists");
  assert(exportArchive.FullPaths.some((path) => path.endsWith("/xl/drawings/drawing1.xml")), "Chart is attached to the worksheet");

  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const backupStarted = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export complete backup", exact: true }).click();
  const backupDownload = await backupStarted;
  const backupFile = await backupDownload.path();
  const backupWorkbook = XLSX.readFile(backupFile);
  assert.deepEqual(backupWorkbook.SheetNames, ["Complete Backup", "Read Me"]);
  const backupRows = XLSX.utils.sheet_to_json(backupWorkbook.Sheets["Complete Backup"]);
  assert.equal(backupRows.filter((row) => row["Record Type"] === "Job").length, 80);
  assert.equal(backupRows.filter((row) => row["Record Type"] === "Customer Organization Folder").length, 1);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Import complete Excel backup").setInputFiles(backupFile);
  await page.getByText(/Backup restored: 80 jobs/).waitFor();

  await page.evaluate(() => {
    window.__nativeExport = null;
    window.__TAURI_INTERNALS__ = {
      invoke: async (command, args) => {
        if (command !== "save_export_file") return null;
        window.__nativeExport = { command, args };
        return `C:\\Users\\Test\\Downloads\\${args.defaultName}`;
      },
    };
  });
  await page.getByRole("button", { name: "Export complete backup", exact: true }).click();
  await page.getByText("Complete Excel backup saved.").waitFor();
  const nativeBackup = await page.evaluate(() => window.__nativeExport);
  assert.equal(nativeBackup.command, "save_export_file");
  assert.match(nativeBackup.args.defaultName, /^Krypton-Solutions-OOR-Complete-Backup-\d{4}-\d{2}-\d{2}\.xlsx$/);
  assert(nativeBackup.args.contentsBase64.startsWith("UEs"), "Native save receives an XLSX ZIP payload");
  const nativeWorkbook = XLSX.read(Buffer.from(nativeBackup.args.contentsBase64, "base64"));
  assert.deepEqual(nativeWorkbook.SheetNames, ["Complete Backup", "Read Me"]);
  assert.equal(
    XLSX.utils.sheet_to_json(nativeWorkbook.Sheets["Complete Backup"])
      .filter((row) => row["Record Type"] === "Job").length,
    80,
    "Native Windows save receives every job",
  );

  await page.getByRole("button", { name: /List of Action Items/ }).click();
  const head = page.locator(".grouped-action-head").first();
  assert.equal(await head.locator("span").nth(3).textContent(), "PN Name");
  assert.equal(await head.locator("span").nth(4).innerText(), "PN");

  await page.getByRole("button", { name: /Test Customer 000/ }).click();
  const completedSection = page.locator(".completed-jobs-section");
  assert.match(await completedSection.locator("summary").innerText(), /Completed\s+1/);
  await page.getByRole("button", { name: "Job Excel Format", exact: true }).click();
  const jobExcelDialog = page.getByRole("dialog", { name: "Job Excel Format" });
  assert.equal(await jobExcelDialog.locator(".job-excel-format-list label").count(), 1);
  assert.equal(await jobExcelDialog.getByText("Job #91004", { exact: true }).count(), 0, "Completed jobs stay out of Job Excel Format");
  await page.evaluate(() => { window.__copiedHtml = undefined; });
  await jobExcelDialog.getByRole("button", { name: "Copy selected jobs", exact: true }).click();
  await page.waitForFunction(() => typeof window.__copiedHtml === "string");
  const jobExcelHtml = await page.evaluate(() => window.__copiedHtml);
  const expectedKryptonDock = new Date(`${day(12)}T12:00:00`).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
  assert.match(jobExcelHtml, /Krypton Dock Date/);
  assert(jobExcelHtml.includes(expectedKryptonDock), "Job Excel Format uses Krypton Dock Date");
  assert(!jobExcelHtml.includes("91004"), "Completed job is not copied");
  assert.deepEqual(errors, []);
  console.log("PASS: Version 78 active-only Job Excel Format with Krypton Dock Date and all Version 70-77 regressions.");
} finally {
  await browser?.close();
  if (process.platform === "win32") spawn("taskkill", ["/pid", String(server.pid), "/T", "/F"]);
  else server.kill();
}
