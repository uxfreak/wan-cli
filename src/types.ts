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

export type NoteType = (typeof NOTE_TYPES)[number];
export type LabelLevel = (typeof LABEL_LEVELS)[number];

export interface WanNote {
  id: string;            // S001-03
  sourceId: string;      // S001
  role: string;          // Work role: "Founder", "Designer", etc.
  noteType: NoteType;    // Special note type label
  content: string;       // 1-3 sentence synthesized note
  tags: string[];        // Free-form tags for quick filtering
  bin?: string;          // Optional rough data bin (temporary, pre-WAAD sorting)
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
}
