# wan — Work Activity Notes CLI

A CLI tool for capturing, synthesizing, and organizing Work Activity Notes (WANs) using the Contextual Design methodology from The UX Book (Hartson & Pyla, 2012).

Built with Bun. Zero dependencies. Compiles to a standalone binary.

## Install

```bash
cd wan-cli
bun install        # install bun-types (dev only)
bun run build      # compile to ./wan binary
```

Or run directly during development:

```bash
bun run src/index.ts <command>
```

## Data Storage

All data lives in a `.wan/` directory (created by `wan init` in your working directory):

```
.wan/
  config.json          # project metadata
  sources/             # raw thought dumps (S001.md, S002.md, ...)
  notes.json           # synthesized work activity notes (with refs, links, detail)
  affinity.json        # WAAD labels and note-to-label assignments
  tasks.json           # hierarchical work tree + focus stack + history log
  sessions.json        # working sessions (intent + summary + auto-attached deltas)
  status.md            # narrative "where I am right now" doc
```

## Concepts

### Work Activity Note

A single point about a single concept, synthesized from raw data. Each note has:

- **Source ID** — which raw dump it came from (S001, S002, ...)
- **Work Role** — the role associated with the note ("Founder", "Designer", etc.)
- **Note Type** — `observation` (default), `design-idea`, `design-question`, or `data-hole`
- **Content** — 1-3 concise, self-standing sentences in user perspective
- **Tags** — optional free-form tags for filtering
- **Bin** — optional rough data bin for pre-WAAD temporary sorting

### Affinity Diagram (WAAD)

Bottom-up, inductive grouping — categories emerge from the data, never imposed top-down.

Three levels of labels (colors are convention from the book):

| Level | Color | What it is |
|-------|-------|-----------|
| L1 | Blue | Group label — directly labels a cluster of notes |
| L2 | Pink | Supergroup — groups of L1 labels |
| L3 | Green | Top-level theme — groups of L2 labels |

Labels are written in **user perspective, storytelling mode**. Their substance comes entirely from the data.

## Commands

### Project

```bash
wan init                          # Initialize .wan/ in current directory
wan philosophy                    # Show full methodology reference
wan stats                         # Note counts, types, affinity status
wan export [--format md|json|csv] # Export notes (stdout)
```

### Sources

```bash
wan source add <file>             # Add a raw thought dump from file
wan source add -                  # Add from stdin
echo "my thoughts" | wan source add -
```

### Notes

```bash
# Add a note (--type defaults to "observation")
wan note add -s S001 -r "Founder" "The note content here."
wan note add -s S001 -r "Founder" -n design-idea "A design idea."
wan note add -s S001 -r "Founder" -n data-hole -t "pricing,market" "Missing data."
wan note add -s S001 -r "Founder" -b "emotional" "Rough bin sorting."

# Bulk import from JSON
wan note bulk -s S001 -f notes.json
# JSON format: [{ "role": "...", "content": "...", "noteType?": "...", "tags?": [], "bin?": "..." }]

# List and filter
wan note list                     # Table view
wan note list --full              # Full content view
wan note list --type design-idea  # Filter by type
wan note list --tag pricing       # Filter by tag
wan note list --source S001       # Filter by source
wan note list --role founder      # Filter by role
wan note list --bin emotional     # Filter by bin

# Edit and remove
wan note edit S001-03 --content "New text"
wan note edit S001-03 --type design-question --tags "new,tags"
wan note rm S001-03               # Remove one
wan note rm S001-03 S001-04       # Remove multiple
```

### Affinity Diagram

