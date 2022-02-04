import {
  adv1,
  cliExecute,
  gametimeToInt,
  getClanLounge,
  mpCost,
  myAdventures,
  myMaxmp,
  myMp,
  myPath,
  print,
  toEffect,
  toInt,
  use,
  useFamiliar,
  useSkill,
} from "kolmafia";
import {
  $familiar,
  $item,
  $location,
  $skill,
  $skills,
  adventureMacro,
  AsdonMartin,
  get,
  getRemainingLiver,
  getRemainingSpleen,
  getRemainingStomach,
  have,
  Session,
  set,
  StrictMacro,
  withChoices,
} from "libram";
import { getGnomePart, gnomeParts } from "./familiar";
import {
  ALL_TIME_FILE,
  ascensionsToday,
  convertMilliseconds,
  dressup,
  maybeResetDailyProperties,
  PARTIAL_FILE,
} from "./lib";
import { printSession, shortPrintSession } from "./session";
import { OBSERVANTLY_TURNS, OVERDRUNK_MPA } from "./settings";

export type StepResults = { name: string; session: Session; runtime: number; error?: boolean };
export function makeStep(
  name: string,
  action: () => void,
  before: (() => void) | null = null
): () => StepResults {
  return () => {
    if (before) before();
    const start = Session.current();
    const startTime = gametimeToInt();
    try {
      action();
    } catch {
      return {
        name,
        session: Session.current().diff(start),
        runtime: gametimeToInt() - startTime,
        error: true,
      };
    }
    return {
      name,
      session: Session.current().diff(start),
      runtime: gametimeToInt() - startTime,
    };
  };
}

function ascension(count: number, action: () => void) {
  return () => {
    if (ascensionsToday() < count) {
      action();
    } else {
      print("skipping, too many ascensions today");
    }
  };
}

function tappedOut(): boolean {
  return (
    getRemainingLiver() === 0 &&
    getRemainingStomach() === 0 &&
    getRemainingSpleen() === 0 &&
    myAdventures() === 0
  );
}

function garboAscend(): void {
  if (!tappedOut()) {
    cliExecute("garbo ascend");
  }
}

function garbo(): void {
  if (!tappedOut()) {
    cliExecute("garbo");
  }
}

function lavaDogs(): void {
  // this is bad and ugly but it gets the job done

  if (!get("_lavaDogs", false)) {
    if (!have(gnomeParts["knee"])) {
      getGnomePart("knee");
    }

    cliExecute("edpiece weasel");

    dressup(
      {
        hat: $item`The Crown of Ed the Undying`,
        back: $item`vampyric cloake`,
        shirt: $item`shoe ad T-shirt`,
        pants: $item`Cargo Cultist Shorts`,
        weapon: $item`cursed pirate cutlass`,
        offhand: $item`Drunkula's wineglass`,
        acc1: $item`mafia thumb ring`,
        acc2: $item`lucky gold ring`,
        acc3: $item`Mr. Cheeng's spectacles`,
        familiar: gnomeParts["knee"],
      },
      $familiar`Reagnimated Gnome`
    );

    const buffs =
      $skills`Holiday Weight Gain, Song of Starch, Get Big, Leash of Linguini, Empathy of the Newt, Blood Bond`.filter(
        have
      );

    const startingAdventures = myAdventures();

    while (
      myAdventures() > 0 &&
      startingAdventures - myAdventures() < 6 &&
      !$location`The Bubblin' Caldera`.noncombatQueue.split(";").includes("Lava Dogs")
    ) {
      adventureMacro($location`The Bubblin' Caldera`, StrictMacro.attack().repeat());
      const toCast = [
        ...$skills`Tongue of the Walrus, Cannelloni Cocoon`,
        ...buffs.filter((skill) => !have(toEffect(skill))),
        $skill`Cannelloni Cocoon`,
      ];
      for (const skill of toCast) {
        if (myMp() < mpCost(skill)) {
          use(Math.floor(myMaxmp() / 25), $item`psychokinetic energy blob`);
        }
        useSkill(skill);
      }
    }
    set("_lavaDogs", true);
  }
}

function machineElfDupe(): void {
  if (get("encountersUntilDMTChoice") === 0) {
    useFamiliar($familiar`Machine Elf`);
    withChoices({ 1125: `1&iid=${toInt($item`very fancy whiskey`)}` }, () => {
      adv1($location`The Deep Machine Tunnels`, -1, "");
    });
  }
}

function overDrunkTurns(): void {
  if (tappedOut()) {
    cliExecute(`CONSUME VALUE ${OVERDRUNK_MPA} NIGHTCAP`);
    lavaDogs();
    machineElfDupe();
    cliExecute("garbo ascend");
  }
}

function nightCap(): void {
  if (tappedOut()) {
    cliExecute(`CONSUME NIGHTCAP`);
    cliExecute("maximize +adv +switch tot");
  }
}

function jumpGash(): void {
  cliExecute("phccs_gash");
}

function communityService(): void {
  if (myPath() === "Community Service") {
    if (!have($item`codpiece`) && !getClanLounge()["codpiece"]) {
      cliExecute("/wl bafh");
      cliExecute("acquire codpiece");
      cliExecute("/wl heck");
    }
    cliExecute("phccs");
    cliExecute("hagnk all");
    cliExecute("breakfast");
  }
}

function postCs(): void {
  AsdonMartin.drive(AsdonMartin.Driving.Observantly, OBSERVANTLY_TURNS);
  use($item`cold medicine cabinet`);
}

export function main(): void {
  const startTime = gametimeToInt();
  maybeResetDailyProperties();

  const steps: (() => StepResults)[] = [
    makeStep("GARBO1", ascension(1, garboAscend)),
    makeStep("OVERDRUNK1", ascension(1, overDrunkTurns)),
    makeStep("COMMUNITYSERVICE", ascension(2, communityService), ascension(1, jumpGash)),
    makeStep("SETUPGARBO2", ascension(2, postCs)),
    makeStep("GARBO2", ascension(2, garbo)),
    makeStep("NIGHTCAP", ascension(2, nightCap)),
  ];

  const results: StepResults[] = [
    { name: "BREAKFAST", session: Session.fromFile(PARTIAL_FILE), runtime: 0 },
  ];

  let errorStateName: string | null = null;

  for (const step of steps) {
    const stepResults = step();
    results.push(stepResults);
    if (stepResults.error) {
      errorStateName = stepResults.name;
      break;
    }
  }

  for (const { name, session, runtime } of results) {
    print(`### ${name} ###`);
    print(`Runtime: ${convertMilliseconds(runtime)}`);
    printSession(session);
    print("");
  }

  print("### FULL SESSION ###");
  const fullSession = Session.add(...results.map((value) => value.session));
  shortPrintSession(fullSession);
  const allTime = Session.fromFile(ALL_TIME_FILE).add(fullSession);
  print("### ALL TIME ###");
  shortPrintSession(allTime);
  allTime.toFile(ALL_TIME_FILE);

  print(`halfloop'd: ${convertMilliseconds(gametimeToInt() - startTime)}`);

  if (errorStateName) {
    print(`ERROR IN ${errorStateName}`);
    fullSession.toFile(PARTIAL_FILE);
  }
}
