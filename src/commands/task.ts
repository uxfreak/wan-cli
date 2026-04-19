// wan task — hierarchical work tree with focus stack and history log.
//
// The work tree captures *what we're doing* across abstraction levels:
//   "formalize typst" → "build wan-cli" → "implement wan task" → ...
// orthogonal to notes (findings) and sessions (time windows).
//
// Subcommands:
//   wan task                          show full tree + current path
//   wan task add "title" [--parent ID] [--intent "..."] [--focus]
//   wan task list / tree              full tree
//   wan task show <id>                node details
//   wan task edit <id> [--title|--intent|--status]
//   wan task rm <id> [--recursive]    delete (refuses if children unless --recursive)
//   wan task focus <id>               set current focus (records event)
//   wan task pop                      focus parent of current
//   wan task done <id>                mark complete (focus moves to parent if id was focused)
//   wan task abandon <id>             mark abandoned
//   wan task block <id> "reason"      mark blocked
//   wan task unblock <id>             back to pending
//   wan task current / path           breadcrumb root → current
//   wan task history / log [--n N]    chronological focus events

import { parseArgs } from "node:util";
import {
  ensureInitialized,
  readTasks,
  writeTasks,
  readNotes,
  writeNotes,
} from "../store";
import {
  validateTaskStatus,
  validateTaskId,
  nextTaskId,
  nowISO,
  ago,
  truncate,
  padRight,
} from "../utils";
import type { TaskNode, TaskStatus, FocusEvent, TaskStore } from "../types";

const STATUS_GLYPH: Record<TaskStatus, string> = {
  pending: "·",
  active: "▸",
  done: "✓",
  abandoned: "✗",
  blocked: "⊘",
};

export async function task(args: string[]): Promise<void> {
  ensureInitialized();
  const [sub, ...rest] = args;
  switch (sub) {
    case undefined:
      await taskOverview();
      break;
    case "add":
      await taskAdd(rest);
      break;
    case "list":
    case "ls":
    case "tree":
      await taskTree(rest);
      break;
    case "show":
      await taskShow(rest[0]);
      break;
    case "edit":
      await taskEdit(rest);
      break;
    case "rm":
    case "remove":
    case "delete":
      await taskRm(rest);
      break;
    case "focus":
      await taskFocus(rest[0]);
      break;
    case "pop":
      await taskPop();
      break;
    case "done":
    case "complete":
      await taskMark(rest[0], "done");
      break;
    case "abandon":
      await taskMark(rest[0], "abandoned");
      break;
    case "block":
      await taskBlock(rest);
      break;
    case "unblock":
      await taskMark(rest[0], "pending");
      break;
    case "current":
    case "path":
      await taskPath();
      break;
    case "history":
    case "log":
      await taskHistory(rest);
      break;
    case "attach":
      await taskAttach(rest);
      break;
    case "detach":
      await taskDetach(rest);
      break;
    case "notes":
      await taskNotes(rest[0]);
      break;
    default:
      throw new Error(
        `Unknown task command: ${sub}. Try: add, tree, show, edit, rm, focus, pop, done, abandon, block, unblock, current, history, attach, detach, notes`,
      );
  }
}

// ── Helpers ────────────────────────────────────────────────

function findTask(store: TaskStore, id: string): TaskNode {
  const t = store.tasks.find((x) => x.id === id);
  if (!t) throw new Error(`Task ${id} not found.`);
  return t;
}

function childrenOf(store: TaskStore, parentId: string | null): TaskNode[] {
  return store.tasks.filter((t) => t.parentId === parentId);
}

function rootTasks(store: TaskStore): TaskNode[] {
  return childrenOf(store, null);
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

function descendants(store: TaskStore, id: string): TaskNode[] {
  const out: TaskNode[] = [];
  const stack = [id];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    for (const child of childrenOf(store, cur)) {
      out.push(child);
      stack.push(child.id);
    }
  }
  return out;
}

function recordEvent(store: TaskStore, ev: Omit<FocusEvent, "at">): void {
  store.history.push({ at: nowISO(), ...ev });
}

