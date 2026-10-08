import { makeValue } from "garbo-lib";
import { Args } from "grimoire-kolmafia";
import {
  chatPrivate,
  choiceFollowsFight,
  Class,
  cliExecute,
  getAutoAttack,
  getPermedSkills,
  holiday,
  inebrietyLimit,
  inMultiFight,
  myAdventures,
  myFamiliar,
  myInebriety,
  mySpleenUse,
  pvpAttacksLeft,
  runCombat,
  setAutoAttack,
  setCcs,
  Skill,
  toClass,
  todayToString,
  visitUrl,
  writeCcs,
} from "kolmafia";
import { $class, $familiar, get, have, Lifestyle, set, StrictMacro } from "libram";

const lifestyleShortcuts = new Map([
  ["hardcore", Lifestyle.hardcore],
  ["softcore", Lifestyle.softcore],
  ["casual", Lifestyle.casual],
]);

const modes = ["garbo", "halloween", "chrono", "auto", "crimbo"] as const;
type Mode = (typeof modes)[number];

export const args = Args.create("halfloop", "Loop your brains out (on live tv)", {
  mode: Args.custom<Mode>(
    {
      help: "What mode to run halfloop in",
      default: "auto",
    },
    (v) => (modes.includes(v as Mode) ? (v as Mode) : undefined),
    "MODE",
  ),
  pvp: Args.boolean({ help: "Run PVP fites", default: true }),
  ascend: Args.boolean({ help: "Loop today", default: true }),
  batfellow: Args.boolean({ help: "consider batfellow consumables", default: true }),
  adventures: Args.number({
    help: "How many turns to keep on your final leg (will also skip nightcap)",
    default: 0,
  }),
  garbo_command: Args.string({ help: "how to invoke garbo", default: "garbo" }),
  keeping_tabs_command: Args.string({
    help: "how to invoke keeping tabs",
    default: "keeping-tabs",
  }),
  consume_command: Args.string({
    help: "how to invoke CONSUME",
    default: "CONSUME",
  }),
  phccs_gash_command: Args.string({
    help: "how to invoke phccs_gash",
    default: "phccs_gash",
  }),
  phccs_command: Args.string({
    help: "how to invoke phccs",
    default: "phccs",
  }),
  loopstar_command: Args.string({
    help: "how to invoke loopstar",
    default: "loopstar",
  }),
  looprobot_command: Args.string({
    help: "how to invoke looprobot",
    default: "looprobot",
  }),
  underthesea_command: Args.string({
    help: "how to invoke UnderTheSea",
    default: "UnderTheSea",
  }),
  crimbo_command: Args.string({
    help: "how to invoke crimbo",
    default: "crimbo",
  }),
  class: Args.custom<Class>(
    {
      help: "what class to run PHCCS as",
      default: $class`Pastamancer`,
    },
    (v: string) => toClass(v),
    "CLASS",
  ),
  path: Args.string({
    help: "What path to run as: cs, smol, robot, sea, standard, casual, or a full path name",
    default: "cs",
  }),
  lifestyle: Args.custom<Lifestyle>(
    {
      help: "Ascend as Hardcore or Softcore",
      default: Lifestyle.softcore,
    },
    (v) => lifestyleShortcuts.get(v) ?? Lifestyle.softcore,
    "LIFESTYLE",
  ),
  maximize: Args.custom<"pvp" | "adventures">(
    {
      help: "Maximize for PvP fights or Adventrues on roll",
      default: "adventures",
    },
    (v) => (v === "pvp" ? "pvp" : "adventures"),
    "MAXIMIZE",
  ),
  // different modes
  list: Args.flag({ help: "list all tasks and then exit" }),
  args: Args.flag({ help: "print out a message showing what args will be used" }),
  sleep: Args.flag({ help: "sleep before executing main loop" }),
});

export function currentArgs(pathArgs: string[]): string[] {
  return [
    `* Ascend: (${args.ascend})`,
    `* Run PVP fites: (${args.pvp})`,
    args.adventures === 0
      ? "* Keep no adventures and nightcap"
      : `* Keep ${args.adventures} adventures and do not nightcap`,
    `* invoke garbo using (${args.garbo_command})`,
    `* invoke keeping-tabs using (${args.keeping_tabs_command})`,
    `* invoke CONSUME using (${args.consume_command})`,
    `* ascend in path (${args.path})`,
    `* ascend as (${args.class})`,
    `* farm mode: (${args.mode} => ${mode()})`,
    ...pathArgs,
    ...(mode() === "crimbo" ? [`* invoke crimbo using (${args.crimbo_command})`] : []),
  ];
}

export function cliExecuteThrow(command: string): void {
  if (!cliExecute(command)) throw `Failed to execute ${command}`;
}