```bash
# Create labels (inductive — let themes emerge from the data)
wan affinity label add -l 1 "I spend most of my time on uncreative tasks"
wan affinity label add -l 2 "Designers feel trapped by mechanical work"
wan affinity label add -l 3 "The creative potential of design teams is wasted"

# Assign notes to L1 (blue) labels
wan affinity assign S001-01 L1-01
wan affinity assign S001-03 L1-01
wan affinity unassign S001-01

# Build hierarchy (nest labels under higher levels)
wan affinity group L1-01 L2-01    # Blue under pink
wan affinity group L2-01 L3-01    # Pink under green
wan affinity ungroup L1-01        # Remove from parent

# Inspect
wan affinity tree                 # Full WAAD hierarchy
wan affinity unassigned           # Notes not yet grouped
wan affinity label list           # All labels
wan affinity label list -l 1      # Only blue labels

# Edit/remove labels
wan affinity label edit L1-01 "Updated label text"
wan affinity label rm L1-01       # Also unassigns notes and unparents children
```

## Workflow

1. **Thought dump** → save as source (`wan source add`)
2. **Synthesize** WANs from the dump (human process, not algorithmic)
3. **Add notes** via `wan note add` or `wan note bulk`
4. **Review** with `wan note list --full` and `wan stats`
5. **Affinity map** — create L1 labels, assign notes, let themes emerge
6. **Build hierarchy** — group L1→L2→L3 as patterns become clear
7. **Export** with `wan export` for downstream use

## Extensions — Long-Running Project Memory

For multi-session work where you need to remember *what you were doing* and
*where you left off*, wan adds three orthogonal layers on top of notes/affinity:

- **Work tree** (`wan task`) — hierarchical breakdown of *what we're doing*
  with focus stack and append-only history. Branches when work spawns
  sub-efforts; rejoins via `pop` or `done`.
- **Sessions** (`wan session`) — wall-clock working windows with intent at
  start, summary at end. On end, auto-attaches notes/labels created during
  the window.
- **Status** (`wan status`) — freeform narrative "where I am" doc.
- **Resume** (`wan resume`) — single bootstrap blob designed for AI session
  startup. Includes status + current focus path + open branches + open
  session + recent history + top open todos + L3 themes + counts.

Plus enrichments to notes themselves:

- **`--detail PATH`** — point a note at a fuller doc (the math, the diagram).
- **`--ref FILE:LINES`** — first-class provenance back to source material.
- **`wan ref add/list/rm`** — manage refs after creation.
- **`wan link`** — note-to-note edges (`calls`, `produces`, `requires`,
  `refines`, `relates`) for reconstructing a call/dataflow graph.
- **`wan todo`** — surfaces unresolved data-holes & design-questions,
  oldest first.

### Recommended session protocol

```bash
wan resume                              # ingest state at session start
wan session start "what I'm tackling"   # open the time window
# ... work: notes, refs, task focus, edits
wan status append "key observation"     # or `wan status set ...`
wan session end "what got done"         # close + auto-attach
git commit -am "session: ..."           # version everything
```

For workflow patterns, decision rules ("when to add a note vs a task"), and
canonical sequences, run `wan guide`. For methodology theory, `wan philosophy`.
The flat command reference is `wan --help` (now with a workflow header).

### Work tree commands

```bash
wan task                                # tree + current focus path
wan task add "Build feature X" -i "rationale" --focus
wan task add "Sub-task" -p T002 --focus
wan task focus T004                     # records focus shift
wan task pop                            # back to parent
wan task done T003                      # close (auto-pops focus if focused)
wan task abandon T009                   # explicit drop
wan task block T010 "waiting on API"
wan task history --n 20                 # chronological focus events
wan task show T002                      # node details + recent events
wan task tree --all                     # include done/abandoned
```

## References

- `references/CHP003.html` — The UX Book, Ch.3: Contextual Inquiry
- `references/CHP004.html` — The UX Book, Ch.4: Contextual Analysis
- `references/CHP005.html` — The UX Book, Ch.5: Extracting Interaction Design Requirements
- `references/WORK_ACTIVITY_NOTES_GUIDE.md` — Work Activity Notes Synthesis Guide

## Build

```bash
bun run build    # → ./wan (standalone binary, ~45MB)
```

The binary can be copied anywhere and run without Bun installed.
