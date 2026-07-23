"use client";

import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  Clock3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Factory,
  FileText,
  FileSpreadsheet,
  Folder,
  FolderKanban,
  Gauge,
  LayoutDashboard,
  Image as ImageIcon,
  Menu,
  PackageCheck,
  Plus,
  Search,
  Settings2,
  StickyNote,
  Trash2,
  Upload,
  Copy,
  UserRound,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Division = "Commercial" | "Aerospace";
type View =
  | "overview"
  | "commercial"
  | "aerospace"
  | "configurations"
  | "quotes"
  | "actions"
  | "follow-ups"
  | "integrations";
type ProjectType =
  | "New"
  | "Repeat"
  | "UPGRADE"
  | "Rework"
  | "RMA"
  | "Assembly Only"
  | "Board Fab Only"
  | "Layout";
type JobStatus =
  | "On Hold"
  | "Waiting on Parts"
  | "Waiting for PCBA"
  | "Waiting for CCAs"
  | "Ready for Mechanical Assembly"
  | "Mechanical Assembly"
  | "Kitting"
  | "SMT"
  | "XRAY"
  | "TH ASSY"
  | "Visual QC"
  | "Testing"
  | "Rework"
  | "Shipping QC"
  | "Complete";
type PolymericsOption =
  | "Underfill"
  | "Staking"
  | "Encapsulation"
  | "Conformal Coating";

type BuildLevel = "PCBA" | "CCA" | "LRU";
type AssemblyRequirement = {
  id: string;
  inputLevel: Exclude<BuildLevel, "LRU">;
  pn: string;
  rev: string;
  quantityPerAssembly: number | "";
};
type AssemblyRecipe = {
  id: string;
  name: string;
  outputLevel: Exclude<BuildLevel, "PCBA">;
  outputPn: string;
  outputRev: string;
  requirements: AssemblyRequirement[];
  createdAt: string;
};

type DailyNote = { id: string; date: string; createdAt: string; text: string };
type RFQTag =
  | "Turnkey"
  | "Repeat"
  | "New"
  | "Assembly Only"
  | "Fabrication Only"
  | "Layout";
type QuoteUrgency = "past-due" | "due-today" | "due-tomorrow" | "scheduled";
type QuoteRecord = {
  id: string;
  division: Division;
  customer: string;
  tags: RFQTag[];
  contact: string;
  pn: string;
  quantity: string;
  rev: string;
  ksid: string;
  dueDate: string;
  createdAt: string;
  completed: boolean;
  notes: DailyNote[];
};
type PartialDelivery = {
  id: string;
  quantity: string;
  dueDate: string;
  comments: string;
  completed: boolean;
};
type QuantityRelease = {
  id: string;
  quantity: number;
  date: string;
};
type MechanicalShipment = {
  id: string;
  quantity: number | "";
  mechanicalTurnDays: number;
  dockDateOverride: string;
  completed: boolean;
  trackingInformation: string;
};
type ShortageItem = {
  id: string;
  kspNumber: string;
  pnNumber: string;
  quantity: string;
  dueDate: string;
  customerSupplied: boolean;
  comments: string;
  complete: boolean;
};
type Job = {
  id: string;
  division: Division;
  customer: string;
  jobNumber: string;
  ksid: string;
  pnName: string;
  pn: string;
  rev: string;
  quantity: string;
  projectType: ProjectType;
  contact: string;
  dueDate: string;
  customerDueDate: string;
  poNumber: string;
  quoteNumber: string;
  status: JobStatus;
  buildLevel?: BuildLevel;
  familyId?: string;
  assemblyRecipeId?: string;
  assemblyRequirements?: AssemblyRequirement[];
  linkedJobIds?: string[];
  completedQuantity?: number | null;
  quantityReleases?: QuantityRelease[];
  mechanicalShipments?: MechanicalShipment[];
  specialProcesses: string[];
  otherSpecialProcess: string;
  otherSpecialProcessTurnDays: number;
  polymericsOptions: PolymericsOption[];
  createdDate: string;
  fabricationDockDate: string;
  pcbDockDate: string;
  pcbArrived: boolean;
  fabricationTurnDays: number;
  assemblyTurnDays: number;
  polymericsTurnDays: number;
  externalTestingTurnDays: number;
  allPartsReceivedDate: string;
  noShortageList: boolean;
  acceptedPartials: boolean;
  partialDeliveries: PartialDelivery[];
  smtDays: number;
  workflowCompleted: string[];
  trackingInformation?: string;
  kryptonDockDateOverride?: string;
  shortages: ShortageItem[];
  notes: DailyNote[];
};
type ActionItem = {
  id: string;
  jobId: string;
  division: Division;
  customer: string;
  jobNumber: string;
  ksid: string;
  outstanding: string;
  dueDate: string;
};
type DockAlert = ActionItem & {
  category: "Missing PCB Dock" | "PCB Past Due";
};
type FollowUpItem = {
  job: Job;
  lastNote: DailyNote | null;
  followUpDueDate: string;
};
type WeeklyTask = {
  id: string;
  text: string;
  complete: boolean;
  createdAt: string;
};
type WeeklyWorkday = {
  date: string;
  tasks: WeeklyTask[];
};
type WeeklyWorkWeek = {
  weekStart: string;
  weekEnd: string;
  days: WeeklyWorkday[];
};
type WeeklyActionsState = {
  current: WeeklyWorkWeek;
  archives: WeeklyWorkWeek[];
};

const projectTypes: ProjectType[] = [
  "New",
  "Repeat",
  "UPGRADE",
  "Rework",
  "RMA",
  "Assembly Only",
  "Board Fab Only",
  "Layout",
];
const jobStatuses: JobStatus[] = [
  "On Hold",
  "Waiting on Parts",
  "Waiting for PCBA",
  "Waiting for CCAs",
  "Ready for Mechanical Assembly",
  "Mechanical Assembly",
  "Kitting",
  "SMT",
  "XRAY",
  "TH ASSY",
  "Visual QC",
  "Testing",
  "Rework",
  "Shipping QC",
  "Complete",
];
const productionAgendaStatuses: JobStatus[] = [
  "Kitting",
  "SMT",
  "XRAY",
  "TH ASSY",
  "Visual QC",
  "Testing",
  "Rework",
  "Shipping QC",
];
const polymericsOptions: PolymericsOption[] = [
  "Underfill",
  "Staking",
  "Encapsulation",
  "Conformal Coating",
];
const rfqTags: RFQTag[] = [
  "Turnkey",
  "Repeat",
  "New",
  "Assembly Only",
  "Fabrication Only",
  "Layout",
];
const storageKey = "projectflow-manufacturing-v3";
const quotesStorageKey = "krypton-oor-quotes-v1";
const weeklyActionsStorageKey = "krypton-oor-weekly-actions-v1";
const assemblyRecipesStorageKey = "krypton-oor-assembly-recipes-v1";

function chicagoDateKey() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function nthWeekday(year: number, month: number, weekday: number, nth: number) {
  const date = new Date(Date.UTC(year, month, 1, 12));
  date.setUTCDate(1 + ((7 + weekday - date.getUTCDay()) % 7) + (nth - 1) * 7);
  return date;
}

function lastWeekday(year: number, month: number, weekday: number) {
  const date = new Date(Date.UTC(year, month + 1, 0, 12));
  date.setUTCDate(date.getUTCDate() - ((7 + date.getUTCDay() - weekday) % 7));
  return date;
}

function observedFixedHoliday(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month, day, 12));
  if (date.getUTCDay() === 6) date.setUTCDate(date.getUTCDate() - 1);
  if (date.getUTCDay() === 0) date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

function federalHolidays(year: number) {
  return new Set([
    dateKey(observedFixedHoliday(year, 0, 1)),
    dateKey(nthWeekday(year, 0, 1, 3)),
    dateKey(nthWeekday(year, 1, 1, 3)),
    dateKey(lastWeekday(year, 4, 1)),
    dateKey(observedFixedHoliday(year, 5, 19)),
    dateKey(observedFixedHoliday(year, 6, 4)),
    dateKey(nthWeekday(year, 8, 1, 1)),
    dateKey(nthWeekday(year, 9, 1, 2)),
    dateKey(observedFixedHoliday(year, 10, 11)),
    dateKey(nthWeekday(year, 10, 4, 4)),
    dateKey(new Date(Date.UTC(year, 11, 24, 12))),
    dateKey(observedFixedHoliday(year, 11, 25)),
  ]);
}

function isBusinessDay(value: Date) {
  const weekday = value.getUTCDay();
  if (weekday === 0 || weekday === 6) return false;
  const key = dateKey(value);
  const year = value.getUTCFullYear();
  return ![year - 1, year, year + 1].some((item) =>
    federalHolidays(item).has(key),
  );
}

function addBusinessDays(date: string, amount: number) {
  if (!date) return "";
  const value = new Date(`${date}T12:00:00Z`);
  let added = 0;
  while (added < Math.max(0, amount)) {
    value.setUTCDate(value.getUTCDate() + 1);
    if (isBusinessDay(value)) added += 1;
  }
  return dateKey(value);
}

function addCalendarDays(date: string, amount: number) {
  if (!date) return "";
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return dateKey(value);
}

function currentWorkWeek(): WeeklyWorkWeek {
  const today = new Date(`${chicagoDateKey()}T12:00:00Z`);
  const weekday = today.getUTCDay();
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  today.setUTCDate(today.getUTCDate() - daysFromMonday);
  const weekStart = dateKey(today);
  const days = Array.from({ length: 5 }, (_, index) => ({
    date: addCalendarDays(weekStart, index),
    tasks: [],
  }));
  return { weekStart, weekEnd: days[4].date, days };
}

function normalizeWeeklyActions(
  saved: WeeklyActionsState | null,
): WeeklyActionsState {
  const fresh = currentWorkWeek();
  if (!saved?.current?.weekStart || !Array.isArray(saved.current.days)) {
    return { current: fresh, archives: [] };
  }
  if (saved.current.weekStart === fresh.weekStart) {
    return {
      current: {
        ...saved.current,
        days: fresh.days.map((day) => ({
          date: day.date,
          tasks:
            saved.current.days.find((savedDay) => savedDay.date === day.date)
              ?.tasks ?? [],
        })),
      },
      archives: Array.isArray(saved.archives) ? saved.archives : [],
    };
  }
  const hasTasks = saved.current.days.some((day) => day.tasks?.length);
  return {
    current: fresh,
    archives: [
      ...(hasTasks ? [saved.current] : []),
      ...(Array.isArray(saved.archives) ? saved.archives : []),
    ].slice(0, 52),
  };
}

function effectiveDueDate(job: Job) {
  return job.customerDueDate || job.dueDate;
}

function latestDate(dates: string[]) {
  return dates.filter(Boolean).sort().at(-1) ?? "";
}

const CUSTOMER_SUPPLIED_NOTE =
  "CUSTOMER to provide Tracking information or ETA";
const LEAD_TIME_NOTE =
  "CUSTOMER to Accept Lead Time, CFM, or Provide Alternative PN";

