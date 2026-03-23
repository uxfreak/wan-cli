import { ensureInitialized, readNotes, writeNotes } from "../store";

export async function noteRm(args: string[]): Promise<void> {
  ensureInitialized();

  if (args.length === 0) {
    throw new Error("Missing note ID(s). Usage: wan note rm <id> [<id2> ...]");
  }

  const store = await readNotes();
  const removed: string[] = [];

  for (const id of args) {
    const idx = store.notes.findIndex((n) => n.id === id);
    if (idx === -1) {
      console.warn(`Note ${id} not found, skipping.`);
      continue;
    }
    store.notes.splice(idx, 1);
    removed.push(id);
  }

  if (removed.length > 0) {
    await writeNotes(store);
    console.log(`Removed: ${removed.join(", ")}`);
  } else {
    console.log("No notes removed.");
  }
}
