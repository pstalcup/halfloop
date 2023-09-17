import { Quest, Task } from "grimoire-kolmafia";
import { get } from "libram";
import { args, external, tapped } from "./util";
import { myAdventures, pvpAttacksLeft } from "kolmafia";

export const cs: Quest<Task> = {
  name: "cs",
  tasks: [
    {
      name: "phccs_gash",
      prepare: (): void => {
        if (myAdventures() > 0 || pvpAttacksLeft() > 0) {
          throw `You shouldn't be ascending with ${myAdventures()} adventures and ${pvpAttacksLeft()} fites left!`;
        }
      },
      ready: () => tapped(true),
      completed: () => get("ascensionsToday") > 0,
      do: () => external("phccs_gash", { key: "class", value: `${args.cs_class}` }),
    },
    {
      name: "phccs",
      ready: () => get("ascensionsToday") === 1,
      completed: () => get("questL13Final") === "finished",
      do: () => external("phccs"),
    },
  ],
  completed: () => get("ascensionsToday") === 1 && get("questL13Final") === "finished",
};
