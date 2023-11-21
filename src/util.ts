import { Args } from "grimoire-kolmafia";
import {
  choiceFollowsFight,
  Class,
  cliExecute,
  getAutoAttack,
  holiday,
  inebrietyLimit,
  inMultiFight,
  myAdventures,
  myFamiliar,
  myInebriety,
  mySpleenUse,
  Path,
  print,
  runCombat,
  setAutoAttack,
  setCcs,
  toClass,
  todayToString,
  toPath,
  visitUrl,
  writeCcs,
} from "kolmafia";
import {
  $class,
  $familiar,
  $path,
  get,
  Lifestyle,
  set,
  StrictMacro,
} from "libram";

const pathShortcuts = new Map([
  ["smol", $path`A Shrunken Adventurer am I`],
  ["cs", $path`Community Service`],
]);

export const args = Args.create(
  "halfloop",
  "Loop your brains out (on live tv)",
  {
    pvp: Args.boolean({ help: "Run PVP fites", default: true }),
    ascend: Args.boolean({ help: "Loop today", default: true }),
    batfellow: Args.boolean({
      help: "consider batfellow consumables",
      default: true,
    }),
    adventures: Args.number({
      help: "How many turns to keep on your final leg (will also skip nightcap)",
      default: 0,
    }),
    garbo_command: Args.string({
      help: "how to invoke garbo",
      default: "garbo",
    }),
    keeping_tabs_command: Args.string({
      help: "how to invoke keeping tabs",
      default: "keeping-tabs-dev",
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
    class: Args.custom<Class>(
      {
        help: "what class to run PHCCS as",
        default: $class`Pastamancer`,
      },
      (v: string) => toClass(v),
      "CLASS",
    ),
    path: Args.custom<Path>(
      {
        help: "What path to run as",
        default: $path`Community Service`,
      },
      (v: string) => pathShortcuts.get(v) ?? toPath(v),
      "PATH",
    ),
    lifestyle: Args.custom<Lifestyle>(
      {
        help: "Ascend as Hardcore or Softcore",
        default: Lifestyle.softcore,
      },
      (v) => (v === "hardcore" ? Lifestyle.hardcore : Lifestyle.softcore),
      "LIFESTYLE",
    ),
    // different modes
    list: Args.flag({ help: "list all tasks and then exit" }),
    args: Args.flag({
      help: "print out a message showing what args will be used",
    }),
    sleep: Args.flag({ help: "sleep before executing main loop" }),
  },
);

const _HALLOWEEN = false;

export function printArgs(): void {
  if (_HALLOWEEN) {
    print("DEBUG TEST: HALLOWEEN");
  }
  print(`* Ascend: (${args.ascend})`);
  print(`* Run PVP fites: (${args.pvp})`);
  print(
    args.adventures === 0
      ? "* Keep no adventures and nightcap"
      : `* Keep ${args.adventures} adventures and do not nightcap`,
  );
  print(`* invoke garbo using (${args.garbo_command})`);
  print(`* invoke keeping-tabs using (${args.keeping_tabs_command})`);
  print(`* invoke CONSUME using (${args.consume_command})`);
  print(`* invoke phccs_gash using (${args.phccs_gash_command})`);
  print(`* invoke phccs using (${args.phccs_gash_command})`);
  print(`* ascend in path (${args.path})`);
  print(`* ascend as (${args.class})`);
}

export function cliExecuteThrow(command: string): void {
  if (!cliExecute(command)) throw `Failed to execute ${command}`;
}

export function tapped(ascend: boolean): boolean {
  // you are done for today if:
  // * when ascending, you have 0 turns
  // * when not ascending, you are overdrunk
  const limit =
    inebrietyLimit() - (myFamiliar() === $familiar`Stooper` ? 1 : 0);
  if (ascend) {
    return myInebriety() > limit && myAdventures() === 0;
  } else {
    return myInebriety() > limit && mySpleenUse() >= 15;
  }
}

export function willAscend(): boolean {
  return args.ascend && get("ascensionsToday") === 0;
}

const devExternalScripts = [
  "garbo",
  "keeping_tabs",
  "consume",
  "phccs",
  "phccs_gash",
] as const;
type DevExternalScript = (typeof devExternalScripts)[number];
const externalScripts = [
  "autoscend",
  "freecandy",
  "combo",
  "loopsmol",
  "loopcasual",
] as const;
type ExternalScript = (typeof externalScripts)[number];

function isExternalScript(value: string): value is ExternalScript {
  return externalScripts.includes(value as ExternalScript);
}

type ScriptArg = string | { key: string; value: string };
export function external(
  name: DevExternalScript | ExternalScript,
  ...scriptArgs: ScriptArg[]
): void {
  const strArgs = scriptArgs.map((a) =>
    typeof a === "string" ? a : `${a.key}="${a.value}"`,
  );
  const command = isExternalScript(name) ? name : args[`${name}_command`];
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
    throw `Combat exception! Last macro error: ${get(
      "lastMacroError",
    )}. Exception ${e}.`;
  }
}

/**
 * Attempt to perform a nonstandard combat-starting Action with a Macro
 * @param macro The Macro to attempt to use
 * @param action The combat-starting action to attempt
 * @param tryAuto Whether or not we should try to resolve the combat with an autoattack; autoattack macros can fail against special monsters, and thus we have to submit a macro via CCS regardless.
 * @returns The output of your specified action function (typically void)
 */
export function withMacro<T, M extends StrictMacro>(
  macro: M,
  action: () => T,
  tryAuto = false,
): T {
  if (getAutoAttack() !== 0) setAutoAttack(0);
  if (tryAuto) macro.setAutoAttack();
  makeCcs(macro);
  try {
    return runCombatBy(action);
  } finally {
    if (tryAuto) setAutoAttack(0);
  }
}

const dailyNumericProperties = [
  "halfloop_turnsSpent",
  "halfloop_swagger",
] as const;
export type DailyNumericProperty = (typeof dailyNumericProperties)[number];
export const HALFLOOP_DAILY_FLAG = "halfloop_dailyFlag";

export function daily<T>(
  callback: (functions: {
    get: (property: DailyNumericProperty) => number;
    set: (property: DailyNumericProperty, value: number) => void;
  }) => T,
): T {
  if (get(HALFLOOP_DAILY_FLAG) !== todayToString()) {
    set(HALFLOOP_DAILY_FLAG, todayToString());
    for (const prop of dailyNumericProperties) {
      set(prop, 0);
    }
  }
  return callback({
    get: (property: DailyNumericProperty) => get(property, 0),
    set: (property: DailyNumericProperty, value: number) =>
      set(property, value),
  });
}

export function fmt(value: number | string): string {
  return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function halloween(): boolean {
  return _HALLOWEEN || holiday().includes("Halloween");
}
