import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import type {
  WanConfig,
  NotesStore,
  AffinityStore,
  SessionStore,
  TaskStore,
} from "./types";

let _root: string | null = null;

export function getWanRoot(): string {
  if (_root) return _root;
  let dir = process.cwd();
  while (true) {
    const candidate = join(dir, ".wan");
    if (existsSync(candidate)) {
      _root = candidate;
      return _root;
    }
    const parent = join(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return join(process.cwd(), ".wan");
}

export function isInitialized(): boolean {
  return existsSync(getWanRoot());
}

export function ensureInitialized(): void {
  if (!isInitialized()) {
    throw new Error("Not a wan project. Run `wan init` first.");
  }
}

export function initProject(name?: string): string {
  const root = join(process.cwd(), ".wan");
  if (existsSync(root)) {
    return root;
  }
  mkdirSync(root);
  mkdirSync(join(root, "sources"));

  const config: WanConfig = {
    name: name || basename(process.cwd()),
    createdAt: new Date().toISOString(),
    version: 3,
  };
  const emptyNotes: NotesStore = { notes: [] };
  const emptyAffinity: AffinityStore = { labels: [], assignments: {} };
  const emptySessions: SessionStore = { sessions: [], openSessionId: null };
  const emptyTasks: TaskStore = { tasks: [], focusedId: null, history: [] };

  Bun.write(join(root, "config.json"), JSON.stringify(config, null, 2));
  Bun.write(join(root, "notes.json"), JSON.stringify(emptyNotes, null, 2));
  Bun.write(join(root, "affinity.json"), JSON.stringify(emptyAffinity, null, 2));
  Bun.write(join(root, "sessions.json"), JSON.stringify(emptySessions, null, 2));
  Bun.write(join(root, "tasks.json"), JSON.stringify(emptyTasks, null, 2));
  Bun.write(join(root, "status.md"), "# Status\n\n_No status yet. `wan status set \"...\"` or `wan status edit`._\n");
  _root = root;
  return root;
}

export async function readConfig(): Promise<WanConfig> {
  const path = join(getWanRoot(), "config.json");
  const text = await Bun.file(path).text();
  return JSON.parse(text);
}

export async function readNotes(): Promise<NotesStore> {
  const path = join(getWanRoot(), "notes.json");
  if (!existsSync(path)) return { notes: [] };
  const text = await Bun.file(path).text();
  return JSON.parse(text);
}

export async function writeNotes(store: NotesStore): Promise<void> {
  const path = join(getWanRoot(), "notes.json");
  await Bun.write(path, JSON.stringify(store, null, 2));
}

export async function readAffinity(): Promise<AffinityStore> {
  const path = join(getWanRoot(), "affinity.json");
  if (!existsSync(path)) return { labels: [], assignments: {} };
  const text = await Bun.file(path).text();
  return JSON.parse(text);
}

export async function writeAffinity(store: AffinityStore): Promise<void> {
  const path = join(getWanRoot(), "affinity.json");
  await Bun.write(path, JSON.stringify(store, null, 2));
}

export function nextSourceId(): string {
  const sourcesDir = join(getWanRoot(), "sources");
  if (!existsSync(sourcesDir)) return "S001";
  const files = readdirSync(sourcesDir).filter((f) => /^S\d{3}\.md$/.test(f));
  if (files.length === 0) return "S001";
  const maxNum = Math.max(
    ...files.map((f) => parseInt(f.slice(1, 4), 10))
  );
  return `S${String(maxNum + 1).padStart(3, "0")}`;
}

export async function writeSource(id: string, content: string): Promise<void> {
  const path = join(getWanRoot(), "sources", `${id}.md`);
  await Bun.write(path, content);
}

export async function readSource(id: string): Promise<string> {
  const path = join(getWanRoot(), "sources", `${id}.md`);
  if (!existsSync(path)) {
    throw new Error(`Source ${id} not found.`);
  }
  return Bun.file(path).text();
}

export function listSourceIds(): string[] {
  const sourcesDir = join(getWanRoot(), "sources");
  if (!existsSync(sourcesDir)) return [];
  return readdirSync(sourcesDir)
    .filter((f) => /^S\d{3}\.md$/.test(f))
    .map((f) => f.replace(".md", ""))
    .sort();
}

export function sourceExists(id: string): boolean {
  const path = join(getWanRoot(), "sources", `${id}.md`);
  return existsSync(path);
}

// ── Sessions ───────────────────────────────────────────────

export async function readSessions(): Promise<SessionStore> {
  const path = join(getWanRoot(), "sessions.json");
  if (!existsSync(path)) return { sessions: [], openSessionId: null };
  const text = await Bun.file(path).text();
  return JSON.parse(text);
}

export async function writeSessions(store: SessionStore): Promise<void> {
  const path = join(getWanRoot(), "sessions.json");
  await Bun.write(path, JSON.stringify(store, null, 2));
}

// ── Tasks (work tree) ─────────────────────────────────────

export async function readTasks(): Promise<TaskStore> {
  const path = join(getWanRoot(), "tasks.json");
  if (!existsSync(path)) return { tasks: [], focusedId: null, history: [] };
  const text = await Bun.file(path).text();
  return JSON.parse(text);
}

export async function writeTasks(store: TaskStore): Promise<void> {
  const path = join(getWanRoot(), "tasks.json");
  await Bun.write(path, JSON.stringify(store, null, 2));
}

// ── Status (narrative state) ──────────────────────────────

export async function readStatus(): Promise<string> {
  const path = join(getWanRoot(), "status.md");
  if (!existsSync(path)) return "";
  return Bun.file(path).text();
}

export async function writeStatus(content: string): Promise<void> {
  const path = join(getWanRoot(), "status.md");
  await Bun.write(path, content);
}

export function statusPath(): string {
  return join(getWanRoot(), "status.md");
}
