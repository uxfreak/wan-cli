// Special note types (The UX Book, Ch.4 §Special Note Types)
export const NOTE_TYPES = [
  "observation",       // Standard work activity note
  "design-idea",       // [Design idea] — user-suggested or observed design opportunity
  "design-question",   // [Design question] — design question raised during analysis
  "data-hole",         // [Data hole] — missing information discovered
] as const;

// Affinity label levels (The UX Book, Ch.4 §Building the WAAD)
export const LABEL_LEVELS = [1, 2, 3] as const;
export const LABEL_COLORS: Record<number, string> = {
  1: "blue",   // Group labels — direct labels on clusters of notes
  2: "pink",   // Supergroup labels — groups of groups
  3: "green",  // Top-level grouping of supergroups
};

// Note-to-note link kinds (extension: dataflow / call graph for technical analysis)
export const LINK_KINDS = [
  "calls",     // A invokes B
  "produces",  // A constructs / yields B
  "requires",  // A depends on B (precondition)
  "refines",   // A is a more detailed version of B
  "relates",   // generic association
] as const;

export type NoteType = (typeof NOTE_TYPES)[number];
export type LabelLevel = (typeof LABEL_LEVELS)[number];
export type LinkKind = (typeof LINK_KINDS)[number];

// First-class citation back to the substrate being analyzed
// (e.g. typst/crates/typst-syntax/src/parser.rs:142-180)
export interface SourceRef {
  path: string;        // file path, project-relative or absolute
  lines?: string;      // "142", "142-180", or omitted for whole-file
  note?: string;       // optional one-line context
}

// Edge between two notes — note A relates to note B in some way
export interface NoteLink {
  to: string;          // target note ID
  kind: LinkKind;
  note?: string;       // optional context for why
}

export interface WanNote {
  id: string;            // S001-03
  sourceId: string;      // S001
  role: string;          // Work role: "Founder", "Designer", etc.
  noteType: NoteType;    // Special note type label
  content: string;       // 1-3 sentence synthesized note
  tags: string[];        // Free-form tags for quick filtering
  bin?: string;          // Optional rough data bin (temporary, pre-WAAD sorting)
  detail?: string;       // Optional path to a fuller doc (math, code, diagrams)
  refs?: SourceRef[];    // First-class provenance back to source material
  links?: NoteLink[];    // Edges to other notes (call graph, dataflow, etc.)
  createdAt: string;     // ISO 8601
  updatedAt: string | null;
}

export interface AffinityLabel {
  id: string;              // "L1-01", "L2-03", "L3-01"
  level: LabelLevel;       // 1 = blue, 2 = pink, 3 = green
  text: string;            // Written in user perspective, storytelling mode
  parentId: string | null; // Parent label ID (L1→L2, L2→L3)
  createdAt: string;
  updatedAt: string | null;
}

export interface AffinityStore {
  labels: AffinityLabel[];
  assignments: Record<string, string>; // noteId → L1 label ID
}

// ── Work tree ──────────────────────────────────────────────
// A hierarchical breakdown of what we're working on, across abstraction levels.
// Root = top mission; children = sub-efforts; leaves = the thing in your hands right now.
// Orthogonal to notes (findings) and sessions (time windows) — this is the *work spine*.

export const TASK_STATUSES = [
  "pending",     // not started
  "active",      // currently being worked on (can be a non-leaf)
  "done",        // completed
  "abandoned",   // explicitly dropped
  "blocked",     // waiting on something external
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface TaskNode {
  id: string;              // "T001", "T002", ...
  title: string;           // short, imperative ("Implement wan resume")
  intent?: string;         // longer-form why / acceptance criteria
  status: TaskStatus;
  parentId: string | null; // null = root-level
  createdAt: string;
  updatedAt: string | null;
  completedAt?: string;
}

// Append-only audit log so we can replay the narrative of what was done when,
// including branches and returns from sub-efforts.
export const FOCUS_ACTIONS = [
  "created",
  "focused",
  "blurred",
  "completed",
  "abandoned",
  "edited",
  "removed",
] as const;
export type FocusAction = (typeof FOCUS_ACTIONS)[number];

export interface FocusEvent {
  at: string;              // ISO 8601
  taskId: string;          // task involved
  action: FocusAction;
  fromTaskId?: string;     // for focused: previously-focused task
  detail?: string;         // freeform context
}

export interface TaskStore {
  tasks: TaskNode[];
  focusedId: string | null;        // current leaf of attention (or null = none)
  history: FocusEvent[];           // append-only timeline
}

// A single working session — opened with `wan session start`, closed with `wan session end`.
// Lets future-you / future-AI reconstruct what happened when.
export interface SessionEntry {
  id: string;              // "SES-001"
  intent: string;          // what this session set out to do
  startedAt: string;       // ISO 8601
  endedAt: string | null;  // null while session is open
  summary?: string;        // written at session end
  // Auto-tracked deltas (populated at end based on timestamps)
  notesAdded: string[];    // note IDs created during the session window
  labelsAdded: string[];   // label IDs created during the session window
  sourcesAdded: string[];  // source IDs created during the session window
}

export interface SessionStore {
  sessions: SessionEntry[];
  openSessionId: string | null; // currently active session, if any
}

export interface WanConfig {
  name: string;
  createdAt: string;
  version: number;
}

export interface NotesStore {
  notes: WanNote[];
}

export interface BulkNoteInput {
  role: string;
  noteType?: string;
  content: string;
  tags?: string[];
  bin?: string;
  detail?: string;
  refs?: SourceRef[];
}
