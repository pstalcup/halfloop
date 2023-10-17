import { Args, Engine, getTasks, Task } from "grimoire-kolmafia";
import { args, daily, fmt, printArgs } from "./util";
import { farm } from "./farm";
import { diet } from "./diet";
import { print, totalTurnsPlayed, wait } from "kolmafia";
import { pvp } from "./pvp";
import { get } from "libram";
import { autoscend, pathQuest } from "./paths";

class HalfloopEngine extends Engine {
  turns: Map<string, number[]> = new Map();

  execute(task: Task<never>): void {
    const startingTurns = totalTurnsPlayed();
    super.execute(task);
    const oldTurns = this.turns.get(task.name);
    this.turns.set(task.name, [totalTurnsPlayed() - startingTurns, ...(oldTurns ?? [])]);
  }

  printTurns(): void {
    print("Tasks Turns:");
    for (const [name, turns] of this.turns.entries()) {
      print(`- ${name}: ${turns.reduce((a, b) => a + b)} (${turns})`);
    }
  }
}

export function main(command = ""): void {
  Args.fill(args, command);

  const startingTurns = totalTurnsPlayed();
  const startingSwagger = get("availableSwagger");

  const tasks = getTasks([pvp, autoscend, pathQuest(), diet, farm]);
  const engine = new HalfloopEngine(tasks);

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

  if (args.sleep) wait(5);

  try {
    engine.run();
  } finally {
    engine.destruct();
    engine.printTurns();

    print("");

    const endingTurns = totalTurnsPlayed();
    const endingSwagger = get("availableSwagger");

    const [totalTurnsSpent, totalSwagger] = daily(({ get, set }) => {
      set("halfloop_turnsSpent", get("halfloop_turnsSpent") + (endingTurns - startingTurns));
      set("halfloop_swagger", get("halfloop_swagger") + (endingSwagger - startingSwagger));
      return [get("halfloop_turnsSpent"), get("halfloop_swagger")];
    });

    const meat = get("garboResultsMeat", 0);
    const item = get("garboResultsItems", 0);
    const embezzlers = get("garboEmbezzlerCount", 0);
    const yachtzees = get("garboYachtzeeCount", 0);

    print("Final Results");
    print(`* Total Turns Spent: ${totalTurnsSpent}`);
    print(`* Garbo Results: ${fmt(meat)} meat + ${fmt(item)} items = ${fmt(meat + item)}`);
    print(`* Garbo Actions: ${fmt(embezzlers)} embezzlers and ${fmt(yachtzees)} yachtzees`);
    print(`* Swagger: ${fmt(totalSwagger)}`);
  }
}
