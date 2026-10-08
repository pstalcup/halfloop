import { canInteract } from "kolmafia";
import { $path } from "libram";

import { args, tapped } from "../util";

import { ascendInto, hagnk, inPath, PathDefinition, prepareGash } from "./lib";

const path = $path`Standard`;

export const standard: PathDefinition = {
  name: "standard",
  path,
  quest: {
    name: "standard",
    tasks: [
      {
        name: "standard gash",
        prepare: prepareGash,
        ready: () => tapped(true) && args.ascend,
        completed: () => !canInteract() && inPath(path),
        do: () => ascendInto(path, { moon: "knoll" }),
      },
      hagnk,
    ],
  },
};
