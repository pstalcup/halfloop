import { Quest, Task, step } from "grimoire-kolmafia";
import {
  availableAmount,
  myInebriety,
  inebrietyLimit,
  cliExecute,
  getCampground,
  buy,
  use,
} from "kolmafia";
import { $item, getModifier, have } from "libram";
import { VOA } from "./constants";
import { garbo } from "./garbo";
import {
  cliExecuteThrow,
  breakStone,
  breakfast,
  dupeTask,
  swagger,
  distillate,
  trackSessionMeat,
} from "./util";

export const casualQuest: Quest<Task> = {
  name: "Casual",
  tasks: [
    {
      name: "LoopCasual",
      completed: () => step("questL13Final") === 999,
      do: () => cliExecuteThrow("loopcasual"),
    },
    breakStone(),
    breakfast(),
    dupeTask(),
    ...garbo(false, ["LoopCasual"]),
    {
      name: "KeepingTabs",
      after: ["Garbo"],
      completed: () => availableAmount($item`meat stack`) === 0,
      do: () => cliExecuteThrow("keeping-tabs"),
      limit: {
        tries: 1,
      },
    },
    distillate("KeepingTabs"),
    {
      name: "Nightcap",
      after: ["Distillate"],
      completed: () => myInebriety() > inebrietyLimit(),
      do: () => cliExecuteThrow("CONSUME NIGHTCAP"),
    },
    {
      name: "Pajamas",
      after: ["Nightcap"],
      completed: () => getModifier("Adventures") > 20, // passives and stuff mean that this is likely
      do: () => cliExecute("maximize +adv +fites +switch tot"),
    },
    {
      name: "Clockwork Maid",
      after: ["Pajamas"],
      ready: () => getModifier("Adventures") + 40 < 200,
      completed: () => !!getCampground()["clockwork maid"],
      do: () => {
        if (!have($item`clockwork maid`)) {
          buy($item`clockwork maid`, 1, VOA * 8);
        }
        if (have($item`clockwork maid`)) {
          use($item`clockwork maid`);
        }
      },
      limit: { tries: 1 },
    },
    swagger(),
    trackSessionMeat("Casual"),
  ],
};