function removeAutomaticShortageNote(comments: string, note: string) {
  return comments
    .replaceAll(note, "")
    .replace(/^\s*\|\s*|\s*\|\s*$/g, "")
    .replace(/\s*\|\s*(?=\|)/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function addAutomaticShortageNote(comments: string, note: string) {
  const clean = removeAutomaticShortageNote(comments, note);
  return clean ? `${clean} | ${note}` : note;
}

function longestOpenShortageDate(shortages: ShortageItem[]) {
  return latestDate(
    shortages
      .filter(
        (item) => !item.complete && !item.customerSupplied && item.dueDate,
      )
      .map((item) => item.dueDate),
  );
}

function shortagePushesDockDate(
  item: ShortageItem,
  shortages: ShortageItem[],
  pcbDockDate: string,
) {
  const longestDate = longestOpenShortageDate(shortages);
  return (
    !item.complete &&
    !item.customerSupplied &&
    Boolean(item.dueDate) &&
    item.dueDate === longestDate &&
    (!pcbDockDate || item.dueDate > pcbDockDate)
  );
}

function shortageExceedsFifteenBusinessDays(
  item: ShortageItem,
  projectCreationDate: string,
) {
  if (
    item.complete ||
    item.customerSupplied ||
    !item.dueDate ||
    !projectCreationDate
  ) {
    return false;
  }
  return item.dueDate > addBusinessDays(projectCreationDate, 15);
}

function reconcileShortageComments(
  shortages: ShortageItem[],
  pcbDockDate: string,
  projectCreationDate: string,
) {
  return shortages.map((item) => {
    let comments = removeAutomaticShortageNote(
      removeAutomaticShortageNote(item.comments, CUSTOMER_SUPPLIED_NOTE),
      LEAD_TIME_NOTE,
    );
    if (item.customerSupplied) {
      comments = addAutomaticShortageNote(comments, CUSTOMER_SUPPLIED_NOTE);
    } else if (
      shortagePushesDockDate(item, shortages, pcbDockDate) ||
      shortageExceedsFifteenBusinessDays(item, projectCreationDate)
    ) {
      comments = addAutomaticShortageNote(comments, LEAD_TIME_NOTE);
    }
    return { ...item, comments };
  });
}

function specialProcessTurnDays(job: Job) {
  return (
    (job.specialProcesses.includes("Polymerics")
      ? job.polymericsTurnDays
      : 0) +
    (job.specialProcesses.includes("External Testing")
      ? job.externalTestingTurnDays
      : 0) +
    (job.specialProcesses.includes("Other")
      ? job.otherSpecialProcessTurnDays
      : 0)
  );
}

function materialsReadyDate(job: Job) {
  if (!job.pcbDockDate) return "";
  const allListedPartsReceived =
    job.shortages.length > 0 && job.shortages.every((item) => item.complete);
  let shortageReadyDate = "";
  if (job.noShortageList || allListedPartsReceived) {
    shortageReadyDate = job.allPartsReceivedDate;
  } else {
    const datedShortages = job.shortages.filter((item) => item.dueDate);
    const unresolvedDatedShortages = job.shortages.filter(
      (item) => !item.complete,
    );
    if (
      datedShortages.length > 0 &&
      unresolvedDatedShortages.every((item) => item.dueDate)
    ) {
      shortageReadyDate = latestDate(datedShortages.map((item) => item.dueDate));
    } else if (!unresolvedDatedShortages.length) {
      shortageReadyDate = job.pcbDockDate;
    }
  }
  if (!shortageReadyDate) return "";
  return latestDate([job.pcbDockDate, shortageReadyDate]);
}

function pcbaReadyForKitting(job: Job) {
  const partsReceived =
    job.noShortageList ||
    (job.shortages.length > 0 && job.shortages.every((item) => item.complete));
  return job.pcbArrived && partsReceived;
}

function activePartialDockDate(job: Job) {
  if (!job.acceptedPartials || !job.partialDeliveries.length) return "";
  return (
    job.partialDeliveries.find((partial) => !partial.completed)?.dueDate ||
    job.partialDeliveries.at(-1)?.dueDate ||
    ""
  );
}

function kryptonDockDate(job: Job) {
  if (job.kryptonDockDateOverride) return job.kryptonDockDateOverride;
  const partialDockDate = activePartialDockDate(job);
  if (partialDockDate) return partialDockDate;
  const readyDate = materialsReadyDate(job);
  if (!readyDate) return "";
  return addBusinessDays(
    readyDate,
    job.assemblyTurnDays + specialProcessTurnDays(job),
  );
}

function kryptonDockDriver(job: Job) {
  const datedShortages = job.shortages.filter((item) => Boolean(item.dueDate));
  const longestShortageDate = latestDate(
    datedShortages.map((item) => item.dueDate),
  );
  const longestItems = datedShortages.filter(
    (item) => item.dueDate === longestShortageDate,
  );
  const itemNames = longestItems
    .map((item) => item.pnNumber || item.kspNumber)
    .filter(Boolean)
    .join(", ");

  if (!job.pcbDockDate && !longestShortageDate) {
    return "Waiting for PCB Dock Date and shortage due dates";
  }
  if (!longestShortageDate || job.pcbDockDate >= longestShortageDate) {
    return `Controlled by PCB Dock Date: ${dateLabel(job.pcbDockDate)}${
      longestShortageDate
        ? ` · Longest shortage ${itemNames || "item"}: ${dateLabel(longestShortageDate)}`
        : ""
    }`;
  }
  return `Controlled by longest lead PN# ${itemNames || "not entered"}: ${dateLabel(longestShortageDate)}${
    job.pcbDockDate ? ` · PCB Dock Date: ${dateLabel(job.pcbDockDate)}` : ""
  }`;
}

function calculatedJobDueDate(job: Job, change: Partial<Job> = {}) {
  const next = { ...job, ...change };
  return addBusinessDays(
    next.createdDate,
    next.fabricationTurnDays +
      next.assemblyTurnDays +
      specialProcessTurnDays(next),
  );
}

function dateLabel(date: string) {
  if (!date) return "Not set";
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function calendarDateParts(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return { month: "---", day: "--" };
  return {
    month: parsed.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: parsed.toLocaleDateString("en-US", { day: "2-digit" }),
  };
}

function daysUntil(date: string) {
  if (!date) return 999;
  return Math.ceil(
    (new Date(`${date}T12:00:00`).getTime() -
      new Date(`${chicagoDateKey()}T12:00:00`).getTime()) /
      86_400_000,
  );
}

function dueCopy(date: string) {
  const days = daysUntil(date);
  if (!date) return "Not scheduled";
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  return `${days}d left`;
}

function quoteUrgency(date: string): QuoteUrgency {
  const days = daysUntil(date);
  if (days < 0) return "past-due";
  if (days === 0) return "due-today";
  if (days === 1) return "due-tomorrow";
  return "scheduled";
}

function quoteUrgencyLabel(date: string) {
  const urgency = quoteUrgency(date);
  if (urgency === "past-due") return "Past due";
  if (urgency === "due-today") return "Due today";
  if (urgency === "due-tomorrow") return "Due in 1 day";
  return "Scheduled";
}

type RfqScanResult = {
  tags: RFQTag[];
  contact: string;
  pn: string;
  rev: string;
  ksid: string;
  dueDate: string;
};

function normalizeRfqShortDate(value: string) {
  const match = value.match(/(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?/);
  if (!match) return "";
  const year = match[3]
    ? Number(match[3]) < 100
      ? 2000 + Number(match[3])
      : Number(match[3])
    : Number(chicagoDateKey().slice(0, 4));
  return `${year}-${String(Number(match[1])).padStart(2, "0")}-${String(Number(match[2])).padStart(2, "0")}`;
}

function parseRfqScreenshot(text: string): RfqScanResult {
  const cleaned = text.replace(/[|•○◯◉◌◦☐☑☒]/g, " ").replace(/[–—]/g, "-");
  const lines = cleaned.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const tagPatterns: Record<RFQTag, RegExp> = {
    Turnkey: /\bturn\s*-?\s*key\b/i,
    Repeat: /\brepeat\b/i,
    New: /\bnew\b/i,
    "Assembly Only": /\bassembly\s+only\b/i,
    "Fabrication Only": /\bfabrication\s+only\b/i,
    Layout: /\blayout\b/i,
  };
  const lastTagLine = lines.reduce(
    (last, line, index) => rfqTags.some((tag) => tagPatterns[tag].test(line)) ? index : last,
    -1,
  );
  // The RFQ identity is the first slash-separated text directly beneath the
  // tags. Rev can wrap onto the following OCR line, as it does on narrow cards.
  const identityStart = Math.max(0, lastTagLine + 1);
  let compositeIndex = lines.findIndex(
    (line, index) => index >= identityStart && line.includes("/") && /[A-Za-z]/.test(line),
  );
  if (compositeIndex < 0) {
    compositeIndex = lines.findIndex((line) => line.includes("/") && /[A-Za-z]/.test(line));
  }
  let composite = compositeIndex >= 0 ? lines[compositeIndex] : "";
  if (
    compositeIndex >= 0 &&
    !/\brev(?:ision)?\b/i.test(composite) &&
    /\brev(?:ision)?\b/i.test(lines[compositeIndex + 1] ?? "")
  ) {
    composite = `${composite} ${lines[compositeIndex + 1]}`;
  }
  const tagArea = compositeIndex >= 0 ? lines.slice(0, compositeIndex).join(" ") : "";
  const detectedTags = rfqTags.filter((tag) => tagPatterns[tag].test(tagArea));
  const dateMatches = [...cleaned.matchAll(/\b\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?\b/g)];
  const dueDate = normalizeRfqShortDate(dateMatches.at(-1)?.[0] ?? "");
  const parts = composite.split("/").map((part) => part.trim());
  // The control immediately before the contact is an empty checkbox. OCR may
  // render it as a circle glyph, O, 0, C, or "Co". Never import that control
  // into the contact-name field.
  const contact = (parts[0] ?? "")
    .replace(/^\s*[([{<]?\s*(?:0|o|c|co)\s*[)\]}>]?\s*[:.\-]?\s+(?=[A-Z][A-Za-z'’-]+(?:\s|$))/i, "")
    .replace(/^\s*[^A-Za-z]+/, "")
    .trim();
  const pnAndRev = parts[1] ?? "";
  const revMatch = pnAndRev.match(/\brev(?:ision)?\b\s*[:#-]?\s*([A-Za-z0-9.-]+)/i);
  const rev = revMatch?.[1] && revMatch[1] !== "-" ? revMatch[1] : "";
  const pn = pnAndRev
    .replace(/\brev(?:ision)?\b[\s\S]*$/i, "")
    .trim()
    .replace(/[-\s]+$/, "");
  const ksidSegment = (parts[2] ?? "").trim();
  const ksid = /^(?:ksid)?\s*[:#-]?\s*$/i.test(ksidSegment)
    ? ""
    : ksidSegment.replace(/^ksid\s*[:#-]?\s*/i, "").trim();
  return { tags: detectedTags, contact, pn, rev, ksid, dueDate };
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function statusClass(status: JobStatus) {
  return status.toLowerCase().replaceAll(" ", "-");
}

function sortOperationalItems<T extends ActionItem>(items: T[]) {
  const divisionOrder: Record<Division, number> = {
    Commercial: 0,
    Aerospace: 1,
  };
  return [...items].sort(
    (a, b) =>
      divisionOrder[a.division] - divisionOrder[b.division] ||
      a.customer.localeCompare(b.customer) ||
      a.jobNumber.localeCompare(b.jobNumber, undefined, { numeric: true }) ||
      a.dueDate.localeCompare(b.dueDate) ||
      a.outstanding.localeCompare(b.outstanding),
  );
}

function dockAlertsForJobs(jobs: Job[]): DockAlert[] {
  const alerts: DockAlert[] = [];
  jobs
    .filter(
      (job) => job.status !== "Complete" && jobBuildLevel(job) === "PCBA",
    )
    .forEach((job) => {
      const fabricationDeadline = addBusinessDays(job.createdDate, 2);
      const base = {
        jobId: job.id,
        division: job.division,
        customer: job.customer,
        jobNumber: job.jobNumber,
        ksid: job.ksid,
      };
      if (!job.pcbDockDate) {
        alerts.push({
          ...base,
          id: `${job.id}-pcb-missing`,
          category: "Missing PCB Dock",
          outstanding: "PCB Dock Date not entered",
          dueDate: fabricationDeadline,
        });
      } else if (!job.pcbArrived && daysUntil(job.pcbDockDate) < 0) {
        alerts.push({
          ...base,
          id: `${job.id}-pcb-overdue`,
          category: "PCB Past Due",
          outstanding: "PCB Dock Date passed; PCB not marked arrived",
          dueDate: job.pcbDockDate,
        });
      }
    });
  return sortOperationalItems(alerts);
}

function actionItemsForJobs(jobs: Job[]): ActionItem[] {
  const items: ActionItem[] = [];
  jobs
    .filter((job) => job.status !== "Complete")
    .forEach((job) => {
      const base = {
        jobId: job.id,
        division: job.division,
        customer: job.customer,
        jobNumber: job.jobNumber,
        ksid: job.ksid,
      };
      const addIfSoon = (id: string, outstanding: string, dueDate: string) => {
        if (dueDate && daysUntil(dueDate) <= 1) {
          items.push({ ...base, id: `${job.id}-${id}`, outstanding, dueDate });
        }
      };
      const buildLevel = jobBuildLevel(job);
      if (buildLevel === "PCBA") {
        const fabricationDeadline = addBusinessDays(job.createdDate, 2);
        if (!job.pcbDockDate) {
          addIfSoon("pcb-date", "Enter PCB Dock Date", fabricationDeadline);
        } else if (!job.pcbArrived) {
          addIfSoon("pcb-arrival", "Confirm PCB Arrived", job.pcbDockDate);
        }
      }
      if (!job.noShortageList) {
        const openShortages = job.shortages.filter((item) => !item.complete);
        if (!job.shortages.length) {
          addIfSoon(
            "shortage-list",
            "Complete or waive Shortage List",
            addBusinessDays(job.createdDate, 3),
          );
        }
        openShortages.forEach((shortage) => {
          const partNumber = shortage.kspNumber || shortage.pnNumber || "item";
          if (shortage.customerSupplied && !shortage.dueDate) {
            items.push({
              ...base,
              id: `${job.id}-shortage-date-${shortage.id}`,
              outstanding: `Follow up for Customer Supplied Part ${partNumber} and enter a due date`,
              dueDate: "",
            });
            return;
          }
          addIfSoon(
            `shortage-${shortage.id}`,
            `Receive shortage ${partNumber}`,
            shortage.dueDate,
          );
        });
      }
      if (job.acceptedPartials) {
        job.partialDeliveries.forEach((partial) =>
          addIfSoon(
            `partial-${partial.id}`,
            `Accepted Partial: QTY ${partial.quantity}${partial.comments ? ` · ${partial.comments}` : ""}`,
            partial.dueDate,
          ),
        );
      }
      if (buildLevel !== "PCBA") {
        const familyJobs = jobs.filter(
          (candidate) =>
            (candidate.familyId ?? candidate.id) === (job.familyId ?? job.id),
        );
        const progress = assemblyRequirementProgress(job, familyJobs);
        progress
          .filter((item) => !item.complete)
          .forEach((item) =>
            addIfSoon(
              `input-${item.requirement.id}`,
              `Need ${item.required - item.available} more ${item.requirement.inputLevel} ${item.requirement.pn}`,
              job.dueDate,
            ),
          );
        if (
          progress.length > 0 &&
          progress.every((item) => item.complete) &&
          assemblyShortagesReady(job) &&
          !job.workflowCompleted.includes("mechanical-assembly")
        ) {
          addIfSoon(
            "mechanical-assembly",
            `Complete ${buildLevel} Mechanical Assembly`,
            job.dueDate,
          );
        }
        if (
          job.workflowCompleted.includes("mechanical-assembly") &&
          !job.workflowCompleted.includes("krypton-dock")
        ) {
          addIfSoon("krypton", "Complete Krypton Dock", job.dueDate);
        }
        return;
      }
      const readyDate = materialsReadyDate(job);
      if (readyDate) {
        const kittingDue = addBusinessDays(readyDate, 1);
        if (!job.workflowCompleted.includes("kitting"))
          addIfSoon("kitting", "Complete Kitting Assembly", kittingDue);
        const smtDue = addBusinessDays(kittingDue, job.smtDays);
        if (!job.workflowCompleted.includes("smt"))
          addIfSoon("smt", "Complete SMT Process", smtDue);
        let processDue = addBusinessDays(readyDate, job.assemblyTurnDays);
        if (job.specialProcesses.includes("Polymerics")) {
          processDue = addBusinessDays(processDue, job.polymericsTurnDays);
          if (!job.workflowCompleted.includes("polymerics")) {
            addIfSoon("polymerics", "Complete Polymerics", processDue);
          }
        }
        if (job.specialProcesses.includes("External Testing")) {
          processDue = addBusinessDays(
            processDue,
            job.externalTestingTurnDays,
          );
          if (!job.workflowCompleted.includes("external-testing")) {
            addIfSoon(
              "external-testing",
              "Complete External Testing",
              processDue,
            );
          }
        }
        if (job.specialProcesses.includes("Other")) {
          processDue = addBusinessDays(
            processDue,
            job.otherSpecialProcessTurnDays,
          );
          if (!job.workflowCompleted.includes("other-special-process")) {
            addIfSoon(
              "other-special-process",
              `Complete ${job.otherSpecialProcess || "Other Special Process"}`,
              processDue,
            );
          }
        }
      }
      const kryptonDue = kryptonDockDate(job);
      if (
        job.specialProcesses.includes("FAI Report") &&
        !job.workflowCompleted.includes("fai-report")
      ) {
        addIfSoon(
          "fai-report",
          "Complete FAI Report",
          kryptonDue || job.dueDate,
        );
      }
      if (kryptonDue && !job.workflowCompleted.includes("krypton-dock")) {
        addIfSoon("krypton", "Complete Krypton Dock", kryptonDue);
      }
    });
  return sortOperationalItems(items);
}

function followUpItemsForJobs(jobs: Job[]): FollowUpItem[] {
  const divisionOrder: Record<Division, number> = {
    Commercial: 0,
    Aerospace: 1,
  };
  return jobs
    .filter((job) => job.status !== "Complete")
    .map((job) => {
      const lastNote =
        [...job.notes].sort((a, b) =>
          `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`),
        )[0] ?? null;
      return {
        job,
        lastNote,
        followUpDueDate: lastNote
          ? addCalendarDays(lastNote.date, 2)
          : job.createdDate,
      };
    })
    .filter((item) => !item.lastNote || daysUntil(item.followUpDueDate) <= 0)
    .sort(
      (a, b) =>
        divisionOrder[a.job.division] - divisionOrder[b.job.division] ||
        a.job.customer.localeCompare(b.job.customer) ||
        a.job.jobNumber.localeCompare(b.job.jobNumber, undefined, {
          numeric: true,
        }) ||
        a.followUpDueDate.localeCompare(b.followUpDueDate),
    );
}

function normalizeJob(job: Job): Job {
  return {
    ...job,
    buildLevel: job.buildLevel ?? "PCBA",
    familyId: job.familyId ?? job.id,
    assemblyRecipeId: job.assemblyRecipeId ?? "",
    assemblyRequirements: (job.assemblyRequirements ?? []).map((item) => ({
      ...item,
      inputLevel: item.inputLevel ?? "PCBA",
      rev: item.rev ?? "",
      quantityPerAssembly:
        item.quantityPerAssembly === "" ? "" : Math.max(1, Number(item.quantityPerAssembly) || 1),
    })),
    linkedJobIds: job.linkedJobIds ?? [],
    completedQuantity:
      job.completedQuantity === null
        ? null
        : Math.min(
            quantityNumber(job.quantity),
            Math.max(0, Number(job.completedQuantity) || (job.status === "Complete" ? quantityNumber(job.quantity) : 0)),
          ),
    quantityReleases: (job.quantityReleases ?? []).map((release) => ({
      ...release,
      quantity: Math.max(0, Number(release.quantity) || 0),
      date: release.date || job.createdDate,
    })),
    mechanicalShipments: (job.mechanicalShipments ?? []).map((shipment) => ({
      ...shipment,
      quantity: shipment.quantity === "" ? "" : Math.max(1, Number(shipment.quantity) || 1),
      mechanicalTurnDays: Math.max(0, Number(shipment.mechanicalTurnDays) || 0),
      dockDateOverride: shipment.dockDateOverride ?? "",
      completed: shipment.completed ?? false,
      trackingInformation: shipment.trackingInformation ?? "",
    })),
    specialProcesses: Array.isArray(job.specialProcesses)
      ? job.specialProcesses
      : [],
    otherSpecialProcess: job.otherSpecialProcess ?? "",
    otherSpecialProcessTurnDays: job.otherSpecialProcessTurnDays ?? 0,
    polymericsOptions: (job.polymericsOptions ?? []).map((option) =>
      option === ("Staking Encapsulation" as PolymericsOption)
        ? "Encapsulation"
        : option,
    ),
    workflowCompleted: Array.isArray(job.workflowCompleted)
      ? job.workflowCompleted
      : [],
    trackingInformation: job.trackingInformation ?? "",
    kryptonDockDateOverride: job.kryptonDockDateOverride ?? "",
    fabricationDockDate: job.fabricationDockDate ?? "",
    pcbDockDate: job.pcbDockDate ?? "",
    pcbArrived: job.pcbArrived ?? false,
    noShortageList: job.noShortageList ?? false,
    acceptedPartials: job.acceptedPartials ?? false,
    partialDeliveries: (job.partialDeliveries ?? []).map((partial) => ({
      ...partial,
      completed: partial.completed ?? false,
    })),
    pn: job.pn ?? "",
    quantity: job.quantity ?? "",
    shortages: (job.shortages ?? []).map((item) => ({
      ...item,
      quantity: item.quantity ?? "",
      comments: item.comments ?? "",
      customerSupplied: item.customerSupplied ?? false,
    })),
    notes: job.notes ?? [],
  };
}

function normalizeQuote(quote: QuoteRecord): QuoteRecord {
  return {
    ...quote,
    quantity: quote.quantity ?? "",
    tags: Array.isArray(quote.tags) ? quote.tags : [],
    completed: quote.completed ?? false,
    notes: Array.isArray(quote.notes) ? quote.notes : [],
  };
}

function normalizeAssemblyRecipe(recipe: AssemblyRecipe): AssemblyRecipe {
  return {
    ...recipe,
    outputLevel: recipe.outputLevel === "LRU" ? "LRU" : "CCA",
    outputRev: recipe.outputRev ?? "",
    requirements: (recipe.requirements ?? []).map((requirement) => ({
      ...requirement,
      inputLevel:
        recipe.outputLevel === "LRU" ? "CCA" : "PCBA",
      rev: requirement.rev ?? "",
      quantityPerAssembly: Math.max(
        1,
        Number(requirement.quantityPerAssembly) || 1,
      ),
    })),
  };
}

function jobBuildLevel(job: Job): BuildLevel {
  return job.buildLevel ?? "PCBA";
}

function quantityNumber(value: string) {
  return Math.max(0, Number.parseFloat(value) || 0);
}

function assemblyRequirementProgress(job: Job, familyJobs: Job[]) {
  const outputQuantity = Math.max(1, quantityNumber(job.quantity));
  return (job.assemblyRequirements ?? []).map((requirement) => {
    const available = familyJobs
      .filter(
        (candidate) =>
          candidate.id !== job.id &&
          (!(job.linkedJobIds?.length) || job.linkedJobIds.includes(candidate.id)) &&
          jobBuildLevel(candidate) === requirement.inputLevel &&
          candidate.pn.trim().toLowerCase() === requirement.pn.trim().toLowerCase() &&
          (!requirement.rev ||
            candidate.rev.trim().toLowerCase() === requirement.rev.trim().toLowerCase()),
      )
      .reduce((sum, candidate) => sum + (candidate.completedQuantity ?? 0), 0);
    const required = Number(requirement.quantityPerAssembly) * outputQuantity;
    return { requirement, available, required, complete: available >= required };
  });
}

function linkedJobsFor(job: Job, jobs: Job[]) {
  return jobs.filter((candidate) => job.linkedJobIds?.includes(candidate.id));
}

function buildableAssemblyQuantity(job: Job, jobs: Job[]) {
  const progress = assemblyRequirementProgress(job, linkedJobsFor(job, jobs));
  if (!progress.length) return 0;
  return Math.max(
    0,
    Math.floor(
      Math.min(
        ...progress.map((item) =>
          Number(item.requirement.quantityPerAssembly) > 0
            ? item.available / Number(item.requirement.quantityPerAssembly)
            : 0,
        ),
      ),
    ),
  );
}

function latestLinkedReleaseDate(job: Job, jobs: Job[]) {
  return linkedJobsFor(job, jobs)
    .flatMap((candidate) => candidate.quantityReleases ?? [])
    .map((release) => release.date)
    .filter(Boolean)
    .sort()
    .at(-1) ?? job.createdDate;
}

function assemblyShortagesReady(job: Job) {
  return (
    job.noShortageList ||
    (job.shortages.length > 0 && job.shortages.every((item) => item.complete))
  );
}

function automaticAssemblyStatus(job: Job, jobs: Job[]) {
  const level = jobBuildLevel(job);
  if (level === "PCBA" || job.status === "Complete" || job.status === "On Hold") {
    return job.status;
  }
  if (
    job.status === "Mechanical Assembly" ||
    job.status === "Shipping QC" ||
    job.workflowCompleted.includes("mechanical-assembly")
  ) {
    return job.status;
  }
  const inputsReady = buildableAssemblyQuantity(job, jobs) > 0;
  if (inputsReady && assemblyShortagesReady(job)) {
    return "Ready for Mechanical Assembly" as JobStatus;
  }
  return (level === "CCA" ? "Waiting for PCBA" : "Waiting for CCAs") as JobStatus;
}

function reconcileAssemblyStatuses(jobs: Job[]) {
  return jobs.map((job) => {
    const status = automaticAssemblyStatus(job, jobs);
    return status === job.status ? job : { ...job, status };
  });
}

const starterJobs: Job[] = [
  {
    id: "job-24618",
    division: "Aerospace",
    customer: "Orion Flight Systems",
    jobNumber: "24618",
    ksid: "KS-11842",
    pnName: "CTRL-8842 Flight Controller",
    pn: "CTRL-8842",
    rev: "C",
    quantity: "24",
    projectType: "New",
    contact: "Amanda Reyes",
    dueDate: "2026-08-14",
    customerDueDate: "2026-08-14",
    poNumber: "PO-77194",
    quoteNumber: "Q-26071",
    status: "Waiting on Parts",
    specialProcesses: ["Polymerics"],
    otherSpecialProcess: "",
    otherSpecialProcessTurnDays: 0,
    polymericsOptions: ["Conformal Coating", "Staking"],
    createdDate: "2026-07-20",
    fabricationDockDate: "2026-07-22",
    pcbDockDate: "2026-07-24",
    pcbArrived: false,
    fabricationTurnDays: 5,
    assemblyTurnDays: 10,
    polymericsTurnDays: 4,
    externalTestingTurnDays: 0,
    allPartsReceivedDate: "",
    noShortageList: false,
    acceptedPartials: false,
    partialDeliveries: [],
    smtDays: 2,
    workflowCompleted: ["project-creation"],
    shortages: [
      {
        id: "s-1",
        kspNumber: "KSP-4401",
        pnNumber: "RES-0402-10K",
        quantity: "120",
        dueDate: "2026-07-23",
        customerSupplied: false,
        comments: "Received with the first component shipment.",
        complete: true,
      },
      {
        id: "s-2",
        kspNumber: "KSP-4402",
        pnNumber: "IC-MCU-884",
        quantity: "24",
        dueDate: "2026-07-25",
        customerSupplied: false,
        comments: "Purchasing requested an updated supplier date.",
        complete: false,
      },
    ],
    notes: [
      {
        id: "n-1",
        date: "2026-07-20",
        createdAt: "2026-07-20T15:10:00",
        text: "Project booked. BOM review complete and shortage list sent to purchasing.",
      },
    ],
  },
  {
    id: "job-24596",
    division: "Commercial",
    customer: "Fujitsu",
    jobNumber: "24596",
    ksid: "KS-11790",
    pnName: "NET-2208 Interface Board",
    pn: "NET-2208",
    rev: "B2",
    quantity: "48",
    projectType: "Repeat",
    contact: "David Lee",
    dueDate: "2026-08-07",
    customerDueDate: "2026-08-02",
    poNumber: "PO-88410",
    quoteNumber: "Q-26042",
    status: "SMT",
    specialProcesses: ["External Testing"],
    otherSpecialProcess: "",
    otherSpecialProcessTurnDays: 0,
    polymericsOptions: [],
    createdDate: "2026-07-15",
    fabricationDockDate: "2026-07-17",
    pcbDockDate: "2026-07-18",
    pcbArrived: true,
    fabricationTurnDays: 4,
    assemblyTurnDays: 8,
    polymericsTurnDays: 0,
    externalTestingTurnDays: 5,
    allPartsReceivedDate: "2026-07-19",
    noShortageList: false,
    acceptedPartials: false,
    partialDeliveries: [],
    smtDays: 3,
    workflowCompleted: [
      "project-creation",
      "shortage-list",
      "fabrication-dock",
      "kitting",
    ],
    shortages: [
      {
        id: "s-3",
        kspNumber: "KSP-4368",
        pnNumber: "CONN-44P",
        quantity: "48",
        dueDate: "2026-07-18",
        customerSupplied: false,
        comments: "Complete.",
        complete: true,
      },
    ],
    notes: [
      {
        id: "n-2",
        date: "2026-07-20",
        createdAt: "2026-07-20T09:25:00",
        text: "Kitting complete. Job released to SMT line 2.",
      },
    ],
  },
  {
    id: "job-24602",
    division: "Commercial",
    customer: "MedTech Instruments",
    jobNumber: "24602",
    ksid: "KS-11801",
    pnName: "SENS-901 Main PCB",
    pn: "SENS-901",
    rev: "A",
    quantity: "2",
    projectType: "Assembly Only",
    contact: "Priya Nair",
    dueDate: "2026-08-10",
    customerDueDate: "2026-08-08",
    poNumber: "PO-99018",
    quoteNumber: "Q-26055",
    status: "Visual QC",
    specialProcesses: ["Polymerics", "External Testing"],
    otherSpecialProcess: "",
    otherSpecialProcessTurnDays: 0,
    polymericsOptions: ["Underfill"],
    createdDate: "2026-07-17",
    fabricationDockDate: "",
    pcbDockDate: "",
    pcbArrived: false,
    fabricationTurnDays: 3,
    assemblyTurnDays: 6,
    polymericsTurnDays: 3,
    externalTestingTurnDays: 4,
    allPartsReceivedDate: "2026-07-18",
    noShortageList: true,
    acceptedPartials: false,
    partialDeliveries: [],
    smtDays: 2,
    workflowCompleted: [
      "project-creation",
      "shortage-list",
      "fabrication-dock",
      "kitting",
      "smt",
    ],
    shortages: [],
    notes: [
      {
        id: "n-3",
        date: "2026-07-20",
        createdAt: "2026-07-20T13:40:00",
        text: "TH assembly finished. Two boards moved to visual inspection.",
      },
    ],
  },
];

const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "commercial", label: "Commercial", icon: Factory },
  { id: "aerospace", label: "Aerospace", icon: Gauge },
  { id: "quotes", label: "Quotes", icon: FileText },
  { id: "actions", label: "List of Action Items", icon: AlertTriangle },
  { id: "follow-ups", label: "Follow Up List", icon: StickyNote },
  { id: "integrations", label: "Data & Backup", icon: FileSpreadsheet },
];

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>(starterJobs);
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [activeView, setActiveView] = useState<View>("overview");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [expandedDivisions, setExpandedDivisions] = useState<Division[]>([
    "Commercial",
    "Aerospace",
  ]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [showNewJob, setShowNewJob] = useState(false);
  const [showNewRfq, setShowNewRfq] = useState(false);
  const [showOldDataImport, setShowOldDataImport] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [quotesHydrated, setQuotesHydrated] = useState(false);
  const [weeklyActions, setWeeklyActions] = useState<WeeklyActionsState>(() => ({
    current: currentWorkWeek(),
    archives: [],
  }));
  const [weeklyActionsHydrated, setWeeklyActionsHydrated] = useState(false);
  const [assemblyRecipes, setAssemblyRecipes] = useState<AssemblyRecipe[]>([]);
  const [assemblyRecipesHydrated, setAssemblyRecipesHydrated] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    let restored: Job[] | null = null;
    if (saved) {
      try {
        restored = JSON.parse(saved);
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
    const frame = requestAnimationFrame(() => {
      if (restored) setJobs(reconcileAssemblyStatuses(restored.map(normalizeJob)));
      setHydrated(true);
      const params = new URLSearchParams(window.location.search);
      const jobId = params.get("job");
      if (jobId) setSelectedJobId(jobId);
      if (params.get("new") === "1") setShowNewJob(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    let restored: QuoteRecord[] | null = null;
    try {
      const raw = window.localStorage.getItem(quotesStorageKey);
      if (raw) restored = JSON.parse(raw) as QuoteRecord[];
    } catch {
      window.localStorage.removeItem(quotesStorageKey);
    }
    const frame = requestAnimationFrame(() => {
      if (restored) setQuotes(restored.map(normalizeQuote));
      setQuotesHydrated(true);
      const quoteId = new URLSearchParams(window.location.search).get("quote");
      if (quoteId) {
        setSelectedQuoteId(quoteId);
        setActiveView("quotes");
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    let saved: WeeklyActionsState | null = null;
    try {
      const raw = window.localStorage.getItem(weeklyActionsStorageKey);
      if (raw) saved = JSON.parse(raw) as WeeklyActionsState;
    } catch {
      window.localStorage.removeItem(weeklyActionsStorageKey);
    }
    const frame = requestAnimationFrame(() => {
      setWeeklyActions(normalizeWeeklyActions(saved));
      setWeeklyActionsHydrated(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    let restored: AssemblyRecipe[] = [];
    try {
      const raw = window.localStorage.getItem(assemblyRecipesStorageKey);
      if (raw) restored = (JSON.parse(raw) as AssemblyRecipe[]).map(normalizeAssemblyRecipe);
    } catch {
      window.localStorage.removeItem(assemblyRecipesStorageKey);
    }
    const frame = requestAnimationFrame(() => {
      setAssemblyRecipes(restored);
      setAssemblyRecipesHydrated(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    function syncJobs(event: StorageEvent) {
      if (event.key !== storageKey || !event.newValue) return;
      try {
        const incoming = JSON.parse(event.newValue) as Job[];
        setJobs(reconcileAssemblyStatuses(incoming.map(normalizeJob)));
      } catch {
        // Ignore an incomplete write from another tab.
      }
    }
    window.addEventListener("storage", syncJobs);
    return () => window.removeEventListener("storage", syncJobs);
  }, []);

  useEffect(() => {
    function syncQuotes(event: StorageEvent) {
      if (event.key !== quotesStorageKey || !event.newValue) return;
      try {
        const incoming = JSON.parse(event.newValue) as QuoteRecord[];
        setQuotes(incoming.map(normalizeQuote));
      } catch {
        // Ignore an incomplete write from another quote window.
      }
    }
    window.addEventListener("storage", syncQuotes);
    return () => window.removeEventListener("storage", syncQuotes);
  }, []);

  useEffect(() => {
    function syncWeeklyActions(event: StorageEvent) {
      if (event.key !== weeklyActionsStorageKey || !event.newValue) return;
      try {
        const incoming = JSON.parse(event.newValue) as WeeklyActionsState;
        setWeeklyActions(normalizeWeeklyActions(incoming));
      } catch {
        // Ignore an incomplete write from another job tab.
      }
    }
    window.addEventListener("storage", syncWeeklyActions);
    return () => window.removeEventListener("storage", syncWeeklyActions);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(storageKey, JSON.stringify(jobs));
  }, [hydrated, jobs]);
  useEffect(() => {
    if (quotesHydrated) {
      window.localStorage.setItem(quotesStorageKey, JSON.stringify(quotes));
    }
  }, [quotes, quotesHydrated]);
  useEffect(() => {
    if (weeklyActionsHydrated) {
      window.localStorage.setItem(
        weeklyActionsStorageKey,
        JSON.stringify(weeklyActions),
      );
    }
  }, [weeklyActions, weeklyActionsHydrated]);
  useEffect(() => {
    if (assemblyRecipesHydrated) {
      window.localStorage.setItem(
        assemblyRecipesStorageKey,
        JSON.stringify(assemblyRecipes),
      );
    }
  }, [assemblyRecipes, assemblyRecipesHydrated]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setWeeklyActions((state) => {
        const latestWeek = currentWorkWeek();
        return state.current.weekStart === latestWeek.weekStart
          ? state
          : normalizeWeeklyActions(state);
      });
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? null;
  const selectedQuote =
    quotes.find((quote) => quote.id === selectedQuoteId) ?? null;
  useEffect(() => {
    document.title = selectedQuote
      ? `RFQ ${selectedQuote.pn} | Krypton Solutions OOR`
      : selectedJob
      ? `Job #${selectedJob.jobNumber} Workflow | Krypton Solutions OOR`
      : showNewJob
        ? "New Project | Krypton Solutions OOR"
        : showNewRfq
          ? "New RFQ | Krypton Solutions OOR"
          : "Krypton Solutions OOR";
  }, [selectedJob, selectedQuote, showNewJob, showNewRfq]);
  const visibleJobs = useMemo(
    () =>
      jobs.filter((job) => {
        return activeView === "commercial"
          ? job.division === "Commercial"
          : activeView === "aerospace"
            ? job.division === "Aerospace"
            : true;
      }),
    [jobs, activeView],
  );

  const customerFolders = useMemo(() => {
    const division: Division =
      activeView === "aerospace" ? "Aerospace" : "Commercial";
    return Object.entries(
      jobs
        .filter((job) => job.division === division)
        .reduce<Record<string, Job[]>>((groups, job) => {
          (groups[job.customer] ??= []).push(job);
          return groups;
        }, {}),
    ).sort(([a], [b]) => a.localeCompare(b));
  }, [jobs, activeView]);
  const customersByDivision = useMemo(
    () =>
      ({
        Commercial: [...new Set(jobs.filter((job) => job.division === "Commercial").map((job) => job.customer))].sort(),
        Aerospace: [...new Set(jobs.filter((job) => job.division === "Aerospace").map((job) => job.customer))].sort(),
      }) satisfies Record<Division, string[]>,
    [jobs],
  );
  const actionItems = useMemo(() => actionItemsForJobs(jobs), [jobs]);
  const followUpItems = useMemo(() => followUpItemsForJobs(jobs), [jobs]);

  const metrics = useMemo(
    () => ({
      active: jobs.filter((job) => job.status !== "Complete").length,
      shortages: jobs
        .flatMap((job) => job.shortages)
        .filter((item) => !item.complete).length,
      late: jobs.filter(
        (job) =>
          job.status !== "Complete" && daysUntil(effectiveDueDate(job)) < 0,
      ).length,
      complete: jobs.filter((job) => job.status === "Complete").length,
    }),
    [jobs],
  );

  function notify(message: string) {
    setToast(message);
  }
  function openDivision(division: Division) {
    setActiveView(division === "Commercial" ? "commercial" : "aerospace");
    setSelectedCustomer(null);
    setMenuOpen(false);
    setExpandedDivisions((current) =>
      current.includes(division) ? current : [...current, division],
    );
  }
  function toggleDivisionMenu(division: Division) {
    setExpandedDivisions((current) =>
      current.includes(division)
        ? current.filter((item) => item !== division)
        : [...current, division],
    );
  }
  function openCustomer(division: Division, customer: string) {
    setActiveView(division === "Commercial" ? "commercial" : "aerospace");
    setSelectedCustomer(customer);
    setMenuOpen(false);
  }
  function updateJob(id: string, change: Partial<Job>) {
    setJobs((current) =>
      reconcileAssemblyStatuses(
        current.map((job) => (job.id === id ? { ...job, ...change } : job)),
      ),
    );
  }
  function deleteJob(id: string) {
    setJobs((current) => {
      const next = reconcileAssemblyStatuses(
        current.filter((job) => job.id !== id),
      );
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
    setSelectedJobId(null);
    window.history.replaceState(null, "", window.location.pathname);
    notify("Job deleted.");
  }

  function createJob(jobOrJobs: Job | Job[]) {
    const createdJobs = Array.isArray(jobOrJobs) ? jobOrJobs : [jobOrJobs];
    const job = createdJobs[0];
    setJobs((current) =>
      reconcileAssemblyStatuses([...createdJobs, ...current]),
    );
    setShowNewJob(false);
    setSelectedJobId(job.id);
    window.history.replaceState(null, "", `?job=${encodeURIComponent(job.id)}`);
    setActiveView(job.division === "Commercial" ? "commercial" : "aerospace");
    notify(
      createdJobs.length === 1
        ? `Job #${job.jobNumber} created in ${job.customer}.`
        : `${createdJobs.length} linked PCBA, CCA, and LRU jobs created as one Project Family.`,
    );
  }

  function createQuote(quote: QuoteRecord) {
    setQuotes((current) => [quote, ...current]);
    setShowNewRfq(false);
    setActiveView("quotes");
    notify(`RFQ for ${quote.pn} created in ${quote.customer}.`);
  }

  function updateQuote(id: string, change: Partial<QuoteRecord>) {
    setQuotes((current) =>
      current.map((quote) =>
        quote.id === id ? { ...quote, ...change } : quote,
      ),
    );
  }

  function bookOldJob(job: Job) {
    setJobs((current) => reconcileAssemblyStatuses([normalizeJob(job), ...current]));
    notify(`Job #${job.jobNumber} confirmed and booked in ${job.customer}.`);
  }

  function openJobTab(id: string) {
    setShowNewJob(false);
    setSelectedQuoteId(null);
    setSelectedJobId(id);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?job=${encodeURIComponent(id)}`,
    );
  }

  function openQuoteWindow(id: string) {
    setShowNewJob(false);
    setSelectedJobId(null);
    setSelectedQuoteId(id);
    setActiveView("quotes");
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?quote=${encodeURIComponent(id)}`,
    );
  }

  function openNewProjectTab() {
    setSelectedJobId(null);
    setSelectedQuoteId(null);
    setShowNewJob(true);
    window.history.replaceState(null, "", `${window.location.pathname}?new=1`);
  }

  function closeWorkspaceTab() {
    setShowNewJob(false);
    setSelectedJobId(null);
    setSelectedQuoteId(null);
    window.history.replaceState(null, "", window.location.pathname);
  }

  function exportJobs() {
    const rows = jobs.map((job) => ({
      Division: job.division,
      Customer: job.customer,
      "Build Level": jobBuildLevel(job),
      "Project Family": job.familyId ?? job.id,
      "Job #": job.jobNumber,
      KSID: job.ksid,
      "PN Name": job.pnName,
      PN: job.pn,
      Rev: job.rev,
      QTY: job.quantity,
      "Project Type": job.projectType,
      Contact: job.contact,
      "Calculated Due Date": job.dueDate,
      "Customer Due Date": job.customerDueDate,
      "PO#": job.poNumber,
      "Quote#": job.quoteNumber,
      Status: job.status,
      "Special Processes": job.specialProcesses.join("; "),
      "Other Special Process": job.otherSpecialProcess,
      "Other Special Process Turn Time": job.otherSpecialProcessTurnDays,
      Polymerics: job.polymericsOptions.join("; "),
      "Project Created": job.createdDate,
      "PCB Dock Date": job.pcbDockDate,
      "PCB Arrived": job.pcbArrived ? "Yes" : "No",
      "Krypton Dock Date": kryptonDockDate(job),
      "Fabrication Turn Time": job.fabricationTurnDays,
      "Assembly Turn Time": job.assemblyTurnDays,
      "Polymerics Turn Time": job.polymericsTurnDays,
      "External Testing Turn Time": job.externalTestingTurnDays,
      "SMT Days": job.smtDays,
      "Open Shortages": job.shortages.filter((item) => !item.complete).length,
      "Assembly Configuration":
        assemblyRecipes.find((recipe) => recipe.id === job.assemblyRecipeId)
          ?.name ?? "",
      "Assembly Inputs": (job.assemblyRequirements ?? [])
        .map(
          (item) =>
            `${item.quantityPerAssembly} × ${item.inputLevel} ${item.pn}${item.rev ? ` Rev ${item.rev}` : ""}`,
        )
        .join("; "),
      "Project Notes": (job.notes ?? [])
        .map((note) => `${note.date || "No date"}: ${note.text}`)
        .join("\n"),
      "Project Notes Data": JSON.stringify(job.notes ?? []),
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(rows),
      "Jobs",
    );
    XLSX.writeFile(
      workbook,
      `Krypton-Solutions-OOR-Jobs-${chicagoDateKey()}.xlsx`,
    );
    notify("Excel workbook downloaded.");
  }

  function exportCompleteBackup() {
    const workbook = XLSX.utils.book_new();
    const backupRows = [
      {
        "Record Type": "Backup Info",
        "Record ID": "Krypton Solutions OOR",
        Payload: JSON.stringify({
          format: "krypton-solutions-oor-backup",
          version: 2,
          exportedAt: new Date().toISOString(),
        }),
      },
      ...jobs.map((job) => ({
        "Record Type": "Job",
        "Record ID": job.id,
        Payload: JSON.stringify(job),
      })),
      ...jobs.map((job) => ({
        "Record Type": "Job Notes",
        "Record ID": job.id,
        Payload: JSON.stringify(job.notes ?? []),
      })),
      ...quotes.map((quote) => ({
        "Record Type": "Quote",
        "Record ID": quote.id,
        Payload: JSON.stringify(quote),
      })),
      ...assemblyRecipes.map((recipe) => ({
        "Record Type": "Assembly Recipe",
        "Record ID": recipe.id,
        Payload: JSON.stringify(recipe),
      })),
      {
        "Record Type": "Weekly Actions",
        "Record ID": weeklyActions.current.weekStart,
        Payload: JSON.stringify(weeklyActions),
      },
    ];
    const backupSheet = XLSX.utils.json_to_sheet(backupRows);
    backupSheet["!cols"] = [{ wch: 20 }, { wch: 28 }, { wch: 100 }];
    XLSX.utils.book_append_sheet(workbook, backupSheet, "Complete Backup");

    const summarySheet = XLSX.utils.aoa_to_sheet([
      ["Krypton Solutions OOR Complete Backup"],
      ["Exported", new Date().toLocaleString()],
      ["Jobs", jobs.length],
      ["Project Notes", jobs.reduce((count, job) => count + (job.notes?.length ?? 0), 0)],
      ["Quotes", quotes.length],
      ["Assembly Configurations", assemblyRecipes.length],
      ["Weekly Action Archives", weeklyActions.archives.length],
      [],
      [
        "Important",
        "Use Data & Backup > Import Complete Backup to restore this file. Do not edit the Complete Backup sheet.",
      ],
    ]);
    summarySheet["!cols"] = [{ wch: 28 }, { wch: 100 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Read Me");
    XLSX.writeFile(
      workbook,
      `Krypton-Solutions-OOR-Complete-Backup-${chicagoDateKey()}.xlsx`,
    );
    notify("Complete Excel backup downloaded.");
  }

  async function importCompleteBackup(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets["Complete Backup"];
      if (!sheet) throw new Error("Missing backup sheet");
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });
      const parsed = rows.map((row) => ({
        type: String(row["Record Type"] ?? ""),
        id: String(row["Record ID"] ?? ""),
        payload: String(row.Payload ?? ""),
      }));
      const infoRow = parsed.find((row) => row.type === "Backup Info");
      const info = infoRow ? JSON.parse(infoRow.payload) : null;
      if (info?.format !== "krypton-solutions-oor-backup") {
        throw new Error("Invalid backup format");
      }
      const importedNotes = new Map(
        parsed
          .filter((row) => row.type === "Job Notes")
          .map((row) => [row.id, row.payload]),
      );
      const importedJobs = parsed
        .filter((row) => row.type === "Job")
        .map((row) => {
          const job = normalizeJob(JSON.parse(row.payload) as Job);
          const notesPayload = importedNotes.get(job.id);
          if (!notesPayload) return job;
          const notes = JSON.parse(notesPayload);
          return {
            ...job,
            notes: Array.isArray(notes) ? notes : job.notes,
          };
        });
      const importedQuotes = parsed
        .filter((row) => row.type === "Quote")
        .map((row) => normalizeQuote(JSON.parse(row.payload) as QuoteRecord));
      const importedRecipes = parsed
        .filter((row) => row.type === "Assembly Recipe")
        .map((row) =>
          normalizeAssemblyRecipe(JSON.parse(row.payload) as AssemblyRecipe),
        );
      const weeklyRow = parsed.find((row) => row.type === "Weekly Actions");
      const importedWeekly = weeklyRow
        ? normalizeWeeklyActions(JSON.parse(weeklyRow.payload) as WeeklyActionsState)
        : normalizeWeeklyActions(null);
      const approved = window.confirm(
        `Import ${importedJobs.length} jobs, ${importedQuotes.length} quotes, and ${importedRecipes.length} assembly configurations from ${file.name}?\n\nThis will replace the jobs, quotes, configurations, and Weekly Actions currently stored on this computer.`,
      );
      if (!approved) {
        notify("Backup import canceled. No data was changed.");
        return;
      }
      setJobs(reconcileAssemblyStatuses(importedJobs));
      setQuotes(importedQuotes);
      setAssemblyRecipes(importedRecipes);
      setWeeklyActions(importedWeekly);
      setSelectedJobId(null);
      setSelectedQuoteId(null);
      setShowNewJob(false);
      notify(
        `Backup restored: ${importedJobs.length} jobs, ${importedQuotes.length} quotes, and ${importedRecipes.length} assembly configurations.`,
      );
    } catch {
      notify("This file is not a valid Krypton Solutions OOR complete backup.");
    } finally {
      input.value = "";
    }
  }

  const title =
    activeView === "overview"
      ? "Production overview"
      : (navItems.find((item) => item.id === activeView)?.label ??
        "Krypton Solutions OOR");

  return (
    <div className="app-shell manufacturing-app">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            <i />
            <i />
            <i />
          </span>
          <span className="brand-name">
            Krypton Solutions <span>OOR</span>
          </span>
        </div>
        <div className="workspace-label">MANUFACTURING CONTROL</div>
        <nav aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const division =
              item.id === "commercial"
                ? "Commercial"
                : item.id === "aerospace"
                  ? "Aerospace"
                  : null;
            if (division) {
              const isExpanded = expandedDivisions.includes(division);
              return (
                <div className="division-nav-group" key={item.id}>
                  <div className="division-nav-row">
                    <button
                      className={
                        activeView === item.id && !selectedCustomer ? "active" : ""
                      }
                      onClick={() => openDivision(division)}
                    >
                      <Icon size={19} />
                      <span>{item.label}</span>
                      <b>{jobs.filter((job) => job.division === division && job.status !== "Complete").length}</b>
                    </button>
                    <button
                      className="division-expand-button"
                      aria-label={`${isExpanded ? "Collapse" : "Expand"} ${division} customer sub-categories`}
                      aria-expanded={isExpanded}
                      onClick={() => toggleDivisionMenu(division)}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="customer-subnav">
                      {customersByDivision[division].map((customer) => (
                        <button
                          className={
                            activeView === item.id && selectedCustomer === customer
                              ? "active"
                              : ""
                          }
                          key={customer}
                          onClick={() => openCustomer(division, customer)}
                        >
                          <span className="subnav-branch" />
                          <span>{customer}</span>
                          <b>
                            {
                              jobs.filter(
                                (job) =>
                                  job.division === division &&
                                  job.customer === customer &&
                                  job.status !== "Complete",
                              ).length
                            }
                          </b>
                        </button>
                      ))}
                      {!customersByDivision[division].length && (
                        <small>No customer sub-categories yet</small>
                      )}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <button
                key={item.id}
                className={activeView === item.id ? "active" : ""}
                onClick={() => {
                  setActiveView(item.id);
                  setMenuOpen(false);
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>
                {item.id === "actions" && actionItems.length > 0 && (
                  <b>{actionItems.length}</b>
                )}
                {item.id === "follow-ups" && followUpItems.length > 0 && (
                  <b>{followUpItems.length}</b>
                )}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <button
            className="microsoft-card"
            onClick={() => setActiveView("integrations")}
          >
            <span className="connection-label">
              <FileSpreadsheet size={16} /> Data + Backup
            </span>
            <small>Imports, exports, and reminder setup</small>
          </button>
          <div className="profile-card">
            <span className="avatar">MN</span>
            <span>
              <strong>Michael Nguyen</strong>
              <small>Production workspace</small>
            </span>
          </div>
        </div>
      </aside>
      {menuOpen && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <main className="main-content">
        <header className="topbar">
          <button
            className="menu-button"
            aria-label="Open navigation"
            onClick={() => setMenuOpen(true)}
          >
            <Menu />
          </button>
          <div>
            <p className="eyebrow">Krypton Solutions OOR</p>
            <h1>{title}</h1>
            <p className="date-line">{dateLabel(chicagoDateKey())}</p>
          </div>
          <div className="topbar-actions">
            {(activeView === "commercial" || activeView === "aerospace") && (
              <button className="button primary" onClick={openNewProjectTab}>
                <Plus size={18} /> New project
              </button>
            )}
            <button
              className="button secondary excel-button"
              onClick={exportJobs}
            >
              <Download size={17} /> Export Excel
            </button>
            <button className="icon-button">
              <Bell size={20} />
            </button>
            <button className="icon-button">
              <UserRound size={21} />
            </button>
          </div>
        </header>

        {activeView === "overview" && (
          <Overview
            jobs={jobs}
            metrics={metrics}
            onOpen={openJobTab}
            onView={setActiveView}
          />
        )}
        {(activeView === "commercial" || activeView === "aerospace") && (
          <DivisionView
            division={activeView === "commercial" ? "Commercial" : "Aerospace"}
            folders={customerFolders}
            jobs={visibleJobs}
            customer={selectedCustomer}
            onCustomerChange={setSelectedCustomer}
            onOpen={openJobTab}
            onNew={openNewProjectTab}
            notify={notify}
          />
        )}
        {activeView === "quotes" && (
          <QuotesView
            quotes={quotes}
            onNew={() => setShowNewRfq(true)}
            onOpen={openQuoteWindow}
            onUpdate={updateQuote}
          />
        )}
        {activeView === "configurations" && (
          <AssemblyConfigurationsView
            recipes={assemblyRecipes}
            onChange={setAssemblyRecipes}
            notify={notify}
          />
        )}
        {activeView === "actions" && (
          <ActionItemsView items={actionItems} onOpen={openJobTab} />
        )}
        {activeView === "follow-ups" && (
          <FollowUpListView
            items={followUpItems}
            onOpen={openJobTab}
            onUpdate={updateJob}
            notify={notify}
          />
        )}
        {activeView === "integrations" && (
          <IntegrationsView
            onExport={exportJobs}
            onExportBackup={exportCompleteBackup}
            onImportBackup={importCompleteBackup}
            onOpenOldData={() => setShowOldDataImport(true)}
            weeklyArchives={weeklyActions.archives}
          />
        )}
      </main>

      {showNewJob && (
        <NewJobModal
          onClose={closeWorkspaceTab}
          onCreate={createJob}
          recipes={assemblyRecipes}
          jobs={jobs}
        />
      )}
      {showNewRfq && (
        <NewRfqModal
          onClose={() => setShowNewRfq(false)}
          onCreate={createQuote}
        />
      )}
      {showOldDataImport && (
        <OldDataImportModal
          onClose={() => setShowOldDataImport(false)}
          onBook={bookOldJob}
        />
      )}
      {selectedJob && (
        <JobDrawer
          job={selectedJob}
          jobs={jobs}
          recipes={assemblyRecipes}
          onClose={closeWorkspaceTab}
          onOpen={openJobTab}
          onUpdate={(change) => updateJob(selectedJob.id, change)}
          onDelete={() => deleteJob(selectedJob.id)}
          notify={notify}
        />
      )}
      {selectedQuote && (
        <QuoteDetailWindow
          quote={selectedQuote}
          onClose={closeWorkspaceTab}
          onUpdate={(change) => updateQuote(selectedQuote.id, change)}
          notify={notify}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} /> {toast}
        </div>
      )}
      <WeeklyNotepad
        week={weeklyActions.current}
        onChange={(current) =>
          setWeeklyActions((state) => ({ ...state, current }))
        }
      />
    </div>
  );
}

function Overview({
  jobs,
  metrics,
  onOpen,
  onView,
}: {
  jobs: Job[];
  metrics: {
    active: number;
    shortages: number;
    late: number;
    complete: number;
  };
  onOpen: (id: string) => void;
  onView: (view: View) => void;
}) {
  const cards = [
    {
      label: "Active jobs",
      value: metrics.active,
      icon: FolderKanban,
      tone: "blue",
    },
    {
      label: "Past due",
      value: metrics.late,
      icon: AlertTriangle,
      tone: "red",
    },
    {
      label: "Completed",
      value: metrics.complete,
      icon: CheckCircle2,
      tone: "green",
    },
  ];
  const sorted = [...jobs].sort((a, b) =>
    effectiveDueDate(a).localeCompare(effectiveDueDate(b)),
  );
  return (
    <div className="view-stack">
      <div className="metric-grid">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="metric-card" key={card.label}>
              <span className={`metric-icon ${card.tone}`}>
                <Icon size={23} />
              </span>
              <span>
                <strong>{card.value}</strong>
                <small>{card.label}</small>
              </span>
            </article>
          );
        })}
      </div>
      <div className="manufacturing-overview">
        <section className="panel job-register">
          <div className="panel-header">
            <div>
              <p className="section-kicker">Live register</p>
              <h2>Priority production jobs</h2>
            </div>
            <button className="text-link" onClick={() => onView("production")}>
              View board <ChevronRight size={16} />
            </button>
          </div>
          <JobTable jobs={sorted.slice(0, 6)} onOpen={onOpen} />
        </section>
        <aside className="overview-rail">
          <section className="panel division-summary">
            <h3>Business sections</h3>
            <button onClick={() => onView("commercial")}>
              <span className="division-icon commercial">
                <Factory />
              </span>
              <span>
                <strong>Commercial</strong>
                <small>
                  {jobs.filter((job) => job.division === "Commercial" && job.status !== "Complete").length}{" "}
                  jobs ·{" "}
                  {
                    new Set(
                      jobs
                        .filter((job) => job.division === "Commercial")
                        .map((job) => job.customer),
                    ).size
                  }{" "}
                  customers
                </small>
              </span>
              <ChevronRight />
            </button>
            <button onClick={() => onView("aerospace")}>
              <span className="division-icon aerospace">
                <Gauge />
              </span>
              <span>
                <strong>Aerospace</strong>
                <small>
                  {jobs.filter((job) => job.division === "Aerospace" && job.status !== "Complete").length}{" "}
                  jobs ·{" "}
                  {
                    new Set(
                      jobs
                        .filter((job) => job.division === "Aerospace")
                        .map((job) => job.customer),
                    ).size
                  }{" "}
                  customers
                </small>
              </span>
              <ChevronRight />
            </button>
          </section>
          <section className="panel urgent-list">
            <h3>Next workflow deadlines</h3>
            {sorted.slice(0, 4).map((job) => (
              <button key={job.id} onClick={() => onOpen(job.id)}>
                <span
                  className={
                    daysUntil(effectiveDueDate(job)) <= 3
                      ? "urgent-dot"
                      : "due-dot"
                  }
                />
                <span>
                  <strong>Job #{job.jobNumber}</strong>
                  <small>
                    {job.customer} · {job.status}
                  </small>
                </span>
                <em
                  className={
                    daysUntil(effectiveDueDate(job)) <= 3 ? "urgent" : ""
                  }
                >
                  {dueCopy(effectiveDueDate(job))}
                </em>
              </button>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
}

function DivisionView({
  division,
  folders,
  jobs,
  customer,
  onCustomerChange,
  onOpen,
  onNew,
  notify,
}: {
  division: Division;
  folders: [string, Job[]][];
  jobs: Job[];
  customer: string | null;
  onCustomerChange: (customer: string | null) => void;
  onOpen: (id: string) => void;
  onNew: () => void;
  notify: (message: string) => void;
}) {
  const [folderStatus, setFolderStatus] = useState<"All" | JobStatus>("All");
  const [jobSearch, setJobSearch] = useState("");
  const divisionJobs = folders.flatMap(([, items]) => items);
  async function copyProductionAgenda() {
    const rows = divisionJobs
      .filter((job) => productionAgendaStatuses.includes(job.status))
      .sort((a, b) => kryptonDockDate(a).localeCompare(kryptonDockDate(b)))
      .map((job) => {
        const latestNote = [...job.notes].sort((a, b) =>
          `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`),
        )[0];
        return {
          "Customer Name": job.customer,
          "Job#": job.jobNumber,
          "PN#": job.pn,
          Status: job.status,
          "Krypton Dock Date": dateLabel(kryptonDockDate(job)),
          "Last Updated Note": latestNote?.text ?? "",
          "Last Note Date": dateLabel(latestNote?.date ?? ""),
        };
      });
    if (!rows.length) {
      notify(`No active ${division.toLowerCase()} production jobs to copy.`);
      return;
    }
    const headers = [
      "Customer Name",
      "Job#",
      "PN#",
      "Status",
      "Krypton Dock Date",
      "Last Updated Note",
      "Last Note Date",
    ] as const;
    const escapeCell = (value: string) =>
      value.replace(
        /[&<>]/g,
        (character) =>
          ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[character]!,
      );
    const html = `<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px"><thead><tr>${headers
      .map(
        (header) =>
          `<th style="border:1px solid #aab4c4;padding:8px;text-align:left;background:#e9eef6">${header}</th>`,
      )
      .join("")}</tr></thead><tbody>${rows
      .map(
        (row) =>
          `<tr>${headers
            .map(
              (header) =>
                `<td style="border:1px solid #aab4c4;padding:8px;vertical-align:top">${escapeCell(String(row[header]))}</td>`,
            )
            .join("")}</tr>`,
      )
      .join("")}</tbody></table>`;
    const plain = [
      headers.join("\t"),
      ...rows.map((row) => headers.map((header) => row[header]).join("\t")),
    ].join("\n");
    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([plain], { type: "text/plain" }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(plain);
      }
      notify(
        `${division} Production Agenda copied. Paste it directly into your email.`,
      );
    } catch {
      notify("Copy was blocked by the browser. Please try again.");
    }
  }
  const normalizedSearch = jobSearch.trim().toLowerCase();
  const wildcardSearch = normalizedSearch.startsWith("*")
    ? normalizedSearch.slice(1)
    : normalizedSearch;
  const matchingJobs = (
    customer ? jobs.filter((job) => job.customer === customer) : jobs
  )
    .filter((job) => folderStatus === "All" || job.status === folderStatus)
    .filter((job) => {
      if (!wildcardSearch) return true;
      const searchable = [
        job.jobNumber,
        job.ksid,
        job.pnName,
        job.pn,
        job.rev,
        job.poNumber,
      ].map((value) => value.toLowerCase());
      return searchable.some((value) => value.includes(wildcardSearch));
    })
    .sort(
      (a, b) =>
        jobStatuses.indexOf(a.status) - jobStatuses.indexOf(b.status) ||
        a.jobNumber.localeCompare(b.jobNumber, undefined, { numeric: true }),
    );
  const onSchedule = matchingJobs.filter((job) => job.status === "Waiting on Parts");
  const onProduction = matchingJobs.filter(
    (job) => job.status !== "Waiting on Parts" && job.status !== "Complete",
  );
  const completed = matchingJobs.filter((job) => job.status === "Complete");
  return (
    <section className="view-stack">
      <div className="view-intro">
        <div>
          <h2>{customer ?? `All ${division} jobs`}</h2>
          <p>
            {customer
              ? `${division} customer sub-category`
              : `Overview of every ${division.toLowerCase()} job. Choose a customer from the left menu to narrow the list.`}
          </p>
        </div>
        <div className="view-intro-actions">
          <button className="button secondary" onClick={copyProductionAgenda}>
            <Copy size={17} /> Copy Production Agenda
          </button>
          <button className="button primary" onClick={onNew}>
            <Plus size={17} /> Add {division} job
          </button>
        </div>
      </div>
      {!folders.length ? (
        <div className="empty-state panel">
          <Folder size={30} />
          <h3>No customer sub-categories yet</h3>
          <p>Create the first {division.toLowerCase()} project to add one.</p>
        </div>
      ) : (
        <section className="panel job-register">
          <div className="panel-header">
            <div>
              <p className="section-kicker">{customer ?? `All ${division}`}</p>
              <h2>Jobs</h2>
            </div>
            <div className="folder-job-controls">
              <label className="job-search-control">
                Search jobs
                <span>
                  <Search size={15} />
                  <input
                    value={jobSearch}
                    onChange={(event) => setJobSearch(event.target.value)}
                    placeholder="Job#, KSID, PN, Rev, PO# or *3847"
                  />
                </span>
              </label>
              <label>
                Status
                <select
                  value={folderStatus}
                  onChange={(event) =>
                    setFolderStatus(event.target.value as "All" | JobStatus)
                  }
                >
                  <option value="All">All statuses</option>
                  {jobStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
              {customer && (
                <button
                  className="text-link"
                  onClick={() => {
                    onCustomerChange(null);
                    setFolderStatus("All");
                  }}
                >
                  Clear folder
                </button>
              )}
            </div>
          </div>
          <div className="job-status-section on-schedule-section">
            <div className="job-status-section-heading">
              <span><Clock3 size={17} /> On Schedule</span>
              <em>{onSchedule.length}</em>
            </div>
            <p>Jobs waiting on parts</p>
            <JobTable jobs={onSchedule} onOpen={onOpen} />
          </div>
          <div className="job-status-section on-production-section">
            <div className="job-status-section-heading">
              <span><Factory size={17} /> On Production</span>
              <em>{onProduction.length}</em>
            </div>
            <p>All active production statuses</p>
            <JobTable jobs={onProduction} onOpen={onOpen} />
          </div>
          <details className="completed-jobs-section">
            <summary>
              <span>
                <CheckCircle2 size={18} /> Completed
              </span>
              <em>{completed.length}</em>
            </summary>
            <div className="completed-jobs-content">
              <JobTable jobs={completed} onOpen={onOpen} />
            </div>
          </details>
        </section>
      )}
    </section>
  );
}

function quoteTagClass(tag: RFQTag) {
  return `rfq-tag ${tag.toLowerCase().replaceAll(" ", "-")}`;
}

function QuotesView({
  quotes,
  onNew,
  onOpen,
  onUpdate,
}: {
  quotes: QuoteRecord[];
  onNew: () => void;
  onOpen: (id: string) => void;
  onUpdate: (id: string, change: Partial<QuoteRecord>) => void;
}) {
  function customerGroups(division: Division) {
    return Object.entries(
      quotes
        .filter((quote) => quote.division === division)
        .reduce<Record<string, QuoteRecord[]>>((groups, quote) => {
          (groups[quote.customer] ??= []).push(quote);
          return groups;
        }, {}),
    )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([customer, customerQuotes]) => [
        customer,
        [...customerQuotes].sort((a, b) =>
          a.dueDate.localeCompare(b.dueDate),
        ),
      ] as const);
  }

  const urgentQuotes = [...quotes]
    .filter(
      (quote) =>
        !quote.completed && quoteUrgency(quote.dueDate) !== "scheduled",
    )
    .sort(
      (a, b) =>
        a.dueDate.localeCompare(b.dueDate) ||
        a.division.localeCompare(b.division) ||
        a.customer.localeCompare(b.customer),
    );
  const urgencyGroups: {
    urgency: Exclude<QuoteUrgency, "scheduled">;
    label: string;
    description: string;
  }[] = [
    {
      urgency: "past-due",
      label: "Past Due",
      description: "Customer response or quote submission is overdue",
    },
    {
      urgency: "due-today",
      label: "Due Today",
      description: "RFQs requiring action before the end of today",
    },
    {
      urgency: "due-tomorrow",
      label: "Due in 1 Day",
      description: "RFQs approaching their deadline tomorrow",
    },
  ];

  return (
    <section className="view-stack quotes-view">
      <div className="view-intro quotes-intro">
        <div>
          <h2>Quotes</h2>
          <p>
            Review RFQs by business section and customer, then open any quote
            for its complete details and notes.
          </p>
        </div>
        <button className="button primary new-rfq-button" onClick={onNew}>
          <Plus size={17} /> New RFQ
        </button>
      </div>

      <div className="quote-division-grid">
        {(["Commercial", "Aerospace"] as Division[]).map((division) => {
          const groups = customerGroups(division);
          const total = groups.reduce(
            (sum, [, customerQuotes]) => sum + customerQuotes.length,
            0,
          );
          return (
            <section className="panel quote-division-panel" key={division}>
              <header className="quote-division-heading">
                <span className={`division-icon ${division.toLowerCase()}`}>
                  {division === "Commercial" ? <Factory /> : <Gauge />}
                </span>
                <span>
                  <small>Business section</small>
                  <h3>{division}</h3>
                </span>
                <b>{total} RFQ{total === 1 ? "" : "s"}</b>
              </header>

              {groups.length ? (
                <div className="quote-customer-list">
                  {groups.map(([customer, customerQuotes]) => (
                    <section className="quote-customer-section" key={customer}>
                      <div className="quote-customer-heading">
                        <span>
                          <UserRound size={15} />
                          <strong>{customer}</strong>
                        </span>
                        <small>
                          {customerQuotes.length} quote
                          {customerQuotes.length === 1 ? "" : "s"}
                        </small>
                      </div>
                      <div className="quote-table">
                        <div className="quote-table-head">
                          <span>Contact</span>
                          <span>Tags</span>
                          <span>PN#</span>
                          <span>Rev</span>
                          <span>QTY</span>
                          <span>KSID</span>
                          <span>Due Date</span>
                          <span>Complete</span>
                        </div>
                        {customerQuotes.map((quote) => (
                          <button
                            className="quote-table-row"
                            key={quote.id}
                            onClick={() => onOpen(quote.id)}
                            aria-label={`Open ${quote.customer} RFQ for PN ${quote.pn}`}
                          >
                            <span>{quote.contact}</span>
                            <span className="quote-row-tags">
                              {quote.tags.length ? (
                                quote.tags.map((tag) => (
                                  <em className={quoteTagClass(tag)} key={tag}>
                                    {tag}
                                  </em>
                                ))
                              ) : (
                                <small>No tags</small>
                              )}
                            </span>
                            <span>
                              <strong>{quote.pn}</strong>
                            </span>
                            <span>{quote.rev || "—"}</span>
                            <span>{quote.quantity || "—"}</span>
                            <span>{quote.ksid || "—"}</span>
                            <span className="quote-due-cell">
                              <strong>{dateLabel(quote.dueDate)}</strong>
                              {quoteUrgency(quote.dueDate) !== "scheduled" && (
                                <em
                                  className={`quote-urgency-badge ${quoteUrgency(quote.dueDate)}`}
                                >
                                  {quoteUrgencyLabel(quote.dueDate)}
                                </em>
                              )}
                            </span>
                            <span
                              className="rfq-completion-control"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={quote.completed}
                                onChange={(event) =>
                                  onUpdate(quote.id, {
                                    completed: event.target.checked,
                                  })
                                }
                                aria-label={`Mark RFQ for ${quote.pn} complete`}
                              />
                              {quote.completed ? "Completed" : "Complete"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="quote-empty-state">
                  <FileText size={28} />
                  <strong>No {division.toLowerCase()} quotes yet</strong>
                  <p>Use New RFQ to add the first customer quote.</p>
                </div>
              )}
            </section>
          );
        })}
      </div>

      <section className="panel upcoming-rfq-panel">
        <div className="panel-header upcoming-rfq-heading">
          <div>
            <p className="section-kicker">Deadline watch</p>
            <h2>Upcoming RFQ</h2>
            <p>Quotes that are past due, due today, or due within one day.</p>
          </div>
          <span className="upcoming-rfq-total">
            <AlertTriangle size={15} /> {urgentQuotes.length} requiring attention
          </span>
        </div>
        <div className="upcoming-rfq-grid">
          {urgencyGroups.map((group) => {
            const groupQuotes = urgentQuotes.filter(
              (quote) => quoteUrgency(quote.dueDate) === group.urgency,
            );
            return (
              <section
                className={`upcoming-rfq-group ${group.urgency}`}
                key={group.urgency}
              >
                <header>
                  <span>
                    <strong>{group.label}</strong>
                    <small>{group.description}</small>
                  </span>
                  <b>{groupQuotes.length}</b>
                </header>
                <div className="upcoming-rfq-list">
                  {groupQuotes.map((quote) => (
                    <button key={quote.id} onClick={() => onOpen(quote.id)}>
                      <span>
                        <small>{quote.division} · {quote.customer}</small>
                        <strong>PN {quote.pn}</strong>
                        <em>{quote.contact} · QTY {quote.quantity || "—"}</em>
                      </span>
                      <span>
                        <strong>{dateLabel(quote.dueDate)}</strong>
                        <ChevronRight size={15} />
                      </span>
                    </button>
                  ))}
                  {!groupQuotes.length && (
                    <div className="upcoming-rfq-empty">
                      <CheckCircle2 size={16} /> No RFQs in this category
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </section>
  );
}

function NewRfqModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (quote: QuoteRecord) => void;
}) {
  const [division, setDivision] = useState<Division>("Commercial");
  const [tags, setTags] = useState<RFQTag[]>([]);
  const [fields, setFields] = useState({ customer: "", contact: "", pn: "", rev: "", quantity: "", ksid: "", dueDate: "", notes: "" });
  const [scanState, setScanState] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);

  function updateField(key: keyof typeof fields, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  async function scanRfqPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setScanState("Scanning photo and locating RFQ details…");
    try {
      const text = await recognizeScreenshot(file);
      const detected = parseRfqScreenshot(text);
      setTags(detected.tags);
      setFields((current) => ({
        ...current,
        contact: detected.contact,
        pn: detected.pn,
        rev: detected.rev,
        ksid: detected.ksid,
        dueDate: detected.dueDate,
      }));
      const populated = [detected.contact, detected.pn, detected.rev, detected.ksid, detected.dueDate].filter(Boolean).length;
      setScanState(`Scan complete. ${populated} details populated. Review the red Missing cues, edit anything needed, then book the RFQ.`);
    } catch {
      setScanState("The photo could not be read. You can still enter or book the RFQ manually.");
    }
    event.target.value = "";
  }

  const missing = (value: string, optional = false) => !optional && !value.trim();
  const missingCue = (isMissing: boolean) => isMissing ? <span className="rfq-missing-cue">Missing</span> : null;

  function toggleTag(tag: RFQTag) {
    setTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const initialNote = fields.notes.trim();
    const now = new Date().toISOString();
    onCreate({
      id: makeId("rfq"),
      division,
      customer: fields.customer.trim(),
      tags,
      contact: fields.contact.trim(),
      pn: fields.pn.trim(),
      quantity: fields.quantity.trim(),
      rev: fields.rev.trim(),
      ksid: fields.ksid.trim(),
      dueDate: fields.dueDate,
      createdAt: now,
      completed: false,
      notes: initialNote
        ? [
            {
              id: makeId("quote-note"),
              date: chicagoDateKey(),
              createdAt: now,
              text: initialNote,
            },
          ]
        : [],
    });
  }

  return (
    <div
      className="modal-layer"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <form className="modal-card new-rfq-modal" onSubmit={submit}>
        <div className="modal-header">
          <div>
            <p className="section-kicker">Quotes · New request</p>
            <h2>New RFQ</h2>
            <p>Add the customer, part details, due date, and quote tags.</p>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Close New RFQ"
            onClick={onClose}
          >
            <X />
          </button>
        </div>

        <section className="rfq-photo-scan">
          <span className="smart-import-icon"><ImageIcon /></span>
          <div>
            <strong>Scan RFQ photo</strong>
            <small>Recognizes tags, Contact, PN#, Rev, optional KSID, and the due date. Enter QTY manually.</small>
            {scanState && <em>{scanState}</em>}
          </div>
          <button type="button" className="button secondary" onClick={() => uploadRef.current?.click()}>
            <Upload size={16} /> Upload photo
          </button>
          <input ref={uploadRef} hidden type="file" accept="image/*" onChange={scanRfqPhoto} />
        </section>

        <fieldset className="division-picker rfq-division-picker">
          <legend>Selection</legend>
          {(["Commercial", "Aerospace"] as Division[]).map((item) => (
            <label key={item} className={division === item ? "selected" : ""}>
              <input
                type="radio"
                checked={division === item}
                onChange={() => setDivision(item)}
              />
              <span className={`division-icon ${item.toLowerCase()}`}>
                {item === "Commercial" ? <Factory /> : <Gauge />}
              </span>
              <span>
                <strong>{item}</strong>
                <small>Save in the {item} quote area</small>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="rfq-form-grid">
          <label className="wide">
            Customer Name {missingCue(missing(fields.customer))}
            <input className={missing(fields.customer) ? "missing-input" : ""} value={fields.customer} onChange={(event) => updateField("customer", event.target.value)} />
          </label>
          <label className="wide">
            Contact {missingCue(missing(fields.contact))}
            <input className={missing(fields.contact) ? "missing-input" : ""} value={fields.contact} onChange={(event) => updateField("contact", event.target.value)} />
          </label>
          <label>
            PN# {missingCue(missing(fields.pn))}
            <input className={missing(fields.pn) ? "missing-input" : ""} value={fields.pn} onChange={(event) => updateField("pn", event.target.value)} />
          </label>
          <label>
            Rev {missingCue(missing(fields.rev))}
            <input className={missing(fields.rev) ? "missing-input" : ""} value={fields.rev} onChange={(event) => updateField("rev", event.target.value)} />
          </label>
          <label>
            QTY {missingCue(missing(fields.quantity))}
            <input className={missing(fields.quantity) ? "missing-input" : ""} value={fields.quantity} type="text" inputMode="numeric" onChange={(event) => updateField("quantity", event.target.value)} />
          </label>
          <label>
            KSID <span>(if applicable)</span>
            <input value={fields.ksid} onChange={(event) => updateField("ksid", event.target.value)} />
          </label>
          <label>
            Due Date {missingCue(missing(fields.dueDate))}
            <input className={missing(fields.dueDate) ? "missing-input" : ""} value={fields.dueDate} type="date" onChange={(event) => updateField("dueDate", event.target.value)} />
          </label>
        </div>

        <fieldset className="rfq-tag-picker">
          <legend>Tags <span>(select any that apply)</span> {missingCue(tags.length === 0)}</legend>
          <div>
            {rfqTags.map((tag) => (
              <label
                className={`${quoteTagClass(tag)} ${tags.includes(tag) ? "selected" : ""}`}
                key={tag}
              >
                <input
                  type="checkbox"
                  checked={tags.includes(tag)}
                  onChange={() => toggleTag(tag)}
                />
                {tags.includes(tag) && <Check size={12} />}
                {tag}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="rfq-notes-field">
          Notes
          <textarea
            value={fields.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            rows={4}
            placeholder="Add the first RFQ note…"
          />
        </label>

        <div className="modal-actions">
          <button type="button" className="button ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary">
            <Plus size={16} /> Book RFQ
          </button>
        </div>
      </form>
    </div>
  );
}

function QuoteDetailWindow({
  quote,
  onClose,
  onUpdate,
  notify,
}: {
  quote: QuoteRecord;
  onClose: () => void;
  onUpdate: (change: Partial<QuoteRecord>) => void;
  notify: (message: string) => void;
}) {
  const [noteDate, setNoteDate] = useState(chicagoDateKey());
  const [noteText, setNoteText] = useState("");
  const [editingDetails, setEditingDetails] = useState(false);

  function toggleQuoteTag(tag: RFQTag) {
    onUpdate({
      tags: quote.tags.includes(tag)
        ? quote.tags.filter((item) => item !== tag)
        : [...quote.tags, tag],
    });
  }

  function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!noteText.trim()) return;
    onUpdate({
      notes: [
        {
          id: makeId("quote-note"),
          date: noteDate,
          createdAt: new Date().toISOString(),
          text: noteText.trim(),
        },
        ...quote.notes,
      ],
    });
    setNoteText("");
    notify("Quote note saved.");
  }

  const notes = [...quote.notes].sort((a, b) =>
    `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`),
  );

  return (
    <div
      className="modal-layer quote-detail-layer"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <article className="modal-card quote-detail-card" role="dialog" aria-modal="true">
        <div className="modal-header quote-detail-header">
          <div>
            <p className="section-kicker">
              {quote.division} · {quote.customer}
            </p>
            <h2>RFQ · PN {quote.pn}</h2>
            <p>Created {dateLabel(quote.createdAt.slice(0, 10))}</p>
          </div>
          <div className="quote-detail-header-actions">
            <label className="rfq-completion-control">
              <input
                type="checkbox"
                checked={quote.completed}
                onChange={(event) =>
                  onUpdate({ completed: event.target.checked })
                }
              />
              {quote.completed ? "Completed" : "Mark complete"}
            </label>
            <button
              className={`button small ${editingDetails ? "primary" : "secondary"}`}
              onClick={() => setEditingDetails((current) => !current)}
            >
              <Settings2 size={15} />
              {editingDetails ? "Done editing" : "Edit quote details"}
            </button>
            <button className="icon-button" aria-label="Close quote" onClick={onClose}>
              <X />
            </button>
          </div>
        </div>

        <div className="quote-detail-layout">
          <section className="quote-detail-information">
            <div className="quote-detail-title">
              <FileText size={19} />
              <span>
                <small>Quote details</small>
                <strong>{quote.customer}</strong>
              </span>
            </div>
            {editingDetails ? (
              <div className="quote-detail-edit-form">
                <label>
                  Business Section
                  <select
                    value={quote.division}
                    onChange={(event) =>
                      onUpdate({ division: event.target.value as Division })
                    }
                  >
                    <option>Commercial</option>
                    <option>Aerospace</option>
                  </select>
                </label>
                <label>
                  Customer Name
                  <input
                    value={quote.customer}
                    onChange={(event) => onUpdate({ customer: event.target.value })}
                  />
                </label>
                <label>
                  Contact
                  <input
                    value={quote.contact}
                    onChange={(event) => onUpdate({ contact: event.target.value })}
                  />
                </label>
                <label>
                  PN#
                  <input
                    value={quote.pn}
                    onChange={(event) => onUpdate({ pn: event.target.value })}
                  />
                </label>
                <label>
                  Rev
                  <input
                    value={quote.rev}
                    onChange={(event) => onUpdate({ rev: event.target.value })}
                  />
                </label>
                <label>
                  QTY
                  <input
                    className={quote.quantity === "" ? "missing-input" : ""}
                    type="text"
                    inputMode="numeric"
                    value={quote.quantity}
                    onChange={(event) => onUpdate({ quantity: event.target.value })}
                  />
                </label>
                <label>
                  KSID <span>(if applicable)</span>
                  <input
                    value={quote.ksid}
                    onChange={(event) => onUpdate({ ksid: event.target.value })}
                  />
                </label>
                <label>
                  Due Date
                  <input
                    type="date"
                    value={quote.dueDate}
                    onChange={(event) => onUpdate({ dueDate: event.target.value })}
                  />
                </label>
                <fieldset className="quote-edit-tags">
                  <legend>Tags</legend>
                  <div>
                    {rfqTags.map((tag) => (
                      <label
                        className={`${quoteTagClass(tag)} ${quote.tags.includes(tag) ? "selected" : ""}`}
                        key={tag}
                      >
                        <input
                          type="checkbox"
                          checked={quote.tags.includes(tag)}
                          onChange={() => toggleQuoteTag(tag)}
                        />
                        {quote.tags.includes(tag) && <Check size={12} />}
                        {tag}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            ) : (
              <div className="quote-detail-fields">
              <div>
                <small>Business Section</small>
                <strong>{quote.division}</strong>
              </div>
              <div>
                <small>Customer Name</small>
                <strong>{quote.customer}</strong>
              </div>
              <div>
                <small>Contact</small>
                <strong>{quote.contact}</strong>
              </div>
              <div>
                <small>PN#</small>
                <strong>{quote.pn}</strong>
              </div>
              <div>
                <small>Rev</small>
                <strong>{quote.rev || "—"}</strong>
              </div>
              <div>
                <small>QTY</small>
                <strong>{quote.quantity || "—"}</strong>
              </div>
              <div>
                <small>KSID</small>
                <strong>{quote.ksid || "Not applicable"}</strong>
              </div>
              <div>
                <small>Due Date</small>
                <strong>{dateLabel(quote.dueDate)}</strong>
              </div>
              <div className="quote-detail-tags-field">
                <small>Tags</small>
                <span className="quote-row-tags">
                  {quote.tags.length ? (
                    quote.tags.map((tag) => (
                      <em className={quoteTagClass(tag)} key={tag}>
                        {tag}
                      </em>
                    ))
                  ) : (
                    <strong>None</strong>
                  )}
                </span>
              </div>
              </div>
            )}
          </section>

          <aside className="quote-notes-panel">
            <div className="quote-notes-heading">
              <span>
                <StickyNote size={17} />
                <strong>RFQ Notes</strong>
              </span>
              <small>{notes.length} note{notes.length === 1 ? "" : "s"}</small>
            </div>
            <form className="quote-note-form" onSubmit={addNote}>
              <label>
                Note date
                <input
                  type="date"
                  value={noteDate}
                  onChange={(event) => setNoteDate(event.target.value)}
                  required
                />
              </label>
              <label>
                New note
                <textarea
                  rows={4}
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                  placeholder="Add customer feedback, pricing status, or next steps…"
                  required
                />
              </label>
              <button className="button primary">
                <Plus size={15} /> Add note
              </button>
            </form>
            <div className="quote-note-list">
              {notes.map((note) => (
                <article key={note.id}>
                  <div>
                    <strong>{dateLabel(note.date)}</strong>
                    <small>
                      {new Date(note.createdAt).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </small>
                  </div>
                  <p>{note.text}</p>
                </article>
              ))}
              {!notes.length && (
                <div className="quote-notes-empty">
                  <StickyNote size={22} />
                  <span>No notes have been added yet.</span>
                </div>
              )}
            </div>
          </aside>
        </div>
      </article>
    </div>
  );
}

function DockAlertChart({
  alerts,
  onOpen,
}: {
  alerts: DockAlert[];
  onOpen: (id: string) => void;
}) {
  const categories: DockAlert["category"][] = [
    "Missing PCB Dock",
    "PCB Past Due",
  ];
  return (
    <section className="panel dock-alert-chart">
      <div className="panel-header">
        <div>
          <p className="section-kicker">PCB control</p>
          <h2>PCB dock exception chart</h2>
          <p>
            Jobs missing a PCB dock date or waiting on an overdue PCB arrival.
          </p>
        </div>
        <div className="dock-alert-counts">
          {categories.map((category) => (
            <span key={category}>
              <strong>
                {alerts.filter((alert) => alert.category === category).length}
              </strong>
              <small>{category}</small>
            </span>
          ))}
        </div>
      </div>
      {alerts.length ? (
        <div className="operational-table">
          <div className="operational-head dock-head">
            <span>Category</span>
            <span>Customer</span>
            <span>Job / KSID</span>
            <span>Outstanding</span>
            <span>Due date</span>
            <span />
          </div>
          {alerts.map((alert) => (
            <div className="operational-row dock-row" key={alert.id}>
              <span className="exception-tag">{alert.category}</span>
              <strong>{alert.customer}</strong>
              <span>
                Job #{alert.jobNumber}
                <small>{alert.ksid}</small>
              </span>
              <span>{alert.outstanding}</span>
              <span className={daysUntil(alert.dueDate) < 0 ? "urgent" : ""}>
                {dateLabel(alert.dueDate)}
                <small>{dueCopy(alert.dueDate)}</small>
              </span>
              <div className="row-actions">
                <button
                  className="icon-button"
                  aria-label="Open job workflow"
                  onClick={() => onOpen(alert.jobId)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="clear-state">
          <CheckCircle2 size={20} /> No dock-date exceptions in this section.
        </div>
      )}
    </section>
  );
}

function ActionItemsView({
  items,
  onOpen,
}: {
  items: ActionItem[];
  onOpen: (id: string) => void;
}) {
  const [dueFilter, setDueFilter] = useState<
    "all" | "past-due" | "due-today" | "due-tomorrow"
  >("all");
  const filteredItems = items.filter((item) => {
    const days = daysUntil(item.dueDate);
    if (dueFilter === "past-due") return days < 0;
    if (dueFilter === "due-today") return days === 0;
    if (dueFilter === "due-tomorrow") return days === 1;
    return true;
  });
  const groupedByJob = filteredItems.reduce<Record<string, ActionItem[]>>((groups, item) => {
    (groups[item.jobId] ??= []).push(item);
    return groups;
  }, {});
  return (
    <section className="view-stack">
      <div className="view-intro">
        <div>
          <h2>List of Action Items</h2>
          <p>
            Overdue work and actions due within one day, sorted by division,
            customer, job, and due date.
          </p>
        </div>
        <span className="action-total">
          <AlertTriangle size={18} /> {filteredItems.length} outstanding
        </span>
      </div>
      <div className="action-filter-bar" role="group" aria-label="Filter action items">
        {([
          ["all", "All"],
          ["past-due", "Past Due"],
          ["due-tomorrow", "1 Day Until Due"],
          ["due-today", "Due Today"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            className={`button small ${dueFilter === value ? "primary" : "secondary"}`}
            onClick={() => setDueFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {(["Commercial", "Aerospace"] as Division[]).map((division) => {
        const divisionItems = filteredItems.filter(
          (item) => item.division === division,
        );
        const divisionGroups = Object.values(groupedByJob).filter(
          (group) => group[0]?.division === division,
        );
        return (
          <section className="panel action-division" key={division}>
            <div className="panel-header">
              <div>
                <p className="section-kicker">{division}</p>
                <h2>{division} action items</h2>
              </div>
              <span className="count-badge">{divisionGroups.length} jobs · {divisionItems.length} actions</span>
            </div>
            {divisionItems.length ? (
              <div className="operational-table">
                <div className="operational-head action-head grouped-action-head">
                  <span>Customer</span>
                  <span>Job #</span>
                  <span>KSID #</span>
                  <span>Actions needed</span>
                  <span>Next due</span>
                  <span />
                </div>
                {divisionGroups.map((group) => {
                  const first = group[0];
                  const nextDue = [...group].sort((a, b) => {
                    if (!a.dueDate) return -1;
                    if (!b.dueDate) return 1;
                    return a.dueDate.localeCompare(b.dueDate);
                  })[0];
                  return (
                  <details
                    className={`operational-row action-row grouped-action-row ${
                      group.some((item) => daysUntil(item.dueDate) < 0)
                        ? "overdue"
                        : group.some((item) => daysUntil(item.dueDate) === 1)
                          ? "due-tomorrow"
                          : ""
                    }`}
                    key={first.jobId}
                  >
                    <summary>
                    <strong>{first.customer}</strong>
                    <span>#{first.jobNumber}</span>
                    <span>{first.ksid}</span>
                    <span className="action-summary-copy">{group.length} action{group.length === 1 ? "" : "s"}<ChevronDown size={15} /></span>
                    <span className={daysUntil(nextDue.dueDate) < 0 ? "urgent" : ""}>
                      {dateLabel(nextDue.dueDate)}<small>{dueCopy(nextDue.dueDate)}</small>
                    </span>
                    <div className="row-actions" onClick={(event) => event.stopPropagation()}>
                      <button
                        className="icon-button"
                        aria-label="Open job workflow"
                        onClick={() => onOpen(first.jobId)}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                    </summary>
                    <div className="grouped-action-details">
                      {group.map((item) => (
                        <div key={item.id}>
                          <span>{item.outstanding}</span>
                          <span className={daysUntil(item.dueDate) < 0 ? "urgent" : ""}>{dateLabel(item.dueDate)} · {dueCopy(item.dueDate)}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                  );
                })}
              </div>
            ) : (
              <div className="clear-state">
                <CheckCircle2 size={20} /> No overdue or next-day actions.
              </div>
            )}
          </section>
        );
      })}
    </section>
  );
}

function FollowUpListView({
  items,
  onOpen,
  onUpdate,
  notify,
}: {
  items: FollowUpItem[];
  onOpen: (id: string) => void;
  onUpdate: (id: string, change: Partial<Job>) => void;
  notify: (message: string) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [dates, setDates] = useState<Record<string, string>>({});

  function addFollowUpNote(event: FormEvent, item: FollowUpItem) {
    event.preventDefault();
    const text = drafts[item.job.id]?.trim();
    if (!text) return;
    const date = dates[item.job.id] || chicagoDateKey();
    onUpdate(item.job.id, {
      notes: [
        {
          id: makeId("note"),
          date,
          createdAt: new Date().toISOString(),
          text,
        },
        ...item.job.notes,
      ],
    });
    setDrafts((current) => ({ ...current, [item.job.id]: "" }));
    notify(`Follow-up note added to Job #${item.job.jobNumber}.`);
  }

  return (
    <section className="view-stack">
      <div className="view-intro">
        <div>
          <h2>Follow Up List</h2>
          <p>
            Active jobs with no note or whose most recent note is at least two
            days old. Add a fresh note to clear the job from this list.
          </p>
        </div>
        <span className="action-total follow-up-total">
          <StickyNote size={18} /> {items.length} need follow up
        </span>
      </div>
      {(["Commercial", "Aerospace"] as Division[]).map((division) => {
        const divisionItems = items.filter(
          (item) => item.job.division === division,
        );
        const customers = Object.entries(
          divisionItems.reduce<Record<string, FollowUpItem[]>>(
            (groups, item) => {
              (groups[item.job.customer] ??= []).push(item);
              return groups;
            },
            {},
          ),
        ).sort(([a], [b]) => a.localeCompare(b));
        return (
          <section className="panel follow-up-division" key={division}>
            <div className="panel-header">
              <div>
                <p className="section-kicker">{division}</p>
                <h2>{division} follow ups</h2>
              </div>
              <span className="count-badge">{divisionItems.length}</span>
            </div>
            {customers.length ? (
              <div className="follow-up-customers">
                {customers.map(([customer, customerItems]) => (
                  <section className="follow-up-customer" key={customer}>
                    <div className="follow-up-customer-title">
                      <Folder size={16} />
                      <strong>{customer}</strong>
                      <small>
                        {customerItems.length} job
                        {customerItems.length === 1 ? "" : "s"}
                      </small>
                    </div>
                    <div className="follow-up-job-list">
                      {customerItems.map((item) => (
                        <article className="follow-up-job" key={item.job.id}>
                          <div className="follow-up-job-summary">
                            <div>
                              <span className="follow-up-badge">
                                Need Follow Up
                              </span>
                              <h3>Job #{item.job.jobNumber}</h3>
                              <small>KSID #{item.job.ksid}</small>
                            </div>
                            <div>
                              <small>Status</small>
                              <em
                                className={`production-status ${statusClass(item.job.status)}`}
                              >
                                {item.job.status}
                              </em>
                            </div>
                            <div>
                              <small>Follow-up due</small>
                              <strong>{dateLabel(item.followUpDueDate)}</strong>
                              <span className="urgent">
                                {dueCopy(item.followUpDueDate)}
                              </span>
                            </div>
                            <button
                              className="button secondary small"
                              onClick={() => onOpen(item.job.id)}
                            >
                              Open job <ChevronRight size={15} />
                            </button>
                          </div>
                          <div className="follow-up-last-note">
                            <small>Last note added</small>
                            {item.lastNote ? (
                              <>
                                <p>{item.lastNote.text}</p>
                                <span>{dateLabel(item.lastNote.date)}</span>
                              </>
                            ) : (
                              <p>No note has been added to this job.</p>
                            )}
                          </div>
                          <form
                            className="follow-up-note-form"
                            onSubmit={(event) => addFollowUpNote(event, item)}
                          >
                            <label>
                              Note date
                              <input
                                type="date"
                                value={dates[item.job.id] || chicagoDateKey()}
                                onChange={(event) =>
                                  setDates((current) => ({
                                    ...current,
                                    [item.job.id]: event.target.value,
                                  }))
                                }
                              />
                            </label>
                            <label>
                              Add follow-up note
                              <textarea
                                rows={2}
                                value={drafts[item.job.id] || ""}
                                onChange={(event) =>
                                  setDrafts((current) => ({
                                    ...current,
                                    [item.job.id]: event.target.value,
                                  }))
                                }
                                placeholder="Add the latest customer, material, or production update…"
                                required
                              />
                            </label>
                            <button className="button primary small">
                              <Plus size={15} /> Save note &amp; clear follow up
                            </button>
                          </form>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="clear-state">
                <CheckCircle2 size={20} /> No jobs need follow up.
              </div>
            )}
          </section>
        );
      })}
    </section>
  );
}

function JobTable({
  jobs,
  onOpen,
}: {
  jobs: Job[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="job-table">
      <div className="job-table-head">
        <span>Job#</span>
        <span>KSID</span>
        <span>PN Name</span>
        <span>PN#</span>
        <span>Rev</span>
        <span>QTY</span>
        <span>PO#</span>
        <span>Level / Type</span>
        <span>Status</span>
        <span>Due date</span>
        <span />
      </div>
      {jobs.map((job) => (
        <button
          className="job-table-row"
          key={job.id}
          onClick={() => onOpen(job.id)}
        >
          <span>
            <strong>#{job.jobNumber}</strong>
          </span>
          <span>{job.ksid || "—"}</span>
          <span>
            <strong>{job.pnName}</strong>
          </span>
          <span>{job.pn || "—"}</span>
          <span>{job.rev || "—"}</span>
          <span>{job.quantity || "—"}</span>
          <span>{job.poNumber || "—"}</span>
          <span className="job-level-type">
            <b className={`build-level-badge ${jobBuildLevel(job).toLowerCase()}`}>
              {jobBuildLevel(job)}
            </b>
            <small>{job.projectType}</small>
          </span>
          <span>
            <em className={`production-status ${statusClass(job.status)}`}>
              {job.status}
            </em>
          </span>
          <span
            className={daysUntil(effectiveDueDate(job)) <= 3 ? "urgent" : ""}
          >
            <strong>{dateLabel(effectiveDueDate(job))}</strong>
            <small>
              {job.customerDueDate ? "Customer due" : dueCopy(job.dueDate)}
            </small>
          </span>
          <ChevronRight size={17} />
        </button>
      ))}
      {!jobs.length && (
        <div className="empty-table">No jobs match this view.</div>
      )}
    </div>
  );
}

// Kept temporarily for compatibility with saved links from the former page.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ShortagesView({
  jobs,
  onOpen,
  updateJob,
  notify,
}: {
  jobs: Job[];
  onOpen: (id: string) => void;
  updateJob: (id: string, change: Partial<Job>) => void;
  notify: (message: string) => void;
}) {
  const [jobId, setJobId] = useState(jobs[0]?.id ?? "");
  const [scanState, setScanState] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const job = jobs.find((item) => item.id === jobId);
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !job) return;
    setScanState(
      file.type.startsWith("image/")
        ? "Scanning shortage screenshot…"
        : "Reading shortage spreadsheet…",
    );
    try {
      const items = await parseShortageFile(file);
      updateJob(job.id, {
        shortages: reconcileShortageComments(
          [...job.shortages, ...items],
          job.pcbDockDate,
          job.createdDate,
        ),
        noShortageList: false,
        allPartsReceivedDate: "",
        status: job.status === "Kitting" ? "Waiting on Parts" : job.status,
        workflowCompleted: job.workflowCompleted.filter(
          (item) => item !== "shortage-list",
        ),
      });
      setScanState(
        `${items.length} row${items.length === 1 ? "" : "s"} added. Red fields need manual completion.`,
      );
      notify(
        `${items.length} shortage item${items.length === 1 ? "" : "s"} imported.`,
      );
    } catch {
      setScanState(
        "The upload could not be scanned. Add the rows manually below.",
      );
      notify(
        "That spreadsheet could not be read. Use columns KSP#, PN#, and Due Date.",
      );
    }
    event.target.value = "";
  }
  return (
    <section className="view-stack">
      <div className="view-intro">
        <div>
          <h2>Shortage list control</h2>
          <p>Track KSP#, PN#, due dates, and receipt completion by job.</p>
        </div>
        <button
          className="button secondary"
          onClick={() => fileRef.current?.click()}
          disabled={!job}
        >
          <Upload size={17} /> Upload Excel or photo
        </button>
      </div>
      <div className="shortage-job-select panel">
        <label>
          Job
          <select
            value={jobId}
            onChange={(event) => setJobId(event.target.value)}
          >
            {jobs.map((item) => (
              <option key={item.id} value={item.id}>
                #{item.jobNumber} · {item.customer} · {item.pnName}
              </option>
            ))}
          </select>
        </label>
        <span>
          <FileSpreadsheet size={18} /> Headers: KSP#, PN#, Due Date
        </span>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv,image/*"
          hidden
          onChange={upload}
        />
      </div>
      {scanState && (
        <div className="scan-message">
          <ImageIcon size={16} /> {scanState}
        </div>
      )}
      {job ? (
        <ShortageEditor
          job={job}
          onUpdate={(change) => updateJob(job.id, change)}
          onOpen={() => onOpen(job.id)}
          notify={notify}
        />
      ) : (
        <div className="empty-state panel">
          Create a job before adding shortages.
        </div>
      )}
    </section>
  );
}

function ShortageEditor({
  job,
  onUpdate,
  onOpen,
  notify,
}: {
  job: Job;
  onUpdate: (change: Partial<Job>) => void;
  onOpen?: () => void;
  notify: (message: string) => void;
}) {
  const [ksp, setKsp] = useState("");
  const [pn, setPn] = useState("");
  const [quantity, setQuantity] = useState("");
  const [due, setDue] = useState("");
  const [comments, setComments] = useState("");
  const allComplete =
    job.noShortageList ||
    (job.shortages.length > 0 && job.shortages.every((item) => item.complete));
  function toggle(item: ShortageItem) {
    const isAssemblyJob = job.buildLevel === "CCA" || job.buildLevel === "LRU";
    const updated = reconcileShortageComments(
      job.shortages.map((current) =>
        current.id === item.id
          ? { ...current, complete: !current.complete }
          : current,
      ),
      job.pcbDockDate,
      job.createdDate,
    );
    const nowAllComplete =
      updated.length > 0 && updated.every((current) => current.complete);
    onUpdate({
      shortages: updated,
      allPartsReceivedDate: nowAllComplete
        ? job.allPartsReceivedDate || chicagoDateKey()
        : "",
      status: nowAllComplete
        ? isAssemblyJob
          ? job.status
          : job.pcbArrived
            ? "Kitting"
            : job.status
        : !isAssemblyJob && job.status === "Kitting"
          ? "Waiting on Parts"
          : job.status,
      workflowCompleted: nowAllComplete
        ? Array.from(new Set([...job.workflowCompleted, "shortage-list"]))
        : job.workflowCompleted.filter((item) => item !== "shortage-list"),
      noShortageList: false,
    });
  }
  function setNoShortageList(enabled: boolean) {
    const isAssemblyJob = job.buildLevel === "CCA" || job.buildLevel === "LRU";
    const listedPartsComplete =
      job.shortages.length > 0 && job.shortages.every((item) => item.complete);
    onUpdate({
      noShortageList: enabled,
      allPartsReceivedDate: enabled
        ? job.allPartsReceivedDate || chicagoDateKey()
        : listedPartsComplete
          ? job.allPartsReceivedDate || chicagoDateKey()
          : "",
      status: enabled
        ? isAssemblyJob
          ? job.status
          : job.pcbArrived
            ? "Kitting"
            : job.status
        : !isAssemblyJob && job.status === "Kitting" && !listedPartsComplete
          ? "Waiting on Parts"
          : job.status,
      workflowCompleted: enabled || listedPartsComplete
        ? Array.from(new Set([...job.workflowCompleted, "shortage-list"]))
        : job.workflowCompleted.filter((item) => item !== "shortage-list"),
    });
    notify(
      enabled
        ? isAssemblyJob
          ? "No Shortage List required. Mechanical hardware marked available."
          : "No Shortage List required. Job moved to Kitting."
        : "Shortage List tracking reopened.",
    );
  }
  function updateItem(id: string, change: Partial<ShortageItem>) {
    const shortages = reconcileShortageComments(
      job.shortages.map((item) =>
        item.id === id ? { ...item, ...change } : item,
      ),
      job.pcbDockDate,
      job.createdDate,
    );
    onUpdate({ shortages });
  }
  function add(event: FormEvent) {
    event.preventDefault();
    if (!ksp && !pn) return;
    const newItem: ShortageItem = {
      id: makeId("shortage"),
      kspNumber: ksp,
      pnNumber: pn,
      quantity,
      dueDate: due,
      comments,
      customerSupplied: false,
      complete: false,
    };
    onUpdate({
      noShortageList: false,
      allPartsReceivedDate: "",
      status: job.status === "Kitting" ? "Waiting on Parts" : job.status,
      workflowCompleted: job.workflowCompleted.filter(
        (item) => item !== "shortage-list",
      ),
      shortages: reconcileShortageComments(
        [...job.shortages, newItem],
        job.pcbDockDate,
        job.createdDate,
      ),
    });
    setKsp("");
    setPn("");
    setQuantity("");
    setDue("");
    setComments("");
    notify("Shortage item added.");
  }
  const datedOpenItems = job.shortages.filter(
    (item) => !item.complete && !item.customerSupplied && item.dueDate,
  );
  const longestShortageDate = latestDate(
    datedOpenItems.map((item) => item.dueDate),
  );
  const longestLeadItems = datedOpenItems.filter(
    (item) => item.dueDate === longestShortageDate,
  );
  const pushesDockDate = (item: ShortageItem) =>
    shortagePushesDockDate(item, job.shortages, job.pcbDockDate);
  const requiresCustomerAction = (item: ShortageItem) =>
    pushesDockDate(item) ||
    shortageExceedsFifteenBusinessDays(item, job.createdDate);
  async function copyCustomerTable() {
    const rows = job.shortages.map((item) => ({
      pn: item.pnNumber,
      qty: item.quantity,
      due: item.customerSupplied ? "CUSTOMER SUPPLIED" : dateLabel(item.dueDate),
      comments: item.customerSupplied
        ? item.comments || CUSTOMER_SUPPLIED_NOTE
        : requiresCustomerAction(item)
          ? item.comments || LEAD_TIME_NOTE
          : item.comments,
      className: item.customerSupplied ? "customer-supplied" : requiresCustomerAction(item) ? "dock-impact" : "",
    }));
    const html = `<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px"><thead><tr>${["PN#", "QTY", "DUE DATE", "Additional Comments"].map((value) => `<th style="border:1px solid #aab4c4;padding:8px;text-align:left;background:#e9eef6">${value}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr style="background:${row.className === "customer-supplied" ? "#dbeafe" : row.className === "dock-impact" ? "#fee2e2" : "#ffffff"}">${[row.pn, row.qty, row.due, row.comments].map((value) => `<td style="border:1px solid #aab4c4;padding:8px">${String(value).replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char]!)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    const plain = ["PN#\tQTY\tDUE DATE\tAdditional Comments", ...rows.map((row) => [row.pn, row.qty, row.due, row.comments].join("\t"))].join("\n");
    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
        await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([plain], { type: "text/plain" }) })]);
      } else {
        await navigator.clipboard.writeText(plain);
      }
      notify("Customer shortage table copied. Paste it directly into your email.");
    } catch {
      notify("Copy was blocked by the browser. Select the table and copy it manually.");
    }
  }
  function removeItem(id: string) {
    const shortages = reconcileShortageComments(
      job.shortages.filter((item) => item.id !== id),
      job.pcbDockDate,
      job.createdDate,
    );
    const nowAllComplete =
      shortages.length > 0 && shortages.every((item) => item.complete);
    onUpdate({
      shortages,
      allPartsReceivedDate: nowAllComplete
        ? job.allPartsReceivedDate || chicagoDateKey()
        : "",
      status: nowAllComplete
        ? job.pcbArrived
          ? "Kitting"
          : job.status
        : job.status === "Kitting"
          ? "Waiting on Parts"
          : job.status,
      workflowCompleted: nowAllComplete
        ? Array.from(new Set([...job.workflowCompleted, "shortage-list"]))
        : job.workflowCompleted.filter((item) => item !== "shortage-list"),
    });
  }
  return (
    <section className="panel shortage-editor">
      <div className="panel-header">
        <div>
          <p className="section-kicker">Job #{job.jobNumber}</p>
          <h2>{job.pnName}</h2>
        </div>
        <div className={`shortage-progress ${allComplete ? "complete" : ""}`}>
          <PackageCheck size={18} />
          <span>
            <strong>
              {job.shortages.filter((item) => item.complete).length}/
              {job.shortages.length}
            </strong>
            <small>received</small>
          </span>
        </div>
      </div>
      <label className="no-shortage-toggle">
        <input
          type="checkbox"
          checked={job.noShortageList}
          onChange={(event) => setNoShortageList(event.target.checked)}
        />
        <span>
          <strong>NO SHORTAGE LIST</strong>
          <small>
            Nothing is outstanding. Mark the shortage step complete and move
            this job to Kitting.
          </small>
        </span>
      </label>
      <label className="all-parts-received">
        All Parts Received
        <input
          type="date"
          value={job.allPartsReceivedDate}
          onChange={(event) => onUpdate({ allPartsReceivedDate: event.target.value })}
        />
        <small>
          This date fills automatically, but you can correct or enter it manually.
        </small>
      </label>
      {!job.noShortageList && (
        <>
          <div className="shortage-summary-bar">
            <div>
              <strong>Longest lead-time item</strong>
              {longestLeadItems.length ? (
                <span>{longestLeadItems.map((item) => item.pnNumber || item.kspNumber).join(", ")} · {dateLabel(longestShortageDate)} · PCB Dock {dateLabel(job.pcbDockDate)} · Krypton Dock {dateLabel(kryptonDockDate(job))}</span>
              ) : <span>No dated open component lead time.</span>}
            </div>
            <button className="button secondary small" type="button" onClick={copyCustomerTable}>
              <Copy size={15} /> Copy Customer Table
            </button>
          </div>
          <form className="shortage-add" onSubmit={add}>
            <label>
              KSP#
              <input
                value={ksp}
                onChange={(event) => setKsp(event.target.value)}
                placeholder="KSP-0000"
              />
            </label>
            <label>
              PN#
              <input
                value={pn}
                onChange={(event) => setPn(event.target.value)}
                placeholder="Part number"
              />
            </label>
            <label>
              QTY
              <input
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="Quantity"
              />
            </label>
            <label>
              Due Date
              <input type="date" value={due} onChange={(event) => setDue(event.target.value)} />
            </label>
            <label className="shortage-comments-field">
              Additional Comments
              <input
                value={comments}
                onChange={(event) => setComments(event.target.value)}
                placeholder="Supplier update, hold reason, or details"
              />
            </label>
            <button className="button primary">
              <Plus size={16} /> Add
            </button>
          </form>
          <div className="shortage-table">
            <div className="shortage-head">
              <span>Received</span>
              <span>KSP#</span>
              <span>PN#</span>
              <span>QTY</span>
              <span>Due date</span>
              <span>Customer supply</span>
              <span>Additional comments</span>
              <span />
            </div>
            {job.shortages.map((item) => (
              <div
                className={`shortage-row ${item.complete ? "checked" : ""} ${item.customerSupplied ? "customer-supplied-row" : requiresCustomerAction(item) ? "dock-impact-row" : ""}`}
                key={item.id}
              >
                <button
                  className="check-button"
                  aria-label={`Mark ${item.pnNumber} ${item.complete ? "not received" : "received"}`}
                  onClick={() => toggle(item)}
                >
                  {item.complete && <Check size={15} />}
                </button>
                <input
                  className={!item.kspNumber ? "missing-shortage" : ""}
                  aria-label="KSP number"
                  value={item.kspNumber}
                  onChange={(event) =>
                    updateItem(item.id, { kspNumber: event.target.value })
                  }
                  placeholder="★ KSP#"
                />
                <input
                  className={!item.pnNumber ? "missing-shortage" : ""}
                  aria-label="Part number"
                  value={item.pnNumber}
                  onChange={(event) =>
                    updateItem(item.id, { pnNumber: event.target.value })
                  }
                  placeholder="★ PN#"
                />
                <input
                  className={!item.quantity ? "missing-shortage" : ""}
                  aria-label="Shortage quantity"
                  value={item.quantity}
                  onChange={(event) =>
                    updateItem(item.id, { quantity: event.target.value })
                  }
                  placeholder="★ QTY"
                />
                <div className="shortage-due-control">
                  <input
                    className={!item.dueDate ? "missing-shortage" : !item.complete && daysUntil(item.dueDate) < 0 ? "urgent-input" : ""}
                    aria-label="Shortage due date"
                    type="date"
                    value={item.dueDate}
                    onChange={(event) =>
                      updateItem(item.id, { dueDate: event.target.value })
                    }
                  />
                </div>
                <label className="shortage-supply-control">
                  <input
                    type="checkbox"
                    aria-label={`Customer supplied ${item.pnNumber || item.kspNumber || "shortage item"}`}
                    checked={item.customerSupplied}
                    onChange={(event) =>
                      updateItem(item.id, {
                        customerSupplied: event.target.checked,
                      })
                    }
                  />
                  <span>
                    {item.customerSupplied ? "CUSTOMER SUPPLIED" : "No"}
                  </span>
                </label>
                <input
                  aria-label="Shortage comments"
                  value={item.comments}
                  onChange={(event) =>
                    updateItem(item.id, { comments: event.target.value })
                  }
                  placeholder="Additional comments (optional)"
                />
                <button
                  className="icon-button"
                  aria-label="Delete shortage item"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {!job.shortages.length && (
              <div className="empty-table">
                No shortage items. Add one or upload an Excel list.
              </div>
            )}
          </div>
        </>
      )}
      {job.noShortageList && (
        <div className="no-shortage-complete">
          <CheckCircle2 size={18} /> Shortage List complete — no parts are
          outstanding.
        </div>
      )}
      {onOpen && (
        <button className="text-link shortage-open" onClick={onOpen}>
          Open full job workflow <ChevronRight size={16} />
        </button>
      )}
    </section>
  );
}

function WeeklyNotepad({
  week,
  onChange,
}: {
  week: WeeklyWorkWeek;
  onChange: (week: WeeklyWorkWeek) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const today = chicagoDateKey();
  const defaultDay = week.days.find((day) => day.date === today)?.date;
  const [selectedDate, setSelectedDate] = useState(
    defaultDay ?? week.days[0]?.date ?? "",
  );

  const selectedDay =
    week.days.find((day) => day.date === selectedDate) ?? week.days[0];
  const openTaskCount = week.days.reduce(
    (total, day) =>
      total + day.tasks.filter((task) => !task.complete).length,
    0,
  );

  function updateDay(
    date: string,
    update: (tasks: WeeklyTask[]) => WeeklyTask[],
  ) {
    onChange({
      ...week,
      days: week.days.map((day) =>
        day.date === date ? { ...day, tasks: update(day.tasks) } : day,
      ),
    });
  }

  function addTask(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !selectedDay) return;
    updateDay(selectedDay.date, (tasks) => [
      ...tasks,
      {
        id: makeId("weekly-task"),
        text,
        complete: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    setDraft("");
  }

  if (!open) {
    return (
      <button className="weekly-notepad-launcher" onClick={() => setOpen(true)}>
        <StickyNote size={19} />
        <span>Weekly Notes</span>
        {openTaskCount > 0 && <b>{openTaskCount}</b>}
      </button>
    );
  }

  return (
    <aside className="weekly-notepad" aria-label="Current week notepad">
      <header>
        <div>
          <span className="notepad-title">
            <StickyNote size={17} /> Current Week
          </span>
          <small>
            {dateLabel(week.weekStart)} – {dateLabel(week.weekEnd)}
          </small>
        </div>
        <button aria-label="Minimize weekly notepad" onClick={() => setOpen(false)}>
          <ChevronDown size={18} />
        </button>
      </header>
      <div className="weekly-notepad-body">
        <div className="notepad-days" role="tablist" aria-label="Work week">
          {week.days.map((day) => {
            const parsed = new Date(`${day.date}T12:00:00`);
            const complete = day.tasks.filter((task) => task.complete).length;
            return (
              <button
                className={`${selectedDay?.date === day.date ? "active" : ""} ${day.date === today ? "today" : ""}`}
                key={day.date}
                onClick={() => setSelectedDate(day.date)}
                role="tab"
                aria-selected={selectedDay?.date === day.date}
              >
                <span>
                  {parsed.toLocaleDateString("en-US", { weekday: "long" })}
                </span>
                <strong>
                  {parsed.toLocaleDateString("en-US", {
                    month: "numeric",
                    day: "numeric",
                  })}
                </strong>
                {day.tasks.length > 0 && (
                  <small>
                    {complete}/{day.tasks.length}
                  </small>
                )}
              </button>
            );
          })}
        </div>
        <div className="notepad-tasks">
          <div className="notepad-task-heading">
            <strong>To-do list</strong>
            <small>{selectedDay?.tasks.length ?? 0} items</small>
          </div>
          <div className="notepad-task-list">
            {selectedDay?.tasks.length ? (
              selectedDay.tasks.map((task) => (
                <div className={`notepad-task ${task.complete ? "complete" : ""}`} key={task.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={task.complete}
                      onChange={(event) =>
                        updateDay(selectedDay.date, (tasks) =>
                          tasks.map((item) =>
                            item.id === task.id
                              ? { ...item, complete: event.target.checked }
                              : item,
                          ),
                        )
                      }
                    />
                    <span>{task.text}</span>
                  </label>
                  <button
                    aria-label={`Delete ${task.text}`}
                    onClick={() =>
                      updateDay(selectedDay.date, (tasks) =>
                        tasks.filter((item) => item.id !== task.id),
                      )
                    }
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            ) : (
              <div className="notepad-empty">
                <CheckCircle2 size={23} />
                <span>No tasks for this day.</span>
              </div>
            )}
          </div>
          <form className="notepad-add" onSubmit={addTask}>
            <input
              aria-label="New weekly task"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Add a quick note or task…"
            />
            <button aria-label="Add task" disabled={!draft.trim()}>
              <Plus size={17} />
            </button>
          </form>
        </div>
      </div>
      <footer>
        Previous weeks move to <strong>Data &amp; Backup → Weekly Actions</strong>.
      </footer>
    </aside>
  );
}

function IntegrationsView({
  onExport,
  onExportBackup,
  onImportBackup,
  onOpenOldData,
  weeklyArchives,
}: {
  onExport: () => void;
  onExportBackup: () => void;
  onImportBackup: (event: ChangeEvent<HTMLInputElement>) => void;
  onOpenOldData: () => void;
  weeklyArchives: WeeklyWorkWeek[];
}) {
  return (
    <section className="view-stack">
      <div className="view-intro">
        <div>
          <h2>Data and Backup</h2>
          <p>
            Move job data and shortage lists between Krypton Solutions OOR and
            Microsoft Office.
          </p>
        </div>
      </div>
      <div className="integration-grid">
        <article className="panel integration-card complete-backup-card">
          <span className="integration-icon excel">
            <FileSpreadsheet />
          </span>
          <div>
            <small>Move everything to another computer</small>
            <h3>Complete Excel backup &amp; restore</h3>
            <p>
              Export all jobs, quotes, shortages, notes, tracking, completed
              records, assembly configurations, Project Families, and Weekly
              Actions. Import the same workbook on another computer to restore
              the exact saved data.
            </p>
          </div>
          <div className="backup-actions">
            <button className="button primary full" onClick={onExportBackup}>
              <Download size={16} /> Export complete backup
            </button>
            <label className="button secondary full backup-import-button">
              <Upload size={16} /> Import complete backup
              <input
                type="file"
                accept=".xlsx"
                onChange={onImportBackup}
                aria-label="Import complete Excel backup"
              />
            </label>
          </div>
          <p className="backup-warning">
            Import asks for confirmation before replacing data on this computer.
          </p>
        </article>
        <article className="panel integration-card legacy-booking-card">
          <span className="integration-icon old-data">
            <FolderKanban />
          </span>
          <div>
            <small>Multiple jobs · review required</small>
            <h3>OLD DATA Production Booking</h3>
            <p>
              Upload an old Excel register or screenshot. Every row becomes a
              separate job review page, and no job is booked until you confirm
              it.
            </p>
          </div>
          <button className="button primary full" onClick={onOpenOldData}>
            <Upload size={16} /> New Project Entry
          </button>
        </article>
        <article className="panel integration-card weekly-actions-card">
          <span className="integration-icon weekly-actions-icon">
            <CheckCircle2 />
          </span>
          <div>
            <small>Archived automatically</small>
            <h3>Weekly Actions</h3>
            <p>
              Prior Monday–Friday notepad entries are stored here when a new
              week begins.
            </p>
          </div>
          <div className="weekly-archive-list">
            {weeklyArchives.length ? (
              weeklyArchives.map((week) => (
                <details key={week.weekStart}>
                  <summary>
                    <span>
                      {dateLabel(week.weekStart)} – {dateLabel(week.weekEnd)}
                    </span>
                    <b>
                      {week.days.reduce((total, day) => total + day.tasks.length, 0)}
                    </b>
                  </summary>
                  <div className="weekly-archive-days">
                    {week.days.map((day) => (
                      <section key={day.date}>
                        <strong>
                          {new Date(`${day.date}T12:00:00`).toLocaleDateString(
                            "en-US",
                            { weekday: "long", month: "numeric", day: "numeric" },
                          )}
                        </strong>
                        {day.tasks.length ? (
                          day.tasks.map((task) => (
                            <p className={task.complete ? "complete" : ""} key={task.id}>
                              {task.complete ? "✓" : "○"} {task.text}
                            </p>
                          ))
                        ) : (
                          <p className="empty-day">No actions</p>
                        )}
                      </section>
                    ))}
                  </div>
                </details>
              ))
            ) : (
              <div className="weekly-archive-empty">
                Your first completed week will appear here.
              </div>
            )}
          </div>
        </article>
        <article className="panel integration-card">
          <span className="integration-icon excel">
            <FileSpreadsheet />
          </span>
          <div>
            <small>Job register</small>
            <h3>Excel export</h3>
            <p>
              Download all commercial and aerospace job fields as a formatted
              .xlsx workbook.
            </p>
          </div>
          <button className="button primary full" onClick={onExport}>
            <Download size={16} /> Export jobs
          </button>
        </article>
        <article className="panel integration-card">
          <span className="integration-icon excel">
            <Upload />
          </span>
          <div>
            <small>Shortage lists</small>
            <h3>Excel and screenshot upload</h3>
            <p>
              Upload .xlsx, .xls, .csv, or a clear screenshot. Missing scanned
              values are highlighted in red for manual entry.
            </p>
          </div>
        </article>
      </div>
      <div className="privacy-note">
        <Settings2 size={18} />
        <span>
          <strong>Business-day schedule:</strong> calculated dates skip weekends,
          the listed U.S. holidays, and Christmas Eve. Krypton Dock starts from
          the later of PCB availability and the longest shortage lead time, then
          adds assembly and selected special-process turn times.
        </span>
      </div>
    </section>
  );
}

function AssemblyConfigurationsView({
  recipes,
  onChange,
  notify,
}: {
  recipes: AssemblyRecipe[];
  onChange: (recipes: AssemblyRecipe[]) => void;
  notify: (message: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [outputLevel, setOutputLevel] =
    useState<AssemblyRecipe["outputLevel"]>("CCA");
  const [outputPn, setOutputPn] = useState("");
  const [outputRev, setOutputRev] = useState("");
  const [requirements, setRequirements] = useState<AssemblyRequirement[]>([
    {
      id: makeId("requirement"),
      inputLevel: "PCBA",
      pn: "",
      rev: "",
      quantityPerAssembly: 1,
    },
  ]);

  function clearForm(level: AssemblyRecipe["outputLevel"] = outputLevel) {
    setEditingId(null);
    setName("");
    setOutputPn("");
    setOutputRev("");
    setRequirements([
      {
        id: makeId("requirement"),
        inputLevel: level === "CCA" ? "PCBA" : "CCA",
        pn: "",
        rev: "",
        quantityPerAssembly: 1,
      },
    ]);
  }

  function changeLevel(level: AssemblyRecipe["outputLevel"]) {
    setOutputLevel(level);
    setRequirements((current) =>
      current.map((item) => ({
        ...item,
        inputLevel: level === "CCA" ? "PCBA" : "CCA",
      })),
    );
  }

  function updateRequirement(
    id: string,
    change: Partial<AssemblyRequirement>,
  ) {
    setRequirements((current) =>
      current.map((item) => (item.id === id ? { ...item, ...change } : item)),
    );
  }

  function save(event: FormEvent) {
    event.preventDefault();
    const cleanRequirements = requirements
      .filter((item) => item.pn.trim())
      .map((item) => ({
        ...item,
        inputLevel: outputLevel === "CCA" ? ("PCBA" as const) : ("CCA" as const),
        pn: item.pn.trim(),
        rev: item.rev.trim(),
        quantityPerAssembly: Math.max(1, Number(item.quantityPerAssembly) || 1),
      }));
    if (!name.trim() || !outputPn.trim() || !cleanRequirements.length) {
      notify("Enter a configuration name, output PN, and at least one required input PN.");
      return;
    }
    const recipe: AssemblyRecipe = {
      id: editingId ?? makeId("assembly-recipe"),
      name: name.trim(),
      outputLevel,
      outputPn: outputPn.trim(),
      outputRev: outputRev.trim(),
      requirements: cleanRequirements,
      createdAt:
        recipes.find((item) => item.id === editingId)?.createdAt ??
        new Date().toISOString(),
    };
    onChange(
      editingId
        ? recipes.map((item) => (item.id === editingId ? recipe : item))
        : [recipe, ...recipes],
    );
    notify(`${outputLevel} configuration saved.`);
    clearForm(outputLevel);
  }

  function edit(recipe: AssemblyRecipe) {
    setEditingId(recipe.id);
    setName(recipe.name);
    setOutputLevel(recipe.outputLevel);
    setOutputPn(recipe.outputPn);
    setOutputRev(recipe.outputRev);
    setRequirements(recipe.requirements.map((item) => ({ ...item })));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="view-stack assembly-config-view">
      <div className="view-intro">
        <div>
          <h2>Assembly Configuration</h2>
          <p>
            Define how many PCBAs make one CCA and how many CCAs make one LRU.
            Configurations are optional and remain available for future Project Families.
          </p>
        </div>
      </div>
      <form className="panel assembly-config-form" onSubmit={save}>
        <div className="assembly-config-heading">
          <div>
            <p className="section-kicker">Many-to-one build recipe</p>
            <h3>{editingId ? "Edit configuration" : "New configuration"}</h3>
          </div>
          {editingId && (
            <button type="button" className="button ghost small" onClick={() => clearForm(outputLevel)}>
              Cancel edit
            </button>
          )}
        </div>
        <div className="assembly-level-picker">
          {(["CCA", "LRU"] as AssemblyRecipe["outputLevel"][]).map((level) => (
            <label className={outputLevel === level ? "selected" : ""} key={level}>
              <input
                type="radio"
                checked={outputLevel === level}
                onChange={() => changeLevel(level)}
              />
              <strong>{level} configuration</strong>
              <small>
                {level === "CCA" ? "PCBAs feed this CCA" : "CCAs feed this LRU"}
              </small>
            </label>
          ))}
        </div>
        <div className="assembly-output-grid">
          <label>
            Configuration Name
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Example: HVDU LRU" />
          </label>
          <label>
            Output {outputLevel} PN#
            <input value={outputPn} onChange={(event) => setOutputPn(event.target.value)} placeholder="Finished assembly PN" />
          </label>
          <label>
            Output Rev <span>(optional)</span>
            <input value={outputRev} onChange={(event) => setOutputRev(event.target.value)} />
          </label>
        </div>
        <div className="assembly-requirements-editor">
          <div className="assembly-requirements-title">
            <div>
              <strong>Required {outputLevel === "CCA" ? "PCBAs" : "CCAs"}</strong>
              <small>Quantity is required for one finished {outputLevel}.</small>
            </div>
            <button
              type="button"
              className="button secondary small"
              onClick={() =>
                setRequirements((current) => [
                  ...current,
                  {
                    id: makeId("requirement"),
                    inputLevel: outputLevel === "CCA" ? "PCBA" : "CCA",
                    pn: "",
                    rev: "",
                    quantityPerAssembly: 1,
                  },
                ])
              }
            >
              <Plus size={15} /> Add different PN
            </button>
          </div>
          <div className="assembly-requirement-head">
            <span>Input level</span><span>Required PN#</span><span>Rev</span><span>QTY per {outputLevel}</span><span />
          </div>
          {requirements.map((requirement) => (
            <div className="assembly-requirement-row" key={requirement.id}>
              <strong>{outputLevel === "CCA" ? "PCBA" : "CCA"}</strong>
              <input value={requirement.pn} onChange={(event) => updateRequirement(requirement.id, { pn: event.target.value })} placeholder="Part number" />
              <input value={requirement.rev} onChange={(event) => updateRequirement(requirement.id, { rev: event.target.value })} placeholder="Any" />
              <input className={requirement.quantityPerAssembly === "" ? "missing-input" : ""} type="text" inputMode="numeric" value={requirement.quantityPerAssembly} onChange={(event) => updateRequirement(requirement.id, { quantityPerAssembly: event.target.value === "" ? "" : Math.max(1, Number(event.target.value) || 1) })} />
              <button type="button" className="icon-button" aria-label="Remove requirement" disabled={requirements.length === 1} onClick={() => setRequirements((current) => current.filter((item) => item.id !== requirement.id))}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button className="button primary"><Check size={16} /> Save configuration</button>
        </div>
      </form>
      <div className="assembly-config-list">
        {recipes.map((recipe) => (
          <article className="panel assembly-recipe-card" key={recipe.id}>
            <header>
              <span className={`build-level-badge ${recipe.outputLevel.toLowerCase()}`}>{recipe.outputLevel}</span>
              <div>
                <h3>{recipe.name}</h3>
                <p>Output: {recipe.outputPn}{recipe.outputRev ? ` Rev ${recipe.outputRev}` : ""}</p>
              </div>
              <div className="assembly-recipe-actions">
                <button className="button secondary small" onClick={() => edit(recipe)}>Edit</button>
                <button className="icon-button" aria-label={`Delete ${recipe.name}`} onClick={() => {
                  if (!window.confirm(`Delete the ${recipe.name} configuration? Existing jobs will keep their saved input requirements.`)) return;
                  onChange(recipes.filter((item) => item.id !== recipe.id));
                  notify("Assembly configuration deleted.");
                }}><Trash2 size={16} /></button>
              </div>
            </header>
            <div className="recipe-flow">
              {recipe.requirements.map((requirement) => (
                <span key={requirement.id}>
                  <b>{requirement.quantityPerAssembly}×</b> {requirement.inputLevel} {requirement.pn}{requirement.rev ? ` Rev ${requirement.rev}` : ""}
                </span>
              ))}
              <ChevronRight size={18} />
              <strong>1× {recipe.outputLevel} {recipe.outputPn}</strong>
            </div>
          </article>
        ))}
        {!recipes.length && (
          <div className="panel empty-table">No assembly configurations saved yet.</div>
        )}
      </div>
    </section>
  );
}

/* Previous project form retained here for migration reference.
function NewJobModal({
  onClose,
  onCreate,
  recipes,
  jobs,
}: {
  onClose: () => void;
  onCreate: (job: Job | Job[]) => void;
  recipes: AssemblyRecipe[];
  jobs: Job[];
}) {
  const [division, setDivision] = useState<Division>("Commercial");
  const [polymerics, setPolymerics] = useState(false);
  const [externalTesting, setExternalTesting] = useState(false);
  const [selectedPoly, setSelectedPoly] = useState<PolymericsOption[]>([]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const createdDate = String(data.get("createdDate"));
    const noteText = String(data.get("initialNote") || "").trim();
    onCreate({
      id: makeId("job"),
      division,
      customer: String(data.get("customer")),
      jobNumber: String(data.get("jobNumber")),
      ksid: String(data.get("ksid")),
      pnName: String(data.get("pnName")),
      rev: String(data.get("rev")),
      projectType: String(data.get("projectType")) as ProjectType,
      contact: String(data.get("contact")),
      dueDate: String(data.get("dueDate")),
      poNumber: String(data.get("poNumber")),
      quoteNumber: String(data.get("quoteNumber")),
      status: String(data.get("status")) as JobStatus,
      specialProcesses: [
        polymerics ? "Polymerics" : "",
        externalTesting ? "External Testing" : "",
      ].filter(Boolean),
      polymericsOptions: selectedPoly,
      createdDate,
      confirmedDate: String(data.get("confirmedDate") || ""),
      allPartsReceivedDate: "",
      smtDays: Number(data.get("smtDays") || 1),
      shortages: [],
      notes: noteText
        ? [
            {
              id: makeId("note"),
              date: createdDate,
              createdAt: new Date().toISOString(),
              text: noteText,
            },
          ]
        : [],
    });
  }
  return (
    <div
      className="modal-layer"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <form className="modal-card new-job-modal" onSubmit={submit}>
        <div className="modal-header">
          <div>
            <p className="section-kicker">Production booking</p>
            <h2>New project</h2>
            <p>
              Create the job, customer folder, manufacturing status, and
              workflow timelines.
            </p>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Close"
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        <fieldset className="division-picker">
          <legend>Business section</legend>
          {(["Commercial", "Aerospace"] as Division[]).map((item) => (
            <label key={item} className={division === item ? "selected" : ""}>
              <input
                type="radio"
                checked={division === item}
                onChange={() => setDivision(item)}
              />
              <span className={`division-icon ${item.toLowerCase()}`}>
                {item === "Commercial" ? <Factory /> : <Gauge />}
              </span>
              <span>
                <strong>{item}</strong>
                <small>Creates the job in the {item} section</small>
              </span>
            </label>
          ))}
        </fieldset>
        <div className="job-form-grid">
          <label className="wide">
            Customer Sub-Category / Folder
            <input name="customer" required placeholder="Example: Fujitsu" />
          </label>
          <label>
            Job #<input name="jobNumber" required />
          </label>
          <label>
            KSID
            <input name="ksid" required />
          </label>
          <label className="wide">
            PN Name
            <input
              name="pnName"
              required
              placeholder="Part number and description"
            />
          </label>
          <label>
            Rev
            <input name="rev" required />
          </label>
          <label>
            Project Type
            <select name="projectType">
              {projectTypes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Contact
            <input name="contact" required />
          </label>
          <label>
            Due Date
            <input name="dueDate" type="date" required />
          </label>
          <label>
            PO#
            <input name="poNumber" />
          </label>
          <label>
            Quote#
            <input name="quoteNumber" />
          </label>
          <label>
            Status
            <select name="status">
              {jobStatuses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Project Creation Date
            <input
              name="createdDate"
              type="date"
              defaultValue={chicagoDateKey()}
              required
            />
          </label>
          <label>
            Project Confirmation Date
            <input name="confirmedDate" type="date" />
          </label>
          <label>
            SMT Process Turn Time
            <select name="smtDays" defaultValue="2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((day) => (
                <option key={day} value={day}>
                  {day} day{day === 1 ? "" : "s"}
                </option>
              ))}
            </select>
          </label>
        </div>
        <fieldset className="process-picker">
          <legend>Special Processes</legend>
          <label>
            <input
              type="checkbox"
              checked={polymerics}
              onChange={(event) => setPolymerics(event.target.checked)}
            />{" "}
            Polymerics
          </label>
          <label>
            <input
              type="checkbox"
              checked={externalTesting}
              onChange={(event) => setExternalTesting(event.target.checked)}
            />{" "}
            External Testing
          </label>
          <label>
            <input
              type="checkbox"
              checked={faiReport}
              onChange={(event) => setFaiReport(event.target.checked)}
            />{" "}
            FAI Report
          </label>
          <label>
            <input
              type="checkbox"
              checked={otherProcess}
              onChange={(event) => {
                setOtherProcess(event.target.checked);
                if (!event.target.checked)
                  setMissingFields((current) => {
                    const next = new Set(current);
                    next.delete("otherSpecialProcess");
                    next.delete("otherSpecialProcessTurnDays");
                    return next;
                  });
              }}
            />{" "}
            Others
          </label>
          {polymerics && (
            <div className="polymerics-options">
              <span>Polymerics options</span>
              {polymericsOptions.map((item) => (
                <label key={item}>
                  <input
                    type="checkbox"
                    checked={selectedPoly.includes(item)}
                    onChange={(event) =>
                      setSelectedPoly((current) =>
                        event.target.checked
                          ? [...current, item]
                          : current.filter((value) => value !== item),
                      )
                    }
                  />{" "}
                  {item}
                </label>
              ))}
            </div>
          )}
        </fieldset>
        <label className="initial-note">
          Initial dated note <span>(optional)</span>
          <textarea
            name="initialNote"
            rows={3}
            placeholder="Add the first booking update…"
          />
        </label>
        <div className="timeline-preview">
          <CalendarClock size={18} />
          <span>
            <strong>Automatic target dates</strong>
            <small>
              Shortage list: +3 days · Fabrication dock: +3 days from
              confirmation · Kitting: +1 day after all parts received · SMT:
              selected duration
            </small>
          </span>
        </div>
        <div className="modal-actions">
          <button type="button" className="button ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary">
            <Plus size={16} /> Create job
          </button>
        </div>
      </form>
    </div>
  );
}
*/

type JobDraft = {
  customer: string;
  jobNumber: string;
  ksid: string;
  pnName: string;
  pn: string;
  rev: string;
  quantity: string;
  projectType: "" | ProjectType;
  contact: string;
  customerDueDate: string;
  poNumber: string;
  quoteNumber: string;
  status: "" | JobStatus;
  createdDate: string;
  fabricationTurnDays: string;
  assemblyTurnDays: string;
  polymericsTurnDays: string;
  externalTestingTurnDays: string;
  smtDays: string;
  otherSpecialProcess: string;
  otherSpecialProcessTurnDays: string;
  initialNote: string;
};

type LinkedBuildDraft = {
  id: string;
  level: BuildLevel;
  recipeId: string;
  fields: JobDraft;
};

type LegacyImportRow = {
  id: string;
  sourceRow: number;
  division: "" | Division;
  fields: JobDraft;
  booked: boolean;
};

const requiredDraftFields: (keyof JobDraft)[] = [
  "customer",
  "jobNumber",
  "ksid",
  "pnName",
  "pn",
  "rev",
  "quantity",
  "projectType",
  "contact",
  "status",
  "createdDate",
  "fabricationTurnDays",
  "assemblyTurnDays",
  "smtDays",
];

const legacyFieldLabels: Partial<Record<keyof JobDraft, string>> = {
  customer: "Customer folder",
  jobNumber: "Job #",
  ksid: "KSID",
  pnName: "PN Name",
  pn: "PN",
  rev: "Rev",
  quantity: "QTY",
  projectType: "Project Type",
  contact: "Contact",
  status: "Status",
  createdDate: "Project Creation Date",
  fabricationTurnDays: "Fabrication Turn Time",
  assemblyTurnDays: "Assembly Turn Time",
  smtDays: "SMT Turn Time",
};

function emptyLegacyDraft(): JobDraft {
  return {
    customer: "",
    jobNumber: "",
    ksid: "",
    pnName: "",
    pn: "",
    rev: "",
    quantity: "",
    projectType: "",
    contact: "",
    customerDueDate: "",
    poNumber: "",
    quoteNumber: "",
    status: "",
    createdDate: "",
    fabricationTurnDays: "",
    assemblyTurnDays: "",
    polymericsTurnDays: "",
    externalTestingTurnDays: "",
    smtDays: "",
    otherSpecialProcess: "",
    otherSpecialProcessTurnDays: "",
    initialNote: "",
  };
}

function linkedBuildDraft(level: BuildLevel, inherited: JobDraft): LinkedBuildDraft {
  return {
    id: makeId(`${level.toLowerCase()}-draft`),
    level,
    recipeId: "",
    fields: {
      ...emptyLegacyDraft(),
      customer: inherited.customer,
      projectType: level === "PCBA" ? "New" : "Assembly Only",
      contact: inherited.contact,
      customerDueDate: inherited.customerDueDate,
      poNumber: inherited.poNumber,
      quoteNumber: inherited.quoteNumber,
      status:
        level === "PCBA"
          ? "Waiting on Parts"
          : level === "CCA"
            ? "Waiting for PCBA"
            : "Waiting for CCAs",
      createdDate: inherited.createdDate || chicagoDateKey(),
      fabricationTurnDays: level === "PCBA" ? "0" : "0",
      assemblyTurnDays: inherited.assemblyTurnDays || "1",
      smtDays: level === "PCBA" ? inherited.smtDays || "2" : "1",
    },
  };
}

function cleanImportedCell(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/^[‘’“”'"|`]+/, "")
    .replace(/[‘’“”'"|`]+$/, "");
}

function cleanImportedKsid(value: unknown) {
  const withoutLabel = cleanImportedCell(value)
    .replace(/^\s*KSID\s*(?:#|No\.?)?\s*[:=\-]?\s*/i, "")
    .replace(/^\s*#+\s*/, "");
  const compact = withoutLabel.replace(/\s+/g, "");
  return compact.match(/[A-Z0-9][A-Z0-9-]*/i)?.[0] ?? "";
}

function matchingProjectType(value: unknown): "" | ProjectType {
  const normalized = normalizeHeading(cleanImportedCell(value));
  return (
    projectTypes.find((item) => normalizeHeading(item) === normalized) ?? ""
  );
}

function matchingJobStatus(value: unknown): "" | JobStatus {
  const normalized = normalizeHeading(cleanImportedCell(value));
  return jobStatuses.find((item) => normalizeHeading(item) === normalized) ?? "";
}

function legacyRowFromRecord(
  record: Record<string, unknown>,
  sourceRow: number,
): LegacyImportRow | null {
  const row = Object.fromEntries(
    Object.entries(record).map(([key, value]) => [normalizeHeading(key), value]),
  );
  const value = (...keys: string[]) =>
    keys
      .map((key) => row[normalizeHeading(key)])
      .find((item) => item !== undefined && cleanImportedCell(item)) ?? "";
  const divisionValue = cleanImportedCell(value("Division", "Business Section"));
  const fields: JobDraft = {
    ...emptyLegacyDraft(),
    customer: cleanImportedCell(
      value(
        "Customer Sub-Category / Folder",
        "Customer Sub-Category",
        "Customer Folder",
        "Customer",
        "Customer Name",
      ),
    ),
    jobNumber: cleanImportedCell(value("Job #", "Job Number", "Job No")),
    ksid: cleanImportedKsid(value("KSID")),
    pnName: cleanImportedCell(value("PN Name", "Part Name", "Job Name")),
    pn: cleanImportedCell(value("PN", "PN#", "Part Number", "Part #")),
    rev: cleanImportedCell(value("REV", "Rev", "Revision")),
    quantity: cleanImportedCell(value("QTY", "Quantity")),
    projectType: matchingProjectType(
      value("Project Type", "Type", "Job Type", "Job Types"),
    ),
    contact: cleanImportedCell(value("Contact", "POC", "Point of Contact")),
    customerDueDate: normalizeUploadedDate(
      value("Customer Due Date", "Due Date"),
    ),
    poNumber: cleanImportedCell(value("PO#", "PO Number", "PO")),
    quoteNumber: cleanImportedCell(
      value("Quote#", "Quote Number", "Quote"),
    ),
    status: matchingJobStatus(value("Status")),
    createdDate: normalizeUploadedDate(
      value("Project Creation Date", "Creation Date", "Booked Date"),
    ),
    fabricationTurnDays:
      cleanImportedCell(value("Fabrication Turn Time", "Fab Turn Time")).match(
        /\d+/,
      )?.[0] ?? "",
    assemblyTurnDays:
      cleanImportedCell(value("Assembly Turn Time")).match(/\d+/)?.[0] ?? "",
    smtDays:
      cleanImportedCell(value("SMT Turn Time", "SMT Days")).match(/\d+/)?.[0] ??
      "",
    initialNote: cleanImportedCell(value("Initial Note", "Notes", "Note")),
  };
  if (
    ![
      fields.customer,
      fields.jobNumber,
      fields.ksid,
      fields.pn,
      fields.rev,
      fields.quantity,
      fields.projectType,
      fields.customerDueDate,
    ].some(Boolean)
  ) {
    return null;
  }
  return {
    id: makeId("legacy-row"),
    sourceRow,
    division: /aerospace/i.test(divisionValue)
      ? "Aerospace"
      : /commercial/i.test(divisionValue)
        ? "Commercial"
        : "",
    fields,
    booked: false,
  };
}

function legacyMissingFields(row: LegacyImportRow) {
  return requiredDraftFields.filter(
    (key) => !cleanImportedCell(row.fields[key]),
  );
}

type OcrWord = {
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

function wordsFromTsv(tsv: string) {
  return tsv
    .split(/\r?\n/)
    .slice(1)
    .map((line) => {
      const cells = line.split("\t");
      if (cells[0] !== "5" || !cells.slice(11).join("\t").trim()) return null;
      return {
        text: cleanImportedCell(cells.slice(11).join("\t")),
        left: Number(cells[6]),
        top: Number(cells[7]),
        width: Number(cells[8]),
        height: Number(cells[9]),
      } satisfies OcrWord;
    })
    .filter((word): word is OcrWord => Boolean(word));
}

function parseBookingQuantityFromTsv(tsv: string) {
  const words = wordsFromTsv(tsv);
  const quantityLabel = words.find((word) => {
    const normalized = normalizeHeading(word.text);
    return normalized === "quantity" || /^q[a-z]?y$/.test(normalized);
  });
  if (!quantityLabel) return "";
  const labelCenter = quantityLabel.top + quantityLabel.height / 2;
  return (
    words
      .filter((word) => {
        const center = word.top + word.height / 2;
        return (
          word.left > quantityLabel.left + quantityLabel.width + 4 &&
          Math.abs(center - labelCenter) <= Math.max(12, quantityLabel.height)
        );
      })
      .sort((a, b) => a.left - b.left)
      .map((word) => cleanImportedCell(word.text).match(/^\d+$/)?.[0] ?? "")
      .find(Boolean) ?? ""
  );
}

function parseLegacyRowsFromTsv(tsv: string) {
  const words = wordsFromTsv(tsv);
  const ksidHeader = words.find(
    (word) => normalizeHeading(word.text) === "ksid",
  );
  if (!ksidHeader) return [] as LegacyImportRow[];
  const headerWords = words.filter(
    (word) => {
      // Booking screenshots frequently wrap headings such as "PN Name" and
      // "Scheduled Ship Date" onto two lines. Keep the whole header band,
      // rather than only words sharing KSID's exact baseline.
      const tolerance = Math.max(28, ksidHeader.height * 2.2);
      return (
        word.top >= ksidHeader.top - tolerance &&
        word.top <= ksidHeader.top + Math.max(10, ksidHeader.height * 0.6)
      );
    },
  );
  const sortedHeaders = headerWords
    .filter((word) => {
      const normalized = normalizeHeading(word.text);
      return normalized.length > 1 || word.text.includes("#");
    })
    .sort((a, b) => a.left - b.left);
  const headerAnchor = (aliases: string[]) => {
    const normalizedAliases = aliases.map(normalizeHeading);
    for (let start = 0; start < sortedHeaders.length; start += 1) {
      let combined = "";
      for (
        let end = start;
        end < Math.min(start + 4, sortedHeaders.length);
        end += 1
      ) {
        const previous = end > start ? sortedHeaders[end - 1] : undefined;
        const current = sortedHeaders[end];
        if (
          previous &&
          current.left - (previous.left + previous.width) >
            Math.max(45, current.height * 3)
        ) {
          break;
        }
        combined += normalizeHeading(current.text);
        if (normalizedAliases.includes(combined)) return current === sortedHeaders[start]
          ? current.left
          : sortedHeaders[start].left;
      }
    }
    return NaN;
  };
  const anchors = [
    {
      field: "Customer Sub-Category / Folder",
      left: headerAnchor([
        "Customer Sub-Category / Folder",
        "Customer Sub-Category",
        "Customer Folder",
        "Customer Name",
        "Customer",
      ]),
    },
    {
      field: "Job #",
      left: headerAnchor(["Job Number", "Job #", "Job No"]),
    },
    { field: "KSID", left: ksidHeader.left },
    {
      field: "PN Name",
      left: headerAnchor(["PN Name", "Part Name", "Job Name"]),
    },
    {
      field: "Project Type",
      left: headerAnchor(["Project Type", "Job Type", "Job Types", "Type"]),
    },
    {
      field: "PN",
      left: headerAnchor(["PN", "PN#", "Part #", "Part Number"]),
    },
    { field: "REV", left: headerAnchor(["REV", "Revision"]) },
    { field: "QTY", left: headerAnchor(["QTY", "Quantity"]) },
    {
      field: "Due Date",
      left: headerAnchor([
        "Customer Due Date",
        "Scheduled Ship Date",
        "Schedule Ship Date",
        "Scheduled Ship",
        "Due Date",
      ]),
    },
    {
      field: "Contact",
      left: headerAnchor(["POC", "Point of Contact", "Contact"]),
    },
    {
      field: "Quote#",
      left: headerAnchor(["Quote#", "Quote Number", "Quote"]),
    },
    { field: "Status", left: headerAnchor(["Status"]) },
  ]
    .filter((anchor) => Number.isFinite(anchor.left))
    .sort((a, b) => a.left - b.left);
  if (anchors.length < 6) return [] as LegacyImportRow[];
  const headerBottom = Math.max(
    ...headerWords.map((word) => word.top + word.height),
  );
  const dataWords = words
    .filter((word) => word.top + word.height / 2 > headerBottom + 1)
    .sort((a, b) => a.top - b.top || a.left - b.left);
  const grouped: OcrWord[][] = [];
  for (const word of dataWords) {
    const center = word.top + word.height / 2;
    const current = grouped.at(-1);
    const currentCenter = current
      ? current.reduce((sum, item) => sum + item.top + item.height / 2, 0) /
        current.length
      : -999;
    if (!current || Math.abs(center - currentCenter) > Math.max(7, word.height)) {
      grouped.push([word]);
    } else {
      current.push(word);
    }
  }
  return grouped
    .map((line, index) => {
      const cells = new Map<string, OcrWord[]>();
      line.forEach((word) => {
        const center = word.left + word.width / 2;
        const column = anchors.reduce(
          (matched, anchor, columnIndex) =>
            center >= anchor.left ? columnIndex : matched,
          0,
        );
        const field = anchors[Math.min(anchors.length - 1, column)].field;
        cells.set(field, [...(cells.get(field) ?? []), word]);
      });
      const record = Object.fromEntries(
        anchors.map(({ field }) => [
          field,
          (cells.get(field) ?? [])
          .sort((a, b) => a.left - b.left)
          .map((word) => word.text)
          .join(" ")
          .trim(),
        ]),
      );
      return legacyRowFromRecord(record, index + 2);
    })
    .filter((row): row is LegacyImportRow => Boolean(row));
}

function parseLegacyRowsFromText(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line &&
        !/customer.*job.*ksid.*(?:pn|part).*rev.*project.*due/i.test(line),
    )
    .map((line, index) => {
      const dateMatch = line.match(
        /\b(?:\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\b/,
      );
      if (!dateMatch) return null;
      const withoutDate = line.replace(dateMatch[0], "").trim();
      const projectType = [...projectTypes]
        .sort((a, b) => b.length - a.length)
        .find((type) =>
          new RegExp(`${type.replaceAll(" ", "\\s+")}$`, "i").test(withoutDate),
        );
      if (!projectType) return null;
      const prefix = withoutDate
        .replace(
          new RegExp(`${projectType.replaceAll(" ", "\\s+")}$`, "i"),
          "",
        )
        .trim();
      const tokens = prefix.split(/\s+/).map(cleanImportedCell).filter(Boolean);
      if (tokens.length < 5) return null;
      return legacyRowFromRecord(
        {
          "Customer Sub-Category / Folder": tokens
            .slice(0, tokens.length - 4)
            .join(" "),
          "Job #": tokens.at(-4),
          KSID: tokens.at(-3),
          PN: tokens.at(-2),
          REV: tokens.at(-1),
          "Project Type": projectType,
          "Due Date": dateMatch[0],
        },
        index + 2,
      );
    })
    .filter((row): row is LegacyImportRow => Boolean(row));
}

function normalizeHeading(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeUploadedDate(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const match = text.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/);
  if (!match) return "";
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${year}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;
}

function extractOcrValue(text: string, labels: string[]) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const isTableHeader = (line: string) => {
    const headerSignals = [
      /\bksid\b/i,
      /\b(?:pn|part\s*number)\b/i,
      /\brev(?:ision)?\b/i,
      /project\s*type/i,
      /(?:due\s*date|schedul(?:ed|e)\s*ship(?:\s*date)?)/i,
    ];
    return headerSignals.filter((pattern) => pattern.test(line)).length >= 3;
  };

  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const expression = new RegExp(
      `^${escaped}(?:\\s*[:=]\\s*|\\s+)(.+)$`,
      "i",
    );
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (isTableHeader(line)) continue;
      const found = line.match(expression);
      if (found?.[1]) return found[1].trim();
      if (new RegExp(`^${escaped}\\s*[:=]?$`, "i").test(line)) {
        const nextLine = lines[index + 1];
        if (nextLine && !isTableHeader(nextLine)) return nextLine.trim();
      }
    }
  }
  return "";
}

function parseBookingScreenshotLabels(text: string): Partial<JobDraft> {
  const normalized = text.replace(/[|]/g, " ").replace(/[–—]/g, "-");
  const capture = (pattern: RegExp) =>
    cleanImportedCell(normalized.match(pattern)?.[1] ?? "");

  // These patterns cover email subject/summary lines as well as labeled
  // booking fields. They intentionally require the field label so unrelated
  // numbers in dates, timestamps, or message text are not imported.
  return {
    poNumber: capture(/\bPO\s*(?:#|No\.?|Number)?\s*[:=\-]?\s*(\d{4,})\b/i),
    quoteNumber: capture(
      /\bQuote\s*(?:#|No\.?|Number)?\s*[:=\-]?\s*(\d{3,})\b/i,
    ),
    jobNumber: capture(
      /\bJob\s*(?:#|No\.?|Number)?\s*[:=\-]?\s*(\d{4,})\b/i,
    ),
    ksid: cleanImportedKsid(
      capture(/\bKSID\s*(?:#|No\.?)?\s*[:=\-]?\s*(\d{4,})\b/i),
    ),
    quantity: capture(/\b(?:QTY|Quantity)\s*[:=\-]?\s*(\d+)\b/i),
    pnName: capture(
      /\b(?:PN\s*Name|Part\s*Name|Job\s*Name)\s*[:=\-]?\s*([^\n\r]+?)(?=\s{2,}|\s+PN\s*(?:#|No\.?|Number)\b|$)/i,
    ),
    pn: capture(
      /\b(?:PN(?!\s*Name\b)|Part\s*(?:#|No\.?|Number))\s*(?:#|No\.?)?\s*[:=\-]?\s*([A-Z0-9][A-Z0-9._\-/]*)\b/i,
    ),
    rev: capture(/\bREV(?:ision)?\s*[:=\-]?\s*([A-Z0-9.-]+)\b/i),
    customerDueDate: normalizeUploadedDate(
      capture(
        /\b(?:Customer\s+Due\s+Date|Scheduled?\s+Ship(?:\s+Date)?|Due\s+Date)\s*[:=\-]?\s*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\b/i,
      ),
    ),
  };
}

function parseBookingProjectName(text: string): Pick<
  Partial<JobDraft>,
  "pnName" | "pn" | "rev"
> {
  const normalized = text.replace(/[|]/g, " ").replace(/[–—]/g, "-");
  const projectLine = normalized.match(
    /(?:^|\n)\s*PROJECT\s*NAME\s*[:=\-]?\s*([^\n\r]+)/i,
  )?.[1];
  const subjectPn = normalized.match(
    /\bQuote\s*\d+\s*-\s*([A-Z0-9][A-Z0-9._\-/]*\d[A-Z0-9._\-/]*)\s*-\s*Job\b/i,
  )?.[1];
  if (!projectLine) {
    return { pn: cleanImportedCell(subjectPn) };
  }

  const [nameSide, ...partSegments] = projectLine.split(/\s*\/\s*/);
  const partSide = partSegments.join("/").trim();
  const partMatch = partSide.match(
    /^([A-Z0-9][A-Z0-9._\-/]*\d[A-Z0-9._\-/]*?)(?:\s+(?:REV(?:ision)?\s*)?([A-Z0-9.-]{1,8}))?\s*$/i,
  );
  return {
    pnName: cleanImportedCell(nameSide),
    pn: cleanImportedCell(partMatch?.[1] || subjectPn),
    rev: cleanImportedCell(partMatch?.[2]),
  };
}

function firstPlausibleOcrValue(
  values: Array<unknown>,
  isPlausible: (value: string) => boolean,
) {
  return values
    .map(cleanImportedCell)
    .find((value) => value && isPlausible(value)) ?? "";
}

function plausiblePnName(value: string) {
  const normalized = normalizeHeading(value);
  return (
    /[a-z]/i.test(value) &&
    !/^(?:pnname|partname|jobname|projecttype|pn|rev|qty|quantity)$/i.test(
      normalized,
    ) &&
    value.length <= 100
  );
}

function plausiblePn(value: string) {
  const compact = value.replace(/\s+/g, "");
  return (
    /[a-z0-9]/i.test(compact) &&
    /\d/.test(compact) &&
    !/^(?:pn|rev|qty|quantity|projecttype)$/i.test(normalizeHeading(compact)) &&
    compact.length >= 4 &&
    compact.length <= 64
  );
}

function plausibleRev(value: string) {
  const compact = value.replace(/\s+/g, "");
  return (
    /^[a-z0-9][a-z0-9.-]{0,7}$/i.test(compact) &&
    !/^(?:rev|qty|pn|type|project)$/i.test(compact)
  );
}

function parseProjectOcrTable(text: string): Partial<JobDraft> {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const headerIndex = lines.findIndex((line) => {
    const headerSignals = [
      /\bksid\b/i,
      /\brev(?:ision)?\b/i,
      /project\s*type/i,
      /(?:due\s*date|schedul(?:ed|e)\s*ship(?:\s*date)?)/i,
    ];
    return headerSignals.filter((pattern) => pattern.test(line)).length >= 3;
  });
  const hasQuantityHeader =
    headerIndex >= 0 && /\b(?:qty|quantity)\b/i.test(lines[headerIndex]);
  const candidates = headerIndex >= 0 ? lines.slice(headerIndex + 1) : lines;
  const row = candidates.find((line) => {
    const cells = line.split(/\s+/).filter(Boolean);
    return cells.length >= 4 && /\d/.test(cells[0]);
  });
  if (!row) return {};
  const dueMatch = row.match(/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/);
  const withoutDate = dueMatch ? row.replace(dueMatch[0], "").trim() : row;
  const cleanCell = (value: string) =>
    value
      .trim()
      .replace(/^[‘’“”'"|`]+/, "")
      .replace(/[‘’“”'"|`]+$/, "");
  const tokens = withoutDate.split(/\s+/).filter(Boolean).map(cleanCell);
  const typeStart = hasQuantityHeader ? 5 : 4;
  const typeText = tokens.slice(typeStart).join(" ");
  const projectType = projectTypes.find(
    (type) => normalizeHeading(type) === normalizeHeading(typeText),
  );
  return {
    jobNumber: tokens[0] ?? "",
    ksid: tokens[1] ?? "",
    pn: tokens[2] ?? "",
    rev: tokens[3] ?? "",
    quantity: hasQuantityHeader ? (tokens[4] ?? "") : "",
    projectType: projectType ?? "",
    customerDueDate: normalizeUploadedDate(dueMatch?.[0] ?? ""),
  };
}

async function recognizeScreenshotData(
  file: File,
  pageSegmentationMode?: string,
) {
  const tesseract = (
    await import("tesseract.js/dist/tesseract.esm.min.js")
  ).default;
  // Keep every OCR dependency on this site. The browser defaults point to
  // third-party CDNs, which are unavailable in the hosted Sites runtime and
  // caused every image import to fail before recognition started.
  const worker = await tesseract.createWorker("eng", tesseract.OEM.LSTM_ONLY, {
    workerPath: "/tesseract/worker.min.js",
    corePath: "/tesseract/core",
    langPath: "/tesseract/lang",
    gzip: false,
    workerBlobURL: false,
  });
  await worker.setParameters({
    tessedit_pageseg_mode:
      pageSegmentationMode ?? tesseract.PSM.SINGLE_BLOCK,
    preserve_interword_spaces: "1",
    user_defined_dpi: "300",
  });

  let images: Array<File | HTMLCanvasElement> = [file];
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.max(
        2,
        Math.min(
          3,
          Math.ceil(3200 / Math.max(bitmap.width, bitmap.height)),
        ),
      );
      const grayscaleCanvas = document.createElement("canvas");
      grayscaleCanvas.width = Math.round(bitmap.width * scale);
      grayscaleCanvas.height = Math.round(bitmap.height * scale);
      const grayscaleContext = grayscaleCanvas.getContext("2d");
      if (grayscaleContext) {
        grayscaleContext.imageSmoothingEnabled = true;
        grayscaleContext.imageSmoothingQuality = "high";
        grayscaleContext.drawImage(
          bitmap,
          0,
          0,
          grayscaleCanvas.width,
          grayscaleCanvas.height,
        );
        const grayscaleData = grayscaleContext.getImageData(
          0,
          0,
          grayscaleCanvas.width,
          grayscaleCanvas.height,
        );
        for (let index = 0; index < grayscaleData.data.length; index += 4) {
          const grayscale = Math.round(
            grayscaleData.data[index] * 0.2126 +
              grayscaleData.data[index + 1] * 0.7152 +
              grayscaleData.data[index + 2] * 0.0722,
          );
          grayscaleData.data[index] = grayscale;
          grayscaleData.data[index + 1] = grayscale;
          grayscaleData.data[index + 2] = grayscale;
        }
        grayscaleContext.putImageData(grayscaleData, 0, 0);

        const contrastCanvas = document.createElement("canvas");
        contrastCanvas.width = grayscaleCanvas.width;
        contrastCanvas.height = grayscaleCanvas.height;
        const contrastContext = contrastCanvas.getContext("2d");
        if (contrastContext) {
          const contrastData = new ImageData(
            new Uint8ClampedArray(grayscaleData.data),
            grayscaleData.width,
            grayscaleData.height,
          );
          for (let index = 0; index < contrastData.data.length; index += 4) {
            const highContrast = contrastData.data[index] >= 170 ? 255 : 0;
            contrastData.data[index] = highContrast;
            contrastData.data[index + 1] = highContrast;
            contrastData.data[index + 2] = highContrast;
          }
          contrastContext.putImageData(contrastData, 0, 0);
          images = [grayscaleCanvas, contrastCanvas];
        } else {
          images = [grayscaleCanvas];
        }
      }
      bitmap.close();
    } catch {
      images = [file];
    }
  }

  try {
    const results = [];
    for (const image of images) {
      results.push(
        await worker.recognize(image, {}, { text: true, tsv: true }),
      );
    }
    const primaryTableResult = results.at(-1)!;
    return {
      text: results.map((result) => result.data.text).join("\n"),
      tsv: primaryTableResult.data.tsv ?? "",
    };
  } finally {
    await worker.terminate();
  }
}

async function recognizeScreenshot(file: File) {
  return (await recognizeScreenshotData(file)).text;
}

type ShortageOcrField =
  | "kspNumber"
  | "quantity"
  | "pnNumber"
  | "dueDate"
  | "comments";

function parseShortageRowsFromTsv(tsv: string) {
  const words = wordsFromTsv(tsv);
  const kspHeader = words.find((word) =>
    normalizeHeading(word.text).startsWith("ksp"),
  );
  if (!kspHeader) return [] as ShortageItem[];

  const headerWords = words.filter(
    (word) =>
      Math.abs(word.top - kspHeader.top) <=
      Math.min(12, Math.max(8, kspHeader.height * 0.55)),
  );
  const findHeader = (test: (normalized: string) => boolean) =>
    headerWords.find((word) => test(normalizeHeading(word.text)));
  const anchors = [
    { field: "kspNumber" as const, word: kspHeader },
    {
      field: "quantity" as const,
      word: findHeader((value) => value === "qty" || value === "quantity"),
    },
    {
      field: "pnNumber" as const,
      word: findHeader(
        (value) => value === "pn" || value === "pnnumber" || value === "partnumber",
      ),
    },
    {
      field: "dueDate" as const,
      word: findHeader((value) => value === "due" || value === "duedate"),
    },
    {
      field: "comments" as const,
      word: findHeader(
        (value) => value === "additional" || value.startsWith("comment"),
      ),
    },
  ]
    .filter(
      (anchor): anchor is { field: ShortageOcrField; word: OcrWord } =>
        Boolean(anchor.word),
    )
    .map((anchor) => ({
      ...anchor,
      center: anchor.word.left + anchor.word.width / 2,
    }))
    .sort((a, b) => a.center - b.center);

  if (anchors.length < 3) return [] as ShortageItem[];

  const headerBottom = Math.max(
    ...headerWords.map((word) => word.top + word.height),
  );
  const dataWords = words
    .filter((word) => word.top + word.height / 2 > headerBottom + 1)
    .sort((a, b) => a.top - b.top || a.left - b.left);
  const groupedRows: OcrWord[][] = [];
  for (const word of dataWords) {
    const center = word.top + word.height / 2;
    const row = groupedRows.at(-1);
    const rowCenter = row
      ? row.reduce((sum, item) => sum + item.top + item.height / 2, 0) /
        row.length
      : -999;
    if (!row || Math.abs(center - rowCenter) > Math.max(8, word.height)) {
      groupedRows.push([word]);
    } else {
      row.push(word);
    }
  }

  return groupedRows
    .map((row) => {
      const cells = new Map<ShortageOcrField, OcrWord[]>(
        anchors.map((anchor) => [anchor.field, []]),
      );
      row.forEach((word) => {
        const center = word.left + word.width / 2;
        const nearest = anchors.reduce((best, anchor) =>
          Math.abs(center - anchor.center) < Math.abs(center - best.center)
            ? anchor
            : best,
        );
        cells.get(nearest.field)?.push(word);
      });
      const value = (field: ShortageOcrField) =>
        (cells.get(field) ?? [])
          .sort((a, b) => a.left - b.left)
          .map((word) => cleanImportedCell(word.text))
          .join(" ")
          .trim();
      const dueValue = value("dueDate");
      const comments = value("comments");
      const customerSupplied = /customer\s*supplied/i.test(
        `${dueValue} ${comments}`,
      );
      return {
        id: makeId("shortage"),
        kspNumber: value("kspNumber"),
        pnNumber: value("pnNumber"),
        quantity: value("quantity"),
        dueDate: customerSupplied ? "" : normalizeUploadedDate(dueValue),
        comments,
        customerSupplied,
        complete: false,
      };
    })
    .filter(
      (item) =>
        item.kspNumber ||
        item.pnNumber ||
        item.quantity ||
        item.dueDate ||
        item.customerSupplied ||
        item.comments,
    );
}

async function parseShortageFile(file: File): Promise<ShortageItem[]> {
  if (file.type.startsWith("image/")) {
    const { text, tsv } = await recognizeScreenshotData(file, "3");
    const tableRows = parseShortageRowsFromTsv(tsv);
    if (tableRows.length) return tableRows;
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !/ksp.*pn.*(?:qty|quantity).*due/i.test(line))
      .map((line) => {
        const dateMatch = line.match(
          /\b(?:\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\b/,
        );
        const dueDate = normalizeUploadedDate(dateMatch?.[0] ?? "");
        const withoutDate = dateMatch
          ? line.replace(dateMatch[0], "").trim()
          : line;
        const columns = withoutDate
          .split(/\s{2,}|\t/)
          .map((value) => value.trim())
          .filter(Boolean);
        const fallback = withoutDate.split(/\s+/);
        const quantityIndex = fallback.findIndex((value, index) =>
          index > 1 ? /^\d+(?:\.\d+)?$/.test(value) : false,
        );
        return {
          id: makeId("shortage"),
          kspNumber: columns[0] ?? fallback[0] ?? "",
          pnNumber:
            columns[1] ??
            (quantityIndex > 1
              ? fallback.slice(1, quantityIndex).join(" ")
              : fallback.slice(1).join(" ")),
          quantity:
            columns[2] ?? (quantityIndex > 1 ? fallback[quantityIndex] : ""),
          dueDate,
          comments:
            columns.slice(3).join(" ") ||
            (quantityIndex > 1
              ? fallback.slice(quantityIndex + 1).join(" ")
              : ""),
          customerSupplied: /customer\s*supplied/i.test(line),
          complete: false,
        };
      })
      .filter(
        (item) =>
          item.kspNumber || item.pnNumber || item.quantity || item.dueDate,
      );
  }

  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: "array",
    cellDates: true,
  });
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    workbook.Sheets[workbook.SheetNames[0]],
    { defval: "" },
  );
  return rows
    .map((row) => {
      const normalized = Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          normalizeHeading(key),
          value,
        ]),
      );
      return {
        id: makeId("shortage"),
        kspNumber: String(normalized.ksp || normalized.kspnumber || ""),
        pnNumber: String(
          normalized.pn || normalized.pnnumber || normalized.partnumber || "",
        ),
        quantity: String(normalized.qty || normalized.quantity || ""),
        dueDate: normalizeUploadedDate(normalized.duedate),
        comments: String(
          normalized.additionalcomments ||
            normalized.comments ||
            normalized.notes ||
            "",
        ),
        customerSupplied: /customer\s*supplied/i.test(String(normalized.duedate || "")),
        complete: false,
      };
    })
    .filter(
      (item) =>
        item.kspNumber || item.pnNumber || item.quantity || item.dueDate,
    );
}

function OldDataImportModal({
  onClose,
  onBook,
}: {
  onClose: () => void;
  onBook: (job: Job) => void;
}) {
  const [rows, setRows] = useState<LegacyImportRow[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scanState, setScanState] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);
  const current = rows[activeIndex] ?? null;
  const missing = current ? legacyMissingFields(current) : [];
  const missingDivision = Boolean(current && !current.division);
  const bookedCount = rows.filter((row) => row.booked).length;
  const needsInfoCount = rows.filter(
    (row) => !row.booked && (!row.division || legacyMissingFields(row).length),
  ).length;

  async function importOldData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setScanState(
      file.type.startsWith("image/")
        ? "Scanning every spreadsheet row in the image…"
        : "Reading every spreadsheet row…",
    );
    try {
      let imported: LegacyImportRow[] = [];
      if (file.type.startsWith("image/")) {
        const result = await recognizeScreenshotData(file);
        imported = parseLegacyRowsFromTsv(result.tsv);
        if (!imported.length) imported = parseLegacyRowsFromText(result.text);
      } else {
        const workbook = XLSX.read(await file.arrayBuffer(), {
          type: "array",
          cellDates: false,
        });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          sheet,
          { defval: "", raw: false, dateNF: "m/d/yyyy" },
        );
        imported = records
          .map((record, index) => legacyRowFromRecord(record, index + 2))
          .filter((row): row is LegacyImportRow => Boolean(row));
      }
      if (!imported.length) {
        setRows([]);
        setScanState(
          "No project rows were detected. Keep the headers visible and try a clearer image or Excel file.",
        );
      } else {
        setRows(imported);
        setActiveIndex(0);
        setScanState(
          `${imported.length} job${imported.length === 1 ? "" : "s"} detected. Review and confirm each booking.`,
        );
      }
    } catch {
      setRows([]);
      setScanState(
        "The file could not be read. Try an Excel file or a clear, straight screenshot with the full header row.",
      );
    }
    event.target.value = "";
  }

  function updateCurrentField<Key extends keyof JobDraft>(
    key: Key,
    value: JobDraft[Key],
  ) {
    setRows((allRows) =>
      allRows.map((row, index) =>
        index === activeIndex
          ? { ...row, fields: { ...row.fields, [key]: value } }
          : row,
      ),
    );
  }

  function updateCurrentDivision(division: Division) {
    setRows((allRows) =>
      allRows.map((row, index) =>
        index === activeIndex ? { ...row, division } : row,
      ),
    );
  }

  function goTo(offset: number) {
    if (!rows.length) return;
    setActiveIndex((index) => (index + offset + rows.length) % rows.length);
  }

  function confirmBooking() {
    if (!current || current.booked) return;
    if (missing.length || missingDivision) {
      const labels = [
        ...(missingDivision ? ["Business section"] : []),
        ...missing.map((key) => legacyFieldLabels[key] ?? key),
      ];
      setScanState(
        `Complete the red fields before booking: ${labels.join(", ")}.`,
      );
      return;
    }
    const fields = current.fields;
    const job: Job = {
      id: makeId("job"),
      division: current.division as Division,
      customer: fields.customer.trim(),
      jobNumber: fields.jobNumber.trim(),
      ksid: fields.ksid.trim(),
      pnName: fields.pnName.trim(),
      pn: fields.pn.trim(),
      rev: fields.rev.trim(),
      quantity: fields.quantity.trim(),
      projectType: fields.projectType as ProjectType,
      contact: fields.contact.trim(),
      dueDate: addBusinessDays(
        fields.createdDate,
        Number(fields.fabricationTurnDays) + Number(fields.assemblyTurnDays),
      ),
      customerDueDate: fields.customerDueDate,
      poNumber: fields.poNumber.trim(),
      quoteNumber: fields.quoteNumber.trim(),
      status: fields.status as JobStatus,
      specialProcesses: [],
      otherSpecialProcess: "",
      otherSpecialProcessTurnDays: 0,
      polymericsOptions: [],
      createdDate: fields.createdDate,
      fabricationDockDate: "",
      pcbDockDate: "",
      pcbArrived: false,
      fabricationTurnDays: Number(fields.fabricationTurnDays),
      assemblyTurnDays: Number(fields.assemblyTurnDays),
      polymericsTurnDays: 0,
      externalTestingTurnDays: 0,
      allPartsReceivedDate: "",
      noShortageList: false,
      acceptedPartials: false,
      partialDeliveries: [],
      smtDays: Number(fields.smtDays),
      workflowCompleted: ["project-creation"],
      shortages: [],
      notes: fields.initialNote.trim()
        ? [
            {
              id: makeId("note"),
              date: fields.createdDate,
              createdAt: new Date().toISOString(),
              text: fields.initialNote.trim(),
            },
          ]
        : [],
    };
    onBook(job);
    const nextRows = rows.map((row, index) =>
      index === activeIndex ? { ...row, booked: true } : row,
    );
    setRows(nextRows);
    const nextIndex = nextRows.findIndex(
      (row, index) => index > activeIndex && !row.booked,
    );
    const wrappedIndex = nextRows.findIndex((row) => !row.booked);
    if (nextIndex >= 0) setActiveIndex(nextIndex);
    else if (wrappedIndex >= 0) setActiveIndex(wrappedIndex);
    setScanState(
      nextRows.every((row) => row.booked)
        ? "All detected jobs have been individually confirmed and booked."
        : `Job #${fields.jobNumber} booked. Review the next job.`,
    );
  }

  const fieldClass = (key: keyof JobDraft) =>
    current && !cleanImportedCell(current.fields[key]) ? "missing-field" : "";
  const missingMark = (key: keyof JobDraft) =>
    current && !cleanImportedCell(current.fields[key]) ? (
      <span className="missing-mark">★ Missing</span>
    ) : null;

  return (
    <div className="modal-layer legacy-import-layer">
      <section className="modal-card legacy-import-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="section-kicker">Data & Backup · Special booking</p>
            <h2>OLD DATA Production Booking</h2>
            <p>
              Import every row, review missing information, and confirm each job
              before it enters production.
            </p>
          </div>
          <button className="icon-button" aria-label="Close" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="legacy-upload-bar">
          <span className="smart-import-icon">
            <FileSpreadsheet />
          </span>
          <div>
            <strong>Upload old production data</strong>
            <small>
              Recognizes both current and old headers, including Job Name → PN
              Name, Job Types → Project Type, Part # → PN, and POC → Contact.
              Each row is one job.
            </small>
            {scanState && <em>{scanState}</em>}
          </div>
          <button
            type="button"
            className="button secondary"
            onClick={() => uploadRef.current?.click()}
          >
            <Upload size={16} /> {rows.length ? "Replace upload" : "Upload photo or Excel"}
          </button>
          <input
            ref={uploadRef}
            type="file"
            hidden
            accept=".xlsx,.xls,.csv,image/*"
            onChange={importOldData}
          />
        </div>

        {!rows.length ? (
          <div className="legacy-empty-state">
            <ImageIcon />
            <h3>One row becomes one review page</h3>
            <p>
              Repeated customer folder names are kept on every matching job.
              Missing required fields will be outlined in red.
            </p>
            <button
              className="button primary"
              onClick={() => uploadRef.current?.click()}
            >
              <Upload size={16} /> Select old data file
            </button>
          </div>
        ) : (
          <>
            <div className="legacy-review-summary">
              <span><strong>{rows.length}</strong> detected</span>
              <span className="booked"><strong>{bookedCount}</strong> booked</span>
              <span className={needsInfoCount ? "needs-info" : "ready"}>
                <strong>{needsInfoCount}</strong> need information
              </span>
            </div>

            <div className="legacy-row-strip" aria-label="Imported job review pages">
              {rows.map((row, index) => {
                const rowMissing = legacyMissingFields(row).length + (row.division ? 0 : 1);
                return (
                  <button
                    key={row.id}
                    className={`${index === activeIndex ? "active" : ""} ${row.booked ? "booked" : rowMissing ? "needs-info" : "ready"}`}
                    onClick={() => setActiveIndex(index)}
                  >
                    <small>Row {row.sourceRow}</small>
                    <strong>Job #{row.fields.jobNumber || "Missing"}</strong>
                    <em>{row.booked ? "Booked" : rowMissing ? `${rowMissing} missing` : "Ready"}</em>
                  </button>
                );
              })}
            </div>

            {current && (
              <div className={`legacy-review-page ${current.booked ? "is-booked" : ""}`}>
                <div className="legacy-page-heading">
                  <div>
                    <p className="section-kicker">Review page {activeIndex + 1} of {rows.length}</p>
                    <h3>Job #{current.fields.jobNumber || "Missing job number"}</h3>
                    <p>
                      {current.booked
                        ? "This job was confirmed and booked."
                        : missing.length || missingDivision
                          ? "Complete every red field, then confirm this booking."
                          : "All required fields are ready for your confirmation."}
                    </p>
                  </div>
                  <span className={`legacy-readiness ${current.booked ? "booked" : missing.length || missingDivision ? "needs-info" : "ready"}`}>
                    {current.booked
                      ? <><CheckCircle2 size={16} /> Booked</>
                      : missing.length || missingDivision
                        ? <><AlertTriangle size={16} /> {missing.length + (missingDivision ? 1 : 0)} missing</>
                        : <><Check size={16} /> Ready to book</>}
                  </span>
                </div>

                <fieldset
                  className={`division-picker legacy-division-picker ${missingDivision ? "missing-field" : ""}`}
                  disabled={current.booked}
                >
                  <legend>
                    Business section {missingDivision && <span className="missing-mark">★ Missing</span>}
                  </legend>
                  {(["Commercial", "Aerospace"] as Division[]).map((division) => (
                    <label key={division} className={current.division === division ? "selected" : ""}>
                      <input
                        type="radio"
                        checked={current.division === division}
                        onChange={() => updateCurrentDivision(division)}
                      />
                      <span className={`division-icon ${division.toLowerCase()}`}>
                        {division === "Commercial" ? <Factory /> : <Gauge />}
                      </span>
                      <span><strong>{division}</strong><small>Book into {division}</small></span>
                    </label>
                  ))}
                </fieldset>

                <div className="job-form-grid legacy-job-grid">
                  <label className={`wide ${fieldClass("customer")}`}>
                    Customer Sub-Category / Folder {missingMark("customer")}
                    <input disabled={current.booked} value={current.fields.customer} onChange={(event) => updateCurrentField("customer", event.target.value)} />
                  </label>
                  <label className={fieldClass("jobNumber")}>
                    Job # {missingMark("jobNumber")}
                    <input disabled={current.booked} value={current.fields.jobNumber} onChange={(event) => updateCurrentField("jobNumber", event.target.value)} />
                  </label>
                  <label className={fieldClass("ksid")}>
                    KSID {missingMark("ksid")}
                    <input disabled={current.booked} value={current.fields.ksid} onChange={(event) => updateCurrentField("ksid", event.target.value)} />
                  </label>
                  <label className={fieldClass("pnName")}>
                    PN Name {missingMark("pnName")}
                    <input disabled={current.booked} value={current.fields.pnName} onChange={(event) => updateCurrentField("pnName", event.target.value)} />
                  </label>
                  <label className={fieldClass("pn")}>
                    PN {missingMark("pn")}
                    <input disabled={current.booked} value={current.fields.pn} onChange={(event) => updateCurrentField("pn", event.target.value)} />
                  </label>
                  <label className={fieldClass("rev")}>
                    Rev {missingMark("rev")}
                    <input disabled={current.booked} value={current.fields.rev} onChange={(event) => updateCurrentField("rev", event.target.value)} />
                  </label>
                  <label className={fieldClass("quantity")}>
                    QTY {missingMark("quantity")}
                    <input disabled={current.booked} inputMode="numeric" value={current.fields.quantity} onChange={(event) => updateCurrentField("quantity", event.target.value)} />
                  </label>
                  <label className={fieldClass("projectType")}>
                    Project Type {missingMark("projectType")}
                    <select disabled={current.booked} value={current.fields.projectType} onChange={(event) => updateCurrentField("projectType", event.target.value as ProjectType)}>
                      <option value="">Select…</option>
                      {projectTypes.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                  <label className={fieldClass("contact")}>
                    Contact {missingMark("contact")}
                    <input disabled={current.booked} value={current.fields.contact} onChange={(event) => updateCurrentField("contact", event.target.value)} />
                  </label>
                  <label>
                    Customer Due Date
                    <input disabled={current.booked} type="date" value={current.fields.customerDueDate} onChange={(event) => updateCurrentField("customerDueDate", event.target.value)} />
                  </label>
                  <label>
                    PO# <span>(optional)</span>
                    <input disabled={current.booked} value={current.fields.poNumber} onChange={(event) => updateCurrentField("poNumber", event.target.value)} />
                  </label>
                  <label>
                    Quote# <span>(optional)</span>
                    <input disabled={current.booked} value={current.fields.quoteNumber} onChange={(event) => updateCurrentField("quoteNumber", event.target.value)} />
                  </label>
                  <label className={fieldClass("status")}>
                    Status {missingMark("status")}
                    <select disabled={current.booked} value={current.fields.status} onChange={(event) => updateCurrentField("status", event.target.value as JobStatus)}>
                      <option value="">Select…</option>
                      {jobStatuses.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                  <label className={fieldClass("createdDate")}>
                    Project Creation Date {missingMark("createdDate")}
                    <input disabled={current.booked} type="date" value={current.fields.createdDate} onChange={(event) => updateCurrentField("createdDate", event.target.value)} />
                  </label>
                  <label className={fieldClass("fabricationTurnDays")}>
                    Fabrication Turn Time {missingMark("fabricationTurnDays")}
                    <input disabled={current.booked} type="number" min="0" value={current.fields.fabricationTurnDays} onChange={(event) => updateCurrentField("fabricationTurnDays", event.target.value)} />
                  </label>
                  <label className={fieldClass("assemblyTurnDays")}>
                    Assembly Turn Time {missingMark("assemblyTurnDays")}
                    <input disabled={current.booked} type="number" min="0" value={current.fields.assemblyTurnDays} onChange={(event) => updateCurrentField("assemblyTurnDays", event.target.value)} />
                  </label>
                  <label className={fieldClass("smtDays")}>
                    SMT Turn Time {missingMark("smtDays")}
                    <input disabled={current.booked} type="number" min="1" value={current.fields.smtDays} onChange={(event) => updateCurrentField("smtDays", event.target.value)} />
                  </label>
                  <label className="wide">
                    Initial Note <span>(optional)</span>
                    <input disabled={current.booked} value={current.fields.initialNote} onChange={(event) => updateCurrentField("initialNote", event.target.value)} />
                  </label>
                </div>
              </div>
            )}

            <div className="legacy-review-actions">
              <button className="button secondary" onClick={() => goTo(-1)}>
                <ChevronLeft size={17} /> Previous job
              </button>
              <span><strong>{activeIndex + 1}</strong> / {rows.length}</span>
              <button className="button secondary" onClick={() => goTo(1)}>
                Next job <ChevronRight size={17} />
              </button>
              <button
                className="button primary confirm-legacy-job"
                disabled={Boolean(current?.booked)}
                onClick={confirmBooking}
              >
                {current?.booked ? <><CheckCircle2 size={17} /> Job booked</> : <><Check size={17} /> Confirm & book this job</>}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function NewJobModal({
  onClose,
  onCreate,
  recipes,
  jobs,
}: {
  onClose: () => void;
  onCreate: (job: Job | Job[]) => void;
  recipes: AssemblyRecipe[];
  jobs: Job[];
}) {
  const [division, setDivision] = useState<Division>("Commercial");
  const [divisionMissing, setDivisionMissing] = useState(false);
  const [polymerics, setPolymerics] = useState(false);
  const [externalTesting, setExternalTesting] = useState(false);
  const [faiReport, setFaiReport] = useState(false);
  const [otherProcess, setOtherProcess] = useState(false);
  const [selectedPoly, setSelectedPoly] = useState<PolymericsOption[]>([]);
  const [scanState, setScanState] = useState("");
  const [missingFields, setMissingFields] = useState<Set<keyof JobDraft>>(
    new Set(),
  );
  const uploadRef = useRef<HTMLInputElement>(null);
  const [fields, setFields] = useState<JobDraft>({
    customer: "",
    jobNumber: "",
    ksid: "",
    pnName: "",
    pn: "",
    rev: "",
    quantity: "",
    projectType: "New",
    contact: "",
    customerDueDate: "",
    poNumber: "",
    quoteNumber: "",
    status: "Waiting on Parts",
    createdDate: chicagoDateKey(),
    fabricationTurnDays: "",
    assemblyTurnDays: "",
    polymericsTurnDays: "",
    externalTestingTurnDays: "",
    smtDays: "2",
    otherSpecialProcess: "",
    otherSpecialProcessTurnDays: "",
    initialNote: "",
  });
  const [additionalPcbas, setAdditionalPcbas] = useState<LinkedBuildDraft[]>([]);
  const [includeMechanicalAssembly, setIncludeMechanicalAssembly] = useState(false);
  const [ccaBuilds, setCcaBuilds] = useState<LinkedBuildDraft[]>([]);
  const [includeLru, setIncludeLru] = useState(false);
  const [lruBuild, setLruBuild] = useState<LinkedBuildDraft | null>(null);
  const [mechanicalBuild, setMechanicalBuild] = useState(false);
  const [mechanicalLevel, setMechanicalLevel] = useState<"CCA" | "LRU">("CCA");
  const [mechanicalRecipeId, setMechanicalRecipeId] = useState("");
  const [linkedJobIds, setLinkedJobIds] = useState<string[]>([]);
  const customerFolders = useMemo(() => {
    const folders = new Map<string, string>();
    jobs.forEach((job) => {
      const folder = job.customer.trim();
      const key = folder.toLocaleLowerCase();
      if (folder && !folders.has(key)) folders.set(key, folder);
    });
    return [...folders.values()].sort((left, right) =>
      left.localeCompare(right, undefined, { sensitivity: "base" }),
    );
  }, [jobs]);

  const eligibleLinkedJobs = jobs.filter(
    (job) =>
      job.customer.trim().toLowerCase() === fields.customer.trim().toLowerCase() &&
      jobBuildLevel(job) === (mechanicalLevel === "CCA" ? "PCBA" : "CCA"),
  );

  const specialTurnDays =
    (polymerics ? Number(fields.polymericsTurnDays || 0) : 0) +
    (externalTesting ? Number(fields.externalTestingTurnDays || 0) : 0) +
    (otherProcess ? Number(fields.otherSpecialProcessTurnDays || 0) : 0);
  const totalTurnDays = mechanicalBuild
    ? Number(fields.assemblyTurnDays || 0)
    : Number(fields.fabricationTurnDays || 0) +
      Number(fields.assemblyTurnDays || 0) +
      specialTurnDays;
  const calculatedDueDate = fields.createdDate
    ? addBusinessDays(fields.createdDate, totalTurnDays)
    : "";

  function setField<Key extends keyof JobDraft>(
    key: Key,
    value: JobDraft[Key],
  ) {
    setFields((current) => ({ ...current, [key]: value }));
    setMissingFields((current) => {
      if (!current.has(key) || !String(value).trim()) return current;
      const updated = new Set(current);
      updated.delete(key);
      return updated;
    });
  }

  function applyParsedFields(
    parsed: Partial<JobDraft> & {
      division?: Division;
      polymerics?: boolean;
      externalTesting?: boolean;
      faiReport?: boolean;
      otherProcess?: boolean;
    },
  ) {
    const importedFields = {
      ...parsed,
      status: parsed.status || "Waiting on Parts",
      createdDate: parsed.createdDate || chicagoDateKey(),
    };
    const required = [...requiredDraftFields];
    if (parsed.polymerics) required.push("polymericsTurnDays");
    if (parsed.externalTesting) required.push("externalTestingTurnDays");
    if (parsed.otherProcess)
      required.push("otherSpecialProcess", "otherSpecialProcessTurnDays");
    setMissingFields(
      new Set(
        required.filter((key) => !String(importedFields[key] ?? "").trim()),
      ),
    );
    setDivisionMissing(!parsed.division);
    if (parsed.division) setDivision(parsed.division);
    if (parsed.polymerics !== undefined) setPolymerics(parsed.polymerics);
    if (parsed.externalTesting !== undefined)
      setExternalTesting(parsed.externalTesting);
    if (parsed.faiReport !== undefined) setFaiReport(parsed.faiReport);
    if (parsed.otherProcess !== undefined) setOtherProcess(parsed.otherProcess);
    setFields(
      (current) =>
        ({
          ...current,
          ...Object.fromEntries(
            Object.entries(importedFields).filter(
              ([key]) =>
                ![
                  "division",
                  "polymerics",
                  "externalTesting",
                  "faiReport",
                  "otherProcess",
                ].includes(key),
            ),
          ),
        }) as JobDraft,
    );
  }

  async function importProject(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setScanState(
      file.type.startsWith("image/")
        ? "Scanning screenshot on this device…"
        : "Reading spreadsheet…",
    );
    try {
      let parsed: Partial<JobDraft> & {
        division?: Division;
        polymerics?: boolean;
        externalTesting?: boolean;
        faiReport?: boolean;
        otherProcess?: boolean;
      } = {};
      if (file.type.startsWith("image/")) {
        const result = await recognizeScreenshotData(file);
        const text = result.text;
        const tableRow =
          parseLegacyRowsFromTsv(result.tsv)[0]?.fields ??
          parseProjectOcrTable(text);
        const labeled = parseBookingScreenshotLabels(text);
        const projectNameRow = parseBookingProjectName(text);
        const projectType = extractOcrValue(text, [
          "Project Type",
          "Job Type",
          "Job Types",
          "Type",
        ]);
        const status = extractOcrValue(text, ["Status"]);
        parsed = {
          division: /aerospace/i.test(text)
            ? "Aerospace"
            : /commercial/i.test(text)
              ? "Commercial"
              : undefined,
          customer: extractOcrValue(text, [
            "Customer Sub-Category",
            "Customer",
            "Customer Name",
          ]),
          jobNumber:
            extractOcrValue(text, ["Job #", "Job Number", "Job No"]) ||
            labeled.jobNumber ||
            tableRow.jobNumber,
          ksid: cleanImportedKsid(
            extractOcrValue(text, ["KSID"]) || labeled.ksid || tableRow.ksid,
          ),
          // Booking screenshots are tables. Prefer the position-aware row for
          // PN fields, then use labeled text as a fallback. A bare wrapped
          // header such as "PN Name" must never cause the next header line to
          // be imported as the value.
          pnName: firstPlausibleOcrValue(
            [
              tableRow.pnName,
              projectNameRow.pnName,
              labeled.pnName,
              extractOcrValue(text, ["PN Name", "Part Name", "Job Name"]),
            ],
            plausiblePnName,
          ),
          pn: firstPlausibleOcrValue(
            [
              tableRow.pn,
              projectNameRow.pn,
              labeled.pn,
              extractOcrValue(text, ["Part Number", "Part #", "PN"]),
            ],
            plausiblePn,
          ),
          rev: firstPlausibleOcrValue(
            [
              tableRow.rev,
              projectNameRow.rev,
              labeled.rev,
              extractOcrValue(text, ["Revision", "Rev"]),
            ],
            plausibleRev,
          ),
          quantity:
            extractOcrValue(text, ["QTY", "Quantity"]) ||
            labeled.quantity ||
            parseBookingQuantityFromTsv(result.tsv) ||
            tableRow.quantity,
          projectType:
            projectTypes.find(
              (item) => item.toLowerCase() === projectType.toLowerCase(),
            ) ?? tableRow.projectType ?? "",
          contact:
            extractOcrValue(text, ["Contact", "POC", "Point of Contact"]) ||
            tableRow.contact,
          customerDueDate: normalizeUploadedDate(
            extractOcrValue(text, [
              "Customer Due Date",
              "Scheduled Ship Date",
              "Schedule Ship Date",
              "Scheduled Ship",
              "Due Date",
            ]) ||
              labeled.customerDueDate ||
              tableRow.customerDueDate,
          ),
          poNumber:
            extractOcrValue(text, ["PO#", "PO Number", "PO No", "PO"]) ||
            labeled.poNumber,
          quoteNumber:
            extractOcrValue(text, ["Quote Number", "Quote#", "Quote"]) ||
            labeled.quoteNumber ||
            tableRow.quoteNumber,
          status:
            jobStatuses.find(
              (item) => item.toLowerCase() === status.toLowerCase(),
            ) ?? tableRow.status ?? "",
          createdDate: normalizeUploadedDate(
            extractOcrValue(text, ["Project Creation Date", "Creation Date"]),
          ),
          fabricationTurnDays:
            extractOcrValue(text, [
              "Fabrication Turn Time",
              "Fab Turn Time",
            ]).match(/\d+/)?.[0] ?? "",
          assemblyTurnDays:
            extractOcrValue(text, ["Assembly Turn Time"]).match(/\d+/)?.[0] ??
            "",
          polymericsTurnDays:
            extractOcrValue(text, ["Polymerics Turn Time"]).match(/\d+/)?.[0] ??
            "",
          externalTestingTurnDays:
            extractOcrValue(text, ["External Testing Turn Time"]).match(
              /\d+/,
            )?.[0] ?? "",
          smtDays:
            extractOcrValue(text, ["SMT Turn Time", "SMT Days"]).match(
              /\d+/,
            )?.[0] ?? "",
          polymerics: /polymerics/i.test(text),
          externalTesting: /external testing/i.test(text),
          faiReport: /\bfai\s*report\b/i.test(text),
          otherProcess: /\bother(?:s)?\s*[:#-]/i.test(text),
          otherSpecialProcess: extractOcrValue(text, ["Others", "Other"]),
          otherSpecialProcessTurnDays:
            extractOcrValue(text, [
              "Other Turn Time",
              "Others Turn Time",
            ]).match(/\d+/)?.[0] ?? "",
        };
      } else {
        const workbook = XLSX.read(await file.arrayBuffer(), {
          type: "array",
          cellDates: true,
        });
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          workbook.Sheets[workbook.SheetNames[0]],
          { defval: "" },
        );
        const row = Object.fromEntries(
          Object.entries(rows[0] ?? {}).map(([key, value]) => [
            normalizeHeading(key),
            value,
          ]),
        );
        const value = (...keys: string[]) =>
          keys
            .map((key) => row[normalizeHeading(key)])
            .find((item) => item !== undefined && String(item).trim()) ?? "";
        const divisionValue = String(value("Division", "Business Section"));
        const typeValue = String(value("Project Type", "Type"));
        const statusValue = String(value("Status"));
        const special = String(value("Special Processes", "Special Process"));
        parsed = {
          division: /aerospace/i.test(divisionValue)
            ? "Aerospace"
            : /commercial/i.test(divisionValue)
              ? "Commercial"
              : undefined,
          customer: String(
            value("Customer Sub-Category", "Customer", "Customer Name"),
          ),
          jobNumber: String(value("Job #", "Job Number", "Job No")),
          ksid: String(value("KSID")),
          pnName: String(value("PN Name", "Part Name", "Job Name")),
          pn: String(value("PN", "Part Number", "Part #")),
          rev: String(value("Rev", "Revision")),
          quantity: String(value("QTY", "Quantity")),
          projectType:
            projectTypes.find(
              (item) => item.toLowerCase() === typeValue.toLowerCase(),
            ) ??
            matchingProjectType(value("Job Type", "Job Types")),
          contact: String(value("Contact", "POC", "Point of Contact")),
          customerDueDate: normalizeUploadedDate(
            value("Customer Due Date", "Due Date"),
          ),
          poNumber: String(value("PO#", "PO Number", "PO")),
          quoteNumber: String(value("Quote#", "Quote Number", "Quote")),
          status:
            jobStatuses.find(
              (item) => item.toLowerCase() === statusValue.toLowerCase(),
            ) ?? "",
          createdDate: normalizeUploadedDate(
            value("Project Creation Date", "Creation Date"),
          ),
          fabricationTurnDays:
            String(value("Fabrication Turn Time", "Fab Turn Time")).match(
              /\d+/,
            )?.[0] ?? "",
          assemblyTurnDays:
            String(value("Assembly Turn Time")).match(/\d+/)?.[0] ?? "",
          polymericsTurnDays:
            String(value("Polymerics Turn Time")).match(/\d+/)?.[0] ?? "",
          externalTestingTurnDays:
            String(value("External Testing Turn Time")).match(/\d+/)?.[0] ?? "",
          smtDays:
            String(value("SMT Turn Time", "SMT Days")).match(/\d+/)?.[0] ?? "",
          polymerics:
            /polymerics/i.test(special) ||
            Boolean(value("Polymerics Turn Time")),
          externalTesting:
            /external testing/i.test(special) ||
            Boolean(value("External Testing Turn Time")),
          faiReport: /\bfai\s*report\b/i.test(special),
          otherProcess: /\bother(?:s)?\b/i.test(special),
          otherSpecialProcess: String(
            value("Other Special Process", "Others", "Other"),
          ),
          otherSpecialProcessTurnDays:
            String(value("Other Turn Time", "Others Turn Time")).match(
              /\d+/,
            )?.[0] ?? "",
        };
      }
      applyParsedFields(parsed);
      setScanState("Upload read. Complete every field marked in red.");
    } catch {
      setScanState(
        "The upload could not be read. You can complete the red fields manually.",
      );
      setMissingFields(new Set(requiredDraftFields));
      setDivisionMissing(true);
    }
    event.target.value = "";
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const required = requiredDraftFields.filter(
      (key) => !mechanicalBuild || !["fabricationTurnDays", "smtDays"].includes(key),
    );
    if (polymerics) required.push("polymericsTurnDays");
    if (externalTesting) required.push("externalTestingTurnDays");
    if (otherProcess)
      required.push("otherSpecialProcess", "otherSpecialProcessTurnDays");
    const missing = required.filter((key) => !String(fields[key]).trim());
    if (missing.length || divisionMissing) {
      setMissingFields(new Set(missing));
      setScanState(
        "Complete the red required fields before creating this job.",
      );
      return;
    }
    if (mechanicalBuild) {
      if (!linkedJobIds.length) {
        setScanState(
          `Select at least one eligible ${mechanicalLevel === "CCA" ? "PCBA" : "CCA"} job from this customer folder.`,
        );
        return;
      }
      const linked = jobs.filter((job) => linkedJobIds.includes(job.id));
      const assemblyRequirements = Array.from(
        linked.reduce((requirements, linkedJob) => {
          const key = `${linkedJob.pn.trim().toLowerCase()}|${linkedJob.rev.trim().toLowerCase()}`;
          if (!requirements.has(key)) {
            requirements.set(key, {
              id: makeId("job-requirement"),
              inputLevel: mechanicalLevel === "CCA" ? "PCBA" as BuildLevel : "CCA" as BuildLevel,
              pn: linkedJob.pn,
              rev: linkedJob.rev,
              quantityPerAssembly: 1,
            });
          }
          return requirements;
        }, new Map<string, AssemblyRequirement>()).values(),
      );
      const readyDate = linked
        .flatMap((job) => job.quantityReleases ?? [])
        .map((release) => release.date)
        .filter(Boolean)
        .sort()
        .at(-1) ?? fields.createdDate;
      const job: Job = normalizeJob({
        id: makeId("job"),
        buildLevel: mechanicalLevel,
        familyId: makeId("mechanical-link"),
        linkedJobIds,
        assemblyRecipeId: "",
        assemblyRequirements,
        division,
        customer: fields.customer,
        jobNumber: fields.jobNumber,
        ksid: fields.ksid,
        pnName: fields.pnName,
        pn: fields.pn,
        rev: fields.rev,
        quantity: fields.quantity,
        projectType: "Assembly Only",
        contact: fields.contact,
        dueDate: addBusinessDays(readyDate, Number(fields.assemblyTurnDays) || 0),
        customerDueDate: fields.customerDueDate,
        poNumber: fields.poNumber,
        quoteNumber: fields.quoteNumber,
        status: mechanicalLevel === "CCA" ? "Waiting for PCBA" : "Waiting for CCAs",
        specialProcesses: [],
        otherSpecialProcess: "",
        otherSpecialProcessTurnDays: 0,
        polymericsOptions: [],
        createdDate: fields.createdDate,
        fabricationDockDate: "",
        pcbDockDate: "",
        pcbArrived: false,
        fabricationTurnDays: 0,
        assemblyTurnDays: Number(fields.assemblyTurnDays) || 0,
        polymericsTurnDays: 0,
        externalTestingTurnDays: 0,
        allPartsReceivedDate: "",
        noShortageList: false,
        acceptedPartials: false,
        partialDeliveries: [],
        smtDays: 0,
        workflowCompleted: ["project-creation"],
        completedQuantity: 0,
        quantityReleases: [],
        mechanicalShipments: [],
        shortages: [],
        notes: fields.initialNote ? [{ id: makeId("note"), date: fields.createdDate, createdAt: new Date().toISOString(), text: fields.initialNote }] : [],
      });
      onCreate(job);
      return;
    }
    const linkedDrafts = [
      ...additionalPcbas,
      ...(includeMechanicalAssembly ? ccaBuilds : []),
      ...(includeMechanicalAssembly && includeLru && lruBuild ? [lruBuild] : []),
    ];
    const linkedRequired: (keyof JobDraft)[] = [
      "customer",
      "jobNumber",
      "ksid",
      "pnName",
      "pn",
      "rev",
      "quantity",
      "contact",
      "status",
      "createdDate",
      "assemblyTurnDays",
    ];
    const incompleteLinked = linkedDrafts.some((draft) =>
      linkedRequired.some((key) => !String(draft.fields[key]).trim()),
    );
    const missingConfiguration = linkedDrafts.some(
      (draft) => draft.level !== "PCBA" && !draft.recipeId,
    );
    if (
      incompleteLinked ||
      missingConfiguration ||
      (includeMechanicalAssembly && !ccaBuilds.length) ||
      (includeLru && !lruBuild)
    ) {
      setScanState(
        "Complete the required fields and choose a configuration for every optional CCA and LRU build.",
      );
      return;
    }
    const familyId = makeId("project-family");
    const primaryJob: Job = {
      id: makeId("job"),
      buildLevel: "PCBA",
      familyId,
      assemblyRecipeId: "",
      assemblyRequirements: [],
      division,
      customer: fields.customer,
      jobNumber: fields.jobNumber,
      ksid: fields.ksid,
      pnName: fields.pnName,
      pn: fields.pn,
      rev: fields.rev,
      quantity: fields.quantity,
      projectType: fields.projectType as ProjectType,
      contact: fields.contact,
      dueDate: calculatedDueDate,
      customerDueDate: fields.customerDueDate,
      poNumber: fields.poNumber,
      quoteNumber: fields.quoteNumber,
      status: fields.status as JobStatus,
      specialProcesses: [
        polymerics ? "Polymerics" : "",
        externalTesting ? "External Testing" : "",
        faiReport ? "FAI Report" : "",
        otherProcess ? "Other" : "",
      ].filter(Boolean),
      otherSpecialProcess: otherProcess
        ? fields.otherSpecialProcess.trim()
        : "",
      otherSpecialProcessTurnDays: otherProcess
        ? Number(fields.otherSpecialProcessTurnDays)
        : 0,
      polymericsOptions: selectedPoly,
      createdDate: fields.createdDate,
      fabricationDockDate: "",
      pcbDockDate: "",
      pcbArrived: false,
      fabricationTurnDays: Number(fields.fabricationTurnDays),
      assemblyTurnDays: Number(fields.assemblyTurnDays),
      polymericsTurnDays: polymerics ? Number(fields.polymericsTurnDays) : 0,
      externalTestingTurnDays: externalTesting
        ? Number(fields.externalTestingTurnDays)
        : 0,
      allPartsReceivedDate: "",
      noShortageList: false,
      acceptedPartials: false,
      partialDeliveries: [],
      smtDays: Number(fields.smtDays),
      workflowCompleted: ["project-creation"],
      shortages: [],
      notes: fields.initialNote
        ? [
            {
              id: makeId("note"),
              date: fields.createdDate,
              createdAt: new Date().toISOString(),
              text: fields.initialNote,
            },
          ]
        : [],
    };
    const linkedJobs = linkedDrafts.map((draft): Job => {
      const recipe = recipes.find((item) => item.id === draft.recipeId);
      const draftFields = draft.fields;
      const mechanicalDays = Number(draftFields.assemblyTurnDays) || 0;
      return {
        id: makeId("job"),
        buildLevel: draft.level,
        familyId,
        assemblyRecipeId: recipe?.id ?? "",
        assemblyRequirements: recipe?.requirements.map((item) => ({
          ...item,
          id: makeId("job-requirement"),
        })) ?? [],
        division,
        customer: draftFields.customer,
        jobNumber: draftFields.jobNumber,
        ksid: draftFields.ksid,
        pnName: draftFields.pnName,
        pn: draftFields.pn,
        rev: draftFields.rev,
        quantity: draftFields.quantity,
        projectType: draftFields.projectType as ProjectType,
        contact: draftFields.contact,
        dueDate: addBusinessDays(draftFields.createdDate, mechanicalDays),
        customerDueDate: draftFields.customerDueDate,
        poNumber: draftFields.poNumber,
        quoteNumber: draftFields.quoteNumber,
        status:
          draft.level === "PCBA"
            ? (draftFields.status as JobStatus)
            : draft.level === "CCA"
              ? "Waiting for PCBA"
              : "Waiting for CCAs",
        specialProcesses: [],
        otherSpecialProcess: "",
        otherSpecialProcessTurnDays: 0,
        polymericsOptions: [],
        createdDate: draftFields.createdDate,
        fabricationDockDate: "",
        pcbDockDate: "",
        pcbArrived: false,
        fabricationTurnDays: Number(draftFields.fabricationTurnDays) || 0,
        assemblyTurnDays: mechanicalDays,
        polymericsTurnDays: 0,
        externalTestingTurnDays: 0,
        allPartsReceivedDate: "",
        noShortageList: false,
        acceptedPartials: false,
        partialDeliveries: [],
        smtDays: Number(draftFields.smtDays) || 1,
        workflowCompleted: ["project-creation"],
        shortages: [],
        notes: draftFields.initialNote
          ? [
              {
                id: makeId("note"),
                date: draftFields.createdDate,
                createdAt: new Date().toISOString(),
                text: draftFields.initialNote,
              },
            ]
          : [],
      };
    });
    onCreate([primaryJob, ...linkedJobs]);
  }

  function addLinkedBuild(level: BuildLevel) {
    const draft = linkedBuildDraft(level, fields);
    if (level === "PCBA") {
      setAdditionalPcbas((current) => [...current, draft]);
    } else if (level === "CCA") {
      setCcaBuilds((current) => [...current, draft]);
    } else {
      setLruBuild(draft);
    }
  }

  function updateDraft(
    draft: LinkedBuildDraft,
    change: Partial<LinkedBuildDraft>,
    fieldChange?: Partial<JobDraft>,
  ) {
    const updated = {
      ...draft,
      ...change,
      fields: { ...draft.fields, ...(fieldChange ?? {}) },
    };
    if (draft.level === "PCBA") {
      setAdditionalPcbas((current) =>
        current.map((item) => (item.id === draft.id ? updated : item)),
      );
    } else if (draft.level === "CCA") {
      setCcaBuilds((current) =>
        current.map((item) => (item.id === draft.id ? updated : item)),
      );
    } else {
      setLruBuild(updated);
    }
  }

  function selectDraftRecipe(draft: LinkedBuildDraft, recipeId: string) {
    const recipe = recipes.find((item) => item.id === recipeId);
    updateDraft(
      draft,
      { recipeId },
      recipe
        ? {
            pnName: draft.fields.pnName || recipe.name,
            pn: recipe.outputPn,
            rev: recipe.outputRev || draft.fields.rev,
          }
        : undefined,
    );
  }

  function copyFamilyDefaults(draft: LinkedBuildDraft) {
    updateDraft(draft, {}, {
      customer: fields.customer,
      contact: fields.contact,
      poNumber: fields.poNumber,
      quoteNumber: fields.quoteNumber,
      customerDueDate: fields.customerDueDate,
      createdDate: fields.createdDate,
    });
  }

  const fieldClass = (key: keyof JobDraft) =>
    missingFields.has(key) ? "missing-field" : "";
  const missingMark = (key: keyof JobDraft) =>
    missingFields.has(key) ? (
      <span className="missing-mark">★ Missing</span>
    ) : null;

  return (
    <div
      className="modal-layer"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <form
        className={`modal-card new-job-modal enhanced-job-form ${mechanicalBuild ? "mechanical-mode" : ""}`}
        onSubmit={submit}
        noValidate
      >
        <div className="modal-header">
          <div>
            <p className="section-kicker">Production booking</p>
            <h2>New project</h2>
            <p>
              Upload an Excel row or screenshot to prefill the form, then review
              the calculated schedule.
            </p>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Close"
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        <div className="smart-import">
          <span className="smart-import-icon">
            <ImageIcon />
          </span>
          <div>
            <strong>Auto-fill project</strong>
            <small>
              Excel or screenshot: headers run across columns and each row is
              treated as one complete job.
            </small>
            {scanState && <em>{scanState}</em>}
          </div>
          <button
            type="button"
            className="button secondary"
            onClick={() => uploadRef.current?.click()}
          >
            <Upload size={16} /> Upload Excel or screenshot
          </button>
          <input
            ref={uploadRef}
            type="file"
            hidden
            accept=".xlsx,.xls,.csv,image/*"
            onChange={importProject}
          />
        </div>
        <fieldset
          className={`division-picker ${divisionMissing ? "missing-field" : ""}`}
        >
          <legend>
            Business section{" "}
            {divisionMissing && <span className="missing-mark">★ Missing</span>}
          </legend>
          {(["Commercial", "Aerospace"] as Division[]).map((item) => (
            <label key={item} className={division === item ? "selected" : ""}>
              <input
                type="radio"
                checked={division === item && !divisionMissing}
                onChange={() => {
                  setDivision(item);
                  setDivisionMissing(false);
                }}
              />
              <span className={`division-icon ${item.toLowerCase()}`}>
                {item === "Commercial" ? <Factory /> : <Gauge />}
              </span>
              <span>
                <strong>{item}</strong>
                <small>Save in the {item} section</small>
              </span>
            </label>
          ))}
        </fieldset>
        <section className="mechanical-job-choice">
          <label className="mechanical-assembly-toggle">
            <input
              type="checkbox"
              checked={mechanicalBuild}
              onChange={(event) => {
                setMechanicalBuild(event.target.checked);
                setLinkedJobIds([]);
                setMechanicalRecipeId("");
                setField("projectType", event.target.checked ? "Assembly Only" : "New");
                setField("status", event.target.checked ? "Waiting for PCBA" : "Waiting on Parts");
              }}
            />
            <span>
              <strong>Mechanical Assembly Build</strong>
              <small>Create this entry as a separate CCA or LRU mechanical job.</small>
            </span>
          </label>
          {mechanicalBuild && (
            <div className="mechanical-level-setup">
              <fieldset className="assembly-level-picker">
                <legend>Mechanical build level</legend>
                {(["CCA", "LRU"] as const).map((level) => (
                  <label className={mechanicalLevel === level ? "selected" : ""} key={level}>
                    <input
                      type="radio"
                      checked={mechanicalLevel === level}
                      onChange={() => {
                        setMechanicalLevel(level);
                        setMechanicalRecipeId("");
                        setLinkedJobIds([]);
                        setField("status", level === "CCA" ? "Waiting for PCBA" : "Waiting for CCAs");
                      }}
                    />
                    <strong>{level} Level</strong>
                    <small>{level === "CCA" ? "Link completed PCBA jobs" : "Link completed CCA jobs"}</small>
                  </label>
                ))}
              </fieldset>
              <div className="linked-job-selector">
                <strong>Select linked {mechanicalLevel === "CCA" ? "PCBA" : "CCA"} jobs</strong>
                <small>Only jobs in the exact Customer Sub-Category / Folder are shown. Their PN# and REV become editable Assembly Config lines in this mechanical job.</small>
                {!fields.customer.trim() && <em>Enter the Customer Sub-Category / Folder first.</em>}
                {fields.customer.trim() && !eligibleLinkedJobs.length && <em>No eligible jobs are currently saved in this folder.</em>}
                {eligibleLinkedJobs.map((job) => (
                  <label key={job.id}>
                    <input
                      type="checkbox"
                      checked={linkedJobIds.includes(job.id)}
                      onChange={(event) => setLinkedJobIds((current) => event.target.checked ? [...current, job.id] : current.filter((id) => id !== job.id))}
                    />
                    <span><strong>Job #{job.jobNumber}</strong><small>{job.pnName} · PN {job.pn} · Rev {job.rev} · QTY {job.quantity}</small></span>
                    <em>{job.completedQuantity ?? 0} completed</em>
                  </label>
                ))}
              </div>
            </div>
          )}
        </section>
        <div className="job-form-grid">
          <label className={`wide ${fieldClass("customer")}`}>
            Customer Sub-Category / Folder {missingMark("customer")}
            <input
              list="new-project-customer-folders"
              value={fields.customer}
              onChange={(event) => setField("customer", event.target.value)}
              placeholder="Search an existing folder or enter a new customer"
            />
            <datalist id="new-project-customer-folders">
              {customerFolders.map((folder) => (
                <option key={folder} value={folder} />
              ))}
            </datalist>
            <small>
              Select an existing customer folder or type a new name to create one.
            </small>
          </label>
          <label className={fieldClass("jobNumber")}>
            {mechanicalBuild ? "MECH JOB #" : "Job #"} {missingMark("jobNumber")}
            <input
              value={fields.jobNumber}
              onChange={(event) => setField("jobNumber", event.target.value)}
            />
          </label>
          <label className={fieldClass("ksid")}>
            KSID {missingMark("ksid")}
            <input
              value={fields.ksid}
              onChange={(event) => setField("ksid", event.target.value)}
            />
          </label>
          <label className={`wide ${fieldClass("pnName")}`}>
            {mechanicalBuild ? `${mechanicalLevel} PN Name` : "PN Name"} {missingMark("pnName")}
            <input
              value={fields.pnName}
              onChange={(event) => setField("pnName", event.target.value)}
            />
          </label>
          <label className={fieldClass("pn")}>
            {mechanicalBuild ? `${mechanicalLevel} PN` : "PN"} {missingMark("pn")}
            <input
              value={fields.pn}
              onChange={(event) => setField("pn", event.target.value)}
              placeholder="Part number"
            />
          </label>
          <label className={fieldClass("rev")}>
            {mechanicalBuild ? `${mechanicalLevel} REV` : "Rev"} {missingMark("rev")}
            <input
              value={fields.rev}
              onChange={(event) => setField("rev", event.target.value)}
            />
          </label>
          <label className={fieldClass("quantity")}>
            QTY {missingMark("quantity")}
            <input
              inputMode="numeric"
              value={fields.quantity}
              onChange={(event) => setField("quantity", event.target.value)}
            />
          </label>
          <label className={fieldClass("projectType")}>
            Project Type {missingMark("projectType")}
            <select
              value={fields.projectType}
              onChange={(event) =>
                setField("projectType", event.target.value as ProjectType)
              }
            >
              <option value="">Select…</option>
              {projectTypes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className={fieldClass("contact")}>
            Contact {missingMark("contact")}
            <input
              value={fields.contact}
              onChange={(event) => setField("contact", event.target.value)}
            />
          </label>
          <label>
            Customer Due Date <span>(optional)</span>
            <input
              type="date"
              value={fields.customerDueDate}
              onChange={(event) =>
                setField("customerDueDate", event.target.value)
              }
            />
          </label>
          <label>
            PO# <span>(optional)</span>
            <input
              value={fields.poNumber}
              onChange={(event) => setField("poNumber", event.target.value)}
            />
          </label>
          <label>
            Quote# <span>(optional)</span>
            <input
              value={fields.quoteNumber}
              onChange={(event) => setField("quoteNumber", event.target.value)}
            />
          </label>
          <label className={fieldClass("status")}>
            Status {missingMark("status")}
            <select
              value={fields.status}
              onChange={(event) =>
                setField("status", event.target.value as JobStatus)
              }
            >
              <option value="">Select…</option>
              {jobStatuses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className={fieldClass("createdDate")}>
            Project Creation Date {missingMark("createdDate")}
            <input
              type="date"
              value={fields.createdDate}
              onChange={(event) => setField("createdDate", event.target.value)}
            />
          </label>
        </div>
        <section className="turn-time-section">
          <div>
            <p className="section-kicker">Business-day calculator</p>
            <h3>Due date turn times</h3>
            <p>
              Weekends, the listed U.S. holidays, and Christmas Eve are skipped.
            </p>
          </div>
          <div className="turn-time-grid">
            <label className={`pcba-turn ${fieldClass("fabricationTurnDays")}`}>
              Fabrication Turn Time {missingMark("fabricationTurnDays")}
              <input
                type="number"
                min="0"
                value={fields.fabricationTurnDays}
                onChange={(event) =>
                  setField("fabricationTurnDays", event.target.value)
                }
              />
              <small>business days</small>
            </label>
            <label className={fieldClass("assemblyTurnDays")}>
              {mechanicalBuild ? "Mechanical Assembly Turn Time" : "Assembly Turn Time"} {missingMark("assemblyTurnDays")}
              <input
                type="number"
                min="0"
                value={fields.assemblyTurnDays}
                onChange={(event) =>
                  setField("assemblyTurnDays", event.target.value)
                }
              />
              <small>business days</small>
            </label>
            <label className={`pcba-turn ${fieldClass("smtDays")}`}>
              SMT Turn Time {missingMark("smtDays")}
              <input
                type="number"
                min="1"
                value={fields.smtDays}
                onChange={(event) => setField("smtDays", event.target.value)}
              />
              <small>within assembly</small>
            </label>
          </div>
        </section>
        <fieldset className="process-picker">
          <legend>Special Processes</legend>
          <label>
            <input
              type="checkbox"
              checked={polymerics}
              onChange={(event) => {
                setPolymerics(event.target.checked);
                if (!event.target.checked)
                  setMissingFields((current) => {
                    const next = new Set(current);
                    next.delete("polymericsTurnDays");
                    return next;
                  });
              }}
            />{" "}
            Polymerics
          </label>
          <label>
            <input
              type="checkbox"
              checked={externalTesting}
              onChange={(event) => {
                setExternalTesting(event.target.checked);
                if (!event.target.checked)
                  setMissingFields((current) => {
                    const next = new Set(current);
                    next.delete("externalTestingTurnDays");
                    return next;
                  });
              }}
            />{" "}
            External Testing
          </label>
          <label>
            <input
              type="checkbox"
              checked={faiReport}
              onChange={(event) => setFaiReport(event.target.checked)}
            />{" "}
            FAI Report
          </label>
          <label>
            <input
              type="checkbox"
              checked={otherProcess}
              onChange={(event) => {
                setOtherProcess(event.target.checked);
                if (!event.target.checked)
                  setMissingFields((current) => {
                    const next = new Set(current);
                    next.delete("otherSpecialProcess");
                    next.delete("otherSpecialProcessTurnDays");
                    return next;
                  });
              }}
            />{" "}
            Other
          </label>
          {polymerics && (
            <div className="special-process-detail">
              <div className="polymerics-options">
                <span>Polymerics options</span>
                {polymericsOptions.map((item) => (
                  <label key={item}>
                    <input
                      type="checkbox"
                      checked={selectedPoly.includes(item)}
                      onChange={(event) =>
                        setSelectedPoly((current) =>
                          event.target.checked
                            ? [...current, item]
                            : current.filter((value) => value !== item),
                        )
                      }
                    />{" "}
                    {item}
                  </label>
                ))}
              </div>
              <label className={fieldClass("polymericsTurnDays")}>
                Polymerics Turn Time {missingMark("polymericsTurnDays")}
                <input
                  type="number"
                  min="0"
                  value={fields.polymericsTurnDays}
                  onChange={(event) =>
                    setField("polymericsTurnDays", event.target.value)
                  }
                />{" "}
                business days
              </label>
            </div>
          )}
          {externalTesting && (
            <div className="special-process-detail">
              <strong>External Testing</strong>
              <label className={fieldClass("externalTestingTurnDays")}>
                External Testing Turn Time{" "}
                {missingMark("externalTestingTurnDays")}
                <input
                  type="number"
                  min="0"
                  value={fields.externalTestingTurnDays}
                  onChange={(event) =>
                    setField("externalTestingTurnDays", event.target.value)
                  }
                />{" "}
                business days
              </label>
            </div>
          )}
          {otherProcess && (
            <div className="special-process-detail">
              <label className={fieldClass("otherSpecialProcess")}>
                Describe the other special process
                {missingMark("otherSpecialProcess")}
                <input
                  value={fields.otherSpecialProcess}
                  onChange={(event) =>
                    setField("otherSpecialProcess", event.target.value)
                  }
                  placeholder="Type the required process"
                />
              </label>
              <label className={fieldClass("otherSpecialProcessTurnDays")}>
                Other Turn Time {missingMark("otherSpecialProcessTurnDays")}
                <input
                  type="number"
                  min="0"
                  value={fields.otherSpecialProcessTurnDays}
                  onChange={(event) =>
                    setField("otherSpecialProcessTurnDays", event.target.value)
                  }
                />{" "}
                business days
              </label>
            </div>
          )}
        </fieldset>
        <div className="calculated-schedule">
          <div>
            <small>Total Turn Time</small>
            <strong>{totalTurnDays} business days</strong>
            <em>Fab + assembly + special processes</em>
          </div>
          <div className="calculated-due">
            <small>Calculated Due Date</small>
            <strong>{dateLabel(calculatedDueDate)}</strong>
            <em>
              {fields.customerDueDate
                ? `Customer due: ${dateLabel(fields.customerDueDate)}`
                : "No customer due date entered"}
            </em>
          </div>
        </div>
        <section className="linked-build-booking">
          <div className="linked-build-heading">
            <div>
              <p className="section-kicker">Optional Project Family</p>
              <h3>PCBA → CCA → LRU</h3>
              <p>
                Add only the linked builds needed for this project. Every entry becomes
                its own job and receives a separate shortage list.
              </p>
            </div>
            <button
              type="button"
              className="button secondary small"
              onClick={() => addLinkedBuild("PCBA")}
            >
              <Plus size={15} /> Add another PCBA
            </button>
          </div>
          {additionalPcbas.map((draft, index) => (
            <LinkedBuildDraftCard
              key={draft.id}
              draft={draft}
              index={index}
              recipes={recipes}
              onUpdate={(fieldChange) => updateDraft(draft, {}, fieldChange)}
              onRecipe={(recipeId) => selectDraftRecipe(draft, recipeId)}
              onCopyFamily={() => copyFamilyDefaults(draft)}
              onRemove={() =>
                setAdditionalPcbas((current) =>
                  current.filter((item) => item.id !== draft.id),
                )
              }
            />
          ))}
          <label className="mechanical-assembly-toggle">
            <input
              type="checkbox"
              checked={includeMechanicalAssembly}
              onChange={(event) => {
                const checked = event.target.checked;
                setIncludeMechanicalAssembly(checked);
                if (checked && !ccaBuilds.length) addLinkedBuild("CCA");
                if (!checked) {
                  setIncludeLru(false);
                  setLruBuild(null);
                }
              }}
            />
            <span>
              <strong>Add Mechanical Assembly</strong>
              <small>Add one or more optional CCA builds after PCBA production.</small>
            </span>
          </label>
          {includeMechanicalAssembly && (
            <div className="assembly-booking-stage">
              <div className="assembly-stage-title">
                <div>
                  <span className="build-level-badge cca">CCA</span>
                  <strong>CCA Mechanical Assembly</strong>
                  <small>Each CCA uses its selected PCBA configuration.</small>
                </div>
                <button type="button" className="button secondary small" onClick={() => addLinkedBuild("CCA")}>
                  <Plus size={15} /> Add another CCA
                </button>
              </div>
              {ccaBuilds.map((draft, index) => (
                <LinkedBuildDraftCard
                  key={draft.id}
                  draft={draft}
                  index={index}
                  recipes={recipes}
                  onUpdate={(fieldChange) => updateDraft(draft, {}, fieldChange)}
                  onRecipe={(recipeId) => selectDraftRecipe(draft, recipeId)}
                  onCopyFamily={() => copyFamilyDefaults(draft)}
                  onRemove={() =>
                    setCcaBuilds((current) =>
                      current.filter((item) => item.id !== draft.id),
                    )
                  }
                />
              ))}
              <label className="mechanical-assembly-toggle lru-toggle">
                <input
                  type="checkbox"
                  checked={includeLru}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setIncludeLru(checked);
                    if (checked && !lruBuild) addLinkedBuild("LRU");
                    if (!checked) setLruBuild(null);
                  }}
                />
                <span>
                  <strong>Build these CCAs into an LRU</strong>
                  <small>Optional final chassis assembly using the selected LRU configuration.</small>
                </span>
              </label>
              {includeLru && lruBuild && (
                <LinkedBuildDraftCard
                  draft={lruBuild}
                  index={0}
                  recipes={recipes}
                  onUpdate={(fieldChange) => updateDraft(lruBuild, {}, fieldChange)}
                  onRecipe={(recipeId) => selectDraftRecipe(lruBuild, recipeId)}
                  onCopyFamily={() => copyFamilyDefaults(lruBuild)}
                  onRemove={() => {
                    setIncludeLru(false);
                    setLruBuild(null);
                  }}
                />
              )}
            </div>
          )}
        </section>
        <label className="initial-note">
          Initial dated note <span>(optional)</span>
          <textarea
            rows={3}
            value={fields.initialNote}
            onChange={(event) => setField("initialNote", event.target.value)}
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="button ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary">
            <Plus size={16} /> Create Project Family
          </button>
        </div>
      </form>
    </div>
  );
}

function LinkedBuildDraftCard({
  draft,
  index,
  recipes,
  onUpdate,
  onRecipe,
  onCopyFamily,
  onRemove,
}: {
  draft: LinkedBuildDraft;
  index: number;
  recipes: AssemblyRecipe[];
  onUpdate: (change: Partial<JobDraft>) => void;
  onRecipe: (recipeId: string) => void;
  onCopyFamily: () => void;
  onRemove: () => void;
}) {
  const matchingRecipes = recipes.filter(
    (recipe) => recipe.outputLevel === draft.level,
  );
  const selectedRecipe = matchingRecipes.find(
    (recipe) => recipe.id === draft.recipeId,
  );
  const required = (key: keyof JobDraft) =>
    !String(draft.fields[key]).trim() ? "missing-field" : "";
  const set = <Key extends keyof JobDraft>(key: Key, value: JobDraft[Key]) =>
    onUpdate({ [key]: value } as Partial<JobDraft>);

  return (
    <article className={`linked-build-card ${draft.level.toLowerCase()}`}>
      <header>
        <div>
          <span className={`build-level-badge ${draft.level.toLowerCase()}`}>
            {draft.level}
          </span>
          <strong>
            {draft.level} Build {index + 1}
          </strong>
          <small>
            {draft.level === "PCBA"
              ? "Additional PCBA in this Project Family"
              : "Optional mechanical assembly job"}
          </small>
        </div>
        <div className="linked-build-actions">
          <button type="button" className="button ghost small" onClick={onCopyFamily}>
            <Copy size={14} /> Copy family defaults
          </button>
          <button type="button" className="icon-button" aria-label={`Remove ${draft.level} build`} onClick={onRemove}>
            <Trash2 size={16} />
          </button>
        </div>
      </header>
      {draft.level !== "PCBA" && (
        <div className="linked-config-select">
          <label className={!draft.recipeId ? "missing-field" : ""}>
            {draft.level} Configuration
            <select value={draft.recipeId} onChange={(event) => onRecipe(event.target.value)}>
              <option value="">Select saved configuration…</option>
              {matchingRecipes.map((recipe) => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.name} · {recipe.outputPn}
                </option>
              ))}
            </select>
          </label>
          {selectedRecipe ? (
            <div className="linked-recipe-preview">
              {selectedRecipe.requirements.map((item) => (
                <span key={item.id}>
                  {item.quantityPerAssembly}× {item.inputLevel} {item.pn}
                  {item.rev ? ` Rev ${item.rev}` : ""}
                </span>
              ))}
            </div>
          ) : (
            <small>
              Save {draft.level} recipes in Assembly Configuration before booking.
            </small>
          )}
        </div>
      )}
      <div className="job-form-grid linked-job-grid">
        <label className={`wide ${required("customer")}`}>
          Customer Sub-Category / Folder
          <input value={draft.fields.customer} onChange={(event) => set("customer", event.target.value)} />
        </label>
        <label className={required("jobNumber")}>
          Job #
          <input value={draft.fields.jobNumber} onChange={(event) => set("jobNumber", event.target.value)} />
        </label>
        <label className={required("ksid")}>
          KSID
          <input value={draft.fields.ksid} onChange={(event) => set("ksid", event.target.value)} />
        </label>
        <label className={`wide ${required("pnName")}`}>
          PN Name
          <input value={draft.fields.pnName} onChange={(event) => set("pnName", event.target.value)} />
        </label>
        <label className={required("pn")}>
          PN#
          <input value={draft.fields.pn} onChange={(event) => set("pn", event.target.value)} />
        </label>
        <label className={required("rev")}>
          Rev
          <input value={draft.fields.rev} onChange={(event) => set("rev", event.target.value)} />
        </label>
        <label className={required("quantity")}>
          QTY
          <input inputMode="numeric" value={draft.fields.quantity} onChange={(event) => set("quantity", event.target.value)} />
        </label>
        <label>
          Project Type
          <select value={draft.fields.projectType} onChange={(event) => set("projectType", event.target.value as ProjectType)}>
            {projectTypes.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className={required("contact")}>
          Contact
          <input value={draft.fields.contact} onChange={(event) => set("contact", event.target.value)} />
        </label>
        <label>
          Customer Due Date <span>(optional)</span>
          <input type="date" value={draft.fields.customerDueDate} onChange={(event) => set("customerDueDate", event.target.value)} />
        </label>
        <label>
          PO# <span>(inherited, editable)</span>
          <input value={draft.fields.poNumber} onChange={(event) => set("poNumber", event.target.value)} />
        </label>
        <label>
          Quote# <span>(inherited, editable)</span>
          <input value={draft.fields.quoteNumber} onChange={(event) => set("quoteNumber", event.target.value)} />
        </label>
        <label className={required("createdDate")}>
          Project Creation Date
          <input type="date" value={draft.fields.createdDate} onChange={(event) => set("createdDate", event.target.value)} />
        </label>
        <label className={required("assemblyTurnDays")}>
          {draft.level === "PCBA" ? "Assembly Turn Time" : "Mechanical Assembly Turn Time"}
          <input type="number" min="0" value={draft.fields.assemblyTurnDays} onChange={(event) => set("assemblyTurnDays", event.target.value)} />
        </label>
        {draft.level === "PCBA" && (
          <>
            <label>
              Fabrication Turn Time
              <input type="number" min="0" value={draft.fields.fabricationTurnDays} onChange={(event) => set("fabricationTurnDays", event.target.value)} />
            </label>
            <label>
              SMT Turn Time
              <input type="number" min="1" value={draft.fields.smtDays} onChange={(event) => set("smtDays", event.target.value)} />
            </label>
          </>
        )}
        <label className="wide">
          Initial Note <span>(optional)</span>
          <input value={draft.fields.initialNote} onChange={(event) => set("initialNote", event.target.value)} />
        </label>
      </div>
    </article>
  );
}

function JobDrawer({
  job,
  jobs,
  recipes,
  onClose,
  onOpen,
  onUpdate,
  onDelete,
  notify,
}: {
  job: Job;
  jobs: Job[];
  recipes: AssemblyRecipe[];
  onClose: () => void;
  onOpen: (id: string) => void;
  onUpdate: (change: Partial<Job>) => void;
  onDelete: () => void;
  notify: (message: string) => void;
}) {
  const [noteDate, setNoteDate] = useState(chicagoDateKey());
  const [noteText, setNoteText] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [editingDetails, setEditingDetails] = useState(false);
  const [partialQty, setPartialQty] = useState("");
  const [partialDueDate, setPartialDueDate] = useState("");
  const [partialComments, setPartialComments] = useState("");
  const [releaseDate, setReleaseDate] = useState(chicagoDateKey());
  const [releaseQuantity, setReleaseQuantity] = useState("");
  const [completedQuantityDraft, setCompletedQuantityDraft] = useState(String(job.completedQuantity ?? 0));
  const [shortageScanState, setShortageScanState] = useState("");
  const shortageUploadRef = useRef<HTMLInputElement>(null);
  const shortageDue = addBusinessDays(job.createdDate, 3);
  const buildLevel = jobBuildLevel(job);
  const familyJobs = jobs.filter(
    (candidate) =>
      candidate.id === job.id ||
      job.linkedJobIds?.includes(candidate.id) ||
      candidate.linkedJobIds?.includes(job.id),
  );
  const linkedMechanicalJobs = jobs.filter(
    (candidate) => candidate.linkedJobIds?.includes(job.id),
  );
  const requirementProgress = assemblyRequirementProgress(job, linkedJobsFor(job, jobs));
  const assemblyRecipe = recipes.find((recipe) => recipe.id === job.assemblyRecipeId);
  const buildableQuantity = buildableAssemblyQuantity(job, jobs);
  const scheduledQuantity = (job.mechanicalShipments ?? []).reduce((sum, batch) => sum + Number(batch.quantity || 0), 0);
  const completedShipmentQuantity = (job.mechanicalShipments ?? []).filter((batch) => batch.completed).reduce((sum, batch) => sum + Number(batch.quantity || 0), 0);
  const remainingQuantity = Math.max(0, quantityNumber(job.quantity) - (job.completedQuantity ?? 0));
  useEffect(() => {
    setCompletedQuantityDraft(String(job.completedQuantity ?? 0));
  }, [job.id, job.completedQuantity]);
  const shipmentDates = (job.mechanicalShipments ?? []).reduce<string[]>((dates, batch, index) => {
    const baseDate = index === 0 ? latestLinkedReleaseDate(job, jobs) : dates[index - 1];
    dates.push(batch.dockDateOverride || addBusinessDays(baseDate, batch.mechanicalTurnDays));
    return dates;
  }, []);
  const readyDate = materialsReadyDate(job);
  const kittingDue = addBusinessDays(readyDate, 1);
  const smtDue = addBusinessDays(kittingDue, job.smtDays);
  const assemblyDue = addBusinessDays(readyDate, job.assemblyTurnDays);
  let processCursor = assemblyDue;
  const polymericsDue = job.specialProcesses.includes("Polymerics")
    ? (processCursor = addBusinessDays(processCursor, job.polymericsTurnDays))
    : "";
  const externalTestingDue = job.specialProcesses.includes("External Testing")
    ? (processCursor = addBusinessDays(
        processCursor,
        job.externalTestingTurnDays,
      ))
    : "";
  const otherProcessDue = job.specialProcesses.includes("Other")
    ? (processCursor = addBusinessDays(
        processCursor,
        job.otherSpecialProcessTurnDays,
      ))
    : "";
  const computedKryptonDockDate =
    buildLevel === "PCBA"
      ? kryptonDockDate(job)
      : job.kryptonDockDateOverride || shipmentDates.at(-1) || job.dueDate;
  type Milestone = {
    key: string;
    name: string;
    date: string;
    rule: string;
    done: boolean;
    checkOnly?: boolean;
    locked?: boolean;
  };
  const pcbaMilestones: Milestone[] = [
    {
      key: "project-creation",
      name: "Project Creation",
      date: job.createdDate,
      rule: "Booked date",
      done: true,
    },
    {
      key: "shortage-list",
      name: "Shortage List",
      date:
        job.noShortageList ||
        (job.shortages.length > 0 &&
          job.shortages.every((item) => item.complete))
          ? job.allPartsReceivedDate
          : shortageDue,
      rule:
        job.noShortageList ||
        (job.shortages.length > 0 &&
          job.shortages.every((item) => item.complete))
          ? `Completed${job.allPartsReceivedDate ? ` ${dateLabel(job.allPartsReceivedDate)}` : ""}`
          : "3 business days from project creation",
      done:
        job.workflowCompleted.includes("shortage-list") ||
        job.noShortageList ||
        (job.shortages.length > 0 &&
          job.shortages.every((item) => item.complete)),
    },
    {
      key: "fabrication-dock",
      name: "Fabrication",
      date: "",
      rule: "Check when fabrication is complete",
      done: job.workflowCompleted.includes("fabrication-dock"),
      checkOnly: true,
    },
    {
      key: "pcb-arrived",
      name: "PCB Dock Date",
      date: job.pcbDockDate,
      rule: job.pcbDockDate
        ? "Confirm the PCB arrived"
        : "Enter the PCB Dock Date below",
      done: job.workflowCompleted.includes("pcb-arrived") || job.pcbArrived,
    },
    {
      key: "kitting",
      name: "Kitting Assembly",
      date: kittingDue,
      rule: "1 business day after PCBs and all components are available",
      done: job.workflowCompleted.includes("kitting"),
    },
    {
      key: "smt",
      name: "SMT Process",
      date: smtDue,
      rule: `${job.smtDays} day${job.smtDays === 1 ? "" : "s"} selected`,
      done:
        job.workflowCompleted.includes("smt") ||
        [
          "Visual QC",
          "Testing",
          "Rework",
          "Shipping QC",
          "Complete",
        ].includes(job.status),
    },
    ...(job.specialProcesses.includes("Polymerics")
      ? [
          {
            key: "polymerics",
            name: "Polymerics",
            date: polymericsDue,
            rule: `${job.polymericsTurnDays} business day${job.polymericsTurnDays === 1 ? "" : "s"}`,
            done:
              job.workflowCompleted.includes("polymerics") ||
              job.status === "Complete",
          },
        ]
      : []),
    ...(job.specialProcesses.includes("External Testing")
      ? [
          {
            key: "external-testing",
            name: "External Testing",
            date: externalTestingDue,
            rule: `${job.externalTestingTurnDays} business day${job.externalTestingTurnDays === 1 ? "" : "s"}`,
            done:
              job.workflowCompleted.includes("external-testing") ||
              job.status === "Complete",
          },
        ]
      : []),
    ...(job.specialProcesses.includes("FAI Report")
      ? [
          {
            key: "fai-report",
            name: "FAI Report",
            date: computedKryptonDockDate,
            rule: "Required special process",
            done:
              job.workflowCompleted.includes("fai-report") ||
              job.status === "Complete",
          },
        ]
      : []),
    ...(job.specialProcesses.includes("Other")
      ? [
          {
            key: "other-special-process",
            name: job.otherSpecialProcess || "Other Special Process",
            date: otherProcessDue,
            rule: `${job.otherSpecialProcessTurnDays} business day${job.otherSpecialProcessTurnDays === 1 ? "" : "s"}`,
            done:
              job.workflowCompleted.includes("other-special-process") ||
              job.status === "Complete",
          },
        ]
      : []),
    {
      key: "krypton-dock",
      name: "Krypton Dock Date",
      date: computedKryptonDockDate,
      rule:
        `${kryptonDockDriver(job)} · then adds assembly and special-process turn times`,
      done:
        job.workflowCompleted.includes("krypton-dock") ||
        job.status === "Complete",
    },
    ...jobs
      .filter((candidate) => candidate.linkedJobIds?.includes(job.id))
      .map((candidate) => ({
        key: `mechanical-release-${candidate.id}`,
        name: `Ready for ${jobBuildLevel(candidate)} Mechanical Assembly for MECH JOB #${candidate.jobNumber}`,
        date: (job.quantityReleases ?? []).at(-1)?.date ?? "",
        rule: `${job.completedQuantity ?? 0} completed QTY available · open the MECH JOB from Production Status`,
        done: (job.completedQuantity ?? 0) > 0,
        checkOnly: true,
        locked: true,
      })),
  ];
  const assemblyInputsReady = buildableQuantity > 0;
  const milestones: Milestone[] =
    buildLevel === "PCBA"
      ? pcbaMilestones
      : [
          {
            key: "assembly-inputs",
            name: buildLevel === "CCA" ? "PCBA Completion" : "CCA Completion",
            date: latestLinkedReleaseDate(job, jobs),
            rule: assemblyInputsReady
              ? `${buildableQuantity} ${buildLevel}${buildableQuantity === 1 ? "" : "s"} currently buildable`
              : `Waiting for released ${buildLevel === "CCA" ? "PCBA" : "CCA"} quantities`,
            done: assemblyInputsReady,
            checkOnly: true,
            locked: true,
          },
          {
            key: "shortage-list",
            name: "Shortage List Completion",
            date:
              job.noShortageList ||
              (job.shortages.length > 0 && job.shortages.every((item) => item.complete))
                ? job.allPartsReceivedDate
                : shortageDue,
            rule:
              job.noShortageList ||
              (job.shortages.length > 0 && job.shortages.every((item) => item.complete))
                ? `Completed${job.allPartsReceivedDate ? ` ${dateLabel(job.allPartsReceivedDate)}` : ""}`
                : "Complete or waive the mechanical job shortage list",
            done:
              job.workflowCompleted.includes("shortage-list") ||
              job.noShortageList ||
              (job.shortages.length > 0 && job.shortages.every((item) => item.complete)),
          },
          {
            key: "mechanical-assembly",
            name:
              buildLevel === "CCA"
                ? "CCA Mechanical Assembly"
                : "LRU Mechanical Assembly",
            date: job.dueDate,
            rule: `${(job.mechanicalShipments ?? []).length} scheduled shipment batch${(job.mechanicalShipments ?? []).length === 1 ? "" : "es"}`,
            done:
              job.workflowCompleted.includes("mechanical-assembly") ||
              job.status === "Complete",
            locked:
              !job.workflowCompleted.includes("mechanical-assembly") &&
              (!assemblyInputsReady || !assemblyShortagesReady(job)),
          },
          {
            key: "krypton-dock",
            name: `${buildLevel} Dock Date`,
            date: computedKryptonDockDate,
            rule: "Final tracking and closeout for this assembly job",
            done:
              job.workflowCompleted.includes("krypton-dock") ||
              job.status === "Complete",
          },
        ];
  function toggleMilestone(key: string) {
    if (key === "assembly-inputs") return;
    const completed = job.workflowCompleted.includes(key);
    onUpdate({
      workflowCompleted: completed
        ? job.workflowCompleted.filter((item) => item !== key)
        : [...job.workflowCompleted, key],
      ...(key === "kitting" && completed
        ? { allPartsReceivedDate: "" }
        : {}),
      ...(key === "smt" && !completed ? { status: "TH ASSY" as JobStatus } : {}),
      ...(key === "krypton-dock"
        ? { status: completed ? "Shipping QC" : "Complete" }
        : {}),
      ...(key === "mechanical-assembly"
        ? {
            status: completed
              ? (assemblyInputsReady && assemblyShortagesReady(job)
                  ? "Ready for Mechanical Assembly"
                  : buildLevel === "CCA"
                    ? "Waiting for PCBA"
                    : "Waiting for CCAs")
              : "Shipping QC",
          }
        : {}),
    });
  }
  function updateTrackingInformation(value: string) {
    const trackingInformation = value;
    const hasTracking = value.trim().length > 0;
    onUpdate({
      trackingInformation,
      ...(hasTracking
        ? {
            status: "Complete",
            workflowCompleted: Array.from(
              new Set([...job.workflowCompleted, "krypton-dock"]),
            ),
          }
        : {}),
    });
    if (hasTracking && job.status !== "Complete") {
      notify("Tracking saved. Krypton Dock Date checked and job moved to Completed.");
    }
  }
  function submitQuantityRelease(event: FormEvent) {
    event.preventDefault();
    const releasedQuantity = Math.max(0, Math.floor(Number(releaseQuantity) || 0));
    const currentCompleted = job.completedQuantity ?? 0;
    const remaining = Math.max(0, quantityNumber(job.quantity) - currentCompleted);
    if (!releasedQuantity) {
      notify("Enter the completed QTY to release.");
      return;
    }
    if (!releaseDate) {
      notify("Select a release date.");
      return;
    }
    if (releasedQuantity > remaining) {
      notify(`Only QTY ${remaining} remains available to release.`);
      return;
    }
    const completedQuantity = currentCompleted + releasedQuantity;
    const quantityReleases = [
      ...(job.quantityReleases ?? []),
      {
        id: makeId("quantity-release"),
        quantity: releasedQuantity,
        date: releaseDate,
      },
    ];
    onUpdate({
      completedQuantity,
      quantityReleases,
      status:
        completedQuantity >= quantityNumber(job.quantity)
          ? "Complete"
          : job.status === "Complete"
            ? "Shipping QC"
            : job.status,
    });
    setReleaseQuantity("");
    notify(`QTY ${releasedQuantity} was released on ${dateLabel(releaseDate)}.`);
  }
  function saveCompletedQuantity() {
    if (completedQuantityDraft === "") {
      notify("Completed QTY is missing.");
      return;
    }
    const totalQuantity = quantityNumber(job.quantity);
    const completedQuantity = Math.min(totalQuantity, Math.max(0, Math.floor(Number(completedQuantityDraft) || 0)));
    const existingReleases = [...(job.quantityReleases ?? [])];
    let quantityReleases: QuantityRelease[] = [];
    if (completedQuantity > 0) {
      let remaining = completedQuantity;
      quantityReleases = existingReleases.flatMap((release) => {
        if (remaining <= 0) return [];
        const quantity = Math.min(release.quantity, remaining);
        remaining -= quantity;
        return quantity > 0 ? [{ ...release, quantity }] : [];
      });
      if (remaining > 0) {
        if (quantityReleases.length) {
          const lastIndex = quantityReleases.length - 1;
          quantityReleases[lastIndex] = {
            ...quantityReleases[lastIndex],
            quantity: quantityReleases[lastIndex].quantity + remaining,
          };
        } else {
          quantityReleases.push({ id: makeId("quantity-release"), quantity: remaining, date: releaseDate || chicagoDateKey() });
        }
      }
    }
    onUpdate({
      completedQuantity,
      quantityReleases,
      status: completedQuantity >= totalQuantity
        ? "Complete"
        : job.status === "Complete" ? "Shipping QC" : job.status,
    });
    setCompletedQuantityDraft(String(completedQuantity));
    notify(`Completed QTY corrected to ${completedQuantity}.`);
  }
  function addMechanicalShipment() {
    onUpdate({
      mechanicalShipments: [
        ...(job.mechanicalShipments ?? []),
        {
          id: makeId("mechanical-shipment"),
          quantity: 1,
          mechanicalTurnDays: job.assemblyTurnDays || 1,
          dockDateOverride: "",
          completed: false,
          trackingInformation: "",
        },
      ],
    });
  }
  function updateAssemblyRequirement(
    id: string,
    change: Partial<AssemblyRequirement>,
  ) {
    onUpdate({
      assemblyRequirements: (job.assemblyRequirements ?? []).map((requirement) =>
        requirement.id === id ? { ...requirement, ...change } : requirement,
      ),
    });
  }
  function updateMechanicalShipment(id: string, change: Partial<MechanicalShipment>) {
    const mechanicalShipments = (job.mechanicalShipments ?? []).map((batch) =>
      batch.id === id ? { ...batch, ...change } : batch,
    );
    const completedQuantity = mechanicalShipments.filter((batch) => batch.completed).reduce((sum, batch) => sum + Number(batch.quantity || 0), 0);
    const calculatedDates = mechanicalShipments.reduce<string[]>((dates, batch, index) => {
      const base = index === 0 ? latestLinkedReleaseDate(job, jobs) : dates[index - 1];
      dates.push(batch.dockDateOverride || addBusinessDays(base, batch.mechanicalTurnDays));
      return dates;
    }, []);
    const quantityReleases = mechanicalShipments
      .map((batch, index) => ({ batch, index }))
      .filter(({ batch }) => batch.completed)
      .map(({ batch, index }) => ({ id: `shipment-release-${batch.id}`, quantity: Number(batch.quantity || 0), date: calculatedDates[index] }));
    onUpdate({
      mechanicalShipments,
      completedQuantity,
      quantityReleases,
      ...(completedQuantity >= quantityNumber(job.quantity) ? { status: "Complete" as JobStatus } : {}),
    });
  }
  function removeMechanicalShipment(id: string) {
    const mechanicalShipments = (job.mechanicalShipments ?? []).filter((batch) => batch.id !== id);
    const completedQuantity = mechanicalShipments
      .filter((batch) => batch.completed)
      .reduce((sum, batch) => sum + Number(batch.quantity || 0), 0);
    const calculatedDates = mechanicalShipments.reduce<string[]>((dates, batch, index) => {
      const base = index === 0 ? latestLinkedReleaseDate(job, jobs) : dates[index - 1];
      dates.push(batch.dockDateOverride || addBusinessDays(base, batch.mechanicalTurnDays));
      return dates;
    }, []);
    const quantityReleases = mechanicalShipments
      .map((batch, index) => ({ batch, index }))
      .filter(({ batch }) => batch.completed)
      .map(({ batch, index }) => ({ id: `shipment-release-${batch.id}`, quantity: Number(batch.quantity || 0), date: calculatedDates[index] }));
    onUpdate({
      mechanicalShipments,
      completedQuantity,
      quantityReleases,
      ...(job.status === "Complete" && completedQuantity < quantityNumber(job.quantity)
        ? { status: "Shipping QC" as JobStatus }
        : {}),
    });
    notify("Shipment batch removed.");
  }
  function addPartialDelivery(event: FormEvent) {
    event.preventDefault();
    if (!partialQty.trim() || !partialDueDate) return;
    const quantity = Math.max(0, Math.floor(Number(partialQty) || 0));
    const bookedQuantity = job.partialDeliveries.reduce(
      (sum, partial) => sum + Math.max(0, Number(partial.quantity) || 0),
      0,
    );
    const availableToBook = Math.max(0, quantityNumber(job.quantity) - bookedQuantity);
    if (!quantity) {
      notify("Enter a valid partial shipment QTY.");
      return;
    }
    if (quantity > availableToBook) {
      notify(`Only QTY ${availableToBook} remains available to book.`);
      return;
    }
    onUpdate({
      acceptedPartials: true,
      partialDeliveries: [
        ...job.partialDeliveries,
        {
          id: makeId("partial"),
          quantity: String(quantity),
          dueDate: partialDueDate,
          comments: partialComments.trim(),
          completed: false,
        },
      ],
    });
    setPartialQty("");
    setPartialDueDate("");
    setPartialComments("");
    notify("Accepted partial delivery added.");
  }

  function updatePartialCompletion(id: string, completed: boolean) {
    const partialDeliveries = job.partialDeliveries.map((partial) =>
      partial.id === id ? { ...partial, completed } : partial,
    );
    const completedQuantity = partialDeliveries
      .filter((partial) => partial.completed)
      .reduce((sum, partial) => sum + Math.max(0, Number(partial.quantity) || 0), 0);
    const allQuantityCompleted =
      quantityNumber(job.quantity) > 0 &&
      completedQuantity >= quantityNumber(job.quantity);
    const workflowCompleted = allQuantityCompleted
      ? Array.from(new Set([...job.workflowCompleted, "krypton-dock"]))
      : job.workflowCompleted.filter((item) => item !== "krypton-dock");
    onUpdate({
      partialDeliveries,
      completedQuantity,
      workflowCompleted,
      ...(allQuantityCompleted
        ? { status: "Complete" as JobStatus }
        : job.status === "Complete"
          ? { status: "Shipping QC" as JobStatus }
          : {}),
    });
    if (allQuantityCompleted) {
      notify("All project QTY completed. Krypton Dock Date is complete.");
    }
  }

  function removePartialDelivery(id: string) {
    const partialDeliveries = job.partialDeliveries.filter(
      (partial) => partial.id !== id,
    );
    const completedQuantity = partialDeliveries
      .filter((partial) => partial.completed)
      .reduce((sum, partial) => sum + Math.max(0, Number(partial.quantity) || 0), 0);
    const allQuantityCompleted =
      quantityNumber(job.quantity) > 0 &&
      completedQuantity >= quantityNumber(job.quantity);
    onUpdate({
      partialDeliveries,
      completedQuantity,
      workflowCompleted: allQuantityCompleted
        ? Array.from(new Set([...job.workflowCompleted, "krypton-dock"]))
        : job.workflowCompleted.filter((item) => item !== "krypton-dock"),
      ...(job.status === "Complete" && !allQuantityCompleted
        ? { status: "Shipping QC" as JobStatus }
        : {}),
    });
  }
  function addNote(event: FormEvent) {
    event.preventDefault();
    if (!noteText.trim()) return;
    onUpdate({
      notes: [
        {
          id: makeId("note"),
          date: noteDate,
          createdAt: new Date().toISOString(),
          text: noteText.trim(),
        },
        ...job.notes,
      ],
    });
    setNoteText("");
    notify("Note saved with timestamp.");
  }
  function startEditingNote(note: DailyNote) {
    setEditingNoteId(note.id);
    setEditingNoteText(note.text);
  }
  function saveEditedNote(noteId: string) {
    if (!editingNoteText.trim()) return;
    onUpdate({
      notes: job.notes.map((note) =>
        note.id === noteId ? { ...note, text: editingNoteText.trim() } : note,
      ),
    });
    setEditingNoteId(null);
    setEditingNoteText("");
    notify("Note updated.");
  }
  function deleteNote(noteId: string) {
    onUpdate({ notes: job.notes.filter((note) => note.id !== noteId) });
    if (editingNoteId === noteId) {
      setEditingNoteId(null);
      setEditingNoteText("");
    }
    notify("Note deleted.");
  }
  async function uploadShortages(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setShortageScanState(
      file.type.startsWith("image/")
        ? "Scanning shortage screenshot…"
        : "Reading shortage spreadsheet…",
    );
    try {
      const items = await parseShortageFile(file);
      onUpdate({
        shortages: reconcileShortageComments(
          [...job.shortages, ...items],
          job.pcbDockDate,
          job.createdDate,
        ),
        noShortageList: false,
        allPartsReceivedDate: "",
        status: job.status === "Kitting" ? "Waiting on Parts" : job.status,
        workflowCompleted: job.workflowCompleted.filter(
          (item) => item !== "shortage-list",
        ),
      });
      setShortageScanState(
        `${items.length} row${items.length === 1 ? "" : "s"} added. Review and complete any missing fields.`,
      );
      notify(
        `${items.length} shortage item${items.length === 1 ? "" : "s"} imported.`,
      );
    } catch {
      setShortageScanState(
        "The upload could not be read. Add the shortage rows manually below.",
      );
    }
    event.target.value = "";
  }
  function setSpecialProcess(name: string, enabled: boolean) {
    const specialProcesses = enabled
      ? Array.from(new Set([...job.specialProcesses, name]))
      : job.specialProcesses.filter((item) => item !== name);
    onUpdate({
      specialProcesses,
      dueDate: calculatedJobDueDate(job, { specialProcesses }),
    });
  }
  function setPolymericsOption(option: PolymericsOption, enabled: boolean) {
    onUpdate({
      polymericsOptions: enabled
        ? Array.from(new Set([...job.polymericsOptions, option]))
        : job.polymericsOptions.filter((item) => item !== option),
    });
  }
  return (
    <div
      className="drawer-layer"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <aside className={`job-drawer ${buildLevel !== "PCBA" ? "mechanical-job-drawer" : ""}`}>
        <div className="drawer-header">
          <div>
            <p className="section-kicker">
              {job.division} / {job.customer}
            </p>
            <div className="job-title-with-level">
              <h2>Job #{job.jobNumber}</h2>
              <span className={`build-level-badge ${buildLevel.toLowerCase()}`}>
                {buildLevel}
              </span>
            </div>
            <span>
              {job.pnName} · PN {job.pn || "—"} · Rev {job.rev} · QTY {job.quantity || "—"}
            </span>
            {editingDetails && (
              <label className="header-dock-date-field">
                Krypton Dock Date
                <input
                  type="date"
                  value={job.kryptonDockDateOverride || computedKryptonDockDate}
                  onChange={(event) =>
                    onUpdate({ kryptonDockDateOverride: event.target.value })
                  }
                  aria-label="Edit Krypton Dock Date"
                />
              </label>
            )}
          </div>
          <div className="drawer-header-actions">
            <button
              className={`button small ${editingDetails ? "primary" : "secondary"}`}
              onClick={() => setEditingDetails((current) => !current)}
            >
              <Settings2 size={15} />
              {editingDetails ? "Done editing" : "Edit job details"}
            </button>
            <button
              className="icon-button"
              aria-label="Close"
              onClick={onClose}
            >
              <X />
            </button>
          </div>
        </div>
        <div className="drawer-body">
          <section className="job-summary-strip">
            <div>
              <small>KSID</small>
              <strong>{job.ksid}</strong>
            </div>
            <div>
              <small>PO#</small>
              <strong>{job.poNumber || "—"}</strong>
            </div>
            <div>
              <small>Quote#</small>
              <strong>{job.quoteNumber || "—"}</strong>
            </div>
          </section>
          {editingDetails ? (
            <section className="full-job-details editable-job-details">
              <label>
                Business Section
                <select
                  value={job.division}
                  onChange={(event) =>
                    onUpdate({ division: event.target.value as Division })
                  }
                >
                  <option>Commercial</option>
                  <option>Aerospace</option>
                </select>
              </label>
              <label>
                Customer Folder
                <input
                  value={job.customer}
                  onChange={(event) =>
                    onUpdate({ customer: event.target.value })
                  }
                />
              </label>
              <label>
                Job #
                <input
                  value={job.jobNumber}
                  onChange={(event) =>
                    onUpdate({ jobNumber: event.target.value })
                  }
                />
              </label>
              <label>
                KSID
                <input
                  value={job.ksid}
                  onChange={(event) => onUpdate({ ksid: event.target.value })}
                />
              </label>
              <label>
                PN Name
                <input
                  value={job.pnName}
                  onChange={(event) => onUpdate({ pnName: event.target.value })}
                />
              </label>
              <label>
                PN
                <input
                  value={job.pn}
                  onChange={(event) => onUpdate({ pn: event.target.value })}
                />
              </label>
              <label>
                Revision
                <input
                  value={job.rev}
                  onChange={(event) => onUpdate({ rev: event.target.value })}
                />
              </label>
              <label>
                QTY
                <input
                  inputMode="numeric"
                  value={job.quantity}
                  onChange={(event) => onUpdate({ quantity: event.target.value })}
                />
              </label>
              <label>
                Project Type
                <select
                  value={job.projectType}
                  onChange={(event) =>
                    onUpdate({ projectType: event.target.value as ProjectType })
                  }
                >
                  {projectTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <label>
                Contact
                <input
                  value={job.contact}
                  onChange={(event) =>
                    onUpdate({ contact: event.target.value })
                  }
                />
              </label>
              <label>
                PO#
                <input
                  value={job.poNumber}
                  onChange={(event) =>
                    onUpdate({ poNumber: event.target.value })
                  }
                />
              </label>
              <label>
                Quote#
                <input
                  value={job.quoteNumber}
                  onChange={(event) =>
                    onUpdate({ quoteNumber: event.target.value })
                  }
                />
              </label>
              <label>
                Customer Due Date
                <input
                  type="date"
                  value={job.customerDueDate}
                  onChange={(event) =>
                    onUpdate({ customerDueDate: event.target.value })
                  }
                />
              </label>
            </section>
          ) : (
            <section className="full-job-details">
              <div>
                <small>Business Section</small>
                <strong>{job.division}</strong>
              </div>
              <div>
                <small>Customer Folder</small>
                <strong>{job.customer}</strong>
              </div>
              <div>
                <small>Contact</small>
                <strong>{job.contact}</strong>
              </div>
              <div>
                <small>Project Type</small>
                <strong>{job.projectType}</strong>
              </div>
              <div>
                <small>PN Name</small>
                <strong>{job.pnName}</strong>
              </div>
              <div>
                <small>PN</small>
                <strong>{job.pn || "—"}</strong>
              </div>
              <div>
                <small>Revision</small>
                <strong>{job.rev}</strong>
              </div>
              <div>
                <small>QTY</small>
                <strong>{job.quantity || "—"}</strong>
              </div>
              <div>
                <small>Calculated Due Date</small>
                <strong>{dateLabel(job.dueDate)}</strong>
              </div>
              <div>
                <small>Customer Due Date</small>
                <strong>{dateLabel(job.customerDueDate)}</strong>
              </div>
            </section>
          )}
          {(buildLevel !== "PCBA" || familyJobs.length > 1) && <section className="drawer-section assembly-structure-section">
            <details open={familyJobs.length > 1}>
              <summary>
                <span>
                  <strong>Assembly Structure</strong>
                  <small>{familyJobs.length} explicitly linked job{familyJobs.length === 1 ? "" : "s"}</small>
                </span>
                <ChevronDown size={18} />
              </summary>
              <div className="family-flow-list">
                {(["PCBA", "CCA", "LRU"] as BuildLevel[]).map((level) => {
                  const levelJobs = familyJobs.filter(
                    (candidate) => jobBuildLevel(candidate) === level,
                  );
                  if (!levelJobs.length) return null;
                  return (
                    <div className="family-level" key={level}>
                      <span className={`build-level-badge ${level.toLowerCase()}`}>{level}</span>
                      <div>
                        {levelJobs.map((candidate) => (
                          <button
                            type="button"
                            className={candidate.id === job.id ? "current" : ""}
                            key={candidate.id}
                            onClick={() => candidate.id !== job.id && onOpen(candidate.id)}
                          >
                            <span>
                              <strong>Job #{candidate.jobNumber}</strong>
                              <small>{candidate.pn} · Rev {candidate.rev} · QTY {candidate.quantity}</small>
                            </span>
                            <em className={`production-status ${statusClass(candidate.status)}`}>{candidate.status}</em>
                            {candidate.id !== job.id && <ChevronRight size={16} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {buildLevel !== "PCBA" && (
                <div className="assembly-input-progress">
                  <div>
                    <strong>{assemblyRecipe?.name ?? `${buildLevel} saved configuration`}</strong>
                    <small>Required quantities are multiplied by this job&apos;s QTY {job.quantity || "1"}.</small>
                  </div>
                  {requirementProgress.map((item) => (
                    <div className={item.complete ? "complete" : "waiting"} key={item.requirement.id}>
                      <span>{item.requirement.inputLevel} {item.requirement.pn}{item.requirement.rev ? ` Rev ${item.requirement.rev}` : ""}</span>
                      <strong>{item.available} / {item.required}</strong>
                      {item.complete ? <CheckCircle2 size={16} /> : <Clock3 size={16} />}
                    </div>
                  ))}
                </div>
              )}
            </details>
          </section>}
          <section className="drawer-section">
            <div className="drawer-section-title">
              <h3>Production status</h3>
              <em className={`production-status ${statusClass(job.status)}`}>
                {job.status}
              </em>
            </div>
            <label className="drawer-field">
              Status filter value
              <select
                value={job.status}
                onChange={(event) => {
                  const status = event.target.value as JobStatus;
                  onUpdate({
                    status,
                    ...(status === "TH ASSY"
                      ? {
                          workflowCompleted: Array.from(
                            new Set([...job.workflowCompleted, "smt"]),
                          ),
                        }
                      : {}),
                  });
                }}
              >
                {jobStatuses.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            {buildLevel === "PCBA" && linkedMechanicalJobs.length > 0 ? (
              <div className="quantity-release-panel">
                <div className="quantity-summary-grid">
                  <div><small>Total QTY</small><strong>{job.quantity || "0"}</strong></div>
                  <div className="completed-quantity-card">
                    <small>Completed QTY</small>
                    <input
                      aria-label="Edit completed quantity"
                      className={completedQuantityDraft === "" ? "missing-input" : ""}
                      type="text"
                      inputMode="numeric"
                      value={completedQuantityDraft}
                      onChange={(event) => setCompletedQuantityDraft(event.target.value.replace(/[^0-9]/g, ""))}
                      onBlur={saveCompletedQuantity}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") event.currentTarget.blur();
                      }}
                    />
                  </div>
                  <div><small>Remaining QTY</small><strong>{remainingQuantity}</strong></div>
                </div>
                <form className="completed-quantity-options" onSubmit={submitQuantityRelease}>
                  <label>Completed QTY to release<input className={!releaseQuantity ? "missing-input" : ""} type="text" inputMode="numeric" value={releaseQuantity} onChange={(event) => setReleaseQuantity(event.target.value.replace(/[^0-9]/g, ""))} placeholder="Enter QTY" /></label>
                  <label>Release date<input type="date" value={releaseDate} onChange={(event) => setReleaseDate(event.target.value)} /></label>
                  <button className="button primary small" type="submit" disabled={remainingQuantity === 0}>Submit release</button>
                </form>
                {(job.quantityReleases ?? []).length > 0 && (
                  <div className="release-history">
                    {(job.quantityReleases ?? []).map((release) => <span key={release.id}>QTY {release.quantity} released {dateLabel(release.date)}</span>)}
                  </div>
                )}
                {linkedMechanicalJobs.map((candidate) => (
                  <button type="button" className="linked-mech-open" key={candidate.id} onClick={() => onOpen(candidate.id)}>
                    Ready for {jobBuildLevel(candidate)} Mechanical Assembly for MECH JOB #{candidate.jobNumber}
                    <ChevronRight size={16} />
                  </button>
                ))}
              </div>
            ) : buildLevel !== "PCBA" ? (
              <div className="mechanical-production-panel">
                <div className="status-assembly-config">
                  <div className="status-config-heading">
                    <div>
                      <strong>{buildLevel} Assembly Config</strong>
                      <small>Set the input QTY needed to build QTY 1 {buildLevel}. PN# and REV come from the linked {buildLevel === "CCA" ? "PCBA" : "CCA"} jobs.</small>
                    </div>
                  </div>
                  {requirementProgress.map((item) => (
                    <div className="status-config-row" key={item.requirement.id}>
                      <div>
                        <small>{item.requirement.inputLevel} PN# / REV</small>
                        <strong>{item.requirement.pn} · Rev {item.requirement.rev || "—"}</strong>
                      </div>
                      <label>
                        QTY needed for 1 {buildLevel}
                        <input
                          className={item.requirement.quantityPerAssembly === "" ? "missing-input" : ""}
                          type="text"
                          inputMode="numeric"
                          value={item.requirement.quantityPerAssembly}
                          onChange={(event) =>
                            updateAssemblyRequirement(item.requirement.id, {
                              quantityPerAssembly: event.target.value === "" ? "" : Math.max(1, Number(event.target.value) || 1),
                            })
                          }
                        />
                      </label>
                      <div>
                        <small>Completed and available</small>
                        <strong>{item.available}</strong>
                      </div>
                    </div>
                  ))}
                  {!requirementProgress.length && (
                    <p>No linked input jobs are configured for this mechanical job.</p>
                  )}
                  <div className="assembly-availability-banner">
                    <span><small>Currently buildable</small><strong>{buildableQuantity} {buildLevel}{buildableQuantity === 1 ? "" : "s"}</strong></span>
                    <span><small>Scheduled</small><strong>{scheduledQuantity}</strong></span>
                    <span><small>Completed / shipped</small><strong>{completedShipmentQuantity}</strong></span>
                  </div>
                </div>
                <div className="shipment-schedule-title">
                  <div><strong>Split shipment schedule</strong><small>Each batch uses its own Mechanical Turn Time. Later dock dates start from the prior batch.</small></div>
                  <button type="button" className="button secondary small" onClick={addMechanicalShipment}><Plus size={15} /> Add shipment</button>
                </div>
                <div className="mechanical-shipment-list">
                  {(job.mechanicalShipments ?? []).map((batch, index) => {
                    const cumulative = (job.mechanicalShipments ?? []).slice(0, index + 1).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
                    const possible = batch.quantity !== "" && cumulative <= buildableQuantity;
                    return (
                      <div className={`mechanical-shipment-row ${possible ? "possible" : "not-possible"}`} key={batch.id}>
                        <div className="shipment-heading"><strong>Shipment {index + 1}</strong><button type="button" className="shipment-remove" onClick={() => removeMechanicalShipment(batch.id)} aria-label={`Remove shipment ${index + 1}`}><Trash2 size={16} /> Remove</button></div>
                        <label>QTY<input className={batch.quantity === "" ? "missing-input" : ""} type="text" inputMode="numeric" value={batch.quantity} onChange={(event) => updateMechanicalShipment(batch.id, { quantity: event.target.value === "" ? "" : Math.max(1, Number(event.target.value) || 1) })} /></label>
                        <label>MECH Turn Time<input type="text" inputMode="numeric" value={batch.mechanicalTurnDays} onChange={(event) => updateMechanicalShipment(batch.id, { mechanicalTurnDays: Math.max(0, Number(event.target.value.replace(/[^0-9]/g, "")) || 0) })} /></label>
                        <label>Calculate Dock Date<input type="date" value={shipmentDates[index] ?? ""} onChange={(event) => updateMechanicalShipment(batch.id, { dockDateOverride: event.target.value })} /></label>
                        <label className="shipment-tracking">Tracking information<input value={batch.trackingInformation} onChange={(event) => updateMechanicalShipment(batch.id, { trackingInformation: event.target.value })} /></label>
                        <label className="shipment-complete"><input type="checkbox" checked={batch.completed} onChange={(event) => updateMechanicalShipment(batch.id, { completed: event.target.checked })} /> Completed Shipment</label>
                      </div>
                    );
                  })}
                  {!(job.mechanicalShipments ?? []).length && <p>No shipment batches scheduled yet.</p>}
                </div>
              </div>
            ) : null}
            {buildLevel === "PCBA" && linkedMechanicalJobs.length === 0 && <label className="accepted-partials-toggle">
              <input
                type="checkbox"
                checked={job.acceptedPartials}
                onChange={(event) =>
                  onUpdate({ acceptedPartials: event.target.checked })
                }
              />
              <span>
                <strong>Accepted Partials</strong>
              </span>
            </label>}
            {buildLevel === "PCBA" && linkedMechanicalJobs.length === 0 && job.acceptedPartials && (
              <div className="partial-deliveries">
                <div className="partial-quantity-summary" aria-live="polite">
                  <span><small>Project QTY</small><strong>{quantityNumber(job.quantity)}</strong></span>
                  <span><small>Booked</small><strong>{job.partialDeliveries.reduce((sum, partial) => sum + Math.max(0, Number(partial.quantity) || 0), 0)}</strong></span>
                  <span><small>Completed</small><strong>{job.partialDeliveries.filter((partial) => partial.completed).reduce((sum, partial) => sum + Math.max(0, Number(partial.quantity) || 0), 0)}</strong></span>
                  <span><small>Left to book</small><strong>{Math.max(0, quantityNumber(job.quantity) - job.partialDeliveries.reduce((sum, partial) => sum + Math.max(0, Number(partial.quantity) || 0), 0))}</strong></span>
                </div>
                <form className="partial-delivery-form" onSubmit={addPartialDelivery}>
                  <label>
                    QTY
                    <input
                      value={partialQty}
                      onChange={(event) => setPartialQty(event.target.value)}
                      placeholder="Quantity"
                      required
                    />
                  </label>
                  <label>
                    Due Date
                    <input
                      type="date"
                      value={partialDueDate}
                      onChange={(event) => setPartialDueDate(event.target.value)}
                      required
                    />
                  </label>
                  <label className="partial-comments">
                    Comments
                    <input
                      value={partialComments}
                      onChange={(event) => setPartialComments(event.target.value)}
                      placeholder="Customer approval or delivery details"
                    />
                  </label>
                  <button className="button primary small">
                    <Plus size={15} /> Add partial
                  </button>
                </form>
                {job.partialDeliveries.map((partial) => (
                  <div className="partial-delivery-row" key={partial.id}>
                    <strong>QTY {partial.quantity}</strong>
                    <span>{dateLabel(partial.dueDate)}</span>
                    <span>{partial.comments || "No comments"}</span>
                    <label className="partial-complete-toggle">
                      <input
                        type="checkbox"
                        checked={partial.completed}
                        onChange={(event) => updatePartialCompletion(partial.id, event.target.checked)}
                      />
                      Completed
                    </label>
                    <button
                      className="icon-button"
                      aria-label="Delete partial delivery"
                      onClick={() => removePartialDelivery(partial.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="drawer-section">
            <h3>Workflow timeline</h3>
            <div className="milestone-list">
              {milestones.map((milestone, index) => (
                <article key={milestone.name} className={milestone.done ? "done" : ""}>
                  <button
                    className="milestone-node"
                    aria-label={`${milestone.done ? "Reopen" : "Complete"} ${milestone.name}`}
                    onClick={() => toggleMilestone(milestone.key)}
                    disabled={milestone.locked}
                    title={milestone.locked ? "Completed automatically from linked jobs" : "Check off this workflow step manually"}
                  >
                    {milestone.done ? <Check size={13} /> : index + 1}
                  </button>
                  <div>
                    <strong>{milestone.name}</strong>
                    <small>{milestone.rule}</small>
                  </div>
                  {milestone.checkOnly ? (
                    <span className="manual-check-label">
                      {milestone.locked ? "Automatic check" : "Manual check only"}
                    </span>
                  ) : (
                    <span
                      className={
                        milestone.date && daysUntil(milestone.date) < 0
                          ? "urgent"
                          : ""
                      }
                    >
                      <strong>{dateLabel(milestone.date)}</strong>
                      <small>
                        {milestone.done
                          ? "Completed"
                          : milestone.date
                          ? dueCopy(milestone.date)
                          : "Waiting for required dates"}
                      </small>
                    </span>
                  )}
                  {milestone.key === "krypton-dock" && (
                    <div className="krypton-dock-controls">
                      <label className="tracking-information-field">
                        Tracking Information
                        <input
                          value={job.trackingInformation ?? ""}
                          onChange={(event) => updateTrackingInformation(event.target.value)}
                          placeholder="Carrier, tracking number, or shipment details"
                        />
                      </label>
                    </div>
                  )}
                </article>
              ))}
            </div>
            <div className="workflow-inputs">
              <label>
                Project creation date
                <input
                  type="date"
                  value={job.createdDate}
                  onChange={(event) => {
                    const change = { createdDate: event.target.value };
                    onUpdate({
                      ...change,
                      dueDate: calculatedJobDueDate(job, change),
                    });
                  }}
                />
              </label>
              <label>
                Customer due date
                <input
                  type="date"
                  value={job.customerDueDate}
                  onChange={(event) =>
                    onUpdate({ customerDueDate: event.target.value })
                  }
                />
              </label>
              {buildLevel === "PCBA" && (
                <label>
                  Fabrication turn days
                  <input
                    type="number"
                    min="0"
                    value={job.fabricationTurnDays}
                    onChange={(event) => {
                      const change = {
                        fabricationTurnDays: Number(event.target.value),
                      };
                      onUpdate({
                        ...change,
                        dueDate: calculatedJobDueDate(job, change),
                      });
                    }}
                  />
                </label>
              )}
              <label>
                {buildLevel === "PCBA" ? "Assembly turn days" : "Mechanical assembly turn days"}
                <input
                  type="number"
                  min="0"
                  value={job.assemblyTurnDays}
                  onChange={(event) => {
                    const change = {
                      assemblyTurnDays: Number(event.target.value),
                    };
                    onUpdate({
                      ...change,
                      dueDate: calculatedJobDueDate(job, change),
                    });
                  }}
                />
              </label>
              {buildLevel === "PCBA" && (
                <label>
                  SMT days
                  <select
                    value={job.smtDays}
                    onChange={(event) =>
                      onUpdate({ smtDays: Number(event.target.value) })
                    }
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            {buildLevel === "PCBA" && (
            <div className="pcb-dock-subsection">
              <div>
                <p className="section-kicker">Fabrication sub-section</p>
                <h4>PCB Dock Tracking</h4>
                <small>
                  Add the expected PCB date. Arrival confirmation appears once
                  the date is set.
                </small>
              </div>
              <label className="pcb-dock-date">
                PCB Dock Date
                <input
                  type="date"
                  value={job.pcbDockDate}
                  onChange={(event) => {
                    const pcbDockDate = event.target.value;
                    onUpdate({
                      pcbDockDate,
                      pcbArrived: pcbDockDate ? job.pcbArrived : false,
                      workflowCompleted: pcbDockDate
                        ? job.workflowCompleted
                        : job.workflowCompleted.filter(
                            (item) => item !== "pcb-arrived",
                          ),
                    });
                  }}
                />
              </label>
              {job.pcbDockDate && (
                <label className="pcb-arrival-toggle">
                  <input
                    type="checkbox"
                    checked={job.pcbArrived}
                    onChange={(event) => {
                      const pcbArrived = event.target.checked;
                      const nextJob = { ...job, pcbArrived };
                      onUpdate({
                        pcbArrived,
                        status:
                          pcbArrived && pcbaReadyForKitting(nextJob)
                            ? "Kitting"
                            : !pcbArrived && job.status === "Kitting"
                              ? "Waiting on Parts"
                              : job.status,
                        workflowCompleted: pcbArrived
                          ? Array.from(
                              new Set([
                                ...job.workflowCompleted,
                                "pcb-arrived",
                              ]),
                            )
                          : job.workflowCompleted.filter(
                              (item) => item !== "pcb-arrived",
                            ),
                      });
                    }}
                  />
                  <span>
                    <strong>PCB Arrived</strong>
                    <small>Check this when the boards are received.</small>
                  </span>
                </label>
              )}
              {job.pcbDockDate &&
                !job.pcbArrived &&
                daysUntil(job.pcbDockDate) < 0 && (
                  <div className="pcb-overdue-alert">
                    <AlertTriangle size={18} />
                    <span>
                      <strong>PCB arrival is overdue</strong>
                      <small>
                        Dock date was {dateLabel(job.pcbDockDate)}. Confirm the
                        arrival when the boards are received.
                      </small>
                    </span>
                  </div>
                )}
            </div>
            )}
          </section>
          {buildLevel === "PCBA" && (
          <section className="drawer-section">
            <div className="drawer-section-title">
              <h3>Special processes</h3>
            </div>
            <div className="process-toggle-grid">
              {["Polymerics", "External Testing", "FAI Report", "Other"].map(
                (process) => (
                  <label key={process}>
                    <input
                      type="checkbox"
                      checked={job.specialProcesses.includes(process)}
                      onChange={(event) =>
                        setSpecialProcess(process, event.target.checked)
                      }
                    />
                    {process === "Other" ? "Others" : process}
                  </label>
                ),
              )}
            </div>
            <p className="process-summary">
              {job.specialProcesses.length
                ? job.specialProcesses
                    .map((process) =>
                      process === "Other" && job.otherSpecialProcess
                        ? `Other: ${job.otherSpecialProcess}`
                        : process,
                    )
                    .join(" · ")
                : "None"}
            </p>
            {job.specialProcesses.includes("Polymerics") && (
              <div className="polymerics-options process-option-editor">
                <span>Polymerics requirements</span>
                {polymericsOptions.map((item) => (
                  <label key={item}>
                    <input
                      type="checkbox"
                      checked={job.polymericsOptions.includes(item)}
                      onChange={(event) =>
                        setPolymericsOption(item, event.target.checked)
                      }
                    />
                    {item}
                  </label>
                ))}
              </div>
            )}
            {job.specialProcesses.includes("Other") && (
              <label className="drawer-field other-process-input">
                Other special process
                <input
                  value={job.otherSpecialProcess}
                  onChange={(event) =>
                    onUpdate({ otherSpecialProcess: event.target.value })
                  }
                  placeholder="Describe the required process"
                />
              </label>
            )}
            <div className="special-turn-editors">
              {job.specialProcesses.includes("Polymerics") && (
                <label>
                  Polymerics Turn Time
                  <input
                    type="number"
                    min="0"
                    value={job.polymericsTurnDays}
                    onChange={(event) => {
                      const change = {
                        polymericsTurnDays: Number(event.target.value),
                      };
                      onUpdate({
                        ...change,
                        dueDate: calculatedJobDueDate(job, change),
                      });
                    }}
                  />{" "}
                  business days
                </label>
              )}
              {job.specialProcesses.includes("External Testing") && (
                <label>
                  External Testing Turn Time
                  <input
                    type="number"
                    min="0"
                    value={job.externalTestingTurnDays}
                    onChange={(event) => {
                      const change = {
                        externalTestingTurnDays: Number(event.target.value),
                      };
                      onUpdate({
                        ...change,
                        dueDate: calculatedJobDueDate(job, change),
                      });
                    }}
                  />{" "}
                  business days
                </label>
              )}
              {job.specialProcesses.includes("Other") && (
                <label>
                  Other Process Turn Time
                  <input
                    type="number"
                    min="0"
                    value={job.otherSpecialProcessTurnDays}
                    onChange={(event) => {
                      const change = {
                        otherSpecialProcessTurnDays: Number(event.target.value),
                      };
                      onUpdate({
                        ...change,
                        dueDate: calculatedJobDueDate(job, change),
                      });
                    }}
                  />{" "}
                  business days
                </label>
              )}
            </div>
          </section>
          )}
          <section className="drawer-section workflow-shortage-section">
            <div className="drawer-section-title">
              <h3>Shortage list</h3>
              <button
                className="button secondary small"
                disabled={job.noShortageList}
                onClick={() => shortageUploadRef.current?.click()}
              >
                <Upload size={15} /> Upload Excel or photo
              </button>
            </div>
            <p className="muted shortage-header-help">
              Each spreadsheet or screenshot row becomes one shortage item.
              Column order can vary when the headers include KSP#, PN, QTY, Due
              Date, and Additional Comments.
            </p>
            <input
              ref={shortageUploadRef}
              type="file"
              accept=".xlsx,.xls,.csv,image/*"
              hidden
              onChange={uploadShortages}
            />
            {shortageScanState && (
              <div className="scan-message">
                <ImageIcon size={16} /> {shortageScanState}
              </div>
            )}
            <ShortageEditor job={job} onUpdate={onUpdate} notify={notify} />
          </section>
          <section className="drawer-section">
            <h3>Notes</h3>
            <form className="drawer-note-form" onSubmit={addNote}>
              <input
                type="date"
                value={noteDate}
                onChange={(event) => setNoteDate(event.target.value)}
                required
              />
              <textarea
                rows={3}
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                placeholder="Add a project note…"
              />
              <button className="button primary small">
                <Plus size={15} /> Add note
              </button>
            </form>
            <div className="drawer-note-history">
              {[...job.notes]
                .sort((a, b) =>
                  `${b.date}${b.createdAt}`.localeCompare(
                    `${a.date}${a.createdAt}`,
                  ),
                )
                .map((note) => (
                  <article key={note.id}>
                    <div className="note-calendar" aria-label={dateLabel(note.date)}>
                      <span>{calendarDateParts(note.date).month}</span>
                      <strong>{calendarDateParts(note.date).day}</strong>
                    </div>
                    <div className="note-copy">
                      {editingNoteId === note.id ? (
                        <>
                          <textarea
                            rows={3}
                            value={editingNoteText}
                            onChange={(event) =>
                              setEditingNoteText(event.target.value)
                            }
                          />
                          <div className="note-edit-actions">
                            <button
                              className="button primary small"
                              onClick={() => saveEditedNote(note.id)}
                            >
                              Save
                            </button>
                            <button
                              className="button ghost small"
                              onClick={() => {
                                setEditingNoteId(null);
                                setEditingNoteText("");
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p>{note.text}</p>
                          <span className="note-timestamp">
                            {dateLabel(note.date)} ·{" "}
                            {new Date(note.createdAt).toLocaleTimeString(
                              "en-US",
                              { hour: "numeric", minute: "2-digit" },
                            )}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="note-actions">
                      <button
                        className="button ghost small"
                        onClick={() => startEditingNote(note)}
                      >
                        Edit
                      </button>
                      <button
                        className="icon-button"
                        aria-label="Delete note"
                        onClick={() => deleteNote(note.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </article>
                ))}
            </div>
          </section>
        </div>
        <div className="drawer-footer">
          <span>
            {job.projectType} · Contact: {job.contact}
          </span>
          <button className="button danger-button" onClick={onDelete}>
            <Trash2 size={15} /> Delete job
          </button>
        </div>
      </aside>
    </div>
  );
}
