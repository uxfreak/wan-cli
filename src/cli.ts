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

const HELP = `
wan — Work Activity Notes CLI

Usage: wan <command> [options]

Commands:
  init                          Initialize .wan/ in current directory
  source add <file|->           Add a raw thought dump as source
  note add -s -r [-n] "text"    Add a synthesized note
  note bulk -s -f <file>        Bulk import notes from JSON
  note list [--type] [--tag] [--source] [--role] [--bin] [--full]
  note edit <id> [--content] [--type] [--tags] [--role] [--bin]
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

  philosophy                    Show WAN methodology and skills reference

Flags:
  -s, --source    Source ID (S001, S002, ...)
  -r, --role      Work role (e.g. "Founder")
  -n, --type      Note type: observation (default), design-idea,
                  design-question, data-hole
  -t, --tags      Comma-separated tags
  -b, --bin       Optional rough data bin (free-form, pre-WAAD sorting)
  -l, --level     Affinity label level: 1 (blue), 2 (pink), 3 (green)
  -f, --full      Full output (note list), or file path (note bulk)
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

    case "stats":
      await stats();
      break;

    case "export":
      await exportNotes(rest);
      break;

    case "philosophy":
      philosophy();
      break;

    default:
      throw new Error(`Unknown command: ${cmd}. Run wan --help for usage.`);
  }
}
