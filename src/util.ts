import { Args } from "grimoire-kolmafia";
import { cliExecute, inebrietyLimit, myAdventures, myFamiliar, myInebriety } from "kolmafia";
import { $familiar, get } from "libram";

export const args = Args.create("halfloop", "Loop your brains out (on live tv)", {
  pvp: Args.boolean({ help: "Run PVP fites", default: true }),
  ascend: Args.boolean({ help: "Loop today", default: true }),
  batfellow: Args.boolean({ help: "consider batfellow consumables", default: true }),
  list: Args.flag({ help: "list all tasks and then exit" }),
  adventures: Args.number({
    help: "How many turns to keep on your final leg (will also skip nightcap)",
    default: 0,
  }),
});

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
