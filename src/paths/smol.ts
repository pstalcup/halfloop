import {
  abort,
  canInteract,
  drink,
  floristAvailable,
  handlingChoice,
  myTurncount,
  runChoice,
  use,
  useSkill,
  visitUrl,
} from "kolmafia";
import { $item, $path, $skill, get, getRemainingLiver, questStep } from "libram";

import { args, cliExecuteThrow, external, statusUpdate, tapped, willAscend } from "../util";

import {
  ascendInto,
  breakfast,
  breakPrism,
  hagnk,
  inPath,
  liverOfSteel,
  newResults,
  PathDefinition,
  prepareGash,
  trackResults,
} from "./lib";

const path = $path`A Shrunken Adventurer am I`;
const results = newResults();

const soberedUp = () => tapped(false) || getRemainingLiver() >= 0;

export const smol: PathDefinition = {
  name: "smol",
  path,
  results,
  describeArgs: () => [`* invoke loopsmol using (${args.loopstar_command})`],
  quest: {
    name: "smol",
    tasks: [
      {
        name: "smol gash",
        prepare: prepareGash,
        ready: () => tapped(true) && willAscend(),
        completed: () => !canInteract() && inPath(path),
        do: (): void => {
          statusUpdate("loopsmolstart", "Jumping gash into smol");
          ascendInto(path, { moon: "platypus", permSkills: true });
          visitUrl("main.php");
          while (handlingChoice()) runChoice(1);
        },
      },
      {
        name: "loopsmol",
        ready: () => inPath(path),
        completed: () => canInteract() || questStep("questL13Final") === 13,
        do: (): void => {
          statusUpdate("loopsmolstart", "Starting `loopsmol`");
          floristAvailable();
          trackResults(results, () => external("loopstar"));
          statusUpdate("loopsmolend", "Done with `loopsmol`");
        },
      },
      {
        name: "loopsmol prism break",
        ready: () => inPath(path) && questStep("questL13Final") === 13,
        completed: () => canInteract(),
        do: (): void => {
          drink($item`astral pilsner`);
          results.turns = myTurncount();
          statusUpdate("loopsmolprism", `Breaking smol prism. That took ${results.turns} turns`);
          breakPrism();
        },
        post: (): void => {
          if (get("sweat") < 75) abort("Not enough sweat");
        },
      },
      hagnk,
      breakfast,
      {
        name: "smol sober up (sweat it out)",
        ready: () => canInteract() && get("_sweatOutSomeBoozeUsed") < 3,
        completed: soberedUp,
        do: () => useSkill($skill`Sweat Out Some Booze`),
      },
      {
        name: "smol sober up (sobrie tea)",
        ready: () => canInteract() && !get("_pottedTeaTreeUsed"),
        completed: soberedUp,
        do: (): void => {
          cliExecuteThrow("teatree sobrie tea");
          use($item`cuppa Sobrie tea`);
        },
      },
      {
        name: "smol sober up (dog hair)",
        ready: () => canInteract() && !get("_syntheticDogHairPillUsed"),
        completed: soberedUp,
        do: () => use($item`synthetic dog hair pill`),
      },
      liverOfSteel("loopstar"),
    ],
  },
};
