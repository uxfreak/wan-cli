import { ensureInitialized, readNotes, writeNotes } from "../store";
import { validateLinkKind, nowISO, truncate } from "../utils";
import type { NoteLink, LinkKind } from "../types";

// wan link add <a> <b> --kind <calls|produces|requires|refines|relates> [context...]
// wan link rm <a> <b>
// wan link list [<noteId>]
// wan link graph
export async function link(args: string[]): Promise<void> {
  ensureInitialized();
  const [sub, ...rest] = args;
  switch (sub) {
    case "add":
      await linkAdd(rest);
      break;
    case "rm":
      await linkRm(rest);
      break;
    case "list":
    case "ls":
      await linkList(rest);
      break;
    case "graph":
      await linkGraph();
      break;
    default:
      throw new Error(`Unknown link command: ${sub}. Try: add, rm, list, graph`);
  }
}

function parseKindFlag(args: string[]): { kind: LinkKind; rest: string[] } {
  const idx = args.findIndex((a) => a === "--kind" || a === "-k");
  if (idx === -1 || idx === args.length - 1) {
    throw new Error("Missing --kind <calls|produces|requires|refines|relates>");
  }
  const kind = validateLinkKind(args[idx + 1]);
  const rest = [...args.slice(0, idx), ...args.slice(idx + 2)];
  return { kind, rest };
}

async function linkAdd(args: string[]): Promise<void> {
  const { kind, rest } = parseKindFlag(args);
  const [a, b, ...noteParts] = rest;
  if (!a || !b) {
    throw new Error('Usage: wan link add <noteA> <noteB> --kind <kind> ["context"]');
  }
  if (a === b) throw new Error("Cannot link a note to itself.");
  const store = await readNotes();
  const noteA = store.notes.find((n) => n.id === a);
  const noteB = store.notes.find((n) => n.id === b);
  if (!noteA) throw new Error(`Note ${a} not found.`);
  if (!noteB) throw new Error(`Note ${b} not found.`);

  if (!noteA.links) noteA.links = [];
  // dedupe by (to, kind)
  if (noteA.links.some((l) => l.to === b && l.kind === kind)) {
    console.log(`Link already exists: ${a} —${kind}→ ${b}`);
    return;
  }
  const edge: NoteLink = { to: b, kind };
  const ctx = noteParts.join(" ").trim();
  if (ctx) edge.note = ctx;
  noteA.links.push(edge);
  noteA.updatedAt = nowISO();
  await writeNotes(store);
  console.log(`Linked: ${a} —${kind}→ ${b}`);
}

async function linkRm(args: string[]): Promise<void> {
  const [a, b] = args;
  if (!a || !b) throw new Error("Usage: wan link rm <noteA> <noteB>");
  const store = await readNotes();
  const noteA = store.notes.find((n) => n.id === a);
  if (!noteA || !noteA.links) {
    console.log(`No links from ${a}.`);
    return;
  }
  const before = noteA.links.length;
  noteA.links = noteA.links.filter((l) => l.to !== b);
  if (noteA.links.length === 0) noteA.links = undefined;
  noteA.updatedAt = nowISO();
  await writeNotes(store);
  console.log(`Removed ${before - (noteA.links?.length ?? 0)} link(s) from ${a} → ${b}.`);
}

async function linkList(args: string[]): Promise<void> {
  const [noteId] = args;
  const store = await readNotes();
  const notes = noteId
    ? store.notes.filter((n) => n.id === noteId)
    : store.notes.filter((n) => n.links && n.links.length > 0);
  if (notes.length === 0) {
    console.log(noteId ? `No links from ${noteId}.` : "No links anywhere yet.");
    return;
  }
  for (const n of notes) {
    if (!n.links || n.links.length === 0) continue;
    console.log(`\n${n.id}  (${truncate(n.content, 60)})`);
    for (const l of n.links) {
      const target = store.notes.find((x) => x.id === l.to);
      const desc = target ? truncate(target.content, 50) : "(missing)";
      const ctx = l.note ? `  // ${l.note}` : "";
      console.log(`  —${l.kind}→ ${l.to}  ${desc}${ctx}`);
    }
  }
}

async function linkGraph(): Promise<void> {
  const store = await readNotes();
  const edges = store.notes.flatMap((n) =>
    (n.links ?? []).map((l) => ({ from: n.id, to: l.to, kind: l.kind })),
  );
  if (edges.length === 0) {
    console.log("No edges yet.");
    return;
  }
  console.log(`# ${edges.length} edge(s)\n`);
  for (const e of edges) console.log(`  ${e.from} —${e.kind}→ ${e.to}`);
}
