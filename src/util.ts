import { Args } from "grimoire-kolmafia";
import {
  Class,
  cliExecute,
  inebrietyLimit,
  myAdventures,
  myFamiliar,
  myInebriety,
  print,
  toClass,
} from "kolmafia";
import { $class, $familiar, get } from "libram";

export const args = Args.create("halfloop", "Loop your brains out (on live tv)", {
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
    default: "keeping-tabs-dev",
  }),
  consume_command: Args.string({
    help: "how to invoke CONSUME",
    default: "CONSUME",
  }),
  phccs_gash_command: Args.string({
    help: "how to invoke phccs_gash",
    default: "phccs_gash softcore",
  }),
  phccs_command: Args.string({
    help: "how to invoke phccs",
    default: "phccs",
  }),
  cs_class: Args.custom<Class>(
    {
      help: "what class to run PHCCS as",
      default: $class`Pastamancer`,
    },
    (v: string) => toClass(v),
    "CLASS"
  ),
  // different modes
  list: Args.flag({ help: "list all tasks and then exit" }),
  args: Args.flag({ help: "print out a message showing what args will be used" }),
});

export function printArgs(): void {
  print(`* Ascend: (${args.ascend})`);
  print(`* Run PVP fites: (${args.pvp})`);
  print(
    args.adventures === 0
      ? "* Keep no adventures and nightcap"
      : `* Keep ${args.adventures} adventures and do not nightcap`
  );
  print(`* invoke garbo using (${args.garbo_command})`);
  print(`* invoke keeping-tabs using (${args.keeping_tabs_command})`);
  print(`* invoke CONSUME using (${args.consume_command})`);
  print(`* invoke phccs_gash using (${args.phccs_gash_command})`);
  print(`* invoke phccs using (${args.phccs_gash_command})`);
  print(`* ascend in CS as (${args.cs_class})`);
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
    return myInebriety() > limit;
  }
}

export function willAscend(): boolean {
  return args.ascend && get("ascensionsToday") === 0;
}

type ScriptArg = string | { key: string; value: string };
export function external(
  name: "garbo" | "keeping_tabs" | "consume" | "phccs" | "phccs_gash",
  ...scriptArgs: ScriptArg[]
): void {
  const strArgs = scriptArgs.map((a) => (typeof a === "string" ? a : `${a.key}="${a.value}"`));
  cliExecuteThrow([args[`${name}_command`], ...strArgs].join(" "));
}
