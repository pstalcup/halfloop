import { Engine, Task } from "grimoire-kolmafia";
import { print, totalTurnsPlayed } from "kolmafia";
import { get } from "libram";
import { daily, fmt } from "./util";

export class HalfloopEngine extends Engine {
    startingTurns = 0;
    startingSwagger = 0;
    turns: Map<string, number[]> = new Map();
  
    execute(task: Task<never>): void {
      this.startingTurns = totalTurnsPlayed();
      this.startingSwagger = get("availableSwagger");
      super.execute(task);
      this.turns.set(task.name, [
        totalTurnsPlayed() - this.startingTurns,
        ...(this.turns.get(task.name) ?? []),
      ]);
    }
  
    printSummary(): void {
      print("Tasks Turns:");
      for (const [name, turns] of this.turns.entries()) {
        print(`- ${name}: ${turns.reduce((a, b) => a + b)} (${turns})`);
      }

      print("");

      const endingTurns = totalTurnsPlayed();
      const endingSwagger = get("availableSwagger");
  
      const [totalTurnsSpent, totalSwagger] = daily(({ get, set }) => {
        set(
          "halfloop_turnsSpent",
          get("halfloop_turnsSpent") + (endingTurns - this.startingTurns),
        );
        set(
          "halfloop_swagger",
          get("halfloop_swagger") + (endingSwagger - this.startingSwagger),
        );
        return [get("halfloop_turnsSpent"), get("halfloop_swagger")];
      });
  
      const meat = get("garboResultsMeat", 0);
      const item = get("garboResultsItems", 0);
      const embezzlers = get("garboEmbezzlerCount", 0);
      const yachtzees = get("garboYachtzeeCount", 0);
  
      print("Final Results");
      print(`* Total Turns Spent: ${totalTurnsSpent}`);
      print(
        `* Garbo Results: ${fmt(meat)} meat + ${fmt(item)} items = ${fmt(
          meat + item,
        )}`,
      );
      print(
        `* Garbo Actions: ${fmt(embezzlers)} embezzlers and ${fmt(
          yachtzees,
        )} yachtzees`,
      );
      print(`* Swagger: ${fmt(totalSwagger)}`);
    }
  }