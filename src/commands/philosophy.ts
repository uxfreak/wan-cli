export function philosophy(): void {
  console.log(PHILOSOPHY);
}

const PHILOSOPHY = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  WAN PHILOSOPHY — The Art and Discipline of Work Activity Notes
  Based on: The UX Book (Hartson & Pyla, 2012), Chapter 4
  Method origin: KJ Method (Jiro Kawakita, 1960s)
  Adapted from: Contextual Design (Beyer & Holtzblatt, 1998)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

╔══════════════════════════════════════════════════════════════════════════════╗
║  CORE PRINCIPLE                                                            ║
║                                                                            ║
║  "Work activity notes should represent raw data so well that the team      ║
║  never has to go back to the raw data to answer questions, fill in         ║
║  blanks, determine what the real point was, or to sort out context."       ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│  WHAT IS A WORK ACTIVITY NOTE?                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  A work activity note documents a single point about a single concept,     │
│  topic, or issue as synthesized from raw contextual data. Notes are        │
│  stated as simple, succinct declarative points in the user's perspective.  │
│                                                                            │
│  Each note has:                                                            │
│    • Source ID — who was observed/interviewed (S001, S002, ...)             │
│    • Work Role — the role associated with this note                        │
│    • Note Type — observation, design-idea, design-question, or data-hole   │
│    • Content — 1-3 synthesized sentences                                   │
│                                                                            │
│  A note is NOT a verbatim quote. It is NOT a requirement. It is NOT a      │
│  design specification. It is the user's work reality, distilled.           │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  THE 10 SYNTHESIS SKILLS                                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  1. PARAPHRASE AND SYNTHESIZE                                              │
│     Never quote raw data verbatim. Maintain the user's perspective and     │
│     intentions, but abstract clear, concise statements. The user's words   │
│     are verbose and indirect — your job is to distill the essence.         │
│                                                                            │
│     ✗ "Ah, they just, they sign and mark, let me see if I have one"       │
│     ✓ "Faculty members sign and date an exam card to indicate if the      │
│       student's performance was satisfactory or unsatisfactory."           │
│                                                                            │
│  2. MAKE DECLARATIVE STATEMENTS                                            │
│     Never write in Q&A format. If an interviewer's question was confirmed  │
│     by the user, reword it as if it came from the user.                    │
│                                                                            │
│     ✗ "Q: Do you prefer to sit with friends? A: Yes"                      │
│     ✓ "When buying tickets, I look for an option allowing friends to      │
│       sit together."                                                       │
│                                                                            │
│  3. FILTER NOISE AND FLUFF                                                 │
│     Raw data is too verbose. Boil it down to essence. Remove hedging,      │
│     repetition, filler words, tangents.                                    │
│                                                                            │
│     ✗ "I think it should, I think it should go electronically because,    │
│       you know, the campus mail could take a couple of days to reach."     │
│     ✓ "Exam notecards are sent via campus mail but could take days."      │
│                                                                            │
│  4. BE BRIEF: 1-3 SUCCINCT SENTENCES                                      │
│     Embrace breviloquence; eschew grandiloquence.                          │
│     Maximum: 3 sentences. Ideal: 1-2 sentences.                           │
│     If you need more, you have multiple concepts — split them.             │
│                                                                            │
│  5. ONE CONCEPT PER NOTE                                                   │
│     Each note contains just one concept, idea, or fact, with possibly      │
│     one rationale statement. This is the atomic unit rule.                  │
│     During affinity mapping, a note can only go in ONE place.              │
│     Multiple concepts = lost insights.                                     │
│                                                                            │
│     ✗ "I don't ask for printed confirmations because I'm afraid someone   │
│       might use my credit card, and also the printer is often broken,      │
│       plus I prefer email anyway."                                         │
│     ✓ Three separate notes:                                               │
│       "I avoid printed confirmations to protect my credit card number."    │
│       "The ticket kiosk printer is frequently out of order."               │
│       "I prefer receiving ticket confirmations via email."                 │
│                                                                            │
│  6. MAKE EACH NOTE COMPLETE AND SELF-STANDING                              │
│     Notes will be shuffled, sorted, and separated. Each must be            │
│     independently understandable without its neighbors.                    │
│     Imagine someone picking up this single note off the floor —            │
│     would they understand it?                                              │
│                                                                            │
│     ✗ "They use it for that purpose."                                     │
│     ✓ "Event managers use the MUTTS database to track ticket sales."      │
│                                                                            │
│  7. NO DANGLING PRONOUNS                                                   │
│     Never use "this," "it," "they," or "them" unless the referent is      │
│     identified in the same note. Every pronoun must have a clear           │
│     antecedent within the note itself.                                     │
│                                                                            │
│     ✗ "This is difficult during peak hours."                              │
│     ✓ "Getting help from the ticket seller is difficult during peak       │
│       hours."                                                              │
│                                                                            │
│  8. STATE THE WORK ROLE, NOT PRONOUNS                                      │
│     Replace "he" or "she" with the actual work role.                       │
│                                                                            │
│     ✗ "She checks the database first."                                    │
│     ✓ "The ticket seller checks the database for availability first."     │
│     ✓ "As a ticket seller, I check the database first."                   │
│                                                                            │
│  9. ADD DISAMBIGUATING WORDS                                               │
│     When splitting raw data into multiple notes, add context that would    │
│     be lost. Repeat the contextual phrase in each note.                    │
│                                                                            │
│     Raw: "When buying MU basketball tickets, I look at seating vs.         │
│     prices; I sometimes look for friends to sit together."                 │
│     ✓ "When buying MU basketball tickets, I compare seating vs. prices."  │
│     ✓ "When buying MU basketball tickets, I look for friends to sit       │
│       together."                                                           │
│     The context phrase is repeated so each note stands alone.              │
│                                                                            │
│  10. AVOID REPETITION                                                      │
│      Don't duplicate information that belongs elsewhere:                   │
│      • Work role names → flow model                                        │
│      • User demographics → user class definitions                          │
│      • Work activities → work activity notes                               │
│      Each piece of information lives in exactly one place.                 │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  SPECIAL NOTE TYPES                                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  observation (default)                                                     │
│    Standard work activity note. Captures what the user does, thinks,       │
│    feels, or experiences in their work domain.                             │
│                                                                            │
│  design-idea                                                               │
│    A design opportunity observed or suggested by the user.                 │
│    "Consider an option to 'Find best N adjacent seats.'"                   │
│                                                                            │
│  design-question                                                           │
│    A question raised during analysis that needs design exploration.        │
│    "Can we facilitate group collaboration at the kiosk?"                   │
│                                                                            │
│  data-hole                                                                 │
│    Missing information discovered during analysis.                         │
│    "Need to understand how ticket sellers handle group reservations."      │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  QUALITY CHECKLIST                                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Before finalizing each note, verify:                                      │
│                                                                            │
│    □ Tagged — has source ID and work role                                  │
│    □ Synthesized — not a verbatim quote; essence captured                  │
│    □ Declarative — statement format, not Q&A                               │
│    □ Filtered — no noise, filler, or unnecessary verbiage                  │
│    □ Brief — 1-3 sentences maximum                                         │
│    □ Atomic — one concept, one idea, one fact (+ optional rationale)       │
│    □ Self-standing — understandable without any other notes                │
│    □ No dangling pronouns — all referents clear within the note            │
│    □ Work role stated — not "he/she" but the actual role                   │
│    □ Disambiguated — context added where split from larger data            │
│    □ Work domain focus — not requirements or design (unless labeled)       │
│    □ No repetition — info not duplicated from other models                 │
│    □ Specific and precise — avoids vague wording                           │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  THE INDUCTIVE PHILOSOPHY — AFFINITY MAPPING                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  "The technique is inductive in the sense that it is a purely bottom-up    │
│  process within which terms used for category labels within the            │
│  organizing structure come from data themselves and not from a predefined  │
│  taxonomy or pre-established vocabulary."                                  │
│                                                                            │
│  THE PROCESS:                                                              │
│                                                                            │
│  1. Start with individual notes — no categories, no structure              │
│  2. Read notes. Find natural affinities between them.                      │
│  3. Cluster notes that share a common theme (bottom of the wall)           │
│  4. As clusters grow, add temporary topical labels (cognitive offloading)  │
│  5. Let topical labels evolve — do NOT let labels constrain the data       │
│  6. When clusters mature, create L1 (blue) labels: group labels            │
│     Written in user perspective, storytelling mode                         │
│  7. Group L1 labels into L2 (pink) labels: supergroups                    │
│  8. Group L2 labels into L3 (green) labels: top-level themes              │
│                                                                            │
│  THE HIERARCHY:                                                            │
│                                                                            │
│    ◆ L3 (green)  — Top-level theme                                        │
│      ◇ L2 (pink)  — Supergroup                                            │
│        ○ L1 (blue)  — Group label on a cluster of notes                   │
│            S001-01: "The actual note content..."                           │
│            S001-02: "Another note in this group..."                        │
│                                                                            │
│  RULES FOR LABELS:                                                         │
│                                                                            │
│  • Substance entirely derived from the data — never preconceived           │
│  • Written in customer/user perspective                                    │
│  • Written in storytelling mode — the user talking to the team             │
│  • Understandable without reading the notes beneath                        │
│  • Captures the collective meaning of the group                            │
│  • As specific and precise as possible                                     │
│  • Never use "miscellaneous," "general," or "other"                       │
│                                                                            │
│  MINDSET:                                                                  │
│                                                                            │
│  • "Let the data speak" — categories emerge, never imposed                │
│  • "No single correct diagram" — many outcomes can be equally effective    │
│  • "No data ownership" — anyone can move notes, change labels              │
│  • "Clusters are putty" — keep them highly malleable                      │
│  • "Sit on your designer instincts" — don't reject based on feasibility   │
│  • "Do not overwork it" — minimal strokes for crisp, fresh effect         │
│  • Groups should be 4-15 notes; split if larger, reconsider if smaller    │
│  • Duplicate notes from different users show WEIGHT — keep them all       │
│                                                                            │
│  This is emergence: "a characteristic of the process by which the group    │
│  interprets and transforms raw data fragments into rich final              │
│  descriptions." — Cox & Greenberg (2000)                                   │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  ANTI-PATTERNS — MISTAKES TO AVOID                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ✗ Designer/Implementer Bias                                               │
│    Rejecting notes because "we can't build that." Stay in the work         │
│    domain. There may be alternative solutions you haven't considered.      │
│                                                                            │
│  ✗ Premature Technology Decisions                                          │
│    Locking into specific solutions too early. Different scenarios may      │
│    need different approaches.                                              │
│                                                                            │
│  ✗ Verbatim Copying                                                        │
│    Pasting raw transcript without synthesis. Produces verbose, noisy       │
│    notes that require multiple readings.                                   │
│                                                                            │
│  ✗ Multiple Concepts in One Note                                           │
│    During affinity mapping, the note can only go in one place —            │
│    other concepts are lost forever.                                        │
│                                                                            │
│  ✗ Context-Dependent Notes                                                 │
│    Pronouns that only make sense with surrounding text.                    │
│    Notes get separated and become meaningless.                             │
│                                                                            │
│  ✗ Vague Labels                                                            │
│    "Miscellaneous," "general," "other things."                             │
│    Be specific: not "How we validate information" but "How we              │
│    validate intake forms."                                                 │
│                                                                            │
│  ✗ Jumping to Requirements                                                 │
│    "System should..." or "We need a button that..."                        │
│    Stay in work domain perspective. Capture what users DO and              │
│    EXPERIENCE, not what the system should do.                              │
│                                                                            │
│  ✗ Top-Down Categorization                                                 │
│    Imposing categories before reading the data. The whole point is         │
│    that structure EMERGES from the notes themselves.                        │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  SUCCESS CRITERIA                                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  A work activity note succeeds when it is:                                 │
│                                                                            │
│    Self-sufficient — team never returns to raw data for clarity            │
│    Scannable — key point understood at a glance                            │
│    Portable — makes sense when moved to any location                       │
│    Atomic — contains one clear concept                                     │
│    Actionable — provides basis for requirements and design                 │
│    User-centered — maintains user perspective and work domain focus        │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EXTENSIONS — Beyond the UX Book
  Additions that adapt wan from pure UX research into a long-running,
  multi-session project memory + workflow spine.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌──────────────────────────────────────────────────────────────────────────────┐