// ── Commands ───────────────────────────────────────────────

async function taskAdd(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      parent: { type: "string", short: "p" },
      intent: { type: "string", short: "i" },
      focus: { type: "boolean", short: "f", default: false },
      status: { type: "string", short: "s" },
    },
    allowPositionals: true,
  });
  const title = positionals.join(" ").trim();
  if (!title) throw new Error('Usage: wan task add "title" [--parent T001] [--intent "..."] [--focus]');

  const store = await readTasks();
  let parentId: string | null = null;
  if (values.parent) {
    validateTaskId(values.parent);
    findTask(store, values.parent); // throws if missing
    parentId = values.parent;
  }
  const id = nextTaskId(store.tasks);
  const status = values.status ? validateTaskStatus(values.status) : "pending";
  const node: TaskNode = {
    id,
    title,
    intent: values.intent?.trim() || undefined,
    status,
    parentId,
    createdAt: nowISO(),
    updatedAt: null,
  };
  store.tasks.push(node);
  recordEvent(store, { taskId: id, action: "created", detail: title });

  if (values.focus) {
    const from = store.focusedId;
    if (from) recordEvent(store, { taskId: from, action: "blurred" });
    store.focusedId = id;
    node.status = "active";
    recordEvent(store, {
      taskId: id,
      action: "focused",
      ...(from ? { fromTaskId: from } : {}),
    });
  }
  await writeTasks(store);
  console.log(`${id} added${values.focus ? " (focused)" : ""}: ${title}`);
}

function renderTree(
  store: TaskStore,
  nodes: TaskNode[],
  depth: number,
  prefix: string,
  out: string[],
): void {
  nodes.forEach((n, i) => {
    const last = i === nodes.length - 1;
    const branch = depth === 0 ? "" : last ? "└── " : "├── ";
    const focused = store.focusedId === n.id ? "  ◀" : "";
    const intent = n.intent ? `  ${truncate(n.intent.replace(/\s+/g, " "), 50)}` : "";
    out.push(
      `${prefix}${branch}${STATUS_GLYPH[n.status]} ${n.id}  ${truncate(n.title, 60)}${focused}${intent ? "    " + intent : ""}`,
    );
    const children = childrenOf(store, n.id);
    if (children.length > 0) {
      const nextPrefix = depth === 0 ? "" : prefix + (last ? "    " : "│   ");
      renderTree(store, children, depth + 1, nextPrefix, out);
    }
  });
}

async function taskTree(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: { all: { type: "boolean", short: "a", default: false } },
    allowPositionals: true,
  });
  const store = await readTasks();
  if (store.tasks.length === 0) {
    console.log("(no tasks yet — `wan task add \"title\"`)");
    return;
  }
  const rootId = positionals[0];
  const roots = rootId ? [findTask(store, rootId)] : rootTasks(store);
  let visible = roots;
  if (!values.all) {
    // hide done/abandoned at top level unless they have non-done children
    visible = roots.filter(
      (r) =>
        r.status !== "done" &&
        r.status !== "abandoned",
    );
    if (visible.length === 0) visible = roots; // fall back if everything closed
  }
  const out: string[] = [];
  renderTree(store, visible, 0, "", out);
  console.log(out.join("\n"));
}

async function taskOverview(): Promise<void> {
  const store = await readTasks();
  if (store.tasks.length === 0) {
    console.log("(no tasks yet — `wan task add \"title\"` to start)");
    return;
  }
  if (store.focusedId) {
    console.log("Focus path:");
    const path = pathTo(store, store.focusedId);
    path.forEach((t, i) => {
      const indent = "  ".repeat(i);
      const arrow = i === path.length - 1 ? " ◀" : "";
      console.log(`${indent}${STATUS_GLYPH[t.status]} ${t.id}  ${t.title}${arrow}`);
    });
    console.log("");
  }
  console.log("Tree:");
  await taskTree([]);
}

