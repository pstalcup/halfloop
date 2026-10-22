import { getProperty } from "kolmafia";
import { get, set } from "libram";

export type ResultLine = { title: string; message: string };

export type RunRecord = {
  state: "running" | "finished" | "aborted";
  path: string;
  startedAt: number;
  finishedAt?: number;
  results: ResultLine[];
  error?: string;
};

/** The leading underscore makes mafia clear this at rollover, so it always describes today */
const RUN_PROPERTY = "_halfloopRun";

/** Save the state of today's run so the relay page can show it */
export function recordRun(record: RunRecord): void {
  set(RUN_PROPERTY, JSON.stringify(record));
}

/** Today's most recent run, if halfloop has been started today */
export function lastRun(): RunRecord | undefined {
  const value = getProperty(RUN_PROPERTY);
  if (!value) return undefined;
  try {
    return JSON.parse(value) as RunRecord;
  } catch {
    return undefined;
  }
}

const INTERRUPT_PROPERTY = "halfloop_interrupt";

/** Ask a running halfloop to stop. Garbo is asked too, since it is usually what is running */
export function requestInterrupt(): void {
  set(INTERRUPT_PROPERTY, true);
  set("garbo_interrupt", true);
}

/** Forget interrupts left over from a run that ended before it saw them */
export function clearInterrupt(): void {
  set(INTERRUPT_PROPERTY, false);
  set("garbo_interrupt", false);
}

/** Stop the run if the relay page asked us to */
export function checkInterrupt(): void {
  if (get(INTERRUPT_PROPERTY, false)) {
    clearInterrupt();
    throw "User interrupt requested. Stopping halfloop.";
  }
}
