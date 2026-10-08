import { Quest, Task } from "grimoire-kolmafia";
import { canInteract, myPath, toPath } from "kolmafia";
import { getRemainingLiver } from "libram";

import { args, external } from "../util";

import { casual } from "./casual";
import { cs } from "./cs";
import { PathDefinition } from "./lib";
import { robot } from "./robot";
import { sea } from "./sea";
import { smol } from "./smol";
import { standard } from "./standard";

export type { PathDefinition, PathResults } from "./lib";

/** Every path halfloop knows how to run. Add new paths here. */
export const paths: PathDefinition[] = [cs, smol, robot, sea, standard, casual];

/** Paths that autoscend should never be used to finish */
const uniquePaths = [cs.path, smol.path, sea.path];

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

/** The path selected by the `path` arg, given as a short name (e.g. smol) or a full path name */
export function currentPath(): PathDefinition {
  const selected =
    paths.find(({ name }) => name === args.path) ??
    paths.find(({ path }) => path === toPath(args.path));
  if (!selected) throw `Unsupported Path ${args.path}`;
  return selected;
}
