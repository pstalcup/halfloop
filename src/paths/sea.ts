import { canInteract, handlingChoice, myTurncount, runChoice, visitUrl } from "kolmafia";
import { $path, get } from "libram";

import { args, external, statusUpdate, tapped, willAscend } from "../util";

import {
  ascendInto,
  breakfast,
  hagnk,
  inPath,
  newResults,
  PathDefinition,
  prepareGash,
  trackResults,
} from "./lib";

const path = $path`11,037 Leagues Under the Sea`;
const results = newResults();

/**
 * The sea path has no prism. Mafia marks questL13Final finished when the Nautical Seaceress
 * dies, but the king is only freed (and the path left) by then visiting the council.
 */
const seaceressDefeated = () => get("questL13Final") === "finished";

export const sea: PathDefinition = {
  name: "sea",
  path,
  results,
  describeArgs: () => [`* invoke UnderTheSea using (${args.underthesea_command})`],
  quest: {
    name: "sea",
    tasks: [
      {
        name: "sea gash",
        prepare: prepareGash,
        ready: () => tapped(true) && willAscend(),
        completed: () => !canInteract() && inPath(path),
        do: (): void => {
          statusUpdate("loopseastart", "Jumping gash into the sea");
          ascendInto(path, { moon: "platypus" });
          // UnderTheSea can get stuck on the intro noncombat, so clear it here
          visitUrl("main.php");
          while (handlingChoice()) runChoice(1);
        },
      },
      {
        name: "UnderTheSea",
        // Only in the path: run in aftercore, UnderTheSea starts an aftercore sea quest instead
        ready: () => inPath(path),
        completed: () => canInteract() || seaceressDefeated(),
        do: (): void => {
          statusUpdate("loopseastart", "Starting `UnderTheSea`");
          trackResults(results, () => external("underthesea"));
          // UnderTheSea frees the king itself, so this is usually the only place to count turns
          results.turns = myTurncount();
          statusUpdate("loopseaend", "Done with `UnderTheSea`");
        },
      },
      {
        name: "sea free king",
        ready: () => inPath(path) && seaceressDefeated(),
        completed: () => canInteract(),
        do: (): void => {
          results.turns = myTurncount();
          statusUpdate("loopseaking", `Freeing the sea king. That took ${results.turns} turns`);
          visitUrl("council.php");
          // Choice 1565 is the sea path council; its first option frees the king
          if (handlingChoice()) runChoice(1);
        },
      },
      hagnk,
      breakfast,
    ],
  },
};
