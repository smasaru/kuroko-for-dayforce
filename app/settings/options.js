/* =============================================================
   options.js — Chrome Extension Options Page Logic
   ============================================================= */

"use strict";

/* ------------------------------------------------------------------
   Defaults
------------------------------------------------------------------ */
const DEFAULTS = _CONFIG;

/* ------------------------------------------------------------------
   Work-on-a-Holiday checkbox
------------------------------------------------------------------ */
const chkWorkOnHoliday = document.getElementById("chk-work-on-holiday");

const ALL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];


/* ------------------------------------------------------------------
   DOM helpers
------------------------------------------------------------------ */
function buildHourSelect(selectedHour) {
  const sel = document.createElement("select");
  for (let h = 0; h <= 23; h++) {
    const opt = document.createElement("option");
    opt.value = h;
    opt.textContent = `${h}:00`;
    if (h === selectedHour) opt.selected = true;
    sel.appendChild(opt);
  }
  return sel;
}

function buildDaySelect(selectedDay) {
  const sel = document.createElement("select");
  for (const day of ALL_DAYS) {
    const opt = document.createElement("option");
    opt.value = day;
    opt.textContent = day;
    if (day === selectedDay) opt.selected = true;
    sel.appendChild(opt);
  }
  return sel;
}

/**
 * Creates a time-range row element.
 * @param {number} start - start hour (0-23)
 * @param {number} end   - end hour (0-23)
 * @returns {HTMLElement}
 */
function buildTimeRangeRow(start = 9, end = 18) {
  const row = document.createElement("div");
  row.className = "time-range-row";

  const lblStart = document.createElement("label");
  lblStart.textContent = "Start:";

  const selStart = buildHourSelect(start);
  selStart.dataset.role = "start";

  const sep = document.createElement("span");
  sep.className = "time-range-sep";
  sep.textContent = "–";

  const lblEnd = document.createElement("label");
  lblEnd.textContent = "End:";

  const selEnd = buildHourSelect(end);
  selEnd.dataset.role = "end";

  const btnRemove = document.createElement("button");
  btnRemove.type = "button";
  btnRemove.className = "btn btn-remove";
  btnRemove.textContent = "\u00d7 Remove";
  btnRemove.addEventListener("click", () => row.remove());

  // Re-validate on change
  selStart.addEventListener("change", () => validateRow(row));
  selEnd.addEventListener("change", () => validateRow(row));

  row.append(lblStart, selStart, sep, lblEnd, selEnd, btnRemove);
  return row;
}

/**
 * Validates a single time-range row, toggling the .invalid class.
 * @param {HTMLElement} row
 * @returns {boolean} true if valid
 */
function validateRow(row) {
  const start = parseInt(row.querySelector('[data-role="start"]').value, 10);
  const end = parseInt(row.querySelector('[data-role="end"]').value, 10);
  const valid = end > start;
  row.classList.toggle("invalid", !valid);
  return valid;
}

/**
 * Reads all time-range rows inside a container.
 * @param {HTMLElement} container
 * @returns {{start:number,end:number}[]}
 */
function collectTimeRanges(container) {
  return Array.from(container.querySelectorAll(".time-range-row")).map((row) => ({
    start: parseInt(row.querySelector('[data-role="start"]').value, 10),
    end: parseInt(row.querySelector('[data-role="end"]').value, 10),
  }));
}

/**
 * Validates all rows in a container. Returns true if all are valid.
 */
function validateAll(container) {
  const rows = container.querySelectorAll(".time-range-row");
  let allValid = true;
  for (const row of rows) {
    if (!validateRow(row)) allValid = false;
  }
  return allValid;
}

/* ------------------------------------------------------------------
   Section 1 — Working Days
------------------------------------------------------------------ */
function loadWorkingDays(days) {
  document.querySelectorAll('[data-day]').forEach((cb) => {
    cb.checked = days.includes(cb.dataset.day);
  });
}

function collectWorkingDays() {
  return Array.from(document.querySelectorAll('[data-day]'))
    .filter((cb) => cb.checked)
    .map((cb) => cb.dataset.day);
}

function loadWorkOnHoliday(value) {
  chkWorkOnHoliday.checked = !!value;
}

function collectWorkOnHoliday() {
  return chkWorkOnHoliday.checked;
}

/* ------------------------------------------------------------------
   Section 2 — Default Working Time
------------------------------------------------------------------ */
const workingTimeList = document.getElementById("working-time-list");

function loadWorkingTime(ranges) {
  workingTimeList.innerHTML = "";
  for (const r of ranges) workingTimeList.appendChild(buildTimeRangeRow(r.start, r.end));
}

document.getElementById("add-working-time").addEventListener("click", () => {
  workingTimeList.appendChild(buildTimeRangeRow(9, 18));
});

/* ------------------------------------------------------------------
   Section 3 — Half-Day Off Working Time
------------------------------------------------------------------ */
const halfdayTimeList = document.getElementById("halfday-time-list");

function loadHalfdayTime(ranges) {
  halfdayTimeList.innerHTML = "";
  for (const r of ranges) halfdayTimeList.appendChild(buildTimeRangeRow(r.start, r.end));
}

document.getElementById("add-halfday-time").addEventListener("click", () => {
  halfdayTimeList.appendChild(buildTimeRangeRow(9, 18));
});

