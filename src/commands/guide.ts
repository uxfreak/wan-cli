// `wan guide` — workflow-focused runbook.
// Sits between `wan --help` (flat reference) and `wan philosophy` (deep theory).
// If you're an AI/human picking up the tool fresh, read this once.

export function guide(): void {
  console.log(GUIDE);
}

const GUIDE = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  WAN GUIDE — How To Actually Use This Tool
  (For the deeper theory: \`wan philosophy\`. For the flat reference: \`wan --help\`.)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌──────────────────────────────────────────────────────────────────────────────┐
│  THE MENTAL MODEL — Three orthogonal layers                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  NOTES        atomic findings — what you DISCOVERED                        │
│               (1-3 sentences, typed: observation / design-idea /           │
│                design-question / data-hole)                                 │
│                                                                            │
│  AFFINITY     emergent themes — what those findings CLUSTER into          │
│               (L1 group → L2 supergroup → L3 top theme,                    │
│                strictly inductive, never imposed)                          │
│                                                                            │
│  WORK TREE    hierarchical intent — what you're DOING                      │
│               (root mission → sub-efforts → leaves;                        │
│                with focus stack and append-only history log)               │
│                                                                            │
│  SESSIONS     wall-clock work windows — WHEN and WHAT during a sitting    │
│  STATUS       prose narrative — WHERE you are right now                    │
│                                                                            │
│  These do NOT nest. A note can come from any task in any session;          │
│  themes emerge from notes regardless of which task surfaced them.          │
│  Tasks and sessions are about workflow; notes and affinity are about      │
│  knowledge.                                                                │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  SESSION PROTOCOL — Run this every time                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─ AT START ────────────────────────────────────────────────────┐         │
│  │  wan resume                          # ingest state           │         │
│  │  wan session start "what I'm        # open the time window    │         │
│  │                    tackling today"                             │         │
│  └────────────────────────────────────────────────────────────────┘         │
│                                                                            │
│  ┌─ DURING WORK ─────────────────────────────────────────────────┐         │
│  │  wan task focus T00X                # set the working leaf    │         │
│  │  wan source add file.md             # raw thought dump        │         │
│  │  wan note add -s S001 -r ROLE \\     # atomic finding          │         │
│  │    --ref FILE:LINES "..."                                     │         │
│  │  wan task add "..." -p T00X --focus # spawn sub-effort        │         │
│  │  wan task done T00Y                 # close + auto-pop focus  │         │
│  │  wan status append "key insight"    # narrative breadcrumb    │         │
│  └────────────────────────────────────────────────────────────────┘         │
│                                                                            │
│  ┌─ AT END ──────────────────────────────────────────────────────┐         │
│  │  wan status set "..."               # if state changed        │         │
│  │  wan session end "what got done"    # auto-attach deltas      │         │
│  │  git commit -am "session: ..."      # version everything      │         │
│  └────────────────────────────────────────────────────────────────┘         │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  WHEN TO USE WHAT — A decision cheat sheet                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  You discovered something                          → wan note add          │
│  You committed to do something                     → wan task add          │
│  You shifted attention to a different sub-effort   → wan task focus        │
│  Something has source material backing it          → --ref FILE:LINES      │
│  The note's content is bigger than 3 sentences     → --detail PATH         │
│  Two notes are causally / structurally related     → wan link add          │
│  A finding doesn't have an answer yet              → -n data-hole          │
│  An open question needs design exploration         → -n design-question    │
│  A novel approach occurred to you                  → -n design-idea        │
│  Themes are starting to repeat across notes        → wan affinity label    │
│  Need narrative state nobody else can see in JSON  → wan status            │
│  Coming back after a break / starting a session    → wan resume            │
│  Want to see what's still open                     → wan todo              │
│  Want to see what we've done so far                → wan task history      │
│  Want to see the call-graph between findings       → wan link graph        │
│  Note content has special chars (math, code)       → wan note add -F PATH  │
│  Want to anchor a note to a task explicitly        → wan task attach       │
│  Want notes that back a task                       → wan task notes <id>   │
│  Want a Mermaid/DOT diagram of the link graph      → wan link graph -f …   │
│  About to commit a wan-cli change                  → wan doctor            │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  CANONICAL PATTERNS                                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  PATTERN 1 — Starting a brand-new project                                  │
│  ────────────────────────────────────────────                              │
│    cd /path/to/workspace                                                   │
│    wan init                                                                │
│    wan task add "<top mission>" -i "<why this matters>"                    │
│    wan task focus T001                                                     │
│    wan status set "Just initialized. About to <first move>."              │
│    wan session start "scaffold the project"                                │
│                                                                            │
│  PATTERN 2 — Resuming after a break (you OR an AI)                         │
│  ─────────────────────────────────────────────                             │
│    wan resume                       # READ THIS FIRST                      │
│    # decide: pick up where focus is, OR re-focus elsewhere                 │
│    wan session start "<intent>"                                            │
│                                                                            │
│  PATTERN 3 — Drilling into a sub-problem (branching)                       │
│  ────────────────────────────────────────────────                          │
│    wan task add "Investigate X" -p <current-task> --focus                  │
│    # ... do the work, add notes, refs ...                                  │
│    wan task done <new-task>          # auto-pops focus to parent           │
│                                                                            │
│  PATTERN 4 — Function-by-function code analysis                            │
│  ─────────────────────────────────────────────                             │
│    wan source add explore-session.md                                       │
│    wan note add -s S001 -r Formalizer \\                                    │
│      --ref crates/foo/src/bar.rs:42-89 \\                                   │
│      --detail formalization/parse/tokenize.md \\                           │
│      --task T011 \\                                                         │
│      -F /tmp/note-content.md            # for math chars: avoid shell      │
│    wan link add S001-01 S001-02 --kind calls "tokenize calls advance"     │
│    wan task attach S001-01 T011 T012    # one note can back many tasks    │
│    wan task notes T011                  # reverse lookup                  │
│    wan link graph -f mermaid > graph.md # paste into a doc                │
│                                                                            │
│  PATTERN 5 — Surfacing themes (when 30+ notes exist)                       │
│  ──────────────────────────────────────────────────                        │
│    wan note list --full                       # re-read everything         │
│    wan affinity label add -l 1 "<emergent theme in user voice>"           │
│    wan affinity assign S001-03 L1-01                                       │
│    # repeat; when L1 labels themselves cluster, add L2; same for L3        │
│    wan affinity tree                                                       │
│                                                                            │
│  PATTERN 6 — When you find a question you can't yet answer                 │
│  ────────────────────────────────────────────────────────                  │
│    wan note add -s S001 -r Formalizer -n data-hole \\                      │
│      "Need to determine how the layout engine handles overflow."          │
│    # comes back via \`wan todo\` and \`wan resume\`                          │
│                                                                            │
│  PATTERN 7 — When you hit a blocker you can't unblock yourself             │
│  ───────────────────────────────────────────────────────────              │
│    wan task block T009 "waiting for clarification on schema"               │
│    wan task pop                       # focus moves to parent              │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  ANTI-PATTERNS — Things to NOT do                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ✗ Skipping \`wan resume\` at session start                                  │
│    You'll re-derive context that already exists. Read first.              │
│                                                                            │
│  ✗ Adding tasks for every tiny step                                        │
│    Tasks are abstraction-level commitments, not micro-todos.              │
│    A leaf task should represent something a session could close.          │
│                                                                            │
│  ✗ Stuffing multiple findings into one note                                │
│    During affinity, a note can only land in one cluster — other           │
│    findings are lost. Split them.                                          │
│                                                                            │
│  ✗ Letting status.md grow unbounded                                        │
│    Use \`wan status set\` to overwrite when state has fundamentally shifted.│
│    Append for breadcrumbs; set for replacement.                           │
│                                                                            │
│  ✗ Pre-imposing affinity labels before notes exist                         │
│    Labels emerge from clustered notes, never the other way.               │
│                                                                            │
│  ✗ Closing a session without a summary                                     │
│    Future-you needs to know what got done. One sentence is enough.        │
│                                                                            │
│  ✗ Forgetting to git-commit between sessions                               │
│    \`.wan/\` is JSON. Commit it. That's how you get history-of-history.    │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  THE MINIMAL VIABLE WORKFLOW                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  If you remember nothing else:                                             │
│                                                                            │
│    1.  wan resume                       (start of session)                 │
│    2.  wan session start "..."                                             │
│    3.  wan task focus <id>             (or add + focus)                    │
│    4.  wan note add -s S00X -r ROLE "..."  (as you discover things)       │
│    5.  wan session end "..."           (end of session)                    │
│    6.  git commit -am "..."                                                │
│                                                                            │
│  Everything else is enrichment. Don't let the surface area scare you;     │
│  the core loop is six commands.                                            │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Next: \`wan philosophy\` for the methodology behind notes & affinity.
        \`wan --help\` for the full command reference.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
