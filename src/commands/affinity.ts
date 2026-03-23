import { parseArgs } from "node:util";
import {
  ensureInitialized,
  readNotes,
  readAffinity,
  writeAffinity,
} from "../store";
import {
  validateLabelLevel,
  nextLabelSeq,
  formatLabelId,
  padRight,
  truncate,
  nowISO,
} from "../utils";
import { LABEL_COLORS, type AffinityLabel, type LabelLevel } from "../types";

export async function affinity(args: string[]): Promise<void> {
  ensureInitialized();

  const [sub, ...rest] = args;

  switch (sub) {
    case "label":
      await labelCmd(rest);
      break;
    case "assign":
      await assign(rest);
      break;
    case "unassign":
      await unassign(rest);
      break;
    case "group":
      await group(rest);
      break;
    case "ungroup":
      await ungroupCmd(rest);
      break;
    case "tree":
      await tree();
      break;
    case "unassigned":
      await unassigned();
      break;
    default:
      console.log(`
wan affinity — Bottom-up affinity diagramming (WAAD)

Subcommands:
  label add -l <1|2|3> "Label text"   Create an affinity label
  label edit <id> "New text"           Edit a label's text
  label rm <id>                        Remove a label
  label list [-l <1|2|3>]              List all labels
  assign <noteId> <labelId>            Assign note to L1 (blue) label
  unassign <noteId>                    Remove note from its group
  group <childLabelId> <parentLabelId> Nest a label under a higher-level label
  ungroup <labelId>                    Remove label from its parent
  tree                                 Show full hierarchy
  unassigned                           Show notes not yet grouped
`);
  }
}

async function labelCmd(args: string[]): Promise<void> {
  const [action, ...rest] = args;

  switch (action) {
    case "add":
      await labelAdd(rest);
      break;
    case "edit":
      await labelEdit(rest);
      break;
    case "rm":
      await labelRm(rest);
      break;
    case "list":
    case "ls":
      await labelList(rest);
      break;
    default:
      throw new Error(`Unknown label action: ${action}. Try: add, edit, rm, list`);
  }
}

async function labelAdd(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args,
    options: {
      level: { type: "string", short: "l", default: "1" },
    },
    allowPositionals: true,
  });

  const level = validateLabelLevel(values.level || "1");
  const text = positionals.join(" ");
  if (!text.trim()) throw new Error("Label text is required.");

  const store = await readAffinity();
  const seq = nextLabelSeq(store.labels, level);
  const id = formatLabelId(level, seq);

  const label: AffinityLabel = {
    id,
    level,
    text: text.trim(),
    parentId: null,
    createdAt: nowISO(),
    updatedAt: null,
  };

  store.labels.push(label);
  await writeAffinity(store);
  console.log(`${id} (${LABEL_COLORS[level]}) added: "${text.trim()}"`);
}

async function labelEdit(args: string[]): Promise<void> {
  const labelId = args[0];
  const text = args.slice(1).join(" ");
  if (!labelId) throw new Error("Missing label ID.");
  if (!text.trim()) throw new Error("New label text is required.");

  const store = await readAffinity();
  const label = store.labels.find((l) => l.id === labelId);
  if (!label) throw new Error(`Label ${labelId} not found.`);

  label.text = text.trim();
  label.updatedAt = nowISO();
  await writeAffinity(store);
  console.log(`${labelId} updated.`);
}

async function labelRm(args: string[]): Promise<void> {
  const labelId = args[0];
  if (!labelId) throw new Error("Missing label ID.");

  const store = await readAffinity();
  const idx = store.labels.findIndex((l) => l.id === labelId);
  if (idx === -1) throw new Error(`Label ${labelId} not found.`);

  const label = store.labels[idx];

  // Remove assignments pointing to this label
  for (const [noteId, lid] of Object.entries(store.assignments)) {
    if (lid === labelId) delete store.assignments[noteId];
  }

  // Unparent children
  for (const child of store.labels) {
    if (child.parentId === labelId) child.parentId = null;
  }

  store.labels.splice(idx, 1);
  await writeAffinity(store);
  console.log(`${labelId} (${LABEL_COLORS[label.level]}) removed.`);
}

async function labelList(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      level: { type: "string", short: "l" },
    },
    allowPositionals: false,
  });

  const store = await readAffinity();
  const notes = await readNotes();
  let labels = store.labels;

  if (values.level) {
    const level = validateLabelLevel(values.level);
    labels = labels.filter((l) => l.level === level);
  }

  if (labels.length === 0) {
    console.log("No labels found.");
    return;
  }

  labels.sort((a, b) => a.level - b.level || a.id.localeCompare(b.id));

  for (const l of labels) {
    const color = LABEL_COLORS[l.level];
    const parentInfo = l.parentId ? ` → ${l.parentId}` : "";
    const noteCount = l.level === 1
      ? ` (${Object.values(store.assignments).filter((id) => id === l.id).length} notes)`
      : "";
    console.log(`  ${padRight(l.id, 8)} ${padRight(color, 6)} ${l.text}${noteCount}${parentInfo}`);
  }
  console.log(`\n${labels.length} label(s)`);
}

