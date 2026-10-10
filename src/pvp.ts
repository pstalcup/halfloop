import { Quest, Task } from "grimoire-kolmafia";
import {
  cliExecute,
  hippyStoneBroken,
  myAdventures,
  pvpAttacksLeft,
  use,
  visitUrl,
} from "kolmafia";
import { $item, get, have, withChoice } from "libram";

import { args } from "./util";

export const pvp: Quest<Task> = {
  name: "pvp",
  tasks: [
    {
      name: "break stone",
      ready: () => args.pvp && get("questL13Final") === "finished",
      completed: () => hippyStoneBroken(),
      do: () => visitUrl("peevpee.php?action=smashstone&pwd&confirm=on", true),
    },
    {
      name: "swagger",
      ready: () => args.pvp && hippyStoneBroken() && pvpAttacksLeft() > 0 && myAdventures() === 0,
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
        // pvp_mab returns normally when it gives up early (e.g. "Could not find anyone to fight!"),
        // so without this check the engine would pick swagger again forever.
        const fitesBefore = pvpAttacksLeft();
        if (!cliExecute("pvp_mab")) throw "pvp_mab failed to run. Is it installed?";
        if (pvpAttacksLeft() > 0 && pvpAttacksLeft() >= fitesBefore) {
          throw `pvp_mab stopped with ${pvpAttacksLeft()} fites left without using any. Check its output above.`;
        }
      },
    },
  ],
};
