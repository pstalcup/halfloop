import { Args, Engine, getTasks } from "grimoire-kolmafia";
import { args } from "./util";
import { farm } from "./farm";
import { cs } from "./cs";

export function main(command = ""): void {
  Args.fill(args, command);

  const engine = new Engine(getTasks([cs, farm]));
  try {
    engine.run();
  } finally {
    engine.destruct();
  }
}
