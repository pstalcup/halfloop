import { Quest, Task } from "grimoire-kolmafia";
import { canInteract, myPath } from "kolmafia";
import { $path, $paths, getRemainingLiver } from "libram";

import { args, external } from "../util";

import { casual } from "./casual";
import { cs } from "./cs";
import { robot } from "./robot";
import { smol } from "./smol";
import { standard } from "./standard";

const uniquePaths = $paths`Community Service, A Shrunken Adventurer am I`;

export const autoscend: Quest<Task> = {
  name: "autoscend",
  tasks: [
    {
      name: "autoscend",
      ready: () => getRemainingLiver() > 0 && !uniquePaths.includes(myPath()),
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
  } else if (args.path === $path`You, Robot`) {
    return robot;
  } else if (args.path === $path.none) {
    return casual;
  }
  throw `Unsupported Path ${args.path}`;
}
