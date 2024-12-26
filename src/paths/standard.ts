import { Quest, Task } from "grimoire-kolmafia";
import { canInteract, myAscensions, myPath } from "kolmafia";
import { $item, $path, ascend, get, prepareAscension } from "libram";
import { args, ascensionCheck, cliExecuteThrow, tapped } from "../util";

const standardPath = $path`Standard`;

export const standard: Quest<Task> = {
  name: "standard",
  tasks: [
    {
      name: "standard gash",
      prepare: (): void => {
        ascensionCheck();
        const garden = "packet of rock seeds";
        const eudora = "Our Daily Candles™ order form";
        prepareAscension({ garden, eudora });
      },
      ready: () => tapped(true) && args.ascend,
      completed: () => !canInteract() && myPath() === standardPath,
      do: (): void => {
        ascend({
          path: standardPath,
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
