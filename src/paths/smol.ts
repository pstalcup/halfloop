import { Quest, Task } from "grimoire-kolmafia";
import {
  canInteract,
  handlingChoice,
  myAdventures,
  myPath,
  pvpAttacksLeft,
  retrieveItem,
  runChoice,
  visitUrl,
} from "kolmafia";
import { args, external, tapped } from "../util";
import { $item, $items, $path, ascend, have, prepareAscension } from "libram";

const smolPath = $path`A Shrunken Adventurer am I`;

export const smol: Quest<Task> = {
  name: "smol",
  tasks: [
    ...$items`Deep Dish of Legend, Calzone of Legend, Pizza of Legend`.map((i) => ({
      name: `prep ${i}`,
      ready: () => canInteract(),
      completed: () => have(i),
      do: () => retrieveItem(i),
    })),
    {
      name: "smol gash",
      prepare: (): void => {
        if (myAdventures() > 0 || pvpAttacksLeft() > 0) {
          throw `You shouldn't be ascending with ${myAdventures()} adventures and ${pvpAttacksLeft()} fites left!`;
        }
        const garden = "packet of rock seeds";
        const eudora = "Our Daily Candles™ order form";
        prepareAscension({ garden, eudora });
      },
      ready: () => tapped(true) && args.ascend,
      completed: () => !canInteract() && myPath() === smolPath,
      do: (): void => {
        ascend({
          path: smolPath,
          playerClass: args.class,
          lifestyle: args.lifestyle,
          moon: "knoll",
          pet: $item`astral belt`,
          consumable: $item`astral six-pack`,
        });
        visitUrl("main.php");
        while (handlingChoice()) runChoice(1);
      },
    },
    {
      name: "loopsmol",
      completed: () => canInteract(),
      do: (): void => {
        external("loopsmol");
      },
    },
  ],
};
