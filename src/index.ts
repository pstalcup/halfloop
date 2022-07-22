import {
  availableAmount,
  cliExecute,
  inebrietyLimit,
  Location,
  myAdventures,
  myDaycount,
  myInebriety,
  myPathId,
  print,
} from "kolmafia";
import { $class, $item, ascend, get, getRemainingLiver, Lifestyle, Paths } from "libram";
import { Engine, Quest, step, Task, getTasks } from "grimoire-kolmafia";

const LEG_AFTERCORE = 0;
const LEG_CS = 1;
const LEG_CASUAL = 2;

const DRUNK_VOA = 3250;

function getCurrentLeg(): number {
  if (myDaycount() > 1) {
    return LEG_AFTERCORE;
  }
  if (myPathId() === Paths.CommunityService.id || get("csServicesPerformed") !== "") {
    return LEG_CS;
  }
  return LEG_CASUAL;
}

function garbo(ascend: boolean, after?: string[]): Task[] {
  if (ascend) {
    return [
      {
        name: "Garbo",
        after,
        do: () => cliExecute("garbo"),
        completed: () => myAdventures() === 0,
      },
      {
        name: "Consume",
        after: ["Garbo"],
        ready: () => myInebriety() === inebrietyLimit(),
        do: () => cliExecute(`CONSUME NIGHTCAP ${DRUNK_VOA}`),
        completed: () => myInebriety() > inebrietyLimit(),
      },
      {
        name: "Overdrunk",
        after: ["Consume"],
        do: () => cliExecute("garbo ascend"),
        completed: () => myAdventures() === 0,
      },
    ];
  } else {
    return [
      {
        name: "Garbo",
        after,
        do: () => cliExecute("garbo"),
        completed: () => myAdventures() === 0,
      },
    ];
  }
}

const aftercoreQuest: Quest<Task> = {
  name: "Aftercore",
  tasks: [
    ...garbo(true),
    {
      name: "Ascend",
      after: ["Overdrunk"],
      do: () => cliExecute("phccs_gash"),
      completed: () => getCurrentLeg() === LEG_CS,
    },
  ],
};

const csQuest: Quest<Task> = {
  name: "CS",
  tasks: [
    {
      name: "PHCCS",
      completed: () => myPathId() !== Paths.CommunityService.id,
      do: () => cliExecute("phccs"),
    },
    ...garbo(true, ["PHCCS"]),
    {
      name: "Ascend",
      after: ["Overdrunk"],
      ready: () => myAdventures() === 0,
      completed: () => getCurrentLeg() === LEG_CASUAL,
      do: () =>
        ascend(
          Paths.Unrestricted,
          $class`Seal Clubber`,
          Lifestyle.casual,
          "platypus",
          $item`astral six-pack`
        ),
    },
  ],
};

const casualQuest: Quest<Task> = {
  name: "Casual",
  tasks: [
    {
      name: "LoopCasual",
      completed: () => step("questL13Final") === 999,
      do: () => cliExecute("loopcasual"),
    },
    ...garbo(false, ["LoopCasual"]),
    {
      name: "KeepingTabs",
      after: ["Garbo"],
      completed: () => availableAmount($item`meat stack`) === 0,
      do: () => cliExecute("keeping-tabs"),
      limit: {
        tries: 1,
      },
    },
    {
      name: "Nightcap",
      after: ["KeepingTabs"],
      completed: () => myInebriety() > inebrietyLimit(),
      do: () => cliExecute("CONSUME NIGHTCAP"),
    },
  ],
};

export function main(args: string = "") {
  const tasks = getTasks([aftercoreQuest, csQuest, casualQuest].slice(getCurrentLeg()));
  const engine = new Engine(tasks);
  const completed = new Set<Task>();

  while (engine.tasks.some((t) => !(completed.has(t) || t.completed()))) {
    const task = engine.tasks.find((t) => engine.available(t));
    if (!task) {
      const uncompletedTasks = engine.tasks
        .filter((t) => !(completed.has(t) || t.completed()))
        .map((t) => t.name);

      print("Uncompleted Tasks:");
      for (const name of uncompletedTasks) {
        print(name);
      }
      throw "Unable to complete a full day!";
    }
    (task.do as () => void)();
  }
}