/* ------------------------------------------------------------------
   Section 4 — Override Working Day & Time
------------------------------------------------------------------ */
const overrideList = document.getElementById("override-list");

/**
 * Builds a full override block for a given day and its time ranges.
 * @param {string} day
 * @param {{start:number,end:number}[]} times
 * @returns {HTMLElement}
 */
function buildOverrideBlock(day = "Mon", times = [{ start: 8, end: 17 }]) {
  const block = document.createElement("div");
  block.className = "override-block";

  /* --- Header --- */
  const header = document.createElement("div");
  header.className = "override-block-header";

  const lblDay = document.createElement("label");
  lblDay.textContent = "Day:";

  const selDay = buildDaySelect(day);
  selDay.dataset.role = "override-day";

  const btnRemoveBlock = document.createElement("button");
  btnRemoveBlock.type = "button";
  btnRemoveBlock.className = "btn btn-remove";
  btnRemoveBlock.textContent = "\u00d7 Remove Day";
  btnRemoveBlock.style.marginLeft = "auto";
  btnRemoveBlock.addEventListener("click", () => block.remove());

  header.append(lblDay, selDay, btnRemoveBlock);

  /* --- Body --- */
  const body = document.createElement("div");
  body.className = "override-block-body";

  const timeList = document.createElement("div");
  timeList.className = "time-range-list";

  for (const t of times) timeList.appendChild(buildTimeRangeRow(t.start, t.end));

  const btnAddTime = document.createElement("button");
  btnAddTime.type = "button";
  btnAddTime.className = "btn btn-add";
  btnAddTime.textContent = "+ Add Time Range";
  btnAddTime.addEventListener("click", () => {
    timeList.appendChild(buildTimeRangeRow(9, 18));
  });

  body.append(timeList, btnAddTime);
  block.append(header, body);
  return block;
}

function loadOverrides(overrides) {
  overrideList.innerHTML = "";
  for (const o of overrides) overrideList.appendChild(buildOverrideBlock(o.day, o.time));
}

document.getElementById("add-override").addEventListener("click", () => {
  overrideList.appendChild(buildOverrideBlock("Mon", [{ start: 8, end: 17 }]));
});

function collectOverrides() {
  return Array.from(overrideList.querySelectorAll(".override-block")).map((block) => ({
    day: block.querySelector('[data-role="override-day"]').value,
    time: collectTimeRanges(block.querySelector(".time-range-list")),
  }));
}

/* ------------------------------------------------------------------
   Validation — check all time ranges across all sections
------------------------------------------------------------------ */
function validateAllSections() {
  const containers = [
    workingTimeList,
    halfdayTimeList,
    ...Array.from(overrideList.querySelectorAll(".time-range-list")),
  ];
  return containers.every((c) => validateAll(c));
}

/* ------------------------------------------------------------------
   Toast
------------------------------------------------------------------ */
let toastTimeout = null;

function showToast(message = "Settings saved.") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2500);
}

/* ------------------------------------------------------------------
   Save
------------------------------------------------------------------ */
document.getElementById("btn-save").addEventListener("click", async () => {
  // Validate first
  if (!validateAllSections()) {
    showToast("\u26a0\ufe0f Please fix invalid time ranges (end must be after start).");
    return;
  }

  const data = {
    DF__DEFAULT_WORKING_DAY: collectWorkingDays(),
    DF__DEFAULT_WORKING_TIME: collectTimeRanges(workingTimeList),
    DF__DEFAULT_HALF_DAY_OFF_WORKING_TIME: collectTimeRanges(halfdayTimeList),
    DF__OVERRIDE_WORKING_DAY_TIME: collectOverrides(),
    DF__WORK_ON_A_HOLIDAY: collectWorkOnHoliday(),
  };

  await localStorage.set(data);
  showToast("Settings saved.");
});

/* ------------------------------------------------------------------
   Reset to Defaults
------------------------------------------------------------------ */
document.getElementById("btn-reset").addEventListener("click", () => {
  populateUI(DEFAULTS);
});

/* ------------------------------------------------------------------
   Populate all UI sections from a data object
------------------------------------------------------------------ */
function populateUI(data) {
  loadWorkingDays(
    data.DF__DEFAULT_WORKING_DAY ?? DEFAULTS.DF__DEFAULT_WORKING_DAY
  );
  loadWorkingTime(
    data.DF__DEFAULT_WORKING_TIME ?? DEFAULTS.DF__DEFAULT_WORKING_TIME
  );
  loadHalfdayTime(
    data.DF__DEFAULT_HALF_DAY_OFF_WORKING_TIME ??
      DEFAULTS.DF__DEFAULT_HALF_DAY_OFF_WORKING_TIME
  );
  loadOverrides(
    data.DF__OVERRIDE_WORKING_DAY_TIME ?? DEFAULTS.DF__OVERRIDE_WORKING_DAY_TIME
  );
  loadWorkOnHoliday(
    data.DF__WORK_ON_A_HOLIDAY ?? false
  );
}

/* ------------------------------------------------------------------
   Initialise on load
------------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", async () => {
  const keys = Object.keys(DEFAULTS);
  const stored = await localStorage.get(keys);

  // Merge stored values with defaults (use default when key is missing)
  const data = {};
  for (const k of keys) {
    data[k] = stored[k] !== undefined ? stored[k] : DEFAULTS[k];
  }

  populateUI(data);
});
