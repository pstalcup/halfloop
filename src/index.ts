import {
  availableAmount,
  cliExecute,
  getCampground,
  handlingChoice,
  hippyStoneBroken,
  inebrietyLimit,
  Item,
  itemAmount,
  lastChoice,
  myAdventures,
  myAscensions,
  myDaycount,
  myInebriety,
  myPathId,
  myStorageMeat,
  print,
  pvpAttacksLeft,
  toInt,
  use,
  useFamiliar,
  visitUrl,
  wait,
} from "kolmafia";
import {
  $class,
  $familiar,
  $item,
  $items,
  ascend,
  Clan,
  get,
  Lifestyle,
  Paths,
  getModifier,
  have,
  withChoice,
} from "libram";
import { Engine, Quest, step, Task, getTasks } from "grimoire-kolmafia";

const LEG_AFTERCORE = 0;
const LEG_CS = 1;
const LEG_CASUAL = 2;

const VOA = get("valueOfAdventure");
const DRUNK_VOA = 3250;
const DUPE_ITEM = $item`bottle of greedy dog`;
const STASH_CLAN = "Alliance from Heck";

function withStashClan(action: (clan: Clan) => void) {
  const originalClan = Clan.get().id;
  Clan.join(STASH_CLAN);

  try {
    action(Clan.get());
  } finally {
    Clan.join(originalClan);
  }
}

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
        completed: () => myAdventures() === 0 || myInebriety() > inebrietyLimit(),
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
        completed: () => myAdventures() === 0 || myInebriety() > inebrietyLimit(),
      },
    ];
  }
}

function breakStone(): Task {
  return {
    name: "BreakStone",
    completed: () => hippyStoneBroken(),
    do: () => visitUrl("peevpee.php?action=smashstone&pwd&confirm=on", true),
  };
}

function swagger(): Task {
  return {
    name: "Swagger",
    ready: () => pvpAttacksLeft() > 0,
    completed: () => pvpAttacksLeft() == 0,
    do: () => {
      if (!get("_fireStartingKitUsed") && have($item`CSA fire-starting kit`)) {
        withChoice(595, 1, () => {
          use($item`CSA fire-starting kit`);
        });
      }
      while (get("_meteoriteAdesUsed") < 3 && have($item`Meteorite-Ade`)) {
        use($item`Meteorite-Ade`);
      }
      cliExecute("swagger");
    },
  };
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
        visitUrl(`choice.php?whichchoice=1125&pwd&option=1&iid=${toInt(DUPE_ITEM)}`);
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
    breakStone(),
    ...garbo(true),
    swagger(),
    {
      name: "Borrow",
      after: ["Overdrunk"],
      do: () => withStashClan((clan) => clan.take($items`moveable feast`)),
      completed: () => availableAmount($item`moveable feast`) > 0,
    },
    {
      name: "Ascend",
      after: ["Borrow"],
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
      do: () => cliExecuteThrow("phccs softcore"),
    },
    {
      name: "Hagnk",
      completed: () => myStorageMeat() === 0,
      do: () => cliExecuteThrow("hagnk all"),
    },
    {
      name: "Return",
      after: ["PHCCS"],
      do: () => withStashClan((clan) => clan.put($items`moveable feast`)),
      completed: () => availableAmount($item`moveable feast`) == 0,
    },
    breakStone(),
    dupeTask(),
    ...garbo(true, ["Return"]),
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
    swagger(),
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
    breakStone(),
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
    },
    {
      name: "Pajamas",
      after: ["Nightcap"],
      completed: () => getModifier("Adventures") > 20, // passives and stuff mean that this is likely
      do: () => cliExecute("maximize +adv +fites +switch tot"),
    },
    {
      name: "Clockwork Maid",
      after: ["Pajamas"],
      ready: () => getModifier("Adventures") + 40 < 200,
      completed: () => !!getCampground()["clockwork maid"],
      do: () => {
        if (!have($item`clockwork maid`)) {
          buy($item`clockwork maid`, 1, VOA * 8);
        }
        if (have($item`clockwork maid`)) {
          use($item`clockwork maid`);
        }
      },
      limit: { tries: 1 },
    },
    swagger(),
  ],
  completed: () => getCurrentLeg() > 2,
};

function logTasks(engine: Engine) {
  engine.tasks.forEach((t: Task) =>
    print(`TASK: ${t.name} AVAILABLE: ${engine.available(t)} COMPLETED: ${t.completed()}`)
  );
}

export function main(args: string = "") {
  const tasks = getTasks([aftercoreQuest, csQuest, casualQuest]);
  const engine = new Engine(tasks);
  logTasks(engine);

  while (engine.tasks.some((t) => engine.available(t))) {
    const task = engine.tasks.find((t) => engine.available(t));

    if (!task) {
      const uncompletedTasks = engine.tasks.filter((t) => !t.completed()).map((t) => t.name);
      for (const name of uncompletedTasks) {
        print(`${name} INCOMPLETE`);
      }

      throw "Unable to complete a full day!";
    }

    logTasks(engine);
    print(`Doing Task: ${task.name}`);
    wait(3);

    if (!task.completed()) {
      engine.do(task);
    }
  }
  print(`Done for today!`);
}
function buy(arg0: Item, arg1: number, arg2: number): void {
  throw new Error("Function not implemented.");
}
