import {
  availableAmount,
  cliExecute,
  handlingChoice,
  hippyStoneBroken,
  inebrietyLimit,
  itemAmount,
  lastChoice,
  Location,
  myAdventures,
  myAscensions,
  myDaycount,
  myInebriety,
  myPathId,
  print,
  pvpAttacksLeft,
  toInt,
  useFamiliar,
  visitUrl,
  wait,
} from "kolmafia";
import { $class, $familiar, $item, ascend, get, getRemainingLiver, Lifestyle, Paths } from "libram";
import { Engine, Quest, step, Task, getTasks } from "grimoire-kolmafia";

const LEG_AFTERCORE = 0;
const LEG_CS = 1;
const LEG_CASUAL = 2;

const DRUNK_VOA = 3250;
const DUPE_ITEM = $item`bottle of greedy dog`;

function getCurrentLeg(): number {
  if (myDaycount() > 1) {
    return LEG_AFTERCORE;
  }
  if (myPathId() === Paths.CommunityService.id || get("csServicesPerformed") !== "") {
    return LEG_CS;
  }
  return LEG_CASUAL;
}

function cliExecuteThrow(command: string) {
  if (!cliExecute(command)) throw `Failed to execute ${command}`;
}

function garbo(ascend: boolean, after?: string[]): Task[] {
  if (ascend) {
    return [
      {
        name: "Garbo",
        after,
        do: () => cliExecuteThrow("garbo ascend yachtzeechain"),
        completed: () => myAdventures() === 0 || myInebriety() >= inebrietyLimit(),
      },
      {
        name: "Consume",
        after: ["Garbo"],
        ready: () => myInebriety() === inebrietyLimit(),
        do: () => cliExecuteThrow(`CONSUME NIGHTCAP VALUE ${DRUNK_VOA}`),
        completed: () => myInebriety() > inebrietyLimit(),
      },
      {
        name: "Overdrunk",
        after: ["Garbo", "Consume"],
        do: () => cliExecuteThrow("garbo ascend"),
        completed: () => myAdventures() === 0,
      },
    ];
  } else {
    return [
      {
        name: "Garbo",
        after,
        ready: () => myAdventures() > 0 && myInebriety() < inebrietyLimit(),
        do: () => cliExecuteThrow("garbo yachtzeechain"),
        completed: () => myAdventures() === 0 || myInebriety() >= inebrietyLimit(),
      },
    ];
  }
}

function pvp(): Task[] {
  return [
    {
      name: "BreakStone",
      completed: () => hippyStoneBroken(),
      do: () => visitUrl("peevpee.php?action=smashstone&pwd&confirm=on", true),
    },
    {
      name: "Swagger",
      completed: () => pvpAttacksLeft() > 0,
      do: () => cliExecute("swagger"),
    },
  ];
}

function dupeTask(): Task {
  return {
    name: "DMT",
    ready: () =>
      itemAmount(DUPE_ITEM) > 0 && get("encountersUntilDMTChoice") < 1 && myAdventures() > 0,
    completed: () => get("lastDMTDuplication") >= myAscensions(),
    do: (): void => {
      useFamiliar($familiar`Machine Elf`);
      visitUrl("adventure.php?snarfblat=458");
      if (handlingChoice() && lastChoice() === 1119) {
        visitUrl("choice.php?pwd&whichchoice=1119&option=4");
        visitUrl(
          `choice.php?whichchoice=1125&pwd&option=1&iid=${toInt($item`bottle of greedy dog`)}`
        );
      }
    },
    limit: {
      tries: 1,
    },
    outfit: { familiar: $familiar`Machine Elf` },
  };
}

const aftercoreQuest: Quest<Task> = {
  name: "Aftercore",
  tasks: [
    ...garbo(true),
    ...pvp(),
    {
      name: "Ascend",
      after: ["Overdrunk"],
      do: () => cliExecuteThrow("phccs_gash"),
      completed: () => getCurrentLeg() === LEG_CS,
    },
  ],
  completed: () => getCurrentLeg() > 0,
};

const csQuest: Quest<Task> = {
  name: "CS",
  tasks: [
    {
      name: "PHCCS",
      completed: () => myPathId() !== Paths.CommunityService.id,
      do: () => cliExecuteThrow("phccs"),
      post: () => cliExecute("hagnk all"),
    },
    dupeTask(),
    ...garbo(true, ["PHCCS"]),
    ...pvp(),
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
  completed: () => getCurrentLeg() > 1,
};

const casualQuest: Quest<Task> = {
  name: "Casual",
  tasks: [
    {
      name: "LoopCasual",
      completed: () => step("questL13Final") === 999,
      do: () => cliExecuteThrow("loopcasual"),
    },
    dupeTask(),
    ...garbo(false, ["LoopCasual"]),
    {
      name: "KeepingTabs",
      after: ["Garbo"],
      completed: () => availableAmount($item`meat stack`) === 0,
      do: () => cliExecuteThrow("keeping-tabs"),
      limit: {
        tries: 1,
      },
    },
    {
      name: "Nightcap",
      after: ["KeepingTabs"],
      completed: () => myInebriety() > inebrietyLimit(),
      do: () => cliExecuteThrow("CONSUME NIGHTCAP"),
      post: () => cliExecute("maximize +adv +switch tot"),
    },
    ...pvp(),
  ],
  completed: () => getCurrentLeg() > 2,
};

export function main(args: string = "") {
  const tasks = getTasks([aftercoreQuest, csQuest, casualQuest]);
  const engine = new Engine(tasks);

  while (engine.tasks.some((t) => engine.available(t))) {
    const task = engine.tasks.find((t) => engine.available(t));

    if (!task) {
      const uncompletedTasks = engine.tasks.filter((t) => !t.completed()).map((t) => t.name);
      for (const name of uncompletedTasks) {
        print(`${name} INCOMPLETE`);
      }

      throw "Unable to complete a full day!";
    }

    engine.tasks.forEach((t: Task) =>
      print(`TASK: ${t.name} AVAILABLE: ${engine.available(t)} COMPLETED: ${t.completed()}`)
    );
    print(`Doing Task: ${task.name}`);
    wait(3);

    if (!task.completed()) {
      engine.do(task);
    }
  }
}
