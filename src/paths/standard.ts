import { Quest, Task } from "grimoire-kolmafia";
import { canInteract, myAdventures, myPath, pvpAttacksLeft } from "kolmafia";
import { $item, $path, ascend, prepareAscension } from "libram";
import { args, tapped } from "../util";

const standardPath = $path`Standard`;

export const standard: Quest<Task> = {
  name: "standard",
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
  ],
};
