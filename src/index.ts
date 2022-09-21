import { Engine, getTasks, Task } from "grimoire-kolmafia";
import { print, myMeat, wait, visitUrl, availableAmount } from "kolmafia";
import { $items, get } from "libram";
import { aftercoreQuest } from "./aftercore";
import { casualQuest } from "./casual";
import { csQuest } from "./cs";
import { getSession } from "./util";

class HalfLoopEngine extends Engine {
  public run(actions?: number): void {
    for (let i = 0; i < (actions ?? Infinity); i++) {
      const task = this.getNextTask();
      if (!task) return;
      wait(3);
      if (task.ready && !task.ready()) throw `Task ${task.name} is not ready`;
      this.execute(task);
    }
  }

  public log(): void {
    this.tasks.forEach((t: Task) =>
      print(`TASK: ${t.name} AVAILABLE: ${this.available(t)} COMPLETED: ${t.completed()}`)
    );
  }
}

function fmt(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

type printBlockCallback = (p: (contents?: string, value?: number) => void) => void;
function printBlock(action: printBlockCallback, color: string) {
  const p = (contents: string = "", value?: number) => {
    if (value !== undefined) {
      print(`-${contents}: ${fmt(value)}`, color);
    } else {
      print(contents);
    }
  };
  action(p);
}

export function main(args: string = "") {
  const startingMeat = myMeat();
  const tasks = getTasks([aftercoreQuest, csQuest, casualQuest]);
  const engine = new HalfLoopEngine(tasks);

  engine.log();
  engine.run();

  const garboItems = get("garboResultsItems", 0);
  const garboMeat = get("garboResultsMeat", 0);

  const sessionAftercore = getSession("Aftercore");
  const sessionCS = getSession("CS");
  const sessionCasual = getSession("Casual");

  printBlock((p) => {
    p();
    p(`Garbo Results: `);
    p(`Items`, garboItems);
    p(`Meat`, garboMeat);
    p(`Total`, garboItems + garboMeat);
    p();
    p(`Raw Session Meat Results`);
    p(`Aftercore`, sessionAftercore);
    p(`CS`, sessionCS);
    p(`Casual`, sessionCasual);
    p(`Total`, sessionAftercore + sessionCS + sessionCasual);
    p();
    p(`Adjusted Daily Results`);
    p(`Garbo Items`, garboItems);
    p(`Raw Session Total`, sessionAftercore + sessionCS + sessionCasual);
    p(`Adjusted Total`, garboItems + sessionAftercore + sessionCS + sessionCasual);
    p(`Computed Casual Cost`, garboMeat - (sessionAftercore + sessionCS + sessionCasual));
    p();
    p(`PVP results: `);
    p(`Swagger`, get("availableSwagger"));
    p();
    p(`Currencies:`);
    $items`Volcoino,FunFunds™,Beach Buck,Coinspiracy,Wal-Mart gift certificate,Freddy Kruegerand`.forEach(
      (i) => p(`${i}`, availableAmount(i))
    );
  }, "yellow");
}
