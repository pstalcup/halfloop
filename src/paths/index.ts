import { canInteract, myPath } from "kolmafia";
import { args, external } from "../util";
import { Quest, Task } from "grimoire-kolmafia";
import { $path, getRemainingLiver } from "libram";
import { cs } from "./cs";
import { smol } from "./smol";
import { standard } from "./standard";

export const autoscend: Quest<Task> = {
  name: "autoscend",
  tasks: [
    {
      name: "autoscend",
      ready: () => getRemainingLiver() > 0 && myPath() !== $path`Community Service`,
      completed: () => canInteract(),
      do: () => external("autoscend"),
    },
  ],
};

export function pathQuest(): Quest<Task> {
  if (args.path === $path`Community Service`) {
    return cs;
  } else if (args.path === $path`A Shrunken Adventurer am I`) {
    return smol;
  } else if (args.path === $path`Standard`) {
    return standard;
  }
  throw `Unsupported Path ${args.path}`;
}
