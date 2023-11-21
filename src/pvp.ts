import { Quest, Task } from "grimoire-kolmafia";
import {
  cliExecute,
  hippyStoneBroken,
  myAdventures,
  pvpAttacksLeft,
  use,
  visitUrl,
} from "kolmafia";
import { args } from "./util";
import { $item, get, have, withChoice } from "libram";

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
      ready: () =>
        args.pvp &&
        hippyStoneBroken() &&
        pvpAttacksLeft() > 0 &&
        myAdventures() === 0,
      completed: () => pvpAttacksLeft() === 0,
      do: (): void => {
        if (
          !get("_fireStartingKitUsed") &&
          have($item`CSA fire-starting kit`)
        ) {
          withChoice(595, 1, () => {
            use($item`CSA fire-starting kit`);
          });
        }
        while (get("_meteoriteAdesUsed") < 3 && have($item`Meteorite-Ade`)) {
          use($item`Meteorite-Ade`);
        }
        cliExecute("swagger");
      },
    },
  ],
};
