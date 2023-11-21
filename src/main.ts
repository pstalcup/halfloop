import { Args, getTasks } from "grimoire-kolmafia";
import { print, wait } from "kolmafia";

import { args, halloween, printArgs } from "./util";
import { farm } from "./farm";
import { diet } from "./diet";
import { pvp } from "./pvp";
import { autoscend, pathQuest } from "./paths";
import { HalfloopEngine } from "./engine";

export function main(command = ""): void {
  Args.fill(args, command);


  const tasks = getTasks([pvp, autoscend, pathQuest(), diet, farm]);
  const engine = new HalfloopEngine(tasks);

  if (args.help) {
    Args.showHelp(args);
    return;
  }

  if (halloween()) {
    print("Trick or Treat!");
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
        available ? "black" : "red",
      );
    }
    print(`Next task: ${engine.getNextTask()?.name}`);
    return;
  }

  printArgs();

  if (args.args) return;

  if (args.sleep) wait(5);

  try {
    engine.run();
  } finally {
    engine.destruct();
    engine.printSummary();
  }
}
