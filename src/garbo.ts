import { Task } from "grimoire-kolmafia";
import { inebrietyLimit, myAdventures, myFamiliar, myInebriety } from "kolmafia";
import { DRUNK_VOA } from "./constants";
import { cliExecuteThrow, distillate, nep, inebrietyLimitIgnoreFamiliar } from "./util";

export function garbo(ascend: boolean, after?: string[]): Task[] {
  if (ascend) {
    return [
      nep(),
      {
        name: "Garbo",
        do: () => cliExecuteThrow("garbo ascend yachtzeechain"),
        completed: () => myAdventures() === 0 || myInebriety() > inebrietyLimitIgnoreFamiliar(),
      },
      distillate("Garbo"),
      {
        name: "Consume",
        after: ["Distillate"],
        ready: () => myInebriety() === inebrietyLimit(),
        do: () => cliExecuteThrow(`CONSUME NIGHTCAP VALUE ${DRUNK_VOA}`),
        completed: () => myInebriety() > inebrietyLimit(),
      },
      {
        name: "Overdrunk",
        after: ["Garbo", "Consume", "Distillate"],
        do: () => cliExecuteThrow("garbo ascend"),
        completed: () => myAdventures() === 0,
      },
    ];
  } else {
    return [
      nep(),
      {
        name: "Garbo",
        after,
        ready: () => myAdventures() > 0 && myInebriety() < inebrietyLimit(),
        do: () => cliExecuteThrow("garbo yachtzeechain"),
        completed: () => myAdventures() === 0 || myInebriety() > inebrietyLimit(),
      },
    ];
  }
}
