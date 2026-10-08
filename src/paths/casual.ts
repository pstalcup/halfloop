import { Quest, Task } from "grimoire-kolmafia";
import {
  canInteract,
  floristAvailable,
  handlingChoice,
  myAscensions,
  myPath,
  myTurncount,
  print,
  runChoice,
  visitUrl,
} from "kolmafia";
import { $item, $path, ascend, get, Lifestyle, prepareAscension, questStep, Session } from "libram";

import {
  args,
  ascensionCheck,
  cliExecuteThrow,
  external,
  halfloopValue,
  skillsToPerm,
  statusUpdate,
  tapped,
  willAscend,
} from "../util";

const casualPath = $path.none;
export let casualMeat = 0;
export let casualItems = 0;
export let casualTurns = 0;

export const casual: Quest<Task> = {
  name: "casual",
  tasks: [
    {
      name: "gash",
      prepare: (): void => {
        ascensionCheck();
        const garden = "packet of rock seeds";
        const eudora = "Our Daily Candles™ order form";
        prepareAscension({ garden, eudora });
      },
      ready: () => tapped(true) && willAscend(),
      completed: () => questStep("questL13Final") <= 13,
      do: (): void => {
        statusUpdate("loopsmolstart", "Jumping gash into smol");
        ascend({
          path: casualPath,
          playerClass: args.class,
          lifestyle: Lifestyle.casual,
          moon: "platypus",
          pet: $item`astral belt`,
          consumable: $item`astral six-pack`,
          permOptions: {
            permSkills: new Map(skillsToPerm().map((s) => [s, Lifestyle.hardcore])),
            neverAbort: false,
          },
        });
        visitUrl("main.php");
        while (handlingChoice()) runChoice(1);
      },
    },
    {
      name: "loopstar",
      ready: () => myPath() === casualPath,
      completed: () => questStep("questL13Final") >= 13,
      do: (): void => {
        print(`${questStep("questL13Final")}`);
        statusUpdate("loopstar", "Starting `loopstar`");

        floristAvailable();
        const start = Session.current();
        external("loopstar");
        const end = Session.current();

        const { meat, items } = Session.diff(end, start).value(halfloopValue);
        casualMeat = meat;
        casualItems = items;

        statusUpdate("loopsmolend", "Done with `loopsmol`");

        casualTurns = myTurncount();
      },
    },
    {
      name: "loopsmol prism break",
      completed: () => questStep("questL13Final") > 13,
      do: (): void => {
        visitUrl("place.php?whichplace=nstower&action=ns_11_prism");
      },
    },
    {
      name: "hagnk",
      ready: () => canInteract(),
      completed: () => get("lastEmptiedStorage") === myAscensions(),
      do: (): void => {
        cliExecuteThrow("hagnk all");
      },
      post: () => cliExecuteThrow("breakfast"),
    },
  ],
};
