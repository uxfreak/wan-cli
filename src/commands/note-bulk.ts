import { existsSync } from "node:fs";
import { parseArgs } from "node:util";
import { ensureInitialized, readNotes, writeNotes, sourceExists } from "../store";
import {
  validateNoteType,
  validateNotEmpty,
  nextNoteSeq,
  formatNoteId,
  nowISO,
} from "../utils";
import type { WanNote, BulkNoteInput } from "../types";

export async function noteBulk(args: string[]): Promise<void> {
  ensureInitialized();

  const { values } = parseArgs({
    args,
    options: {
      source: { type: "string", short: "s" },
      file: { type: "string", short: "f" },
    },
    allowPositionals: false,
  });

  const sourceId = values.source;
  const filePath = values.file;

  if (!sourceId) throw new Error("Missing --source (-s)");
  if (!filePath) throw new Error("Missing --file (-f)");

  if (!sourceExists(sourceId)) {
    throw new Error(`Source ${sourceId} does not exist.`);
  }
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const raw = await Bun.file(filePath).text();
  let inputs: BulkNoteInput[];
  try {
    inputs = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON in bulk file.");
  }

  if (!Array.isArray(inputs)) {
    throw new Error("Bulk file must contain a JSON array.");
  }

  const store = await readNotes();
  let seq = nextNoteSeq(store.notes, sourceId);
  const now = nowISO();
  let count = 0;

  for (const input of inputs) {
    if (!input.role || !input.content) {
      throw new Error(
        `Invalid entry at index ${count}: requires role and content.`
      );
    }

    const noteType = validateNoteType(input.noteType || "observation");
    validateNotEmpty(input.content, "Content");

    const note: WanNote = {
      id: formatNoteId(sourceId, seq),
      sourceId,
      role: input.role,
      noteType,
      content: input.content.trim(),
      tags: input.tags || [],
      createdAt: now,
      updatedAt: null,
    };

    if (input.bin) {
      note.bin = input.bin.toLowerCase().trim();
    }

    store.notes.push(note);
    seq++;
    count++;
  }

  await writeNotes(store);
  console.log(`${count} notes added (${formatNoteId(sourceId, seq - count)} → ${formatNoteId(sourceId, seq - 1)}).`);
}
