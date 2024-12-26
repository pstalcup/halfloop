import { Quest, Task } from "grimoire-kolmafia";
import {
  canInteract,
  cliExecute,
  myAscensions,
  myPath,
  myTurncount,
  runChoice,
  visitUrl,
} from "kolmafia";
import {
  $item,
  $path,
  $skill,
  ascend,
  get,
  have,
  prepareAscension,
  questStep,
  Session,
} from "libram";
import {
  args,
  ascensionCheck,
  cliExecuteThrow,
  external,
  halfloopValue,
  statusUpdate,
  tapped,
} from "../util";

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
        ascensionCheck();
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
          moon: "vole",
          pet: $item`astral belt`,
          consumable: $item`astral six-pack`,
        });
        if (visitUrl("main.php").includes("one made of rusty metal and scrap wiring")) runChoice(1);
        cliExecute("refresh all");
      },
    },

    {
      name: "looprobot",
      ready: () => myPath() === robotPath,
      completed: () => canInteract() || questStep("questL13Final") === 13,
      do: (): void => {
        statusUpdate("looprobotstart", "Starting `looprobot`");

        const start = Session.current();
        external("looprobot");
        const end = Session.current();

        const { meat, items } = Session.diff(end, start).value(halfloopValue);
        robotMeat = meat;
        robotItems = items;

        statusUpdate("looprobotend", "Done with `looprobot`");
      },
    },
    {
      name: "looprobot prism break",
      ready: () => myPath() === robotPath && questStep("questL13Final") === 13,
      completed: () => canInteract(),
      do: (): void => {
        robotTurns = myTurncount();
        statusUpdate("looprobotprism", `Breaking roboit prism. That took ${robotTurns} turns`);
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
    {
      name: "liver of steel",
      ready: () => questStep("questL06Friar") === 999,
      completed: () => have($skill`Liver of Steel`),
      do: (): void => {
        external("loopcasual", { key: "goal", value: "organ" });
      },
    },
  ],
};
