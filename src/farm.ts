import { Quest, Task } from "grimoire-kolmafia";
import {
  adv1,
  availableAmount,
  canInteract,
  eat,
  getShop,
  guildStoreAvailable,
  handlingChoice,
  Item,
  mallPrice,
  myAdventures,
  myClass,
  print,
  repriceShop,
  runChoice,
  shopPrice,
  use,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $location,
  $monster,
  $monsters,
  $skill,
  byClass,
  Clan,
  EternityCodpiece,
  get,
  getRemainingLiver,
  getRemainingStomach,
  have,
  set,
  StrictMacro,
} from "libram";

import { currentPath } from "./paths";
import {
  args,
  cliExecuteThrow,
  external,
  ExternalScript,
  halloween,
  mode,
  rolloverAdventureHeadroom,
  ScriptArg,
  statusUpdate,
  tapped,
  willAscend,
  withMacro,
} from "./util";

const SNOWBALL = $item`precision snowball`;

const RUNAWAY_MACRO = StrictMacro.if_(
  $monsters`giant rubber spider, time-spinner prank`,
  StrictMacro.skill($skill`Saucegeyser`).repeat(),
)
  .externalIf(
    have($effect`Eldritch Attunement`),
    StrictMacro.if_($monster`Eldritch Tentacle`, StrictMacro.skill($skill`Saucegeyser`).repeat()),
  )
  .runaway();

const RAFFLE_TICKET_COUNT = 111;
const HALLOWEEN_FAMILIAR = $familiar`Red-Nosed Snapper`;
const HALLOWEEN_OUTFIT = "Ceramic Suit";

function halloweenFarm() {
  return [
    {
      name: "halloween garbo nobarf ascend",
      ready: () => canInteract() && willAscend(),
      completed: () => get("_garboCompleted").includes("nobarf"),
      do: () => external("garbo", "nobarf", "ascend"),
    },
    {
      name: "halloween garbo nobarf",
      ready: () => canInteract() && !willAscend(),
      completed: () => get("_garboCompleted").includes("nobarf"),
      do: () => external("garbo", "nobarf"),
    },
    {
      name: "halloween",
      outfit: () => ({ familiar: HALLOWEEN_FAMILIAR }),
      prepare: () => {
        set("freecandy_treatOutfit", HALLOWEEN_OUTFIT);
        set("freecandy_familiar", HALLOWEEN_FAMILIAR);
      },
      completed: () => myAdventures() < 5,
      do: () => external("freecandy"),
    },
    {
      name: "halloween combo",
      ready: () => canInteract() && getRemainingLiver() < 0 && myAdventures() < 5,
      completed: () => tapped(true),
      do: () => external("combo", `${myAdventures()}`),
    },
  ];
}

function nobarfTaskList(name: ExternalScript, ...scriptArgs: ScriptArg[]) {
  return [
    {
      name: "sausages",
      ready: () => have($item`magical sausage casing`) && getRemainingStomach() >= 0,
      completed: () => get("_sausagesEaten") >= 21,
      acquire: [{ item: $item`magical sausage` }],
      do: () => eat($item`magical sausage`),
    },
    {
      name: `${name} garbo nobarf ascend`,
      ready: () => canInteract() && willAscend(),
      completed: () => get("_garboCompleted").includes("nobarf"),
      do: () => external("garbo", "nobarf", "ascend"),
    },
    {
      name: `${name} garbo nobarf`,
      ready: () => canInteract() && !willAscend(),
      completed: () => get("_garboCompleted").includes("nobarf"),
      do: () => external("garbo", "nobarf"),
    },
    {
      name: `${name}`,
      ready: () => canInteract(),
      completed: () => tapped(willAscend()),
      do: () => external(name, ...scriptArgs),
    },
  ];
}

function chronoFarm(): Task[] {
  return nobarfTaskList("chrono");
}

function crimboFarm(): Task[] {
  return nobarfTaskList("crimbo");
}

