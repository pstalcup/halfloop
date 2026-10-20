import { getProperty } from "kolmafia";
import { set } from "libram";

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
