import { existsSync } from "node:fs";
import { parseArgs } from "node:util";
import { ensureInitialized, readNotes, writeNotes } from "../store";
import {
  validateNoteType,
  parseTags,
  parseSourceRef,
  nowISO,
} from "../utils";

export async function noteEdit(args: string[]): Promise<void> {
  ensureInitialized();

  const { values, positionals } = parseArgs({
    args,
    options: {
      content: { type: "string" },
      "content-from-file": { type: "string", short: "F" },
      type: { type: "string", short: "n" },
      tags: { type: "string", short: "t" },
      role: { type: "string", short: "r" },
      bin: { type: "string", short: "b" },
      detail: { type: "string", short: "d" },
      "add-ref": { type: "string", multiple: true },
      "rm-ref": { type: "string", multiple: true },
      "clear-refs": { type: "boolean", default: false },
    },
    allowPositionals: true,
  });

  const noteId = positionals[0];
  if (!noteId) {
    throw new Error(
      "Missing note ID. Usage: wan note edit <id> [--content ...] [--type ...] [--tags ...] [--role ...] [--bin ...] [--detail PATH] [--add-ref FILE:LINES]... [--rm-ref INDEX]... [--clear-refs]",
    );
  }

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
  if (values["content-from-file"] !== undefined) {
    const path = values["content-from-file"];
    if (!existsSync(path)) throw new Error(`File not found: ${path}`);
    note.content = (await Bun.file(path).text()).trimEnd();
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
  if (values.detail !== undefined) {
    const v = values.detail.trim();
    note.detail = v.length > 0 ? v : undefined;
    changed = true;
  }
  if (values["clear-refs"]) {
    note.refs = undefined;
    changed = true;
  }
  if (values["rm-ref"] && values["rm-ref"].length > 0) {
    if (!note.refs) note.refs = [];
    const indices = values["rm-ref"].map((s) => parseInt(s, 10)).filter((n) => !isNaN(n));
    // Remove highest indices first to keep lower indices stable
    indices.sort((a, b) => b - a);
    for (const idx of indices) {
      if (idx >= 0 && idx < note.refs.length) note.refs.splice(idx, 1);
    }
    if (note.refs.length === 0) note.refs = undefined;
    changed = true;
  }
  if (values["add-ref"] && values["add-ref"].length > 0) {
    if (!note.refs) note.refs = [];
    for (const r of values["add-ref"]) note.refs.push(parseSourceRef(r));
    changed = true;
  }

  if (!changed) {
    console.log(
      "Nothing to update. Use --content, --type, --tags, --role, --bin, --detail, --add-ref, --rm-ref, or --clear-refs.",
    );
    return;
  }

  note.updatedAt = nowISO();
  await writeNotes(store);
  console.log(`${noteId} updated.`);
}
