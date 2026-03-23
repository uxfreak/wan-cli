import { parseArgs } from "node:util";
import { ensureInitialized, readNotes, writeNotes, sourceExists } from "../store";
import {
  validateNoteType,
  validateNotEmpty,
  nextNoteSeq,
  formatNoteId,
  parseTags,
  nowISO,
} from "../utils";
import type { WanNote } from "../types";

export async function noteAdd(args: string[]): Promise<void> {
  ensureInitialized();

  const { values, positionals } = parseArgs({
    args,
    options: {
      source: { type: "string", short: "s" },
      role: { type: "string", short: "r" },
      type: { type: "string", short: "n", default: "observation" },
      tags: { type: "string", short: "t" },
      bin: { type: "string", short: "b" },
    },
    allowPositionals: true,
  });

  const sourceId = values.source;
  const role = values.role;
  const noteTypeRaw = values.type || "observation";
  const content = positionals.join(" ");

  if (!sourceId) throw new Error("Missing --source (-s)");
  if (!role) throw new Error("Missing --role (-r)");
  if (!content.trim()) throw new Error("Missing note content (positional argument)");

  if (!sourceExists(sourceId)) {
    throw new Error(`Source ${sourceId} does not exist.`);
  }

  const noteType = validateNoteType(noteTypeRaw);
  validateNotEmpty(content, "Content");

  const store = await readNotes();
  const seq = nextNoteSeq(store.notes, sourceId);
  const id = formatNoteId(sourceId, seq);

  const note: WanNote = {
    id,
    sourceId,
    role,
    noteType,
    content: content.trim(),
    tags: values.tags ? parseTags(values.tags) : [],
    createdAt: nowISO(),
    updatedAt: null,
  };

  if (values.bin) {
    note.bin = values.bin.toLowerCase().trim();
  }

  store.notes.push(note);
  await writeNotes(store);
  console.log(`${id} added.`);
}
