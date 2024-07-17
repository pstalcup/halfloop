import { Quest, Task } from "grimoire-kolmafia";
import {
  canInteract,
  myAdventures,
  myAscensions,
  myPath,
  myTurncount,
  pvpAttacksLeft,
  visitUrl,
} from "kolmafia";
import { $item, $path, ascend, get, prepareAscension, questStep, Session } from "libram";
import { args, cliExecuteThrow, external, halfloopValue, statusUpdate, tapped } from "../util";

export const robotPath = $path`You, Robot`;
export let robotItems = 0;
export let robotMeat = 0;
export let robotTurns = 0;

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
      name: "looprobot",
      ready: () => myPath() === robotPath,
      completed: () => canInteract() || questStep("questL13Final") === 13,
      do: (): void => {
        statusUpdate("loopsmolstart", "Starting `loopsmol`");

        const start = Session.current();
        external("looprobot");
        const end = Session.current();

        const { meat, items } = Session.diff(end, start).value(halfloopValue);
        robotMeat = meat;
        robotItems = items;

        statusUpdate("loopsmolend", "Done with `loopsmol`");
      },
    },
    {
      name: "loopsmol prism break",
      ready: () => myPath() === robotPath && questStep("questL13Final") === 13,
      completed: () => canInteract(),
      do: (): void => {
        robotTurns = myTurncount();
        statusUpdate("loopsmolprism", `Breaking smol prism. That took ${robotTurns} turns`);
        visitUrl("place.php?whichplace=nstower&action=ns_11_prism");
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