│  THREE LAYERS — NOTES, AFFINITY, WORK TREE                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Notes are FINDINGS — atomic things you discovered.                        │
│  Affinity is THEMES — what those findings cluster into (inductive).        │
│  The work tree is INTENT — what you set out to do, hierarchically.         │
│                                                                            │
│  The three are orthogonal:                                                 │
│    • A note can be created during any task; tasks don't own notes.         │
│    • A theme emerges from notes regardless of which task surfaced them.    │
│    • A task can span many sessions; sessions can serve many tasks.         │
│                                                                            │
│  At session start: read STATUS + the focus path + open todos               │
│  (or just run \`wan resume\` and get all of it in one blob).                │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  THE WORK TREE — wan task                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  A hierarchical tree of *what we're doing*, across abstraction levels.    │
│  Branches when work spawns sub-efforts. Rejoins via pop or done.           │
│  Every focus change is recorded in an append-only history log.             │
│                                                                            │
│      T001  Formalize Typst as math (active)                                │
│      ├── T002  Build wan-cli for project mgmt (active)  ← focus path       │
│      │   ├── T003  Extend types ✓                                          │
│      │   ├── T004  ↳ wan task hierarchy (active)        ← current leaf     │
│      │   └── T005  ↳ wan resume                                            │
│      └── T006  Recursive descent over typst pipeline                       │
│          ├── T007  L0 spine                                                │
│          └── T008  L1 phases                                               │
│                                                                            │
│  STATUSES                                                                  │
│    ·  pending     not started                                              │
│    ▸  active      currently being worked on (can be a non-leaf)            │
│    ✓  done        completed                                                │
│    ✗  abandoned   explicitly dropped                                       │
│    ⊘  blocked     waiting on something external                            │
│                                                                            │
│  COMMANDS                                                                  │
│    wan task                          show tree + focus path                │
│    wan task add "title" -p T001 -i "intent" --focus                        │
│    wan task focus T004               record focus shift                    │
│    wan task pop                      back to parent                        │
│    wan task done T003                close + auto-pop if focused            │
│    wan task history --n 20           recent focus events                   │
│                                                                            │
│  The work tree is the answer to: "where am I, and how did I get here?"    │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  PROVENANCE — wan ref                                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Every note can carry first-class refs back to source material:            │
│    wan ref add S001-03 typst/crates/typst-syntax/src/parser.rs:142-180     │
│  This is stronger than tags — refs are structured (path + lines + note),   │
│  enabling re-verification of any claim against the substrate it came from. │
│                                                                            │
│  Use --detail to point a note at a fuller doc (the math, the diagram,      │
│  the code listing) when 1-3 sentences aren't enough.                       │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  EDGES — wan link                                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Notes form a graph, not a flat list. Common edge kinds:                  │
│    calls      A invokes B                                                  │
│    produces   A constructs / yields B                                      │
│    requires   A depends on B (precondition)                                │
│    refines    A is a more detailed version of B                            │
│    relates    generic association                                          │
│                                                                            │
│  The graph is what makes a function-by-function pipeline analysis          │
│  reconstructable — without it, you have notes but not the call structure.  │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  TIME — wan session                                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  A session is a wall-clock working window with an explicit intent at       │
│  the start and a summary at the end. On end, wan auto-attaches the notes   │
│  and labels created during the session window — so future-you can ask      │
│  "what happened on Tuesday?" and get a real answer.                        │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  NARRATIVE — wan status                                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  status.md is the freeform "where I am right now" doc. Stat is structured, │
│  this is prose. Read it first thing every session.                         │
│                                                                            │
│    wan status set "..."     overwrite                                      │
│    wan status append "..."  append a timestamped line                      │
│    wan status edit          open in $EDITOR                                │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  BOOTSTRAP — wan resume                                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Single command, single blob, drop-in for AI session startup or for a     │
│  collaborator coming back after a break. Includes:                         │
│    • status.md (narrative state)                                           │
│    • current focus path (root → leaf)                                      │
│    • open work-tree branches                                               │
│    • open session (if any) and last closed                                 │
│    • last 8 history events                                                 │
│    • top open todos (data-holes + design-questions, oldest first)          │
│    • L3 themes from affinity                                               │
│    • store counts                                                          │
│                                                                            │
│  Run this first thing in every session.                                    │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
