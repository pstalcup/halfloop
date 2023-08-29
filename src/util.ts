import { Args } from "grimoire-kolmafia";
import { cliExecute, inebrietyLimit, myAdventures, myInebriety } from "kolmafia";
import { get } from "libram";

export const args = Args.create("halfloop", "Loop your brains out (on live tv)", {
  pvp: Args.boolean({ help: "Run PVP fites", default: true }),
  ascend: Args.boolean({ help: "Loop today", default: true }),
});

export function cliExecuteThrow(command: string): void {
  if (!cliExecute(command)) throw `Failed to execute ${command}`;
}

export function tapped(ascend: boolean): boolean {
  // you are done for today if:
  // * when ascending, you have 0 turns
  // * when not ascending, you are overdrunk
  return (ascend && myAdventures() === 0) || (!ascend && myInebriety() > inebrietyLimit());
}

export function willAscend(): boolean {
  return args.ascend && get("ascensionsToday") === 0;
}