async function taskShow(id?: string): Promise<void> {
  if (!id) throw new Error("Usage: wan task show <id>");
  const store = await readTasks();
  const t = findTask(store, id);
  const path = pathTo(store, id).map((x) => `${x.id}/${truncate(x.title, 30)}`).join(" › ");
  const kids = childrenOf(store, id);
  console.log(`\n${t.id}  ${t.title}`);
  console.log(`  status:    ${t.status}${store.focusedId === id ? "  (focused)" : ""}`);
  console.log(`  path:      ${path}`);
  if (t.intent) console.log(`  intent:    ${t.intent}`);
  console.log(`  created:   ${t.createdAt} (${ago(t.createdAt)})`);
  if (t.updatedAt) console.log(`  updated:   ${t.updatedAt} (${ago(t.updatedAt)})`);
  if (t.completedAt) console.log(`  completed: ${t.completedAt} (${ago(t.completedAt)})`);
  if (kids.length > 0) {
    console.log(`  children:  ${kids.map((k) => `${STATUS_GLYPH[k.status]} ${k.id}`).join(", ")}`);
  }
  // Recent history involving this task
  const events = store.history.filter((e) => e.taskId === id).slice(-6);
  if (events.length > 0) {
    console.log(`  recent:`);
    for (const e of events) {
      console.log(`    ${ago(e.at)}  ${e.action}${e.detail ? `  — ${e.detail}` : ""}`);
    }
  }
}

async function taskEdit(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      title: { type: "string" },
      intent: { type: "string", short: "i" },
      status: { type: "string", short: "s" },
      parent: { type: "string", short: "p" },
    },
    allowPositionals: true,
  });
  const id = positionals[0];
  if (!id) throw new Error("Usage: wan task edit <id> [--title ...] [--intent ...] [--status ...] [--parent ...]");
  const store = await readTasks();
  const t = findTask(store, id);
  let changed = false;
  if (values.title !== undefined) {
    t.title = values.title;
    changed = true;
  }
  if (values.intent !== undefined) {
    t.intent = values.intent.trim() || undefined;
    changed = true;
  }
  if (values.status !== undefined) {
    t.status = validateTaskStatus(values.status);
    if (t.status === "done") t.completedAt = nowISO();
    changed = true;
  }
  if (values.parent !== undefined) {
    if (values.parent === "" || values.parent.toLowerCase() === "none") {
      t.parentId = null;
    } else {
      validateTaskId(values.parent);
      if (values.parent === id) throw new Error("Cannot parent a task to itself.");
      // Prevent cycles: new parent must not be a descendant of t
      const desc = descendants(store, id).map((d) => d.id);
      if (desc.includes(values.parent)) {
        throw new Error(`Cannot reparent: ${values.parent} is a descendant of ${id}.`);
      }
      findTask(store, values.parent);
      t.parentId = values.parent;
    }
    changed = true;
  }
  if (!changed) {
    console.log("Nothing to update. Use --title, --intent, --status, or --parent.");
    return;
  }
  t.updatedAt = nowISO();
  recordEvent(store, { taskId: id, action: "edited" });
  await writeTasks(store);
  console.log(`${id} updated.`);
}

async function taskRm(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: { recursive: { type: "boolean", short: "r", default: false } },
    allowPositionals: true,
  });
  const id = positionals[0];
  if (!id) throw new Error("Usage: wan task rm <id> [--recursive]");
  const store = await readTasks();
  const t = findTask(store, id);
  const kids = childrenOf(store, id);
  if (kids.length > 0 && !values.recursive) {
    throw new Error(
      `${id} has ${kids.length} child task(s). Re-run with --recursive to delete the whole subtree.`,
    );
  }
  const toRemove = values.recursive ? [t, ...descendants(store, id)] : [t];
  const removeIds = new Set(toRemove.map((x) => x.id));
  store.tasks = store.tasks.filter((x) => !removeIds.has(x.id));
  if (store.focusedId && removeIds.has(store.focusedId)) {
    store.focusedId = t.parentId;
    recordEvent(store, { taskId: t.parentId ?? id, action: "blurred", detail: "focus removed via rm" });
  }
  for (const r of toRemove) recordEvent(store, { taskId: r.id, action: "removed" });
  await writeTasks(store);
  console.log(`Removed ${toRemove.length} task(s): ${[...removeIds].join(", ")}`);
}

