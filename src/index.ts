import { Args, Engine, getTasks } from "grimoire-kolmafia";
import { args, printArgs } from "./util";
import { farm } from "./farm";
import { cs } from "./cs";
import { diet } from "./diet";
import { print, wait } from "kolmafia";
import { pvp } from "./pvp";

export function main(command = ""): void {
  Args.fill(args, command);

  const tasks = getTasks([pvp, cs, diet, farm]);
  const engine = new Engine(tasks);

  if (args.help) {
    Args.showHelp(args);
    return;
  }

  print("Welcome to Halfloop");
  print(" Run Options:");
  print(" ");

  if (args.list) {
    print(`All tasks to run:`);
    for (const task of tasks) {
      const available = engine.available(task);
      print(
        `* ${task.name} ${available ? "available" : "unavailable"}`,
        available ? "black" : "red"
      );
    }
    print(`Next task: ${engine.getNextTask()?.name}`);
    return;
  }

  printArgs();

  if (args.args) return;

  wait(5);

  try {
    engine.run();
  } finally {
    engine.destruct();
  }
}
