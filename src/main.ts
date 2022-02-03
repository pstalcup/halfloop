import { cliExecute, gametimeToInt, getClanLounge, print, todayToString, use } from "kolmafia";
import { $item, AsdonMartin, property, Session } from "libram";
import { printSession, shortPrintSession } from "./session";

const OVERDRUNK_MPA = 4000;
const OBSERVANTLY_TURNS = 1000;
const RESULTS_FILE = "halfloop.json";

function step(
  name: string,
  action: () => void,
  before: (() => void) | null = null
): { name: string; session: Session; runtime: number } {
  if (before) before();
  const start = Session.current();
  const startTime = gametimeToInt();
  action();
  return { name, session: Session.current().diff(start), runtime: gametimeToInt() - startTime };
}

function garboLegOne(): void {
  cliExecute("garbo ascend");
}

function overDrunkTurns(): void {
  cliExecute(`CONSUME VALUE ${OVERDRUNK_MPA} NIGHTCAP`);
  cliExecute("garbo ascend");
}

function jumpGash(): void {
  cliExecute("phccs_gash");
}

function communityService(): void {
  if (!getClanLounge()["codpiece"]) {
    cliExecute("/wl bafh");
    cliExecute("acquire codpiece");
    cliExecute("/wl heck");
  }
  cliExecute("phccs");
  cliExecute("hagnk all");
  cliExecute("breakfast");
}

function garboLegTwo(): void {
  AsdonMartin.drive(AsdonMartin.Driving.Observantly, OBSERVANTLY_TURNS);
  use($item`cold medicine cabinet`);

  cliExecute("garbo");
}

export function resetDailyPreference(trackingPreference: string): boolean {
  const today = todayToString();
  if (property.getString(trackingPreference) !== today) {
    property.set(trackingPreference, today);
    return true;
  } else {
    return false;
  }
}

export function convertMilliseconds(milliseconds: number): string {
  const ms = milliseconds % 1000;
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const secondsLeft = Math.round((seconds - minutes * 60) * 1000) / 1000;
  const hours = Math.floor(minutes / 60);
  const minutesLeft = Math.round(minutes - hours * 60);
  return [
    hours !== 0 ? `${hours} hours` : "",
    minutesLeft !== 0 ? `${minutesLeft} minutes` : "",
    secondsLeft !== 0 ? `${secondsLeft} seconds` : "",
    `${ms} milliseconds`,
  ]
    .filter((s) => s.length)
    .join(", ");
}

export function main(): void {
  const startTime = gametimeToInt();
  if (resetDailyPreference("halfloopLastRun")) {
    const steps = [
      { name: "BREAKFAST", session: Session.current(), runtime: 0 },
      step("GARBO (1)", garboLegOne),
      step("OVERDRUNK (1)", overDrunkTurns),
      step("COMMUNITY SERVICE", communityService, jumpGash),
      step("GARBO (2)", garboLegTwo),
    ];

    for (const { name, session, runtime } of steps) {
      print(`### ${name} ###`);
      print(`Runtime: ${convertMilliseconds(runtime)}`);
      printSession(session);
      print("");
    }

    print("### FULL SESSION ###");
    const fullSession = Session.add(...steps.map((value) => value.session));
    shortPrintSession(fullSession);
    const allTime = Session.fromFile(RESULTS_FILE).add(fullSession);
    print("### ALL TIME ###");
    shortPrintSession(allTime);
    allTime.toFile(RESULTS_FILE);
  }
  print(`halfloop'd: ${convertMilliseconds(gametimeToInt() - startTime)}`);
}
