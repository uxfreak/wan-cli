import { ensureInitialized, readNotes, readAffinity, listSourceIds } from "../store";
import { NOTE_TYPES, LABEL_COLORS } from "../types";
import { padRight } from "../utils";

export async function stats(): Promise<void> {
  ensureInitialized();

  const [store, affinity] = await Promise.all([readNotes(), readAffinity()]);
  const { notes } = store;
  const sources = listSourceIds();

  console.log(`\nTotal: ${notes.length} note(s) across ${sources.length} source(s)\n`);

  if (notes.length === 0) return;

  // By note type
  const maxCount = notes.length;
  const barScale = maxCount > 0 ? 30 / maxCount : 0;

  console.log("By Note Type:");
  const byType = new Map<string, number>();
  for (const nt of NOTE_TYPES) byType.set(nt, 0);
  for (const n of notes) byType.set(n.noteType, (byType.get(n.noteType) || 0) + 1);
  for (const [nt, count] of [...byType.entries()].sort((a, b) => b[1] - a[1])) {
    if (count > 0) {
      const bar = "█".repeat(Math.round(count * barScale));
      console.log(`  ${padRight(nt, 20)} ${padRight(String(count), 4)} ${bar}`);
    }
  }

  // By source
  console.log("\nBy Source:");
  const bySrc = new Map<string, number>();
  for (const n of notes) bySrc.set(n.sourceId, (bySrc.get(n.sourceId) || 0) + 1);
  for (const [src, count] of [...bySrc.entries()].sort()) {
    console.log(`  ${padRight(src, 8)} ${count}`);
  }

  // By role
  console.log("\nBy Role:");
  const byRole = new Map<string, number>();
  for (const n of notes) byRole.set(n.role, (byRole.get(n.role) || 0) + 1);
  for (const [role, count] of [...byRole.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${padRight(role, 20)} ${count}`);
  }

  // Bins (if any notes have bins)
  const notesWithBins = notes.filter((n) => n.bin);
  if (notesWithBins.length > 0) {
    console.log("\nBy Bin (temporary sorting):");
    const byBin = new Map<string, number>();
    for (const n of notesWithBins) byBin.set(n.bin!, (byBin.get(n.bin!) || 0) + 1);
    for (const [bin, count] of [...byBin.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${padRight(bin, 20)} ${count}`);
    }
    const unbinned = notes.length - notesWithBins.length;
    if (unbinned > 0) console.log(`  ${padRight("(unbinned)", 20)} ${unbinned}`);
  }

  // Top tags
  const tagFreq = new Map<string, number>();
  for (const n of notes) {
    for (const tag of n.tags) {
      tagFreq.set(tag, (tagFreq.get(tag) || 0) + 1);
    }
  }
  if (tagFreq.size > 0) {
    console.log("\nTop Tags:");
    const sorted = [...tagFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    for (const [tag, count] of sorted) {
      console.log(`  ${padRight(tag, 20)} ${count}`);
    }
  }

  // Affinity status
  const totalAssigned = Object.keys(affinity.assignments).length;
  const totalLabels = affinity.labels.length;
  console.log("\nAffinity Diagram:");
  if (totalLabels === 0) {
    console.log("  No labels yet. Run `wan affinity label add` to start bottom-up grouping.");
  } else {
    for (const level of [1, 2, 3] as const) {
      const count = affinity.labels.filter((l) => l.level === level).length;
      if (count > 0) {
        console.log(`  L${level} (${LABEL_COLORS[level]}) labels:  ${count}`);
      }
    }
    console.log(`  Notes assigned:        ${totalAssigned}/${notes.length}`);
    const unassigned = notes.length - totalAssigned;
    if (unassigned > 0) console.log(`  Notes unassigned:      ${unassigned}`);
  }

  console.log("");
}
