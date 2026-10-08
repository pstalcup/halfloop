import {
  floristAvailable,
  handlingChoice,
  myTurncount,
  print,
  runChoice,
  visitUrl,
} from "kolmafia";
import { $path, Lifestyle, questStep } from "libram";

import { args, external, statusUpdate, tapped, willAscend } from "../util";

import {
  ascendInto,
  breakfast,
  breakPrism,
  hagnk,
  inPath,
  newResults,
  PathDefinition,
  prepareGash,
  trackResults,
} from "./lib";

const path = $path.none;
const results = newResults();

export const casual: PathDefinition = {
  name: "casual",
  path,
  results,
  describeArgs: () => [`* invoke loopstar using (${args.loopstar_command})`],
  quest: {
    name: "casual",
    tasks: [
      {
        name: "gash",
        prepare: prepareGash,
        ready: () => tapped(true) && willAscend(),
        completed: () => questStep("questL13Final") <= 13,
        do: (): void => {
          statusUpdate("loopcasualstart", "Jumping gash into casual");
          ascendInto(path, { moon: "platypus", lifestyle: Lifestyle.casual, permSkills: true });
          visitUrl("main.php");
          while (handlingChoice()) runChoice(1);
        },
      },
      {
        name: "loopstar",
        ready: () => inPath(path),
        completed: () => questStep("questL13Final") >= 13,
        do: (): void => {
          print(`${questStep("questL13Final")}`);
          statusUpdate("loopstar", "Starting `loopstar`");
          floristAvailable();
          trackResults(results, () => external("loopstar"));
          statusUpdate("loopcasualend", "Done with `loopstar`");
          results.turns = myTurncount();
        },
      },
      {
        name: "casual prism break",
        completed: () => questStep("questL13Final") > 13,
        do: breakPrism,
      },
      hagnk,
      breakfast,
    ],
  },
};
