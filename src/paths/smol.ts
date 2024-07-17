import { Quest, Task } from "grimoire-kolmafia";
import {
  abort,
  canInteract,
  drink,
  handlingChoice,
  myAdventures,
  myAscensions,
  myPath,
  myTurncount,
  pvpAttacksLeft,
  runChoice,
  use,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  args,
  cliExecuteThrow,
  external,
  halfloopValue,
  skillsToPerm,
  statusUpdate,
  tapped,
  willAscend,
} from "../util";
import {
  $item,
  $path,
  $skill,
  ascend,
  get,
  getRemainingLiver,
  have,
  Lifestyle,
  prepareAscension,
  questStep,
  Session,
} from "libram";

export const smolPath = $path`A Shrunken Adventurer am I`;
export let smolMeat = 0;
export let smolItems = 0;
export let smolTurns = 0;

export const smol: Quest<Task> = {
  name: "smol",
  tasks: [
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
      ready: () => tapped(true) && willAscend(),
      completed: () => !canInteract() && myPath() === smolPath,
      do: (): void => {
        statusUpdate("loopsmolstart", "Jumping gash into smol");
        ascend({
          path: smolPath,
          playerClass: args.class,
          lifestyle: args.lifestyle,
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
      name: "loopsmol",
      ready: () => myPath() === smolPath,
      completed: () => canInteract() || questStep("questL13Final") === 13,
      do: (): void => {
        statusUpdate("loopsmolstart", "Starting `loopsmol`");

        const start = Session.current();
        external("loopsmol");
        const end = Session.current();

        const { meat, items } = Session.diff(end, start).value(halfloopValue);
        smolMeat = meat;
        smolItems = items;

        statusUpdate("loopsmolend", "Done with `loopsmol`");
      },
    },
    {
      name: "loopsmol prism break",
      ready: () => myPath() === smolPath && questStep("questL13Final") === 13,
      completed: () => canInteract(),
      do: (): void => {
        drink($item`astral pilsner`);
        smolTurns = myTurncount();
        statusUpdate("loopsmolprism", `Breaking smol prism. That took ${smolTurns} turns`);
        visitUrl("place.php?whichplace=nstower&action=ns_11_prism");
      },
      post: (): void => {
        if (get("sweat") < 75) {
          abort("Not enough sweat");
        }
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
    {
      name: "smol sober up (sweat it out)",
      ready: () => canInteract() && get("_sweatOutSomeBoozeUsed") < 3,
      completed: () => tapped(false) || getRemainingLiver() >= 0,
      do: (): void => {
        useSkill($skill`Sweat Out Some Booze`);
      },
    },
    {
      name: "smol sober up (sobrie tea)",
      ready: () => canInteract() && !get("_pottedTeaTreeUsed"),
      completed: () => tapped(false) || getRemainingLiver() >= 0,
      do: (): void => {
        cliExecuteThrow("teatree sobrie tea");
        use($item`cuppa Sobrie tea`);
      },
    },
    {
      name: "smol sober up (dog hair)",
      ready: () => canInteract() && !get("_syntheticDogHairPillUsed"),
      completed: () => tapped(false) || getRemainingLiver() >= 0,
      do: (): void => {
        use($item`synthetic dog hair pill`);
      },
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
