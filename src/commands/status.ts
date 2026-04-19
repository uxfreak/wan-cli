import { spawn } from "node:child_process";
import { ensureInitialized, readStatus, writeStatus, statusPath } from "../store";
import { nowISO } from "../utils";

// wan status              — print current status
// wan status set "..."   — overwrite status with one-line text
// wan status append "..." — append a timestamped line
// wan status edit         — open in $EDITOR
export async function status(args: string[]): Promise<void> {
  ensureInitialized();
  const [sub, ...rest] = args;
  switch (sub) {
    case undefined:
    case "show":
      await statusShow();
      break;
    case "set":
      await statusSet(rest.join(" "));
      break;
    case "append":
    case "add":
      await statusAppend(rest.join(" "));
      break;
    case "edit":
      await statusEdit();
      break;
    case "clear":
      await writeStatus("# Status\n\n_Cleared._\n");
      console.log("Status cleared.");
      break;
    default:
      throw new Error(`Unknown status command: ${sub}. Try: show, set, append, edit, clear`);
  }
}

async function statusShow(): Promise<void> {
  const text = await readStatus();
  if (!text.trim()) {
    console.log("(empty status — `wan status set \"...\"` or `wan status edit`)");
    return;
  }
  console.log(text.trimEnd());
}

async function statusSet(text: string): Promise<void> {
  if (!text.trim()) throw new Error('Usage: wan status set "..."');
  const stamp = nowISO();
  const body = `# Status\n\n_Updated: ${stamp}_\n\n${text.trim()}\n`;
  await writeStatus(body);
  console.log("Status set.");
}

async function statusAppend(text: string): Promise<void> {
  if (!text.trim()) throw new Error('Usage: wan status append "..."');
  const existing = await readStatus();
  const stamp = nowISO();
  const body = (existing.trimEnd() || "# Status\n") + `\n\n_${stamp}_  ${text.trim()}\n`;
  await writeStatus(body);
  console.log("Status appended.");
}

async function statusEdit(): Promise<void> {
  const editor = process.env.EDITOR || process.env.VISUAL || "vi";
  const path = statusPath();
  await new Promise<void>((resolve, reject) => {
    const child = spawn(editor, [path], { stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Editor exited with code ${code}`));
    });
    child.on("error", reject);
  });
  console.log("Status saved.");
}
