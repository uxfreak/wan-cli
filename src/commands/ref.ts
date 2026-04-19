import { ensureInitialized, readNotes, writeNotes } from "../store";
import { parseSourceRef, formatSourceRef, nowISO } from "../utils";
import type { SourceRef } from "../types";

// wan ref add <noteId> <file:lines> [context...]
// wan ref rm <noteId> <index>
// wan ref list [<noteId>]
export async function ref(args: string[]): Promise<void> {
  ensureInitialized();
  const [sub, ...rest] = args;
  switch (sub) {
    case "add":
      await refAdd(rest);
      break;
    case "rm":
      await refRm(rest);
      break;
    case "list":
    case "ls":
      await refList(rest);
      break;
    default:
      throw new Error(`Unknown ref command: ${sub}. Try: add, rm, list`);
  }
}

async function refAdd(args: string[]): Promise<void> {
  const [noteId, refRaw, ...noteParts] = args;
  if (!noteId || !refRaw) {
    throw new Error('Usage: wan ref add <noteId> <file:lines> ["context note"]');
  }
  const store = await readNotes();
  const note = store.notes.find((n) => n.id === noteId);
  if (!note) throw new Error(`Note ${noteId} not found.`);

  const context = noteParts.join(" ").trim() || undefined;
  const ref: SourceRef = parseSourceRef(refRaw, context);
  if (!note.refs) note.refs = [];
  note.refs.push(ref);
  note.updatedAt = nowISO();
  await writeNotes(store);
  console.log(`${noteId}: ref [${note.refs.length - 1}] added → ${formatSourceRef(ref)}`);
}

async function refRm(args: string[]): Promise<void> {
  const [noteId, idxRaw] = args;
  if (!noteId || idxRaw === undefined) {
    throw new Error("Usage: wan ref rm <noteId> <index>");
  }
  const idx = parseInt(idxRaw, 10);
  if (isNaN(idx)) throw new Error(`Invalid index: ${idxRaw}`);

  const store = await readNotes();
  const note = store.notes.find((n) => n.id === noteId);
  if (!note) throw new Error(`Note ${noteId} not found.`);
  if (!note.refs || idx < 0 || idx >= note.refs.length) {
    throw new Error(`No ref at index ${idx} for note ${noteId}.`);
  }
  const removed = note.refs.splice(idx, 1)[0];
  if (note.refs.length === 0) note.refs = undefined;
  note.updatedAt = nowISO();
  await writeNotes(store);
  console.log(`${noteId}: removed ref ${formatSourceRef(removed)}`);
}

async function refList(args: string[]): Promise<void> {
  const [noteId] = args;
  const store = await readNotes();
  const notes = noteId
    ? store.notes.filter((n) => n.id === noteId)
    : store.notes.filter((n) => n.refs && n.refs.length > 0);
  if (notes.length === 0) {
    console.log(noteId ? `No refs for ${noteId}.` : "No refs anywhere yet.");
    return;
  }
  for (const n of notes) {
    if (!n.refs || n.refs.length === 0) continue;
    console.log(`\n${n.id}  (${n.refs.length} ref${n.refs.length === 1 ? "" : "s"})`);
    n.refs.forEach((r, i) => {
      console.log(`  [${i}] ${formatSourceRef(r)}`);
    });
  }
}