async function taskFocus(id?: string): Promise<void> {
  if (!id) throw new Error("Usage: wan task focus <id>");
  const store = await readTasks();
  const t = findTask(store, id);
  const from = store.focusedId;
  if (from === id) {
    console.log(`Already focused on ${id}.`);
    return;
  }
  if (from) recordEvent(store, { taskId: from, action: "blurred" });
  store.focusedId = id;
  if (t.status === "pending") t.status = "active";
  t.updatedAt = nowISO();
  recordEvent(store, {
    taskId: id,
    action: "focused",
    ...(from ? { fromTaskId: from } : {}),
  });
  await writeTasks(store);
  const path = pathTo(store, id).map((x) => x.title).join(" › ");
  console.log(`Focus → ${id}  (${path})`);
}

async function taskPop(): Promise<void> {
  const store = await readTasks();
  if (!store.focusedId) throw new Error("No current focus.");
  const cur = findTask(store, store.focusedId);
  const parent = cur.parentId;
  recordEvent(store, { taskId: cur.id, action: "blurred" });
  store.focusedId = parent;
  if (parent) {
    const p = findTask(store, parent);
    if (p.status === "pending") p.status = "active";
    p.updatedAt = nowISO();
    recordEvent(store, { taskId: parent, action: "focused", fromTaskId: cur.id });
    await writeTasks(store);
    console.log(`Focus → ${parent}  (${p.title})`);
  } else {
    await writeTasks(store);
    console.log(`Focus cleared (was ${cur.id}; no parent).`);
  }
}

async function taskMark(id: string | undefined, target: TaskStatus): Promise<void> {
  if (!id) throw new Error(`Usage: wan task ${target === "done" ? "done" : target} <id>`);
  const store = await readTasks();
  const t = findTask(store, id);
  t.status = target;
  t.updatedAt = nowISO();
  if (target === "done") {
    t.completedAt = nowISO();
    recordEvent(store, { taskId: id, action: "completed" });
  } else if (target === "abandoned") {
    recordEvent(store, { taskId: id, action: "abandoned" });
  } else {
    recordEvent(store, { taskId: id, action: "edited", detail: `status → ${target}` });
  }
  // If we just closed the focused task, pop focus to parent
  if ((target === "done" || target === "abandoned") && store.focusedId === id) {
    const parent = t.parentId;
    recordEvent(store, { taskId: id, action: "blurred" });
    store.focusedId = parent;
    if (parent) recordEvent(store, { taskId: parent, action: "focused", fromTaskId: id });
  }
  await writeTasks(store);
  console.log(`${id} → ${target}`);
}

async function taskBlock(args: string[]): Promise<void> {
  const [id, ...reasonParts] = args;
  if (!id) throw new Error('Usage: wan task block <id> "reason"');
  const reason = reasonParts.join(" ").trim();
  const store = await readTasks();
  const t = findTask(store, id);
  t.status = "blocked";
  t.updatedAt = nowISO();
  recordEvent(store, {
    taskId: id,
    action: "edited",
    detail: reason ? `blocked: ${reason}` : "blocked",
  });
  await writeTasks(store);
  console.log(`${id} → blocked${reason ? ` (${reason})` : ""}`);
}

async function taskPath(): Promise<void> {
  const store = await readTasks();
  if (!store.focusedId) {
    console.log("(no current focus — `wan task focus <id>`)");
    return;
  }
  const path = pathTo(store, store.focusedId);
  for (let i = 0; i < path.length; i++) {
    const t = path[i];
    const arrow = i === path.length - 1 ? "  ◀ now" : "";
    console.log(`${"  ".repeat(i)}${STATUS_GLYPH[t.status]} ${t.id}  ${t.title}${arrow}`);
  }
}

// ── Note ↔ task attachment ────────────────────────────────
//
// A note can support multiple tasks. The attachment is stored on the note
// (taskIds) so listing a note shows which tasks it backs without needing
// per-task indexes. The reverse lookup (which notes back this task) is a
// one-pass scan of the notes store.

