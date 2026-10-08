import {
  cliExecute,
  myAdventures,
  myTurncount,
  putCloset,
  pvpAttacksLeft,
  takeCloset,
} from "kolmafia";
import { $item, $path, get, Lifestyle } from "libram";

import { args, cliExecuteThrow, external, tapped } from "../util";

import { hagnk, newResults, PathDefinition, runBreakfast, trackResults } from "./lib";

const results = newResults();

export const cs: PathDefinition = {
  name: "cs",
  path: $path`Community Service`,
  results,
  describeArgs: () => [
    `* invoke phccs_gash using (${args.phccs_gash_command})`,
    `* invoke phccs using (${args.phccs_command})`,
  ],
  quest: {
    name: "cs",
    tasks: [
      {
        name: "phccs_gash",
        prepare: (): void => {
          if (myAdventures() > 0 || pvpAttacksLeft() > 0) {
            throw `You shouldn't be ascending with ${myAdventures()} adventures and ${pvpAttacksLeft()} fites left!`;
          }
        },
        ready: () => tapped(true) && args.ascend,
        completed: () => get("ascensionsToday") > 0,
        do: () =>
          external(
            "phccs_gash",
            `${args.lifestyle === Lifestyle.hardcore ? "hardcore" : "softcore"}`,
            { key: "class", value: `${args.class}` },
          ),
      },
      {
        name: "phccs",
        ready: () => get("ascensionsToday") === 1,
        completed: () => get("questL13Final") === "finished",
        do: (): void => {
          putCloset($item`Leprecondo`);
          trackResults(results, () => external("phccs"));
          takeCloset($item`Leprecondo`);

          results.turns = myTurncount();
          cliExecute("refresh all");
          cliExecuteThrow("hagnk all");
          runBreakfast();
        },
      },
      hagnk,
    ],
    completed: () => get("ascensionsToday") === 1 && get("questL13Final") === "finished",
  },
};
