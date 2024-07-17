import { Args, Engine, getTasks, Task } from "grimoire-kolmafia";
import { args, currentArgs, daily, fmt, halloween, statusUpdate } from "./util";
import { farm } from "./farm";
import { diet } from "./diet";
import { myAdventures, numericModifier, print, totalTurnsPlayed, wait } from "kolmafia";
import { pvp } from "./pvp";
import { $item, $path, clamp, Clan, get, have, sumNumbers } from "libram";
import { autoscend, pathQuest } from "./paths";
import { smolItems, smolMeat, smolPath, smolTurns } from "./paths/smol";
import { csItems, csMeat } from "./paths/cs";

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

export function main(command = ""): void {
  Args.fill(args, command);

  Clan.join("Bonus Adventures From Hell"); // make sure you start in the right place

  const startingTurns = totalTurnsPlayed();
  const startingSwagger = get("availableSwagger");

  const tasks = getTasks([pvp, autoscend, pathQuest(), diet, farm()]);
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
        available ? "black" : "red"
      );
    }
    print(`Next task: ${engine.getNextTask()?.name}`);
    return;
  }

  const runArgs = currentArgs();

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

    const [totalTurnsSpent, totalSwagger, totalSmolMeat, totalSmolItems] = daily(({ get, set }) => {
      set("halfloop_turnsSpent", get("halfloop_turnsSpent") + (endingTurns - startingTurns));
      set("halfloop_swagger", get("halfloop_swagger") + (endingSwagger - startingSwagger));
      set("halfloop_smolMeat", get("halfloop_smolMeat") + smolMeat);
      set("halfloop_smolItems", get("halfloop_smolItems") + smolItems);
      return [
        get("halfloop_turnsSpent"),
        get("halfloop_swagger"),
        get("halfloop_smolMeat"),
        get("halfloop_smolItems"),
      ];
    });

    const garboMeat = get("garboResultsMeat", 0);
    const garboItems = get("garboResultsItems", 0);
    const embezzlers = get("garboEmbezzlerCount", 0);
    const [turns, lostTurns] = rolloverTurns();

    const meat = sumNumbers([garboMeat, totalSmolItems, csMeat]);
    const items = sumNumbers([garboItems, totalSmolItems, csItems]);

    const results = (meat: number, items: number) =>
      `${fmt(meat)} meat + ${fmt(items)} items = ${fmt(meat + items)}`;

    const resultMessage = (title: string, message: string, color = "black") => {
      statusUpdate(`r${title.replace(" ", "").toLowerCase()}`, `${title} ${message}`);
      print(`* ${title}: ${message}`, color);
    };

    print("Final Results");
    resultMessage("Total Turns", `${totalTurnsSpent}`);
    resultMessage("Garbo Results", `${results(garboMeat, garboItems)}`);
    resultMessage("Garbo Actions", `${fmt(embezzlers)} embezzlers`);
    if (args.path === smolPath) {
      resultMessage("Smol Results", `${results(totalSmolMeat, totalSmolItems)}`);
      resultMessage(
        "Smol Summary",
        `${fmt(smolTurns)} turns, ${get("_loopsmol_pulls_used")} pulls`
      );
    }
    if (args.path === $path`Community Service`) {
      resultMessage("CS Results", `${results(csMeat, csItems)}`);
    }
    resultMessage("Overall Results", `${results(meat, items)}`);
    resultMessage("Swagger", `${fmt(totalSwagger)}`);
    resultMessage("Turns Tomorrow", `${turns} (after potato and hourglass)`);
    resultMessage("Lost Turns", `${lostTurns} to rollover`);
  }
}
