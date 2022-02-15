import {
  cliExecute,
  gametimeToInt,
  getClanLounge,
  myAdventures,
  myPath,
  print,
  use,
} from "kolmafia";
import {
  $class,
  $item,
  ascend,
  AsdonMartin,
  getRemainingLiver,
  getRemainingSpleen,
  getRemainingStomach,
  have,
  Lifestyle,
  Paths,
  questStep,
  Session,
} from "libram";
import {
  ALL_TIME_FILE,
  ascensionsToday,
  convertMilliseconds,
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
    const startTime = gametimeToInt();
    try {
      if (before) before();
      const start = Session.current();
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

function overDrunkTurns(): void {
  if (tappedOut()) {
    cliExecute(`CONSUME VALUE ${OVERDRUNK_MPA} NIGHTCAP`);
    cliExecute("garbo ascend");
  }
}

function nightCap(): void {
  if (tappedOut()) {
    cliExecute(`CONSUME NIGHTCAP`);
    cliExecute("maximize +adv +switch tot");
  }
}

function jumpCsGash(): void {
  if (!tappedOut()) {
    throw "Don't ascend with adventures dawg!";
  }
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

function jumpCasualGash(): void {
  if (!tappedOut()) {
    throw "Don't ascend with adventures dawg!";
  }
  ascend(
    Paths.Unrestricted,
    $class`Seal Cluber`,
    Lifestyle.casual,
    "canadia",
    $item`astral six-pack`
  );
}

function casual(): void {
  cliExecute("loopcasual");
}

function finishedNs(): void {
  if (questStep("questL13Final") < 999) {
    throw "Didn't finish the NS";
  }
}

export function main(): void {
  const startTime = gametimeToInt();
  maybeResetDailyProperties();

  const steps: (() => StepResults)[] = [
    makeStep("GARBO1", ascension(1, garboAscend)),
    makeStep("OVERDRUNK1", ascension(1, overDrunkTurns)),
    makeStep("COMMUNITYSERVICE", ascension(2, communityService), ascension(1, jumpCsGash)),
    makeStep("SETUPGARBO2", ascension(2, postCs)),
    makeStep("GARBO2", ascension(2, garbo)),
    makeStep("OVERDRUNK1", ascension(2, overDrunkTurns)),
    makeStep("CASUAL", ascension(3, casual), ascension(2, jumpCasualGash)),
    makeStep("GARBO3", ascension(3, garbo), finishedNs),
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
