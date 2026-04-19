import { parseArgs } from "node:util";
import { ensureInitialized, readNotes } from "../store";
import { ago, padRight, truncate } from "../utils";

// wan todo — list open data-holes and design-questions, oldest first
// Filters: --type, --tag, --source, --role
export async function todo(args: string[]): Promise<void> {
  ensureInitialized();
  const { values } = parseArgs({
    args,
    options: {
      type: { type: "string", short: "n" },
      tag: { type: "string", short: "t" },
      source: { type: "string", short: "s" },
      role: { type: "string", short: "r" },
      full: { type: "boolean", short: "f", default: false },
    },
    allowPositionals: false,
  });

  const store = await readNotes();
  let notes = store.notes.filter(
    (n) => n.noteType === "data-hole" || n.noteType === "design-question",
  );

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

  if (notes.length === 0) {
    console.log("No open todos.");
    return;
  }

  // Oldest first — they've been waiting longest
  notes.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  if (values.full) {
    for (const n of notes) {
      console.log(`\n${n.id} [${n.noteType}] ${ago(n.createdAt)}`);
      console.log(`  ${n.content}`);
      if (n.tags.length > 0) console.log(`  tags: ${n.tags.join(", ")}`);
    }
    console.log(`\n${notes.length} open todo(s)`);
    return;
  }

  const idW = 9;
  const typeW = 16;
  const ageW = 10;
  const contentW = 56;
  console.log(
    [padRight("ID", idW), padRight("Type", typeW), padRight("Age", ageW), "Content"].join("  "),
  );
  console.log("-".repeat(idW + typeW + ageW + contentW + 6));
  for (const n of notes) {
    console.log(
      [
        padRight(n.id, idW),
        padRight(n.noteType, typeW),
        padRight(ago(n.createdAt), ageW),
        truncate(n.content, contentW),
      ].join("  "),
    );
  }
  console.log(`\n${notes.length} open todo(s)`);
}