async function assign(args: string[]): Promise<void> {
  const [noteId, labelId] = args;
  if (!noteId || !labelId) throw new Error("Usage: wan affinity assign <noteId> <labelId>");

  const [noteStore, store] = await Promise.all([readNotes(), readAffinity()]);

  const note = noteStore.notes.find((n) => n.id === noteId);
  if (!note) throw new Error(`Note ${noteId} not found.`);

  const label = store.labels.find((l) => l.id === labelId);
  if (!label) throw new Error(`Label ${labelId} not found.`);
  if (label.level !== 1) throw new Error(`Can only assign notes to L1 (blue) labels. ${labelId} is L${label.level} (${LABEL_COLORS[label.level]}).`);

  store.assignments[noteId] = labelId;
  await writeAffinity(store);
  console.log(`${noteId} → ${labelId}`);
}

async function unassign(args: string[]): Promise<void> {
  const noteId = args[0];
  if (!noteId) throw new Error("Usage: wan affinity unassign <noteId>");

  const store = await readAffinity();
  if (!store.assignments[noteId]) {
    console.log(`${noteId} is not assigned to any label.`);
    return;
  }

  delete store.assignments[noteId];
  await writeAffinity(store);
  console.log(`${noteId} unassigned.`);
}

async function group(args: string[]): Promise<void> {
  const [childId, parentId] = args;
  if (!childId || !parentId) throw new Error("Usage: wan affinity group <childLabelId> <parentLabelId>");

  const store = await readAffinity();

  const child = store.labels.find((l) => l.id === childId);
  if (!child) throw new Error(`Label ${childId} not found.`);

  const parent = store.labels.find((l) => l.id === parentId);
  if (!parent) throw new Error(`Label ${parentId} not found.`);

  if (parent.level <= child.level) {
    throw new Error(`Parent must be a higher level. ${parentId} is L${parent.level}, ${childId} is L${child.level}.`);
  }

  child.parentId = parentId;
  child.updatedAt = nowISO();
  await writeAffinity(store);
  console.log(`${childId} (${LABEL_COLORS[child.level]}) → ${parentId} (${LABEL_COLORS[parent.level]})`);
}

async function ungroupCmd(args: string[]): Promise<void> {
  const labelId = args[0];
  if (!labelId) throw new Error("Usage: wan affinity ungroup <labelId>");

  const store = await readAffinity();
  const label = store.labels.find((l) => l.id === labelId);
  if (!label) throw new Error(`Label ${labelId} not found.`);

  if (!label.parentId) {
    console.log(`${labelId} has no parent.`);
    return;
  }

  label.parentId = null;
  label.updatedAt = nowISO();
  await writeAffinity(store);
  console.log(`${labelId} ungrouped.`);
}

async function unassigned(): Promise<void> {
  const [noteStore, store] = await Promise.all([readNotes(), readAffinity()]);
  const assignedIds = new Set(Object.keys(store.assignments));
  const unassignedNotes = noteStore.notes.filter((n) => !assignedIds.has(n.id));

  if (unassignedNotes.length === 0) {
    console.log("All notes are assigned.");
    return;
  }

  for (const n of unassignedNotes) {
    const typeLabel = n.noteType !== "observation" ? ` {${n.noteType}}` : "";
    console.log(`  ${padRight(n.id, 9)} [${padRight(n.role, 12)}]${typeLabel} ${truncate(n.content, 70)}`);
  }
  console.log(`\n${unassignedNotes.length} unassigned note(s)`);
}

async function tree(): Promise<void> {
  const [noteStore, store] = await Promise.all([readNotes(), readAffinity()]);
  const { labels, assignments } = store;

  if (labels.length === 0) {
    console.log("No affinity labels yet. Start with `wan affinity label add -l 1 \"Label text\"`");
    return;
  }

  // Find the highest level present
  const maxLevel = Math.max(...labels.map((l) => l.level));

  // Print top-level labels (those at the highest level with no parent, or all at top)
  const roots = labels.filter(
    (l) => l.level === maxLevel || (l.parentId === null && l.level > 1)
  );

  // Also include L1 labels that have no parent and aren't children of anything
  const orphanL1 = labels.filter(
    (l) => l.level === 1 && l.parentId === null
  );

  // Build the tree from the highest level down
  const topNodes = labels.filter((l) => l.parentId === null);
  topNodes.sort((a, b) => b.level - a.level || a.id.localeCompare(b.id));

  for (const node of topNodes) {
    printTreeNode(node, labels, assignments, noteStore.notes, 0);
  }

  // Summary
  const assigned = Object.keys(assignments).length;
  const total = noteStore.notes.length;
  console.log(`\n${labels.length} label(s), ${assigned}/${total} notes assigned`);
}

function printTreeNode(
  label: AffinityLabel,
  allLabels: AffinityLabel[],
  assignments: Record<string, string>,
  allNotes: import("../types").WanNote[],
  depth: number
): void {
  const indent = "  ".repeat(depth);
  const color = LABEL_COLORS[label.level];
  const icon = label.level === 3 ? "◆" : label.level === 2 ? "◇" : "○";
  console.log(`${indent}${icon} [${label.id}|${color}] ${label.text}`);

  // Print children labels
  const children = allLabels
    .filter((l) => l.parentId === label.id)
    .sort((a, b) => a.id.localeCompare(b.id));

  for (const child of children) {
    printTreeNode(child, allLabels, assignments, allNotes, depth + 1);
  }

  // If L1, print assigned notes
  if (label.level === 1) {
    const noteIds = Object.entries(assignments)
      .filter(([, lid]) => lid === label.id)
      .map(([nid]) => nid);

    for (const nid of noteIds) {
      const note = allNotes.find((n) => n.id === nid);
      if (note) {
        const typeTag = note.noteType !== "observation" ? ` {${note.noteType}}` : "";
        console.log(`${indent}    ${note.id}${typeTag}: ${truncate(note.content, 65)}`);
      }
    }
  }
}
