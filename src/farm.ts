import { Quest, Task } from "grimoire-kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $skill,
  get,
  getRemainingLiver,
  getRemainingStomach,
  have,
  withChoice,
} from "libram";
import { args, cliExecuteThrow, tapped, willAscend } from "./util";
import {
  cliExecute,
  drink,
  eat,
  hippyStoneBroken,
  inebrietyLimit,
  myAdventures,
  myAscensions,
  myFamiliar,
  myFullness,
  myInebriety,
  numericModifier,
  pvpAttacksLeft,
  retrieveItem,
  use,
  useSkill,
  visitUrl,
} from "kolmafia";

export const farm: Quest<Task> = {
  name: "farm",
  tasks: [
    {
      name: "hagnk",
      completed: () => get("lastEmptiedStorage") === myAscensions(),
      do: () => cliExecuteThrow("hagnk all"),
    },
    {
      name: "Breakfast",
      do: () => cliExecuteThrow("breakfast"),
      completed: () => get("lastBreakfast") !== -1 || get("breakfastCompleted"),
      limit: { tries: 1 },
    },
    {
      name: "break stone",
      ready: () => args.pvp,
      completed: () => hippyStoneBroken(),
      do: () => visitUrl("peevpee.php?action=smashstone&pwd&confirm=on", true),
    },
    {
      name: "duffo",
      ready: () => ["", "food", "booze"].includes(get("_questPartyFairQuest")),
      completed: () => get("_questPartyFair") !== "unstarted",
      do: () => cliExecuteThrow("duffo go"),
    },
    {
      name: "swagger",
      ready: () => args.pvp && hippyStoneBroken() && pvpAttacksLeft() > 0 && myAdventures() === 0,
      completed: () => pvpAttacksLeft() === 0,
      do: (): void => {
        if (!get("_fireStartingKitUsed") && have($item`CSA fire-starting kit`)) {
          withChoice(595, 1, () => {
            use($item`CSA fire-starting kit`);
          });
        }
        while (get("_meteoriteAdesUsed") < 3 && have($item`Meteorite-Ade`)) {
          use($item`Meteorite-Ade`);
        }
        cliExecute("swagger");
      },
    },
    {
      name: "burnsger",
      ready: () => myInebriety() >= 2 && getRemainingStomach() >= 4,
      completed: () => get("_mrBurnsgerEaten"),
      prepare: (): void => {
        if (!get("_milkOfMagnesiumUsed")) {
          retrieveItem($item`milk of magnesium`);
          use($item`milk of magnesium`);
        }
      },
      do: () => eat($item`Mr. Burnsger`),
    },
    {
      name: "doc clock",
      ready: () => myFullness() >= 2 && getRemainingLiver() >= 4,
      completed: () => get("_docClocksThymeCocktailDrunk"),
      do: () => drink($item`Doc Clock's thyme cocktail`),
    },
    {
      name: "mad liquor",
      ready: () => myFullness() >= 1 && getRemainingLiver() >= 3,
      completed: () => get("_madLiquorDrunk"),
      do: () => drink($item`The Mad Liquor`),
    },
    {
      name: "stooper",
      ready: () =>
        myAdventures() === 0 && getRemainingLiver() === 0 && myFamiliar() !== $familiar`Stooper`,
      completed: () => getRemainingLiver() === 0 && myFamiliar() === $familiar`Stooper`,
      do: () => cliExecuteThrow("drink stillsuit distillate"),
      outfit: { familiar: $familiar`Stooper` },
    },
    {
      name: "nightcap",
      ready: () => getRemainingLiver() === 0 && myFamiliar() === $familiar`Stooper`,
      completed: () => myInebriety() > inebrietyLimit(),
      do: () => cliExecuteThrow("CONSUME NIGHTCAP"),
    },
    {
      name: "garbo ascend",
      ready: () => willAscend(),
      completed: () => tapped(true),
      do: () => cliExecuteThrow("garbo ascend"),
    },
    {
      name: "garbo",
      ready: () => !willAscend(),
      completed: () => tapped(false),
      do: () => cliExecuteThrow("garbo"),
    },
    {
      name: "pajamas",
      prepare: (): void => {
        if (!get("_aug13Cast") || have($effect`Offhand Remarkable`)) {
          useSkill($skill`Aug. 13th: Left/Off Hander's Day!`);
        }
      },
      completed: () => numericModifier("Adventures") > 70,
      do: (): void => {
        cliExecuteThrow("maximize +adv +switch left");
      },
    },
    {
      name: "keeping-tabs",
      ready: () => !willAscend(),
      completed: () => get("_keepingTabs", "") !== "",
      do: () => cliExecuteThrow("keeping-tabs-dev"),
    },
  ],
};
