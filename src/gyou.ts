import { Quest, Task } from "grimoire-kolmafia";
import { Class, Item, myTurncount, toInt, toItem, use, useFamiliar } from "kolmafia";
import {
  $item,
  $items,
  $location,
  $path,
  ascend,
  get,
  Lifestyle,
  getKramcoWandererChance,
  Latte,
  Pantogram,
  RetroCape,
  $skill,
  $familiar,
  have,
} from "libram";
import { KRAMCO_CHANCE } from "./constants";
import { cliExecuteThrow } from "./util";

export const gyouAscend: Task[] = [
  {
    name: "Ascend",
    completed: () => get("ascensionsToday") === 1,
    do: () => ascend($path`Grey You`, Class.none, Lifestyle.softcore, "platypus"),
  },
];

function pull(items: Item[]): Task[] {
  return items.map((i) => {
    const task: Task = {
      name: `Pull ${i}`,
      completed: () =>
        have(i) ||
        get("_roninStoragePulls")
          .split(",")
          .map((id) => toItem(toInt(id)))
          .includes(i),
      do: () => cliExecuteThrow(`pull ${i}`),
    };
    return task;
  });
}

export const gyou: Quest<Task> = {
  name: "GYou",
  tasks: [
    ...pull(
      $items`love, mafia pointer finger ring, mafia thumb ring, lucky gold ring, ten-leaf clover, porquoise, drive-by shooting`
    ),
    {
      name: "GYou",
      do: () => cliExecuteThrow("loopgyou"),
      completed: () => get("questL13Final") === "",
    },
    {
      name: "RoninBarf",
      do: $location`Barf Mountain`,
      completed: () => myTurncount() >= 1000,
      prepare: () => {
        RetroCape.tuneToSkill($skill`Precision Shot`);
        const expectedModifiers = ["Meat Drop: 40", "Familiar Weight: 5", "Item Drop: 20"];
        if (expectedModifiers.some((m) => !get("latteModifier").includes(m))) {
          cliExecuteThrow("latte refill cajun carrot rawhide");
        }
        if (!have($item`amulet coin`)) {
          useFamiliar($familiar`cornbeefadon`);
          use($item`box of familiar jacks`);
        }
        if (!Pantogram.havePants()) {
          Pantogram.makePants(
            "Muscle",
            "Stench Resistance: 2",
            "Maximum HP: 40",
            "Drops Items: true",
            "Meat Drop: 60"
          );
        }
      },
      outfit: () => {
        return {
          hat: $item`wad of used tape`,
          back: $item`unwrapped knock-off retro superhero cape`,
          shirt: $item`jurassic parka`,
          weapon: $item`love`,
          offhand:
            getKramcoWandererChance() > KRAMCO_CHANCE
              ? $item`Kramco Sausage-o-Matic™`
              : $item`latte lovers member's mug`,
          pants: get("sweat") < 75 ? $item`designer sweatpants` : $item`pantogram`,
          acc1: $item`mafia pointer finger ring`,
          acc2: $item`mafia thumb ring`,
          acc3: $item`lucky gold ring`,
          famequip: $item`amulet coin`,
          familiar:
            get("_spaceJellyfishDrops") < 10 ? $familiar`space jellyfish` : $familiar`robortender`,
          modifier: "meat",
        };
      },
    },
  ],
  completed: () => get("ascensionsToday") > 1,
};
