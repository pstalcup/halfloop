import { Args, Engine, getTasks, Task } from "grimoire-kolmafia";
import {
  myAdventures,
  numericModifier,
  print,
  pvpAttacksLeft,
  totalTurnsPlayed,
  wait,
} from "kolmafia";
import { $item, clamp, Clan, get, have, sumNumbers } from "libram";

import { diet } from "./diet";
import { farm } from "./farm";
import { autoscend, currentPath, PathDefinition, PathResults, paths } from "./paths";
import { pvp } from "./pvp";
import { args, currentArgs, daily, fmt, halloween, statusUpdate } from "./util";

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

function rolloverTurns() {
  const base =
    myAdventures() +
    40 +
    numericModifier("Adventures") +
    clamp(2 * get("_resolutionAdv"), 0, 10) +
    get("_gibbererAdv") +
    get("_hareAdv");

  return [
    clamp(base, 0, 200) +
      (have($item`potato alarm clock`) ? 5 : 0) +
      (have($item`etched hourglass`) ? 5 : 0),
    base - clamp(base, 0, 200),
  ];
}

function rolloverFites() {
  return pvpAttacksLeft() + 10 + numericModifier("PvP Fights");
}

export function main(command = ""): void {
  Args.fill(args, command);

  Clan.join("Bonus Adventures From Hell"); // make sure you start in the right place

  const startingTurns = totalTurnsPlayed();
  const startingSwagger = get("availableSwagger");

  const path = currentPath();
  const tasks = getTasks([pvp, autoscend, path.quest, diet, farm()]);
  const engine = new HalfloopEngine(tasks);

  if (args.help) {
    Args.showHelp(args);
    return;
  }

  if (halloween()) {
    print("Trick or Treat!");
  }

  statusUpdate("start", "Starting Halfloop");
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

  const runArgs = currentArgs(path.describeArgs?.() ?? []);

  statusUpdate("args1", runArgs.slice(0, 4).join("\n"));
  statusUpdate("args2", runArgs.slice(4).join("\n"));

  runArgs.forEach((a) => print(a));

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

    const trackedPaths = paths.filter(
      (path): path is PathDefinition & { results: PathResults } => path.results !== undefined,
    );
    const meatProperty = (path: PathDefinition) => `halfloop_${path.name}Meat` as const;
    const itemsProperty = (path: PathDefinition) => `halfloop_${path.name}Items` as const;

    const [totalTurnsSpent, totalSwagger, pathTotals] = daily(
      [
        "halfloop_turnsSpent",
        "halfloop_swagger",
        ...trackedPaths.flatMap((path) => [meatProperty(path), itemsProperty(path)]),
      ],
      ({ get, set }) => {
        set("halfloop_turnsSpent", get("halfloop_turnsSpent") + (endingTurns - startingTurns));
        set("halfloop_swagger", get("halfloop_swagger") + (endingSwagger - startingSwagger));
        for (const path of trackedPaths) {
          set(meatProperty(path), get(meatProperty(path)) + path.results.meat);
          set(itemsProperty(path), get(itemsProperty(path)) + path.results.items);
        }
        return [
          get("halfloop_turnsSpent"),
          get("halfloop_swagger"),
          new Map(
            trackedPaths.map((path) => [
              path.name,
              { meat: get(meatProperty(path)), items: get(itemsProperty(path)) },
            ]),
          ),
        ] as const;
      },
    );

    const garboMeat = get("garboResultsMeat", 0);
    const garboItems = get("garboResultsItems", 0);
    const garboTurns = get("garboResultsTurns", 0);
    const embezzlers = get("garboEmbezzlerCount", 0);
    const [turns, lostTurns] = rolloverTurns();

    const meat = sumNumbers([garboMeat, ...[...pathTotals.values()].map(({ meat }) => meat)]);
    const items = sumNumbers([garboItems, ...[...pathTotals.values()].map(({ items }) => items)]);

    const results = (meat: number, items: number) =>
      `${fmt(meat)} meat + ${fmt(items)} items = ${fmt(meat + items)}`;

    const resultMessage = (title: string, message: string, color = "black") => {
      statusUpdate(`r${title.replace(" ", "").toLowerCase()}`, `${title} ${message}`);
      print(`* ${title}: ${message}`, color);
    };

    print("Final Results");
    resultMessage("Total Turns", `${totalTurnsSpent}`);
    resultMessage("Garbo Results", `${results(garboMeat, garboItems)}`);
    resultMessage("Garbo Actions", `${fmt(garboTurns)} turns, ${fmt(embezzlers)} embezzlers`);

    const pathTotal = pathTotals.get(path.name);
    if (path.results && pathTotal) {
      resultMessage(`${path.name} Results`, `${results(pathTotal.meat, pathTotal.items)}`);
      resultMessage(`${path.name} Summary`, `${fmt(path.results.turns)} turns`);
    }
    resultMessage("Overall Results", `${results(meat, items)}`);
    resultMessage("Swagger", `${fmt(totalSwagger)}`);
    resultMessage("Turns Tomorrow", `${turns} (after potato and hourglass)`);
    resultMessage("Fights Tomorrow", `${rolloverFites()}`);
    resultMessage("Lost Turns", `${lostTurns} to rollover`);
  }
}
