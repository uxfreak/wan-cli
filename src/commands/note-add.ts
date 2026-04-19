import { existsSync } from "node:fs";
import { parseArgs } from "node:util";
import {
  ensureInitialized,
  readNotes,
  writeNotes,
  sourceExists,
  readTasks,
  readConfig,
  getWanRoot,
} from "../store";
import {
  validateNoteType,
  validateNotEmpty,
  validateTaskId,
  nextNoteSeq,
  formatNoteId,
  parseTags,
  parseSourceRef,
  nowISO,
  runRefValidator,
} from "../utils";
import type { WanNote, SourceRef } from "../types";

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
      detail: { type: "string", short: "d" },
      ref: { type: "string", multiple: true },
      "from-file": { type: "string", short: "F" },
      task: { type: "string", multiple: true },
      "no-validate": { type: "boolean", default: false },
    },
    allowPositionals: true,
  });

  const sourceId = values.source;
  const role = values.role;
  const noteTypeRaw = values.type || "observation";

  // Content sources (in priority order):
  //   --from-file PATH | -F PATH    → read content from file
  //   "-" positional                → read from stdin
  //   positional args               → join as content (legacy / fast path)
  // The --from-file route exists because shell-mangled chars (Unicode arrows,
  // backticks, math symbols) survive intact when passed via file.
  let content: string;
  if (values["from-file"]) {
    const path = values["from-file"];
    if (!existsSync(path)) throw new Error(`File not found: ${path}`);
    content = await Bun.file(path).text();
  } else if (positionals.length === 1 && positionals[0] === "-") {
    if (process.stdin.isTTY) {
      console.log("Enter note content (Ctrl+D to finish):");
    }
    content = await new Response(process.stdin as unknown as ReadableStream).text();
  } else {
    content = positionals.join(" ");
  }

  if (!sourceId) throw new Error("Missing --source (-s)");
  if (!role) throw new Error("Missing --role (-r)");
  if (!content.trim()) throw new Error("Missing note content (positional, --from-file, or stdin via -)");

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
  if (values.detail) {
    note.detail = values.detail.trim();
  }
  if (values.ref && values.ref.length > 0) {
    const refs: SourceRef[] = values.ref.map((r) => parseSourceRef(r));
    // Run per-project ref validator on each ref unless bypassed.
    if (!values["no-validate"]) {
      const config = await readConfig();
      if (config.validators?.ref) {
        for (const r of refs) {
          await runRefValidator(config.validators.ref, getWanRoot(), r);
        }
      }
    }
    note.refs = refs;
  }
  if (values.task && values.task.length > 0) {
    const tasks = await readTasks();
    for (const tid of values.task) {
      validateTaskId(tid);
      if (!tasks.tasks.find((t) => t.id === tid)) {
        throw new Error(`Task ${tid} not found.`);
      }
    }
    note.taskIds = [...values.task];
  }

  store.notes.push(note);
  await writeNotes(store);
  const taskBit = note.taskIds && note.taskIds.length > 0 ? `  → ${note.taskIds.join(", ")}` : "";
  console.log(`${id} added.${taskBit}`);
}
