import { NOTE_TYPES, LABEL_LEVELS, type NoteType, type LabelLevel, type WanNote, type AffinityLabel } from "./types";

export function validateNoteType(input: string): NoteType {
  const normalized = input.toLowerCase().trim();
  if (NOTE_TYPES.includes(normalized as NoteType)) {
    return normalized as NoteType;
  }
  throw new Error(
    `Invalid note type "${input}". Valid: ${NOTE_TYPES.join(", ")}`
  );
}

export function validateLabelLevel(input: string | number): LabelLevel {
  const num = typeof input === "string" ? parseInt(input, 10) : input;
  if (LABEL_LEVELS.includes(num as LabelLevel)) {
    return num as LabelLevel;
  }
  throw new Error(`Invalid label level "${input}". Valid: 1 (blue), 2 (pink), 3 (green)`);
}

export function validateSourceId(id: string): void {
  if (!/^S\d{3}$/.test(id)) {
    throw new Error(`Invalid source ID "${id}". Expected format: S001, S002, etc.`);
  }
}

export function validateNoteId(id: string): void {
  if (!/^S\d{3}-\d+$/.test(id)) {
    throw new Error(`Invalid note ID "${id}". Expected format: S001-01, S001-02, etc.`);
  }
}

export function validateNotEmpty(value: string, fieldName: string): void {
  if (!value || !value.trim()) {
    throw new Error(`${fieldName} cannot be empty.`);
  }
}

export function nextNoteSeq(notes: WanNote[], sourceId: string): number {
  const sourceNotes = notes.filter((n) => n.sourceId === sourceId);
  if (sourceNotes.length === 0) return 1;
  const maxSeq = Math.max(
    ...sourceNotes.map((n) => {
      const parts = n.id.split("-");
      return parseInt(parts[1], 10);
    })
  );
  return maxSeq + 1;
}

export function nextLabelSeq(labels: AffinityLabel[], level: LabelLevel): number {
  const levelLabels = labels.filter((l) => l.level === level);
  if (levelLabels.length === 0) return 1;
  const maxSeq = Math.max(
    ...levelLabels.map((l) => {
      const parts = l.id.split("-");
      return parseInt(parts[1], 10);
    })
  );
  return maxSeq + 1;
}

export function formatNoteId(sourceId: string, seq: number): string {
  return `${sourceId}-${String(seq).padStart(2, "0")}`;
}

export function formatLabelId(level: LabelLevel, seq: number): string {
  return `L${level}-${String(seq).padStart(2, "0")}`;
}

export function parseNoteId(id: string): { sourceId: string; seq: number } {
  const match = id.match(/^(S\d{3})-(\d+)$/);
  if (!match) throw new Error(`Cannot parse note ID: ${id}`);
  return { sourceId: match[1], seq: parseInt(match[2], 10) };
}

export function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len - 1) + "…";
}

export function padRight(str: string, len: number): string {
  return str + " ".repeat(Math.max(0, len - str.length));
}
