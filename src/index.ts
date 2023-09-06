import { Args, Engine, getTasks } from "grimoire-kolmafia";
import { args } from "./util";
import { farm } from "./farm";
import { cs } from "./cs";
import { diet } from "./diet";
import { print } from "kolmafia";
import { pvp } from "./pvp";

export function main(command = ""): void {
  Args.fill(args, command);

  const tasks = getTasks([pvp, cs, diet, farm]);
  const engine = new Engine(tasks);

  if (args.list) {
    print(`Tasks to run:`);
    for (const task of tasks) {
      print(`* ${task.name}`);
    }
    return;
  }

  try {
    engine.run();
  } finally {
    engine.destruct();
  }
}
