import { Task } from "grimoire-kolmafia";
import {
  cliExecute,
  handlingChoice,
  hippyStoneBroken,
  inebrietyLimit,
  lastChoice,
  myAdventures,
  myAscensions,
  myFamiliar,
  myInebriety,
  mySessionMeat,
  pvpAttacksLeft,
  toInt,
  use,
  useFamiliar,
  visitUrl,
} from "kolmafia";
import { $familiar, $item, Clan, get, have, set, withChoice } from "libram";
import { STASH_CLAN, DUPE_ITEM, Leg } from "./constants";

export function withStashClan(action: (clan: Clan) => void) {
  const originalClan = Clan.get().id;
  Clan.join(STASH_CLAN);

  try {
    action(Clan.get());
  } finally {
    Clan.join(originalClan);
  }
}

export function cliExecuteThrow(command: string) {
  if (!cliExecute(command)) throw `Failed to execute ${command}`;
}

export function dupeTask(): Task {
  return {
    name: "DMT",
    ready: () => have(DUPE_ITEM) && get("encountersUntilDMTChoice") < 1 && myAdventures() > 0,
    completed: () => get("lastDMTDuplication") >= myAscensions(),
    do: (): void => {
      useFamiliar($familiar`Machine Elf`);
      visitUrl("adventure.php?snarfblat=458");
      if (handlingChoice() && lastChoice() === 1119) {
        visitUrl("choice.php?pwd&whichchoice=1119&option=4");
        visitUrl(`choice.php?whichchoice=1125&pwd&option=1&iid=${toInt(DUPE_ITEM)}`);
      }
    },
    limit: {
      tries: 1,
    },
    outfit: { familiar: $familiar`Machine Elf` },
  };
}

export function breakfast(): Task {
  return {
    name: "Breakfast",
    do: () => cliExecute("breakfast"),
    completed: () => get("lastBreakfast") !== -1 || get("breakfastCompleted"),
    limit: { tries: 1 },
  };
}

export function breakStone(): Task {
  return {
    name: "BreakStone",
    completed: () => hippyStoneBroken(),
    do: () => visitUrl("peevpee.php?action=smashstone&pwd&confirm=on", true),
  };
}

export function swagger(): Task {
  return {
    name: "Swagger",
    ready: () => pvpAttacksLeft() > 0,
    completed: () => pvpAttacksLeft() == 0,
    do: () => {
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
  };
}

export function distillate(afterTask: string): Task {
  return {
    name: "Distillate",
    after: [afterTask],
    ready: () => myInebriety() === inebrietyLimit(),
    do: () => cliExecuteThrow("drink stillsuit distillate"),
    outfit: {
      familiar: $familiar`Stooper`,
    },
    completed: () =>
      (myInebriety() === inebrietyLimit() && myFamiliar() === $familiar`Stooper`) ||
      myInebriety() > inebrietyLimit(),
  };
}

export function trackSessionMeat(key: Leg): Task {
  return {
    name: "SessionMeat",
    do: () => set(`session${key}`, mySessionMeat()),
    completed: () => get(`session${key}`, 0) !== 0,
  };
}

export function getSession(key: Leg): number {
  return get(`session${key}`, 0);
}

export function inebrietyLimitIgnoreFamiliar() {
  return inebrietyLimit() - (myFamiliar() === $familiar`stooper` ? 1 : 0);
}

export function nep(): Task {
  return {
    name: "NEP",
    do: () => cliExecuteThrow("duffo go"),
    completed: () => get("_questPartyFair") !== "unstarted",
  };
}
