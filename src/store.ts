import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import type { WanConfig, NotesStore, AffinityStore } from "./types";

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
    version: 2,
  };
  const emptyNotes: NotesStore = { notes: [] };
  const emptyAffinity: AffinityStore = { labels: [], assignments: {} };

  Bun.write(join(root, "config.json"), JSON.stringify(config, null, 2));
  Bun.write(join(root, "notes.json"), JSON.stringify(emptyNotes, null, 2));
  Bun.write(join(root, "affinity.json"), JSON.stringify(emptyAffinity, null, 2));
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
