import { handlingChoice, runChoice, useFamiliar, visitUrl } from "kolmafia";
import { $familiar, $item, have } from "libram";

type GnomePart = "ears" | "lungs" | "elbow" | "knee" | "foot";
const gnomeChoices: { [p in GnomePart]: number } = {
  ears: 1,
  lungs: 2,
  elbow: 3,
  knee: 4,
  foot: 5,
};
export const gnomeParts: { [p in GnomePart]: Item } = {
  ears: $item`gnomish swimmer's ears`,
  lungs: $item`gnomish coal miner's lung`,
  elbow: $item`gnomish tennis elbow`,
  knee: $item`gnomish housemaid's kgnee`,
  foot: $item`gnomish athlete's foot`,
};

export function getGnomePart(part: GnomePart): boolean {
  useFamiliar($familiar`Reagnimated Gnome`);
  const page = visitUrl("arena.php");
  if (
    page.includes("Susie is probably still mad at your little Gnome buddy") ||
    !handlingChoice()
  ) {
    return false;
  }
  runChoice(gnomeChoices[part]);
  return have(gnomeParts[part]);
}