export function tapped(ascend: boolean): boolean {
  // you are done for today if:
  // * when ascending, you have 0 turns
  // * when not ascending, you are overdrunk
  const limit = inebrietyLimit() - (myFamiliar() === $familiar`Stooper` ? 1 : 0);
  if (ascend) {
    return myInebriety() > limit && myAdventures() === 0;
  } else {
    return myInebriety() > limit && mySpleenUse() >= 15;
  }
}

export function willAscend(): boolean {
  return args.ascend && get("ascensionsToday") === 0;
}

type DevExternalScript =
  | "garbo"
  | "keeping_tabs"
  | "consume"
  | "phccs"
  | "phccs_gash"
  | "loopstar"
  | "looprobot"
  | "underthesea"
  | "crimbo";
const externalScripts = [
  "autoscend",
  "freecandy",
  "combo",
  "loopcasual",
  "chrono",
  "moustacherider",
] as const;
type BuiltExternalScript = (typeof externalScripts)[number];

export type ExternalScript = DevExternalScript | BuiltExternalScript;

function isDevExternalScript(value: string): value is BuiltExternalScript {
  return externalScripts.includes(value as BuiltExternalScript);
}

export type ScriptArg = string | { key: string; value: string };
export function external(name: ExternalScript, ...scriptArgs: ScriptArg[]): void {
  const strArgs = scriptArgs.map((a) => (typeof a === "string" ? a : `${a.key}="${a.value}"`));
  const command = isDevExternalScript(name) ? name : args[`${name}_command`];
  cliExecuteThrow([command, ...strArgs].join(" "));
}

function makeCcs<M extends StrictMacro>(macro: M) {
  writeCcs(`[default]\n"${macro.toString()}"`, "halfloop");
  setCcs("halfloop");
}

function runCombatBy<T>(initiateCombatAction: () => T) {
  try {
    const result = initiateCombatAction();
    while (inMultiFight()) runCombat();
    if (choiceFollowsFight()) visitUrl("choice.php");
    return result;
  } catch (e) {
    throw `Combat exception! Last macro error: ${get("lastMacroError")}. Exception ${e}.`;
  }
}

/**
 * Attempt to perform a nonstandard combat-starting Action with a Macro
 * @param macro The Macro to attempt to use
 * @param action The combat-starting action to attempt
 * @param tryAuto Whether or not we should try to resolve the combat with an autoattack; autoattack macros can fail against special monsters, and thus we have to submit a macro via CCS regardless.
 * @returns The output of your specified action function (typically void)
 */
export function withMacro<T, M extends StrictMacro>(macro: M, action: () => T, tryAuto = false): T {
  if (getAutoAttack() !== 0) setAutoAttack(0);
  if (tryAuto) macro.setAutoAttack();
  makeCcs(macro);
  try {
    return runCombatBy(action);
  } finally {
    if (tryAuto) setAutoAttack(0);
  }
}

export type DailyNumericProperty = `halfloop_${string}`;
export const HALFLOOP_DAILY_FLAG = "halfloop_dailyFlag";

/**
 * Read and write numeric properties that reset to 0 each day
 * @param properties Every property the callback may touch; these are zeroed on the first call of the day
 */
export function daily<T>(
  properties: DailyNumericProperty[],
  callback: (functions: {
    get: (property: DailyNumericProperty) => number;
    set: (property: DailyNumericProperty, value: number) => void;
  }) => T,
): T {
  if (get(HALFLOOP_DAILY_FLAG) !== todayToString()) {
    set(HALFLOOP_DAILY_FLAG, todayToString());
    for (const prop of properties) {
      set(prop, 0);
    }
  }
  return callback({
    get: (property: DailyNumericProperty) => get(property, 0),
    set: (property: DailyNumericProperty, value: number) => set(property, value),
  });
}

export function fmt(value: number | string): string {
  return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function mode(): Mode {
  return args.mode === "auto"
    ? holiday().includes("Halloween")
      ? "halloween"
      : get("timeTowerAvailable")
        ? "chrono"
        : "garbo"
    : args.mode;
}

export function halloween(): boolean {
  return mode() === "halloween";
}

export function skillsToPerm(): Skill[] {
  const permed = getPermedSkills();
  return Skill.all().filter((s) => have(s) && !permed[s.name] && s.permable);
}

export const { value: halfloopValue } = makeValue();

export function statusUpdate(id: string, message: string): void {
  chatPrivate("TortureBot", `ID: ${id} Status: ${message.split("\n").join("\\\\n")}`);
}

export function ascensionCheck(): void {
  if (myAdventures() > 0 || (args.pvp && pvpAttacksLeft() > 0)) {
    throw `You shouldn't be ascending with ${myAdventures()} adventures and ${pvpAttacksLeft()} fites left!`;
  }
}
