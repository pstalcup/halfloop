import { Quest, Task } from "grimoire-kolmafia";
import { $effect, $item, $skill, get, have } from "libram";
import { args, cliExecuteThrow, external, tapped, willAscend } from "./util";
import {
  getShop,
  Item,
  mallPrice,
  myAdventures,
  myAscensions,
  numericModifier,
  repriceShop,
  shopPrice,
  use,
  useSkill,
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
      name: "raindoh",
      completed: () => have($item`empty Rain-Doh can`),
      do: () => use($item`can of Rain-Doh`),
    },
    {
      name: "breakfast",
      do: () => cliExecuteThrow("breakfast"),
      completed: () => get("lastBreakfast") !== -1 || get("breakfastCompleted"),
      limit: { tries: 1 },
    },
    {
      name: "duffo",
      ready: () => ["", "food", "booze"].includes(get("_questPartyFairQuest")),
      completed: () => get("_questPartyFair") !== "unstarted",
      do: () => cliExecuteThrow("duffo go"),
    },
    {
      name: "garbo ascend",
      ready: () => willAscend(),
      completed: () => tapped(true),
      do: () => external("garbo", "ascend"),
    },
    {
      name: "garbo",
      ready: () => args.adventures === 0 && !willAscend(),
      completed: () => tapped(false),
      do: () => external("garbo"),
    },
    {
      name: "limited garbo",
      ready: () => args.adventures > 0 && !willAscend(),
      completed: () => myAdventures() <= args.adventures,
      do: () => external("garbo", `-${args.adventures}`),
    },
    {
      name: "pajamas",
      ready: () => !willAscend() && args.adventures === 0,
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
      do: () => external("keeping_tabs"),
      post: (): void => {
        const shop = getShop();
        for (const itemStr of Object.keys(shop)) {
          const item = Item.get(itemStr);
          if (shopPrice(item) === 999999999) {
            repriceShop(Math.floor(mallPrice(item) * 0.95), item);
          }
        }
      },
    },
  ],
};