async function taskAttach(args: string[]): Promise<void> {
  const [noteId, ...taskIds] = args;
  if (!noteId || taskIds.length === 0) {
    throw new Error("Usage: wan task attach <noteId> <taskId> [<taskId> ...]");
  }
  const tasks = await readTasks();
  for (const tid of taskIds) {
    validateTaskId(tid);
    if (!tasks.tasks.find((t) => t.id === tid)) throw new Error(`Task ${tid} not found.`);
  }
  const notesStore = await readNotes();
  const note = notesStore.notes.find((n) => n.id === noteId);
  if (!note) throw new Error(`Note ${noteId} not found.`);
  if (!note.taskIds) note.taskIds = [];
  let added = 0;
  for (const tid of taskIds) {
    if (!note.taskIds.includes(tid)) {
      note.taskIds.push(tid);
      added += 1;
    }
  }
  note.updatedAt = nowISO();
  await writeNotes(notesStore);
  console.log(`${noteId}: +${added} task(s); now → ${note.taskIds.join(", ")}`);
}

async function taskDetach(args: string[]): Promise<void> {
  const [noteId, ...taskIds] = args;
  if (!noteId || taskIds.length === 0) {
    throw new Error("Usage: wan task detach <noteId> <taskId> [<taskId> ...]");
  }
  const notesStore = await readNotes();
  const note = notesStore.notes.find((n) => n.id === noteId);
  if (!note) throw new Error(`Note ${noteId} not found.`);
  if (!note.taskIds || note.taskIds.length === 0) {
    console.log(`${noteId} has no task attachments.`);
    return;
  }
  const before = note.taskIds.length;
  note.taskIds = note.taskIds.filter((t) => !taskIds.includes(t));
  if (note.taskIds.length === 0) note.taskIds = undefined;
  note.updatedAt = nowISO();
  await writeNotes(notesStore);
  const removed = before - (note.taskIds?.length ?? 0);
  console.log(`${noteId}: −${removed} task(s); now → ${note.taskIds?.join(", ") ?? "(none)"}`);
}

async function taskNotes(taskId?: string): Promise<void> {
  if (!taskId) throw new Error("Usage: wan task notes <taskId>");
  validateTaskId(taskId);
  const tasks = await readTasks();
  const task = tasks.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`Task ${taskId} not found.`);
  const notesStore = await readNotes();
  const attached = notesStore.notes.filter((n) => n.taskIds?.includes(taskId));
  console.log(`\n${task.id}  ${task.title}  [${task.status}]`);
  if (attached.length === 0) {
    console.log("  (no notes attached — use `wan task attach <noteId> <taskId>`)");
    return;
  }
  console.log(`  ${attached.length} attached note(s):`);
  for (const n of attached) {
    const typeLabel = n.noteType !== "observation" ? ` {${n.noteType}}` : "";
    console.log(`    ${n.id}${typeLabel}  ${truncate(n.content, 70)}`);
  }
}

async function taskHistory(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: { n: { type: "string" }, task: { type: "string", short: "t" } },
    allowPositionals: false,
  });
  const store = await readTasks();
  let events = store.history;
  if (values.task) events = events.filter((e) => e.taskId === values.task);
  const n = values.n ? parseInt(values.n, 10) : 30;
  const slice = events.slice(-n);
  if (slice.length === 0) {
    console.log("(no history)");
    return;
  }
  const idW = 6;
  const actW = 11;
  const taskW = 6;
  console.log(
    [padRight("when", idW + 4), padRight("action", actW), padRight("task", taskW), "detail"].join("  "),
  );
  for (const e of slice) {
    const t = store.tasks.find((x) => x.id === e.taskId);
    const detail = e.detail ?? (t ? truncate(t.title, 60) : "");
    const fromBit = e.fromTaskId ? ` ← ${e.fromTaskId}` : "";
    console.log(
      [
        padRight(ago(e.at), idW + 4),
        padRight(e.action, actW),
        padRight(e.taskId, taskW),
        detail + fromBit,
      ].join("  "),
    );
  }
}
