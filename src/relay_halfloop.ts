import { Args, ParseError } from "grimoire-kolmafia";
import {
  formFields,
  fullnessLimit,
  getProperty,
  inebrietyLimit,
  myAdventures,
  myFullness,
  myInebriety,
  myMeat,
  myName,
  myPath,
  mySpleenUse,
  myTurncount,
  pvpAttacksLeft,
  removeProperty,
  spleenLimit,
  todayToString,
  write,
} from "kolmafia";
import { get, set } from "libram";

import { paths } from "./paths";
import { lastRun, requestInterrupt, RunRecord } from "./run";
import {
  args,
  fmt,
  HALFLOOP_DAILY_FLAG,
  lifestyleShortcuts,
  rolloverFights,
  rolloverTurns,
} from "./util";

type Row = [string, string];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function table(rows: Row[]): string {
  const body = rows
    .map(([key, value]) => `<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(value)}</td></tr>`)
    .join("");
  return `<table>${body}</table>`;
}

function section(title: string, content: string): string {
  return `<section><h2>${escapeHtml(title)}</h2>${content}</section>`;
}

function time(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

function duration(from: number, to: number): string {
  const minutes = Math.round((to - from) / 60_000);
  return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

type Setting = {
  property: string;
  help: string;
  default: string;
  choices?: string[];
  parse: (value: string) => unknown;
};

function displayDefault(value: unknown): string {
  for (const [name, lifestyle] of lifestyleShortcuts) {
    if (value === lifestyle) return name;
  }
  return `${value}`;
}

/** Every halfloop arg that can be saved as a setting; flags only make sense on the command line */
function settings(): Setting[] {
  const result: Setting[] = [];
  Args.getMetadata(args).traverse((spec, key) => {
    if (spec.valueHelpName === "FLAG" || spec.setting === "") return;
    result.push({
      property: spec.setting ?? `halfloop_${spec.key ?? key}`,
      help: spec.help ?? "",
      default: "default" in spec ? displayDefault(spec.default) : "",
      choices:
        spec.options?.map(([value]) => value) ??
        (spec.valueHelpName === "BOOLEAN" ? ["true", "false"] : undefined),
      parse: spec.parser,
    });
  });
  return result;
}

/** Save submitted settings; an empty value clears the setting so the default applies */
function saveSettings(): string[] {
  const fields = formFields();
  if (fields.save === undefined) return [];
  const messages: string[] = [];
  for (const setting of settings()) {
    const value = fields[setting.property]?.trim();
    if (value === undefined || value === getProperty(setting.property)) continue;
    if (value === "") {
      removeProperty(setting.property);
      messages.push(`Reset ${setting.property} to its default`);
      continue;
    }
    let parsed: unknown;
    try {
      parsed = setting.parse(value);
    } catch {
      parsed = undefined;
    }
    if (parsed === undefined || parsed instanceof ParseError) {
      messages.push(`Could not save ${setting.property}: "${value}" is not a valid value`);
      continue;
    }
    set(setting.property, value);
    messages.push(`Set ${setting.property} to ${value}`);
  }
  return messages;
}

function settingInput(setting: Setting): string {
  const name = escapeHtml(setting.property);
  const current = getProperty(setting.property);
  if (setting.choices) {
    const options = [
      `<option value="">default (${escapeHtml(setting.default)})</option>`,
      ...setting.choices.map(
        (choice) =>
          `<option value="${escapeHtml(choice)}"${choice === current ? " selected" : ""}>${escapeHtml(choice)}</option>`,
      ),
    ];
    return `<select name="${name}">${options.join("")}</select>`;
  }
  return `<input name="${name}" value="${escapeHtml(current)}" placeholder="${escapeHtml(setting.default)}">`;
}

function settingsForm(): string {
  const rows = settings()
    .map(
      (setting) =>
        `<tr><th>${escapeHtml(setting.property.replace(/^halfloop_/, ""))}</th><td>${settingInput(setting)}</td><td class="help">${escapeHtml(setting.help)}</td></tr>`,
    )
    .join("");
  return `<form method="post"><table>${rows}</table><button type="submit" name="save" value="1">Save settings</button></form>
<p class="help">Blank fields use the default. Arguments given on the command line still override these settings.</p>`;
}

function runSection(run: RunRecord | undefined): string {
  if (!run) return section("Today's run", "<p>Halfloop has not been run today.</p>");

  const now = Date.now();
  const status: Row[] = [
    ["Status", { running: "In progress", finished: "Complete", aborted: "Aborted" }[run.state]],
    ["Path", run.path],
    ["Started", time(run.startedAt)],
    run.finishedAt
      ? ["Finished", `${time(run.finishedAt)} (${duration(run.startedAt, run.finishedAt)})`]
      : ["Running for", duration(run.startedAt, now)],
  ];
  if (run.error) status.push(["Error", run.error]);

  // A loop script other than garbo only notices the interrupt once it hands control back
  const interrupt =
    run.state === "running"
      ? `<form method="post"><button type="submit" name="interrupt" value="1" class="interrupt">Interrupt halfloop</button></form>`
      : "";

  const results =
    run.results.length > 0
      ? `<h3>Results</h3>${table(run.results.map(({ title, message }) => [title, message]))}`
      : "";
  return section("Today's run", table(status) + interrupt + results);
}

function liveStats(): string {
  const [turnsTomorrow, lostTurns] = rolloverTurns();
  const character: Row[] = [
    ["Character", myName()],
    ["Path", myPath().name],
    ["Ascensions today", `${get("ascensionsToday", 0)}`],
    ["Turns this ascension", fmt(myTurncount())],
    ["Adventures", fmt(myAdventures())],
    ["Meat", fmt(myMeat())],
    [
      "Organs",
      `${myFullness()}/${fullnessLimit()} full, ${myInebriety()}/${inebrietyLimit()} drunk, ${mySpleenUse()}/${spleenLimit()} spleen`,
    ],
    ["PvP fights", fmt(pvpAttacksLeft())],
    ["Swagger", fmt(get("availableSwagger", 0))],
  ];

  const today: Row[] = [];
  if (get(HALFLOOP_DAILY_FLAG) === todayToString()) {
    today.push(["Halfloop turns", fmt(get("halfloop_turnsSpent", 0))]);
    today.push(["Halfloop swagger", fmt(get("halfloop_swagger", 0))]);
    for (const path of paths.filter(({ results }) => results)) {
      const meat = get(`halfloop_${path.name}Meat`, 0);
      const items = get(`halfloop_${path.name}Items`, 0);
      if (meat || items)
        today.push([`${path.name} results`, `${fmt(meat)} meat + ${fmt(items)} items`]);
    }
  }
  const garboTurns = get("garboResultsTurns", 0);
  if (garboTurns) {
    today.push([
      "Garbo results",
      `${fmt(get("garboResultsMeat", 0))} meat + ${fmt(get("garboResultsItems", 0))} items`,
    ]);
    today.push([
      "Garbo actions",
      `${fmt(garboTurns)} turns, ${fmt(get("garboEmbezzlerCount", 0))} embezzlers`,
    ]);
  }

  const tomorrow: Row[] = [
    ["Turns tomorrow", `${turnsTomorrow} (after potato and hourglass)`],
    ["Lost to rollover", `${lostTurns}`],
    ["Fights tomorrow", `${rolloverFights()}`],
  ];

  return section(
    "Current stats",
    `${
      table(character) + (today.length > 0 ? `<h3>Today so far</h3>${table(today)}` : "")
    }<h3>Rollover</h3>${table(tomorrow)}`,
  );
}

const style = `
body { font-family: Arial, sans-serif; font-size: 14px; margin: 16px; color: #222; }
h1 { font-size: 20px; }
h2 { font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
h3 { font-size: 14px; margin-bottom: 4px; }
section { max-width: 900px; margin-bottom: 24px; }
table { border-collapse: collapse; }
th { text-align: left; padding: 3px 12px 3px 0; white-space: nowrap; vertical-align: top; }
td { padding: 3px 12px 3px 0; vertical-align: top; }
.help { color: #777; }
.notice { background: #eef6ee; border: 1px solid #9c9; padding: 6px 10px; margin-bottom: 12px; }
button { margin-top: 8px; }
.interrupt { background: #c33; color: white; border: none; padding: 6px 14px; font-weight: bold; cursor: pointer; }
`;

function handleInterrupt(): string[] {
  if (formFields().interrupt === undefined) return [];
  requestInterrupt();
  return [
    "Interrupt requested. Garbo stops at its next task; halfloop stops before its next step.",
  ];
}

export function main(): void {
  const messages = [...handleInterrupt(), ...saveSettings()];
  const run = lastRun();

  const notices = messages.map((message) => `<div class="notice">${escapeHtml(message)}</div>`);
  // Keep the page current while a run is going
  const refresh = run?.state === "running" ? '<meta http-equiv="refresh" content="60">' : "";

  write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Halfloop</title>${refresh}<style>${style}</style></head><body>
<h1>Halfloop</h1>
${notices.join("")}
${runSection(run)}
${liveStats()}
${section("Settings", settingsForm())}
</body></html>`);
}