function garboFarm() {
  return [
    {
      name: "garbo ascend",
      ready: () => canInteract() && willAscend(),
      completed: () => tapped(true),
      do: () => external("garbo", "ascend"),
      post: () => statusUpdate("garboascend", "Finished `garbo ascend`"),
    },
    {
      name: "garbo",
      ready: () => canInteract() && args.adventures === 0 && !willAscend(),
      completed: () => tapped(false),
      do: () => external("garbo"),
      post: () => statusUpdate("garbo", "Finished `garbo`"),
    },
    {
      name: "limited garbo",
      ready: () => canInteract() && args.adventures > 0 && !willAscend(),
      completed: () => myAdventures() <= args.adventures,
      do: () => external("garbo", `-${args.adventures}`),
    },
  ];
}

const PEARL_ZONES = [
  "AnemoneMine",
  "DiveBar",
  "MarinaraTrench",
  "MadnessReef",
  "TheBriniestDeepests",
] as const;
export const PEARLO_PROPERTY = "_halfloopPearlo";

/**
 * The sea path uses up the codpiece pearls every run. Farming them takes turns, so run pearlo
 * once diet has the day's turns in hand and before garbo spends them. The mall restock at the
 * jump still covers any slot pearlo didn't fill, so a pearlo failure never stops the day.
 */
const pearlo: Task = {
  name: "pearlo",
  ready: () =>
    currentPath().name === "sea" &&
    canInteract() &&
    willAscend() &&
    EternityCodpiece.have() &&
    args.pearlo_command !== "",
  completed: () =>
    get(PEARLO_PROPERTY, "") !== "" ||
    PEARL_ZONES.every((zone) => get(`_unblemishedPearl${zone}`, false)),
  do: (): void => {
    try {
      external("pearlo");
      set(PEARLO_PROPERTY, "ran");
    } catch (e) {
      print(`pearlo failed, leaving the codpiece to the mall restock: ${e}`, "red");
      set(PEARLO_PROPERTY, `failed: ${e}`);
    }
  },
};

/** One line for the end of day summary, or undefined when pearlo didn't run today */
export function pearloSummary(): string | undefined {
  const ran = get(PEARLO_PROPERTY, "");
  if (ran === "") return undefined;
  const pearls = PEARL_ZONES.filter((zone) => get(`_unblemishedPearl${zone}`, false)).length;
  return `${pearls}/${PEARL_ZONES.length} pearls farmed today${ran === "ran" ? "" : ` (${ran})`}`;
}

function primaryFarmTasks() {
  if (halloween()) {
    return halloweenFarm();
  } else if (mode() === "chrono") {
    return chronoFarm();
  } else if (mode() === "crimbo") {
    return crimboFarm();
  } else {
    return garboFarm();
  }
}

export const farm: () => Quest<Task> = () => ({
  name: "farm",
  tasks: [
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
      name: "duffo",
      ready: () => canInteract() && ["", "food", "booze"].includes(get("_questPartyFairQuest")),
      completed: () => get("_questPartyFair") !== "unstarted",
      do: () => cliExecuteThrow("duffo go"),
    },
    pearlo,
    ...primaryFarmTasks(),
    {
      name: "pajamas",
      ready: () => canInteract() && !willAscend() && args.adventures === 0,
      prepare: (): void => {
        if (!get("_aug13Cast") && !have($effect`Offhand Remarkable`)) {
          useSkill($skill`Aug. 13th: Left/Off Hander's Day!`);
        }
      },
      completed: () => get("_halfloopPajamas", false),
      do: (): void => {
        if (args.maximize === "adventures") {
          // Adventures past the rollover cap are wasted, so only wear as much +adv as still fits
          // and spend the rest of the outfit on PvP fights.
          Clan.join("Bonus Adventures from Hell");
          cliExecuteThrow(
            `maximize 10 adv ${rolloverAdventureHeadroom()} max, fites, +switch left`,
          );
        } else {
          Clan.join("Alliance from Heck");
          cliExecuteThrow("maximize +fites +switch left");
        }
      },
      post: () => set("_halfloopPajamas", true),
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
          if (shopPrice(item) === 999999999999) {
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
    {
      name: "precision snowball",
      completed: () => availableAmount(SNOWBALL) === 0,
      do: () => use(SNOWBALL),
    },
    {
      name: "Smoke em if you got em",
      ready: () => get("getawayCampsiteUnlocked"),
      completed: () => !have($item`stick of firewood`),
      do: (): void => {
        while (have($item`stick of firewood`)) {
          set("choiceAdventure1394", `1&message=garf`);
          use(1, $item`campfire smoke`);
        }
      },
    },
  ],
});
