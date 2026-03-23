import { isInitialized, initProject } from "../store";

export function init(args: string[]): void {
  if (isInitialized()) {
    console.log("Already initialized.");
    return;
  }
  const name = args[0];
  const root = initProject(name);
  console.log(`Initialized wan project at ${root}`);
}
