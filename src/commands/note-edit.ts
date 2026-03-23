import { parseArgs } from "node:util";
import { ensureInitialized, readNotes, writeNotes } from "../store";
import { validateNoteType, parseTags, nowISO } from "../utils";

export async function noteEdit(args: string[]): Promise<void> {
  ensureInitialized();

  const { values, positionals } = parseArgs({
    args,
    options: {
      content: { type: "string" },
      type: { type: "string", short: "n" },
      tags: { type: "string", short: "t" },
      role: { type: "string", short: "r" },
      bin: { type: "string", short: "b" },
    },
    allowPositionals: true,
  });

  const noteId = positionals[0];
  if (!noteId) throw new Error("Missing note ID. Usage: wan note edit <id> [--content ...] [--type ...] [--tags ...] [--role ...] [--bin ...]");

  const store = await readNotes();
  const note = store.notes.find((n) => n.id === noteId);
  if (!note) {
    const similar = store.notes
      .filter((n) => n.sourceId === noteId.split("-")[0])
      .map((n) => n.id);
    const hint = similar.length > 0 ? ` Similar: ${similar.join(", ")}` : "";
    throw new Error(`Note ${noteId} not found.${hint}`);
  }

  let changed = false;

  if (values.content !== undefined) {
    note.content = values.content;
    changed = true;
  }
  if (values.type !== undefined) {
    note.noteType = validateNoteType(values.type);
    changed = true;
  }
  if (values.tags !== undefined) {
    note.tags = parseTags(values.tags);
    changed = true;
  }
  if (values.role !== undefined) {
    note.role = values.role;
    changed = true;
  }
  if (values.bin !== undefined) {
    note.bin = values.bin.toLowerCase().trim() || undefined;
    changed = true;
  }

  if (!changed) {
    console.log("Nothing to update. Use --content, --type, --tags, --role, or --bin.");
    return;
  }

  note.updatedAt = nowISO();
  await writeNotes(store);
  console.log(`${noteId} updated.`);
}
