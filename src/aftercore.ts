import { Quest, Task } from "grimoire-kolmafia";
import { availableAmount } from "kolmafia";
import { $items, $item, get, $path } from "libram";
import { PATH } from "./constants";
import { csAscend } from "./cs";
import { garbo } from "./garbo";
import { gyouAscend } from "./gyou";
import { withStashClan, breakfast, breakStone, swagger, trackSessionMeat } from "./util";

export const aftercoreQuest: Quest<Task> = {
  name: "Aftercore",
  tasks: [
    breakfast(),
    breakStone(),
    ...garbo(true),
    swagger(),
    trackSessionMeat("Aftercore"),
    ...(PATH === $path`Community Service` ? csAscend : gyouAscend),
  ],
  completed: () => get("ascensionsToday") > 0,
};
