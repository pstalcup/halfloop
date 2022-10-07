import {
  availableAmount,
  cliExecute,
  getProperty,
  handlingChoice,
  Item,
  myFamiliar,
  outfit,
  print,
  runChoice,
  setProperty,
  use,
  useFamiliar,
} from "kolmafia";

export function batfellow(argument: string) {
  print(`Running batfellow ${argument}`);
  const familiar = myFamiliar();
  const originalChoiceValue = getProperty("choiceAdventure1133");
  const originalAbortValue = getProperty("abortOnChoiceWhenNotInChoice");
  setProperty("choiceAdventure1133", "1");
  setProperty("abortOnChoiceWhenNotInChoice", "false");
  cliExecute("checkpoint");
  use(Item.get("special edition Batfellow comic"));
  if (handlingChoice()) runChoice(-1);
  cliExecute("batfellow.ash " + argument);
  setProperty("choiceAdventure1133", originalChoiceValue);
  useFamiliar(familiar);
  outfit("checkpoint");
}
