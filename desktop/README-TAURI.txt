Krypton Solutions OOR 78.0.0 for Windows 11 x64
Rebuilt from Version 69 with the requested Version 70–78 changes.

Open Overview and click Weekly Report below the overview summary cards.
The Excel workbook contains Commercial, Aerospace, Customer Supplied, and Need Shortage Report sheets. It includes unreceived KSPs overdue or due through Sunday of the current Chicago calendar week and undated KSPs. Each sheet groups KSPs into one multiline row per job. Issued-part due dates use MM/DD/YYYY, and KS Purchasing Team Comments is included as a blank column. Undated entries sort last. Missing lists use the existing business-day calendar and a two-business-day purchasing target, including overdue targets.

Customer supplied dates are retained and copied as dates or Not Set.
Dock calculations use the latest dated outstanding material or PCB date, with existing assembly and special-process turnaround and overrides.
SMT status checks Kitting; later SMT stages also check SMT.
Organization membership survives whitespace normalization and restart.
Text editing commits after a 500 ms pause, with pending changes flushed on blur and native close. Workflow controls remain immediate.
Action Items have separate PN Name and PN columns, and Follow Ups include both.
The quote section and its saved records are removed; job Quote# fields remain.
No AI or email rewrite feature is included.

Version 75 adds reorderable special-process workflow stages and matching status values. CCA/LRU timelines and Krypton Dock Dates remain Not Set - Awaiting PCBAs until Mechanical Assembly begins. Job Excel Format now has a search bar, job-list dates show Krypton Dock, completed projects are hidden from No Follow Ups, excluded jobs are omitted from Shortage List Report, and shortage components can be deleted in one confirmed action.

Version 76 renames Shortage List Report to Weekly Report and adds an On Schedule Builds sheet. Export Excel now groups active jobs by Organization Folder or Customer Sub-Category, keeps completed jobs on a separate sheet, and includes an editable delivery-validation column with an Early / On Time / Past Due chart. Complete Backup uses the verified Windows-safe download path and is covered by export-and-restore testing.

Version 77 fixes Excel exports in the installed Windows app. Export Complete Backup and the other Excel exports now use a native Windows Save As dialog and write the workbook through the desktop application instead of relying on a WebView download link.

Version 78 keeps completed jobs in their own Completed section and excludes them from Job Excel Format. The Job Excel Format date column is now Krypton Dock Date and uses the calculated or overridden Krypton Dock Date for each active job.

Use the installer under Installer, or run Portable/KryptonOOR.exe.
The application identifier and existing job storage keys are retained.
Export a complete backup before moving between computers.
Offline OCR and the offline WebView2 installer remain included.
