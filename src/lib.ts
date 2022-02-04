import { equip, Familiar, Item, myAscensions, todayToString, toSlot, useFamiliar } from "kolmafia";
import { get, property, Session, set } from "libram";

export const ALL_TIME_FILE = "halfloop.json";
export const PARTIAL_FILE = "halfloop-partial.json";
export const STARTING_FILE = "halfloop-starting.json";

function resetDailyProperty(trackingPreference: string): boolean {
  const today = todayToString();
  if (property.getString(trackingPreference) !== today) {
    property.set(trackingPreference, today);
    return true;
  } else {
    return false;
  }
}

export function maybeResetDailyProperties(): void {
  if (resetDailyProperty("halfLoopLastRun")) {
    set("halfLoopAscension", myAscensions());
    Session.current().toFile(PARTIAL_FILE);
  }
}

export function ascensionsToday(): number {
  return get("halfLoopAscension", 0) - myAscensions();
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

type OutfitSlot =
  | "hat"
  | "weapon"
  | "offhand"
  | "back"
  | "shirt"
  | "pants"
  | "acc1"
  | "acc2"
  | "acc3"
  | "familiar";
export function dressup(
  equipment: Partial<{ [slot in OutfitSlot]: Item }>,
  familiar?: Familiar
): void {
  if (familiar) {
    useFamiliar(familiar);
  }
  for (const [slotStr, item] of Object.entries(equipment)) {
    equip(toSlot(slotStr), item);
  }
}
