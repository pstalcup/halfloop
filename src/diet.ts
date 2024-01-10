import { Quest, Task } from "grimoire-kolmafia";
import {
  canInteract,
  drink,
  eat,
  inebrietyLimit,
  myAdventures,
  myFamiliar,
  myFullness,
  myInebriety,
  retrieveItem,
  use,
  useSkill,
} from "kolmafia";
import {
  $familiar,
  $item,
  $items,
  $skill,
  BurningLeaves,
  get,
  getRemainingLiver,
  getRemainingSpleen,
  getRemainingStomach,
  have,
  withProperty,
} from "libram";
import { args, cliExecuteThrow, external, halloween, willAscend } from "./util";

const shouldNightcap = () => getRemainingLiver() === 0 && myFamiliar() === $familiar`Stooper`;

const OVERDRUNK_VOA = 4000;
const HALLOWEEN_MPA = 15000;

function primaryDietTasks() {
  if (halloween()) {
    return [
      {
        name: "stooper",
        ready: () =>
          myAdventures() < 5 && getRemainingLiver() === 0 && myFamiliar() !== $familiar`Stooper`,
        completed: () => getRemainingLiver() === 0 && myFamiliar() === $familiar`Stooper`,
        do: () => cliExecuteThrow("drink stillsuit distillate"),
        outfit: { familiar: $familiar`Stooper` },
      },
      {
        name: "halloween consume",
        completed: () =>
          getRemainingStomach() === 0 && getRemainingLiver() <= 0 && getRemainingSpleen() === 0,
        do: () => withProperty("valueOfAdventure", HALLOWEEN_MPA, () => external("consume", "ALL")),
      },
      {
        name: "halloween nightcap ascend",
        ready: () => shouldNightcap() && willAscend(),
        completed: () => myInebriety() > inebrietyLimit(),
        do: () =>
          withProperty("valueOfAdventure", HALLOWEEN_MPA, () => external("consume", "NIGHTCAP")),
      },
      {
        name: "halloween nightcap",
        ready: () => shouldNightcap() && !willAscend(),
        completed: () => myInebriety() > inebrietyLimit(),
        do: () => external("consume", "NIGHTCAP"),
      },
    ];
  } else {
    return [
      {
        name: "stooper",
        ready: () =>
          myAdventures() === 0 && getRemainingLiver() === 0 && myFamiliar() !== $familiar`Stooper`,
        completed: () => getRemainingLiver() === 0 && myFamiliar() === $familiar`Stooper`,
        do: () => cliExecuteThrow("drink stillsuit distillate"),
        outfit: { familiar: $familiar`Stooper` },
      },
      {
        name: "nightcap ascend",
        ready: () => shouldNightcap() && willAscend(),
        completed: () => myInebriety() > inebrietyLimit(),
        do: () =>
          withProperty("valueOfAdventure", OVERDRUNK_VOA, () => external("consume", "NIGHTCAP")),
      },
      {
        name: "nightcap",
        ready: () => shouldNightcap() && !willAscend(),
        completed: () => myInebriety() > inebrietyLimit(),
        do: () => external("consume", "NIGHTCAP"),
      },
    ];
  }
}

export const diet: Quest<Task> = {
  name: "diet",
  tasks: [
    ...$items`Deep Dish of Legend, Calzone of Legend, Pizza of Legend`.map((i) => ({
      name: `prep ${i}`,
      ready: () => canInteract(),
      completed: () => have(i),
      do: () => retrieveItem(i),
    })),
    {
      name: "buy day shortener",
      ready: () => BurningLeaves.numberOfLeaves() > 222,
      completed: () => get("_leafDayShortenerCrafted"),
      do: () => cliExecuteThrow("leaves day shortener"),
    },
    {
      name: "buy leaf lasso",
      ready: () => BurningLeaves.numberOfLeaves() > 69,
      completed: () => get("_leafLassosCrafted", 0) === 3,
      do: () => cliExecuteThrow("leaves lit leaf lasso"),
    },
    {
      name: "drunk day shortener",
      ready: () => willAscend() && myInebriety() > inebrietyLimit() && myAdventures() >= 5,
      completed: () => !have($item`day shortener`),
      do: () => use($item`day shortener`),
    },
    {
      name: "milk of mag",
      completed: () => get("_milkOfMagnesiumUsed"),
      acquire: () => [{ item: $item`milk of magnesium` }],
      do: () => use($item`milk of magnesium`),
    },
    {
      name: "borrowed time",
      ready: () => !willAscend(),
      completed: () => get("_borrowedTimeUsed"),
      acquire: () => [{ item: $item`borrowed time` }],
      do: () => use($item`borrowed time`),
    },
    {
      name: "extra time",
      completed: () => get("_extraTimeUsed", 0) > 0,
      do: () => use($item`extra time`),
    },
    {
      name: `pizza of legend`,
      ready: () => canInteract() && myFullness() === 0,
      completed: () => get("pizzaOfLegendEaten"),
      do: () => eat($item`Pizza of Legend`),
    },
    {
      name: `calzone of legend`,
      ready: () => canInteract() && myFullness() === 0,
      completed: () => get("calzoneOfLegendEaten"),
      do: () => eat($item`Calzone of Legend`),
    },
    {
      name: `deep dish of legend`,
      ready: () => canInteract() && myFullness() === 0,
      completed: () => get("deepDishOfLegendEaten"),
      do: () => eat($item`Deep Dish of Legend`),
    },
    {
      // this should only happen if you are at 0 full and you've already eaten all your legendary pizzas
      name: `boris's bread`,
      ready: () => canInteract(),
      completed: () => myFullness() > 0,
      acquire: [{ item: $item`Boris's bread` }],
      do: () => eat($item`Boris's bread`),
    },
    {
      name: "burnsger",
      ready: () =>
        args.batfellow &&
        have($item`Mr. Burnsger`) &&
        myInebriety() >= 2 &&
        getRemainingStomach() >= 4,
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
      ready: () =>
        args.batfellow &&
        have($item`Doc Clock's thyme cocktail`) &&
        myFullness() >= 2 &&
        getRemainingLiver() >= 4,
      completed: () => get("_docClocksThymeCocktailDrunk"),
      prepare: () => useSkill($skill`The Ode to Booze`),
      do: () => drink($item`Doc Clock's thyme cocktail`),
    },
    {
      name: "mad liquor",
      ready: () =>
        args.batfellow &&
        have($item`The Mad Liquor`) &&
        myFullness() >= 1 &&
        getRemainingLiver() >= 3,
      completed: () => get("_madLiquorDrunk"),
      prepare: () => useSkill($skill`The Ode to Booze`),
      do: () => drink($item`The Mad Liquor`),
    },
    ...primaryDietTasks(),
  ],
};
