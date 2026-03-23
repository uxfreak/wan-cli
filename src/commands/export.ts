import { parseArgs } from "node:util";
import { ensureInitialized, readNotes, readAffinity } from "../store";
import { LABEL_COLORS } from "../types";
import type { WanNote, AffinityLabel, AffinityStore } from "../types";

export async function exportNotes(args: string[]): Promise<void> {
  ensureInitialized();

  const { values } = parseArgs({
    args,
    options: {
      format: { type: "string", short: "f", default: "md" },
    },
    allowPositionals: false,
  });

  const format = values.format || "md";
  const [store, affinity] = await Promise.all([readNotes(), readAffinity()]);
  const { notes } = store;

  if (notes.length === 0) {
    console.log("No notes to export.");
    return;
  }

  switch (format) {
    case "json":
      console.log(JSON.stringify({ notes, affinity }, null, 2));
      break;

    case "csv":
      exportCsv(notes);
      break;

    case "md":
      exportMarkdown(notes, affinity);
      break;

    default:
      throw new Error(`Unknown format "${format}". Use: md, json, csv`);
  }
}

function escapeCsv(str: string): string {
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function exportCsv(notes: WanNote[]): void {
  console.log("id,sourceId,role,noteType,content,tags,bin,createdAt,updatedAt");
  for (const n of notes) {
    const row = [
      n.id,
      n.sourceId,
      escapeCsv(n.role),
      n.noteType,
      escapeCsv(n.content),
      escapeCsv(n.tags.join("; ")),
      n.bin || "",
      n.createdAt,
      n.updatedAt || "",
    ].join(",");
    console.log(row);
  }
}

function exportMarkdown(notes: WanNote[], affinity: AffinityStore): void {
  const date = new Date().toISOString().split("T")[0];
  console.log(`# Work Activity Notes`);
  console.log(`Exported: ${date}\n`);

  const hasAffinity = affinity.labels.length > 0;

  if (hasAffinity) {
    // Export as WAAD hierarchy
    console.log(`## Affinity Diagram\n`);
    const topLevel = Math.max(...affinity.labels.map((l) => l.level)) as 1 | 2 | 3;

    const topLabels = affinity.labels
      .filter((l) => l.level === topLevel)
      .sort((a, b) => a.id.localeCompare(b.id));

    for (const topLabel of topLabels) {
      printLabelTree(topLabel, affinity, notes, 3);
    }

    // Unassigned notes
    const assignedIds = new Set(Object.keys(affinity.assignments));
    const unassigned = notes.filter((n) => !assignedIds.has(n.id));
    if (unassigned.length > 0) {
      console.log(`\n## Unassigned Notes (${unassigned.length})\n`);
      for (const n of unassigned) {
        printNote(n);
      }
    }
  } else {
    // Flat export grouped by source
    for (const noteType of ["observation", "design-idea", "design-question", "data-hole"] as const) {
      const typed = notes.filter((n) => n.noteType === noteType);
      if (typed.length === 0) continue;

      const label = noteType.charAt(0).toUpperCase() + noteType.slice(1).replace("-", " ");
      console.log(`## ${label}s (${typed.length})\n`);
      for (const n of typed) {
        printNote(n);
      }
      console.log("");
    }
  }
}

function printNote(n: WanNote): void {
  const typePrefix = n.noteType !== "observation" ? `[${n.noteType}] ` : "";
  const tags = n.tags.length > 0 ? " " + n.tags.map((t) => `\`#${t}\``).join(" ") : "";
  console.log(`- **${n.id}** [${n.role}] ${typePrefix}${n.content}${tags}`);
}

function printLabelTree(
  label: AffinityLabel,
  affinity: AffinityStore,
  notes: WanNote[],
  headingLevel: number
): void {
  const color = LABEL_COLORS[label.level];
  const prefix = "#".repeat(headingLevel);
  console.log(`${prefix} ${label.text} _(${label.id}, ${color})_\n`);

  // Find child labels
  const children = affinity.labels
    .filter((l) => l.parentId === label.id)
    .sort((a, b) => a.id.localeCompare(b.id));

  if (children.length > 0) {
    for (const child of children) {
      printLabelTree(child, affinity, notes, headingLevel + 1);
    }
  }

  // If L1 label, print assigned notes
  if (label.level === 1) {
    const assignedNoteIds = Object.entries(affinity.assignments)
      .filter(([, labelId]) => labelId === label.id)
      .map(([noteId]) => noteId);

    for (const noteId of assignedNoteIds) {
      const note = notes.find((n) => n.id === noteId);
      if (note) printNote(note);
    }
    console.log("");
  }
}
