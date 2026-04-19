// wan resume — single bootstrap blob for picking up where we left off.
// Designed to be the first command run at session start (by human or AI).
// Outputs: status doc, current task path + tree summary, open session,
// recent history, top open todos, affinity headline, store counts.

import {
  ensureInitialized,
  readStatus,
  readTasks,
  readSessions,
  readNotes,
  readAffinity,
  readConfig,
  listSourceIds,
} from "../store";
import { ago, truncate } from "../utils";
import type { TaskNode, TaskStore } from "../types";

const SEP = "─".repeat(78);

function header(title: string): string {
  return `\n${SEP}\n${title}\n${SEP}`;
}

function pathTo(store: TaskStore, id: string): TaskNode[] {
  const out: TaskNode[] = [];
  let cur: string | null = id;
  while (cur) {
    const t: TaskNode | undefined = store.tasks.find((x) => x.id === cur);
    if (!t) break;
    out.unshift(t);
    cur = t.parentId;
  }
  return out;
}

const STATUS_GLYPH: Record<string, string> = {
  pending: "·",
  active: "▸",
  done: "✓",
  abandoned: "✗",
  blocked: "⊘",
};

export async function resume(_args: string[]): Promise<void> {
  ensureInitialized();
  const config = await readConfig();
  const out: string[] = [];

  out.push(`# wan resume — ${config.name}`);
  out.push(`Generated ${new Date().toISOString()}`);

  // ── Status ─────────────────────────
  const status = (await readStatus()).trim();
  out.push(header("STATUS (narrative)"));
  out.push(status || "(empty — `wan status set \"...\"`)");

  // ── Current focus path ─────────────
  const tasks = await readTasks();
  out.push(header("CURRENT FOCUS"));
  if (tasks.focusedId) {
    const path = pathTo(tasks, tasks.focusedId);
    path.forEach((t, i) => {
      const arrow = i === path.length - 1 ? "  ◀ now" : "";
      out.push(`${"  ".repeat(i)}${STATUS_GLYPH[t.status]} ${t.id}  ${t.title}${arrow}`);
      if (i === path.length - 1 && t.intent) {
        out.push(`${"  ".repeat(i + 1)}intent: ${t.intent}`);
      }
    });
  } else {
    out.push("(no focused task — `wan task focus <id>` to set one)");
  }

  // ── Open task tree (top-level + active branches) ──
  out.push(header("WORK TREE (open branches)"));
  if (tasks.tasks.length === 0) {
    out.push("(no tasks)");
  } else {
    const lines: string[] = [];
    const renderBranch = (parentId: string | null, depth: number) => {
      const kids = tasks.tasks.filter((t) => t.parentId === parentId);
      for (const k of kids) {
        if (k.status === "done" || k.status === "abandoned") continue;
        const focus = tasks.focusedId === k.id ? "  ◀" : "";
        lines.push(`${"  ".repeat(depth)}${STATUS_GLYPH[k.status]} ${k.id}  ${truncate(k.title, 60)}${focus}`);
        renderBranch(k.id, depth + 1);
      }
    };
    renderBranch(null, 0);
    out.push(lines.length > 0 ? lines.join("\n") : "(all branches closed)");
  }

  // ── Open session ──────────────────
  const sessions = await readSessions();
  out.push(header("SESSION"));
  if (sessions.openSessionId) {
    const s = sessions.sessions.find((x) => x.id === sessions.openSessionId);
    if (s) {
      out.push(`OPEN: ${s.id}  started ${ago(s.startedAt)}`);
      out.push(`  intent: ${s.intent}`);
    }
  } else {
    out.push("(no open session — `wan session start \"...\"`)");
    const last = sessions.sessions[sessions.sessions.length - 1];
    if (last) {
      out.push(`Last closed: ${last.id} ${ago(last.endedAt ?? last.startedAt)}`);
      if (last.summary) out.push(`  summary: ${last.summary}`);
    }
  }

  // ── Recent history ────────────────
  out.push(header("RECENT HISTORY (last 8 events)"));
  const recent = tasks.history.slice(-8);
  if (recent.length === 0) {
    out.push("(no history)");
  } else {
    for (const e of recent) {
      const t = tasks.tasks.find((x) => x.id === e.taskId);
      const title = t ? truncate(t.title, 50) : "";
      const fromBit = e.fromTaskId ? ` ← ${e.fromTaskId}` : "";
      const detail = e.detail && e.detail !== title ? `  — ${e.detail}` : "";
      out.push(`  ${ago(e.at).padEnd(10)}  ${e.action.padEnd(10)}  ${e.taskId}  ${title}${fromBit}${detail}`);
    }
  }

  // ── Open todos (data-holes + design-questions) ──
  const notes = await readNotes();
  const open = notes.notes
    .filter((n) => n.noteType === "data-hole" || n.noteType === "design-question")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  out.push(header(`OPEN TODOS (${open.length} unresolved)`));
  if (open.length === 0) {
    out.push("(none)");
  } else {
    for (const n of open.slice(0, 8)) {
      out.push(`  ${n.id}  [${n.noteType}]  ${ago(n.createdAt)}  ${truncate(n.content, 60)}`);
    }
    if (open.length > 8) out.push(`  … +${open.length - 8} more (run \`wan todo\`)`);
  }

  // ── Affinity headline (L3 themes if any) ──
  const aff = await readAffinity();
  out.push(header("AFFINITY (top-level themes)"));
  const l3 = aff.labels.filter((l) => l.level === 3);
  const l2 = aff.labels.filter((l) => l.level === 2);
  const l1 = aff.labels.filter((l) => l.level === 1);
  if (l3.length === 0 && l2.length === 0 && l1.length === 0) {
    out.push("(no labels yet)");
  } else {
    if (l3.length > 0) {
      out.push("L3 (themes):");
      for (const l of l3) out.push(`  ${l.id}  ${l.text}`);
    }
    out.push(`  totals: L1=${l1.length} L2=${l2.length} L3=${l3.length}`);
  }

  // ── Counts ─────────────────────────
  const sourceIds = listSourceIds();
  const byType = notes.notes.reduce<Record<string, number>>((acc, n) => {
    acc[n.noteType] = (acc[n.noteType] ?? 0) + 1;
    return acc;
  }, {});
  out.push(header("STORE"));
  out.push(`  sources:  ${sourceIds.length}`);
  out.push(`  notes:    ${notes.notes.length}  (${Object.entries(byType).map(([k, v]) => `${k}=${v}`).join(", ")})`);
  out.push(`  tasks:    ${tasks.tasks.length}`);
  out.push(`  sessions: ${sessions.sessions.length}`);

  out.push(SEP);
  console.log(out.join("\n"));
}
