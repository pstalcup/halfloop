import { Quest, Task } from "grimoire-kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $skill,
  get,
  getRemainingLiver,
  have,
  withChoice,
} from "libram";
import { cliExecuteThrow, tapped, willAscend } from "./util";
import {
  cliExecute,
  hippyStoneBroken,
  inebrietyLimit,
  myAdventures,
  myAscensions,
  myFamiliar,
  myInebriety,
  numericModifier,
  pvpAttacksLeft,
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
      completed: () => hippyStoneBroken(),
      do: () => visitUrl("peevpee.php?action=smashstone&pwd&confirm=on", true),
    },
    {
      name: "duffo",
      completed: () => get("_questPartyFair") !== "unstarted" || get("_questPartyFairQuest") !== "",
      do: () => cliExecuteThrow("duffo go"),
    },
    {
      name: "swagger",
      ready: () => hippyStoneBroken() && pvpAttacksLeft() > 0 && myAdventures() === 0,
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
