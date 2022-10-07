import { Quest, Task } from "grimoire-kolmafia";
import { cliExecute, inebrietyLimit, myAdventures, myInebriety } from "kolmafia";
import { get } from "libram";
import { DRUNK_VOA } from "./constants";
import { cliExecuteThrow, distillate, inebrietyLimitIgnoreFamiliar, nep } from "./util";

export function duffo(ascend: boolean = true): Task[] {
  if (ascend) {
    return [
      nep(),
      {
        name: "GarboNoBarf",
        do: () => cliExecuteThrow("garbo yachtzeechain nobarf"),
        completed: () => get("_backUpUses") === 11,
      },
      {
        name: "BagCollector",
        do: () => cliExecuteThrow("baggo"),
        completed: () => myAdventures() === 0 && myInebriety() === inebrietyLimitIgnoreFamiliar(),
      },
      distillate("BagCollector"),
      {
        name: "Consume",
        after: ["Distillate"],
        ready: () => myInebriety() === inebrietyLimit(),
        do: () => cliExecuteThrow(`CONSUME NIGHTCAP VALUE ${DRUNK_VOA}`),
        completed: () => myInebriety() > inebrietyLimit(),
      },
      {
        name: "DrunkGarbo",
        do: () => cliExecute("garbo ascend"),
        completed: () => myAdventures() === 0 && myInebriety() > inebrietyLimit(),
      },
    ];
  } else {
    return [
      {
        name: "GarboNoBarf",
        do: () => cliExecuteThrow("garbo yachtzeechain nobarf"),
        completed: () => get("_backUpUses") === 11,
      },
      {
        name: "BagCollector",
        do: () => cliExecuteThrow("baggo"),
        completed: () => myAdventures() === 0 && myInebriety() === inebrietyLimitIgnoreFamiliar(),
      },
    ];
  }
}
