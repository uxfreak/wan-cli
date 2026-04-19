import { init } from "./commands/init";
import { sourceAdd } from "./commands/source";
import { noteAdd } from "./commands/note-add";
import { noteBulk } from "./commands/note-bulk";
import { noteList } from "./commands/note-list";
import { noteEdit } from "./commands/note-edit";
import { noteRm } from "./commands/note-rm";
import { stats } from "./commands/stats";
import { exportNotes } from "./commands/export";
import { affinity } from "./commands/affinity";
import { philosophy } from "./commands/philosophy";
import { render } from "./commands/render";
import { ref } from "./commands/ref";
import { status } from "./commands/status";
import { session } from "./commands/session";
import { link } from "./commands/link";
import { todo } from "./commands/todo";
import { task } from "./commands/task";
import { resume } from "./commands/resume";
import { guide } from "./commands/guide";

const HELP = `
wan — Work Activity Notes CLI

Usage: wan <command> [options]

WORKFLOW (the six-command core loop)
  1. wan resume                       — at session start, ingest state
  2. wan session start "intent"       — open the time window
  3. wan task focus <id>              — set the working leaf  (or task add + --focus)
  4. wan note add -s S0X -r ROLE "…"  — as you discover things  (--ref, --detail)
  5. wan session end "summary"        — close + auto-attach deltas
  6. git commit -am "…"               — version everything

THREE LAYERS
  notes      = atomic findings (1-3 sentences, typed)
  affinity   = emergent themes (L1→L2→L3, strictly inductive)
  task tree  = hierarchical intent with focus stack and history log

For workflow patterns and decision rules:  wan guide
For methodology theory:                    wan philosophy

Commands:
  init                          Initialize .wan/ in current directory
  resume                        Bootstrap blob: status + focus + history + open todos
  source add <file|->           Add a raw thought dump as source

  note add -s -r [-n] [-d --ref] "text"
                                Add a synthesized note. -d=detail path,
                                --ref FILE:LINES (repeatable) for provenance
  note bulk -s -f <file>        Bulk import notes from JSON
  note list [--type] [--tag] [--source] [--role] [--bin] [--full]
  note edit <id> [--content] [--type] [--tags] [--role] [--bin]
                                [--detail PATH] [--add-ref ...] [--rm-ref N] [--clear-refs]
  note rm <id> [<id2> ...]      Remove note(s)
  stats                         Show note statistics
  export [--format md|json|csv] Export notes

  affinity label add -l <1|2|3> "text"   Create an affinity label
  affinity label edit <id> "text"        Edit a label
  affinity label rm <id>                 Remove a label
  affinity label list [-l <1|2|3>]       List labels
  affinity assign <noteId> <labelId>     Assign note to L1 label
  affinity unassign <noteId>             Remove note from group
  affinity group <childId> <parentId>    Nest label under higher level
  affinity ungroup <labelId>             Remove from parent
  affinity tree                          Show full WAAD hierarchy
  affinity unassigned                    Show ungrouped notes

  task                          Show full work tree + current path
  task add "title" [-p PARENT] [-i intent] [--focus]
  task tree [<rootId>] [--all]  Print tree (hides done/abandoned by default)
  task show <id>                Node details + recent events
  task edit <id> [--title|--intent|--status|--parent]
  task rm <id> [--recursive]    Delete (refuses if children unless -r)
  task focus <id>               Set current focus (records event)
  task pop                      Move focus to parent
  task done|abandon|block|unblock <id>
  task current | path           Breadcrumb root → current
  task history [--n N] [--task ID]   Chronological focus events

  ref add <noteId> <file:lines> ["context"]   First-class provenance
  ref rm <noteId> <index>
  ref list [<noteId>]

  link add <a> <b> --kind <calls|produces|requires|refines|relates> ["context"]
  link rm <a> <b>
  link list [<noteId>]
  link graph                    All edges (text DAG)

  session start "intent"        Open a working session
  session end "summary"         Close + auto-attach notes/labels created within
  session list / show <id> / current

  status [show]                 Print narrative status
  status set "..."              Overwrite with one-line text
  status append "..."           Append a timestamped line
  status edit                   Open status.md in $EDITOR
  status clear

  todo [--type] [--tag] [--source] [--role] [--full]
                                List unresolved data-holes & design-questions

  render init "Deck Title"       Create a new card deck
  render add --title "..." --body "..." [--label --highlight --accent --tag]
  render list                    List all cards in the deck
  render show <n>                Show card details
  render edit <n> --title "..."  Edit a card
  render rm <n>                  Remove a card
  render clear                   Clear all cards
  render [-o path.pdf]           Render deck to PDF via faux-render

  guide                         Workflow runbook: protocol, patterns, anti-patterns
  philosophy                    Show WAN methodology and skills reference

Flags:
  -s, --source    Source ID (S001, S002, ...)
  -r, --role      Work role (e.g. "Founder")
  -n, --type      Note type: observation (default), design-idea,
                  design-question, data-hole
  -t, --tags      Comma-separated tags
  -b, --bin       Optional rough data bin (free-form, pre-WAAD sorting)
  -d, --detail    Path to a fuller doc (math, code, diagrams) for the note
      --ref       FILE:LINES (repeatable) — first-class provenance
  -l, --level     Affinity label level: 1 (blue), 2 (pink), 3 (green)
  -p, --parent    Parent task ID (T001, ...)
  -i, --intent    Longer-form why / acceptance criteria
  -f, --full      Full output (note list), or file path (note bulk),
                  or focus newly-added task
`.trim();

export async function run(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log(HELP);
    return;
  }

  const [cmd, ...rest] = args;

  switch (cmd) {
    case "init":
      init(rest);
      break;

    case "resume":
      await resume(rest);
      break;

    case "source": {
      const [sub, ...subArgs] = rest;
      if (sub === "add") {
        await sourceAdd(subArgs);
      } else {
        throw new Error(`Unknown source command: ${sub}. Try: wan source add`);
      }
      break;
    }

    case "note": {
      const [sub, ...subArgs] = rest;
      switch (sub) {
        case "add":
          await noteAdd(subArgs);
          break;
        case "bulk":
          await noteBulk(subArgs);
          break;
        case "list":
        case "ls":
          await noteList(subArgs);
          break;
        case "edit":
          await noteEdit(subArgs);
          break;
        case "rm":
          await noteRm(subArgs);
          break;
        default:
          throw new Error(
            `Unknown note command: ${sub}. Try: add, bulk, list, edit, rm`
          );
      }
      break;
    }

    case "affinity":
      await affinity(rest);
      break;

    case "task":
    case "t":
      await task(rest);
      break;

    case "ref":
      await ref(rest);
      break;

    case "link":
      await link(rest);
      break;

    case "session":
    case "ses":
      await session(rest);
      break;

    case "status":
      await status(rest);
      break;

    case "todo":
      await todo(rest);
      break;

    case "stats":
      await stats();
      break;

    case "export":
      await exportNotes(rest);
      break;

    case "render":
      await render(rest);
      break;

    case "guide":
      guide();
      break;

    case "philosophy":
      philosophy();
      break;

    default:
      throw new Error(`Unknown command: ${cmd}. Run wan --help for usage.`);
  }
}
