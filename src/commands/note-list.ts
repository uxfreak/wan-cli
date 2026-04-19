import { parseArgs } from "node:util";
import { ensureInitialized, readNotes } from "../store";
import { truncate, padRight, formatSourceRef } from "../utils";

export async function noteList(args: string[]): Promise<void> {
  ensureInitialized();

  const { values } = parseArgs({
    args,
    options: {
      type: { type: "string", short: "n" },
      tag: { type: "string", short: "t" },
      source: { type: "string", short: "s" },
      role: { type: "string", short: "r" },
      bin: { type: "string", short: "b" },
      full: { type: "boolean", short: "f", default: false },
    },
    allowPositionals: false,
  });

  const store = await readNotes();
  let notes = store.notes;

  if (values.type) {
    const nt = values.type.toLowerCase();
    notes = notes.filter((n) => n.noteType === nt);
  }
  if (values.tag) {
    const tag = values.tag.toLowerCase();
    notes = notes.filter((n) => n.tags.some((t) => t === tag));
  }
  if (values.source) {
    notes = notes.filter((n) => n.sourceId === values.source);
  }
  if (values.role) {
    const role = values.role.toLowerCase();
    notes = notes.filter((n) => n.role.toLowerCase().includes(role));
  }
  if (values.bin) {
    const bin = values.bin.toLowerCase();
    notes = notes.filter((n) => n.bin === bin);
  }

  if (notes.length === 0) {
    console.log("No notes found.");
    return;
  }

  if (values.full) {
    for (const n of notes) {
      const typeLabel = n.noteType !== "observation" ? ` {${n.noteType}}` : "";
      const binLabel = n.bin ? ` [bin: ${n.bin}]` : "";
      console.log(`\n${n.id} [${n.role}]${typeLabel}${binLabel}`);
      console.log(`  ${n.content}`);
      if (n.tags.length > 0) console.log(`  tags: ${n.tags.join(", ")}`);
      if (n.detail) console.log(`  detail: ${n.detail}`);
      if (n.refs && n.refs.length > 0) {
        console.log(`  refs:`);
        n.refs.forEach((r, i) => console.log(`    [${i}] ${formatSourceRef(r)}`));
      }
      if (n.links && n.links.length > 0) {
        console.log(`  links:`);
        for (const l of n.links) {
          const ctx = l.note ? `  // ${l.note}` : "";
          console.log(`    —${l.kind}→ ${l.to}${ctx}`);
        }
      }
    }
    console.log(`\n${notes.length} note(s)`);
    return;
  }

  // Table output
  const idW = 9;
  const typeW = 17;
  const roleW = 14;
  const contentW = 55;

  const header = [
    padRight("ID", idW),
    padRight("Type", typeW),
    padRight("Role", roleW),
    padRight("Content", contentW),
    "Tags",
  ].join("  ");

  const sep = "-".repeat(header.length);
  console.log(header);
  console.log(sep);

  for (const n of notes) {
    const row = [
      padRight(n.id, idW),
      padRight(n.noteType, typeW),
      padRight(truncate(n.role, roleW), roleW),
      padRight(truncate(n.content, contentW), contentW),
      n.tags.join(", "),
    ].join("  ");
    console.log(row);
  }

  console.log(sep);
  console.log(`${notes.length} note(s)`);
}
