import {
  NOTE_TYPES,
  LABEL_LEVELS,
  LINK_KINDS,
  TASK_STATUSES,
  type NoteType,
  type LabelLevel,
  type LinkKind,
  type TaskStatus,
  type WanNote,
  type AffinityLabel,
  type TaskNode,
  type SessionEntry,
  type SourceRef,
} from "./types";

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

// ── New: link kinds, source refs, task IDs, session IDs ────

export function validateLinkKind(input: string): LinkKind {
  const normalized = input.toLowerCase().trim();
  if (LINK_KINDS.includes(normalized as LinkKind)) {
    return normalized as LinkKind;
  }
  throw new Error(`Invalid link kind "${input}". Valid: ${LINK_KINDS.join(", ")}`);
}

export function validateTaskStatus(input: string): TaskStatus {
  const normalized = input.toLowerCase().trim();
  if (TASK_STATUSES.includes(normalized as TaskStatus)) {
    return normalized as TaskStatus;
  }
  throw new Error(`Invalid task status "${input}". Valid: ${TASK_STATUSES.join(", ")}`);
}

export function validateTaskId(id: string): void {
  if (!/^T\d{3,}$/.test(id)) {
    throw new Error(`Invalid task ID "${id}". Expected format: T001, T002, ...`);
  }
}

export function nextTaskId(tasks: TaskNode[]): string {
  if (tasks.length === 0) return "T001";
  const max = Math.max(...tasks.map((t) => parseInt(t.id.slice(1), 10)));
  return `T${String(max + 1).padStart(3, "0")}`;
}

export function nextSessionId(sessions: SessionEntry[]): string {
  if (sessions.length === 0) return "SES-001";
  const max = Math.max(...sessions.map((s) => parseInt(s.id.slice(4), 10)));
  return `SES-${String(max + 1).padStart(3, "0")}`;
}

// "path/to/file.rs:142-180" or "path/to/file.rs:142" or "path/to/file.rs"
export function parseSourceRef(raw: string, note?: string): SourceRef {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Source ref cannot be empty");
  const lastColon = trimmed.lastIndexOf(":");
  if (lastColon <= 0) {
    return note ? { path: trimmed, note } : { path: trimmed };
  }
  const after = trimmed.slice(lastColon + 1);
  // accept "142", "142-180", "142,150,160"
  if (/^\d+(-\d+)?(,\d+(-\d+)?)*$/.test(after)) {
    const ref: SourceRef = { path: trimmed.slice(0, lastColon), lines: after };
    if (note) ref.note = note;
    return ref;
  }
  return note ? { path: trimmed, note } : { path: trimmed };
}

export function formatSourceRef(ref: SourceRef): string {
  const base = ref.lines ? `${ref.path}:${ref.lines}` : ref.path;
  return ref.note ? `${base} — ${ref.note}` : base;
}

// Relative-time helper for human-readable history/log views
export function ago(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.floor((now - then) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}
