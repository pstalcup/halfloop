import { Quest, Task } from "grimoire-kolmafia";
import { get } from "libram";
import { cliExecuteThrow, tapped } from "./util";

export const cs: Quest<Task> = {
  name: "cs",
  tasks: [
    {
      name: "phccs_gash",
      ready: () => tapped(true),
      completed: () => get("ascensionsToday") > 0,
      do: () => cliExecuteThrow("phccs_gash softcore"),
    },
    {
      name: "phccs",
      ready: () => get("ascensionsToday") === 1,
      completed: () => get("questL13Final") === "finished",
      do: () => cliExecuteThrow("phccs"),
    },
  ],
  completed: () => get("ascensionsToday") === 1 && get("questL13Final") === "finished",
};
