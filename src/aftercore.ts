import { Quest, Task } from "grimoire-kolmafia";
import { get, $path } from "libram";
import { PATH } from "./constants";
import { csAscend } from "./cs";
import { gyouAscend } from "./gyou";
import { breakfast, breakStone, swagger, trackSessionMeat } from "./util";

export function aftercoreQuest(primary: (ascend: boolean) => Task[]): Quest<Task> {
  return {
    name: "Aftercore",
    tasks: [
      breakfast(),
      breakStone(),
      ...primary(true),
      swagger(),
      trackSessionMeat("Aftercore"),
      ...(PATH === $path`Community Service` ? csAscend : gyouAscend),
    ],
    completed: () => get("ascensionsToday") > 0,
  };
}
