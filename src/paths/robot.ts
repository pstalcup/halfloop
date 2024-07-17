import { Quest, Task } from "grimoire-kolmafia";
import { canInteract, myAdventures, myAscensions, myPath, pvpAttacksLeft } from "kolmafia";
import { $item, $path, ascend, get, prepareAscension } from "libram";
import { args, cliExecuteThrow, tapped } from "../util";

const robotPath = $path`You, Robot`;

export const robot: Quest<Task> = {
  name: "robot",
  tasks: [
    {
      name: "standard gash",
      prepare: (): void => {
        if (myAdventures() > 0 || pvpAttacksLeft() > 0) {
          throw `You shouldn't be ascending with ${myAdventures()} adventures and ${pvpAttacksLeft()} fites left!`;
        }
        const garden = "packet of rock seeds";
        const eudora = "Our Daily Candles™ order form";
        prepareAscension({ garden, eudora });
      },
      ready: () => tapped(true) && args.ascend,
      completed: () => !canInteract() && myPath() === robotPath,
      do: (): void => {
        ascend({
          path: robotPath,
          playerClass: args.class,
          lifestyle: args.lifestyle,
          moon: "knoll",
          pet: $item`astral belt`,
          consumable: $item`astral six-pack`,
        });
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
};
