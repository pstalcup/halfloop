import { Quest, Task } from "grimoire-kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $location,
  $monster,
  $monsters,
  $skill,
  byClass,
  get,
  have,
  StrictMacro,
} from "libram";
import { args, cliExecuteThrow, external, tapped, willAscend, withMacro } from "./util";
import {
  adv1,
  availableAmount,
  canInteract,
  getShop,
  guildStoreAvailable,
  handlingChoice,
  Item,
  mallPrice,
  myAdventures,
  myAscensions,
  myClass,
  numericModifier,
  repriceShop,
  runChoice,
  shopPrice,
  use,
  useSkill,
  visitUrl,
} from "kolmafia";

const RUNAWAY_MACRO = StrictMacro.if_(
  $monsters`giant rubber spider, time-spinner prank`,
  StrictMacro.skill($skill`Saucegeyser`).repeat()
)
  .externalIf(
    have($effect`Eldritch Attunement`),
    StrictMacro.if_($monster`Eldritch Tentacle`, StrictMacro.skill($skill`Saucegeyser`).repeat())
  )
  .runaway();

const RAFFLE_TICKET_COUNT = 11;

export const farm: Quest<Task> = {
  name: "farm",
  tasks: [
    {
      name: "hagnk",
      ready: () => canInteract(),
      completed: () => get("lastEmptiedStorage") === myAscensions(),
      do: () => cliExecuteThrow("hagnk all"),
    },
    {
      name: "guild",
      ready: () => canInteract(),
      completed: () => guildStoreAvailable(),
      prepare: () => visitUrl("guild.php?place=challenge"),
      do: (): void => {
        const loc = byClass({
          Pastamancer: $location`The Haunted Pantry`,
          "Seal Clubber": $location`The Outskirts of Cobb's Knob`,
          default: $location.none,
        });
        if (loc === $location.none) {
          throw `Can't unlock guild as ${myClass()}`;
        }
        withMacro(RUNAWAY_MACRO, () => {
          adv1(loc, -1, "");
          if (handlingChoice()) {
            runChoice(1);
          }
        });
      },
      outfit: {
        modifier: "Familiar Weight",
        familiar: $familiar`Pair of Stomping Boots`,
      },
      post: () => visitUrl("guild.php?place=challenge"),
    },
    {
      name: "raindoh",
      ready: () => canInteract(),
      completed: () => have($item`empty Rain-Doh can`),
      do: () => use($item`can of Rain-Doh`),
    },
    {
      name: "breakfast",
      ready: () => canInteract(),
      do: () => cliExecuteThrow("breakfast"),
      completed: () => get("lastBreakfast") !== -1 || get("breakfastCompleted"),
      limit: { tries: 1 },
    },
    {
      name: "duffo",
      ready: () => canInteract() && ["", "food", "booze"].includes(get("_questPartyFairQuest")),
      completed: () => get("_questPartyFair") !== "unstarted",
      do: () => cliExecuteThrow("duffo go"),
    },
    {
      name: "garbo ascend",
      ready: () => canInteract() && willAscend(),
      completed: () => tapped(true),
      do: () => external("garbo", "ascend"),
    },
    {
      name: "garbo",
      ready: () => canInteract() && args.adventures === 0 && !willAscend(),
      completed: () => tapped(false),
      do: () => external("garbo"),
    },
    {
      name: "limited garbo",
      ready: () => canInteract() && args.adventures > 0 && !willAscend(),
      completed: () => myAdventures() <= args.adventures,
      do: () => external("garbo", `-${args.adventures}`),
    },
    {
      name: "pajamas",
      ready: () => canInteract() && !willAscend() && args.adventures === 0,
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
      ready: () => canInteract() && !willAscend(),
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
    {
      name: "raffle",
      ready: () => canInteract() && !willAscend(),
      completed: () => availableAmount($item`raffle ticket`) >= RAFFLE_TICKET_COUNT,
      do: () =>
        cliExecuteThrow(`raffle ${RAFFLE_TICKET_COUNT - availableAmount($item`raffle ticket`)}`),
    },
  ],
};
