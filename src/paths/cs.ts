import { Quest, Task } from "grimoire-kolmafia";
import { get, Lifestyle, Session } from "libram";
import { args, cliExecuteThrow, external, halfloopValue, tapped } from "../util";
import {
  canInteract,
  cliExecute,
  myAdventures,
  myAscensions,
  myTurncount,
  pvpAttacksLeft,
} from "kolmafia";

export let csMeat = 0;
export let csItems = 0;
export let csTurns = 0;

export const cs: Quest<Task> = {
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
          { key: "class", value: `${args.class}` }
        ),
    },
    {
      name: "phccs",
      ready: () => get("ascensionsToday") === 1,
      completed: () => get("questL13Final") === "finished",
      do: (): void => {
        const start = Session.current();
        external("phccs");
        const end = Session.current();

        const { meat, items } = Session.diff(end, start).value(halfloopValue);
        csMeat = meat;
        csItems = items;
        csTurns = myTurncount();
        cliExecute("refresh all");
      },
    },

    {
      name: "hagnk",
      ready: () => canInteract(),
      completed: () => get("lastEmptiedStorage") === myAscensions(),
      do: () => cliExecuteThrow("hagnk all"),
      post: () => cliExecuteThrow("breakfast"),
    },
  ],
  completed: () => get("ascensionsToday") === 1 && get("questL13Final") === "finished",
};
