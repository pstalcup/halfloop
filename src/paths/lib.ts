import { Quest, Task } from "grimoire-kolmafia";
import { canInteract, myAscensions, myPath, Path, visitUrl } from "kolmafia";
import {
  $item,
  $skill,
  ascend,
  get,
  have,
  Lifestyle,
  prepareAscension,
  questStep,
  Session,
} from "libram";

import {
  args,
  ascensionCheck,
  cliExecuteThrow,
  external,
  ExternalScript,
  halfloopValue,
  skillsToPerm,
} from "../util";

export type PathResults = { meat: number; items: number; turns: number };

export type PathDefinition = {
  /** Short name: accepted by the `path` arg, and used in result properties and summaries */
  name: string;
  path: Path;
  quest: Quest<Task>;
  /** Present when the path runs a loop script whose profit should be reported */
  results?: PathResults;
  /** Extra lines for the run options printout */
  describeArgs?: () => string[];
};

export function newResults(): PathResults {
  return { meat: 0, items: 0, turns: 0 };
}

/** Run `action` and record the meat and items it gained into `results` */
export function trackResults(results: PathResults, action: () => void): void {
  const start = Session.current();
  action();
  const { meat, items } = Session.diff(Session.current(), start).value(halfloopValue);
  results.meat = meat;
  results.items = items;
}

export function inPath(path: Path): boolean {
  return myPath() === path;
}

export function prepareGash(): void {
  ascensionCheck();
  prepareAscension({ garden: "packet of rock seeds", eudora: "Our Daily Candles™ order form" });
}

type GashOptions = {
  moon: Parameters<typeof ascend>[0]["moon"];
  /** Defaults to the `lifestyle` arg */
  lifestyle?: Lifestyle;
  /** Hardcore perm every skill we have that isn't already permed */
  permSkills?: boolean;
};

export function ascendInto(path: Path, { moon, lifestyle, permSkills }: GashOptions): void {
  ascend({
    path,
    playerClass: args.class,
    lifestyle: lifestyle ?? args.lifestyle,
    moon,
    pet: $item`astral belt`,
    consumable: $item`astral six-pack`,
    ...(permSkills
      ? {
          permOptions: {
            permSkills: new Map(skillsToPerm().map((s) => [s, Lifestyle.hardcore])),
            neverAbort: false,
          },
        }
      : {}),
  });
}

export function breakPrism(): void {
  visitUrl("place.php?whichplace=nstower&action=ns_11_prism");
}

export const hagnk: Task = {
  name: "hagnk",
  ready: () => canInteract(),
  completed: () => get("lastEmptiedStorage") === myAscensions(),
  do: () => cliExecuteThrow("hagnk all"),
  post: () => cliExecuteThrow("breakfast"),
};

/** Once the Friars are done, have `script` fill our organs so we pick up Liver of Steel */
export function liverOfSteel(script: ExternalScript): Task {
  return {
    name: "liver of steel",
    ready: () => questStep("questL06Friar") === 999,
    completed: () => have($skill`Liver of Steel`),
    do: () => external(script, { key: "goal", value: "organ" }),
  };
}
