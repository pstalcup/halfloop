import { canInteract, cliExecute, myTurncount, runChoice, visitUrl } from "kolmafia";
import { $path, questStep } from "libram";

import { args, external, statusUpdate, tapped } from "../util";

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

const path = $path`You, Robot`;
const results = newResults();

export const robot: PathDefinition = {
  name: "robot",
  path,
  results,
  describeArgs: () => [`* invoke looprobot using (${args.looprobot_command})`],
  quest: {
    name: "robot",
    tasks: [
      {
        name: "standard gash",
        prepare: prepareGash,
        ready: () => tapped(true) && args.ascend,
        completed: () => !canInteract() && inPath(path),
        do: (): void => {
          ascendInto(path, { moon: "vole" });
          if (visitUrl("main.php").includes("one made of rusty metal and scrap wiring")) {
            runChoice(1);
          }
          cliExecute("refresh all");
        },
      },
      {
        name: "looprobot",
        ready: () => inPath(path),
        completed: () => canInteract() || questStep("questL13Final") === 13,
        do: (): void => {
          statusUpdate("looprobotstart", "Starting `looprobot`");
          trackResults(results, () => external("looprobot"));
          statusUpdate("looprobotend", "Done with `looprobot`");
        },
      },
      {
        name: "looprobot prism break",
        ready: () => inPath(path) && questStep("questL13Final") === 13,
        completed: () => canInteract(),
        do: (): void => {
          results.turns = myTurncount();
          statusUpdate("looprobotprism", `Breaking robot prism. That took ${results.turns} turns`);
          breakPrism();
        },
      },
      hagnk,
      breakfast,
      liverOfSteel("loopcasual"),
    ],
  },
};
