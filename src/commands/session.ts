import {
  ensureInitialized,
  readSessions,
  writeSessions,
  readNotes,
  readAffinity,
  listSourceIds,
} from "../store";
import { nowISO, nextSessionId, ago, truncate, padRight } from "../utils";
import type { SessionEntry } from "../types";

// wan session start "intent text"
// wan session end "summary text"
// wan session list
// wan session show <id>
// wan session current
export async function session(args: string[]): Promise<void> {
  ensureInitialized();
  const [sub, ...rest] = args;
  switch (sub) {
    case "start":
      await sessionStart(rest.join(" "));
      break;
    case "end":
      await sessionEnd(rest.join(" "));
      break;
    case "list":
    case "ls":
      await sessionList();
      break;
    case "show":
      await sessionShow(rest[0]);
      break;
    case "current":
    case undefined:
      await sessionCurrent();
      break;
    default:
      throw new Error(`Unknown session command: ${sub}. Try: start, end, list, show, current`);
  }
}

async function sessionStart(intent: string): Promise<void> {
  if (!intent.trim()) throw new Error('Usage: wan session start "intent text"');
  const store = await readSessions();
  if (store.openSessionId) {
    const open = store.sessions.find((s) => s.id === store.openSessionId);
    throw new Error(
      `Session already open: ${store.openSessionId}` +
        (open ? ` ("${truncate(open.intent, 50)}")` : "") +
        `. End it first with: wan session end "summary"`,
    );
  }
  const id = nextSessionId(store.sessions);
  const entry: SessionEntry = {
    id,
    intent: intent.trim(),
    startedAt: nowISO(),
    endedAt: null,
    notesAdded: [],
    labelsAdded: [],
    sourcesAdded: [],
  };
  store.sessions.push(entry);
  store.openSessionId = id;
  await writeSessions(store);
  console.log(`Session ${id} started: ${intent.trim()}`);
}

async function sessionEnd(summary: string): Promise<void> {
  const store = await readSessions();
  if (!store.openSessionId) {
    throw new Error("No open session. Start one with: wan session start \"...\"");
  }
  const entry = store.sessions.find((s) => s.id === store.openSessionId);
  if (!entry) throw new Error(`Internal: open session ${store.openSessionId} not found.`);

  // Compute deltas based on createdAt within session window
  const start = entry.startedAt;
  const end = nowISO();
  const notesStore = await readNotes();
  const affinity = await readAffinity();
  const sourceIds = listSourceIds();

  entry.notesAdded = notesStore.notes
    .filter((n) => n.createdAt >= start && n.createdAt <= end)
    .map((n) => n.id);
  entry.labelsAdded = affinity.labels
    .filter((l) => l.createdAt >= start && l.createdAt <= end)
    .map((l) => l.id);
  // Sources don't have timestamps — we track those that didn't exist when other open sessions
  // started would be too complex; for now, leave sourcesAdded empty (source IDs are sequential anyway).
  entry.sourcesAdded = sourceIds.filter((sid) => {
    // crude proxy: source ID lexicographically > any source ID at session start
    // (we have no timestamp; skip detection — user can add via tags if needed)
    return false;
  });

  entry.endedAt = end;
  if (summary.trim()) entry.summary = summary.trim();
  store.openSessionId = null;
  await writeSessions(store);
  console.log(
    `Session ${entry.id} ended. +${entry.notesAdded.length} notes, +${entry.labelsAdded.length} labels.`,
  );
}

async function sessionList(): Promise<void> {
  const store = await readSessions();
  if (store.sessions.length === 0) {
    console.log("No sessions yet.");
    return;
  }
  const idW = 9;
  const intentW = 48;
  console.log(
    [padRight("ID", idW), padRight("Intent", intentW), "Started", "Notes"].join("  "),
  );
  console.log("-".repeat(idW + intentW + 30));
  for (const s of store.sessions) {
    const open = s.id === store.openSessionId ? " *" : "";
    console.log(
      [
        padRight(s.id + open, idW),
        padRight(truncate(s.intent, intentW), intentW),
        padRight(ago(s.startedAt), 12),
        String(s.notesAdded.length),
      ].join("  "),
    );
  }
  if (store.openSessionId) console.log(`\n* = currently open`);
}

async function sessionShow(id?: string): Promise<void> {
  if (!id) throw new Error("Usage: wan session show <id>");
  const store = await readSessions();
  const entry = store.sessions.find((s) => s.id === id);
  if (!entry) throw new Error(`Session ${id} not found.`);
  const open = entry.id === store.openSessionId;
  console.log(`\n${entry.id}${open ? " (open)" : ""}`);
  console.log(`  intent:    ${entry.intent}`);
  console.log(`  started:   ${entry.startedAt} (${ago(entry.startedAt)})`);
  if (entry.endedAt) console.log(`  ended:     ${entry.endedAt} (${ago(entry.endedAt)})`);
  if (entry.summary) console.log(`  summary:   ${entry.summary}`);
  if (entry.notesAdded.length > 0)
    console.log(`  notes:     ${entry.notesAdded.join(", ")}`);
  if (entry.labelsAdded.length > 0)
    console.log(`  labels:    ${entry.labelsAdded.join(", ")}`);
}

async function sessionCurrent(): Promise<void> {
  const store = await readSessions();
  if (!store.openSessionId) {
    console.log("(no open session)");
    return;
  }
  await sessionShow(store.openSessionId);
}
