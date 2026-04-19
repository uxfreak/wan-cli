# Contributing to wan

## The doc-rot doctrine

`wan` has six places that describe the command surface, each with its own audience:

| File | Audience | What lives here |
|---|---|---|
| `src/cli.ts` (`HELP`) | reference card | flat list of every command + flags |
| `src/commands/guide.ts` | new users | workflow protocol, decision rules, canonical patterns |
| `src/commands/philosophy.ts` | deep readers | methodology theory + extension docs |
| `README.md` | repo visitors | install + concepts + workflow |
| `~/.claude/CLAUDE.md` (the wan section) | AI agents in any project | how to use wan in someone else's workspace |
| `src/commands/doctor.ts` | future-you | the consistency check that catches drift |

The risk: change a command, forget one of the six docs, drift sets in. Over time
every doc's truth probability drops below 1 and they become noise.

## The pre-commit checklist

Before committing any change to the wan command surface, do all of these:

1. **Update `src/cli.ts` `HELP`** — the case label is wired but the text isn't? Add the line.
2. **Update `README.md`** — the README has a workflow section + extension section that describe the command surface; update both if relevant.
3. **Update `src/commands/guide.ts`** — does the new command warrant a workflow pattern, a decision-rule entry, or an anti-pattern? Add it.
4. **Update `src/commands/philosophy.ts`** — does it introduce a conceptually new layer (like `task` did)? Add a section. Otherwise skip.
5. **Update `~/.claude/CLAUDE.md`** — the global wan section. Update the command list / decision rules / loop. (Path: `/Users/kasa/.claude/CLAUDE.md`.)
6. **Run `wan doctor`** — catches the mechanical drift (file-not-imported, command-not-in-HELP, etc.). Should print `✓` before you commit.
7. **Run `bun run build`** — make sure it still compiles.
8. **One commit, all artifacts together.** Per CLAUDE.md principle 4 (commit-scope honesty): the commit that changes behavior X must also update every doc making a claim about X.

## Anti-patterns

- **Splitting docs into a separate "follow-up" commit.** The follow-up rarely happens. By the time someone else reads the docs, they're stale.
- **"I'll add it to the README later."** No.
- **Updating only `HELP`.** That covers reference; it does nothing for users learning the workflow (`guide`) or AI agents (`CLAUDE.md`).
- **Skipping `wan doctor`.** It exists precisely so you don't have to remember.

## What `wan doctor` checks

**Always (wan-cli-internal):**
- Every `commands/*.ts` is imported by `cli.ts`.
- Every top-level `case` in the cli switch appears somewhere in `HELP`.
- `HELP` mentions `wan guide` and `wan philosophy`.
- `README.md` mentions every major command group.
- `guide.ts` covers the core protocol commands.
- `philosophy.ts` covers the extension methodology.
- `CONTRIBUTING.md` exists.
- `~/.claude/CLAUDE.md` mentions `wan resume` (the AI bootstrap).

**Project mode (when run inside a `.wan/`-bearing project):**
- If `.wan/config.json` has `validators.markdownRoot`, scan that directory
  recursively for `[text](path)` markdown links and verify each resolves.

It does **not** check semantic accuracy — that's still your job. But it catches the mechanical drift that's both common and silent.

## Pluggable validators (project-side configuration)

`wan` is project-agnostic. Per-project schemas via `.wan/config.json`:

```json
{
  "validators": {
    "ref": "path/to/validate-ref.sh",
    "markdownRoot": "docs"
  }
}
```

- **`validators.ref`** runs on every `wan ref add` and `wan note add --ref`.
  The script receives the ref via env vars (`WAN_REF_PATH`, `WAN_REF_LINES`,
  `WAN_REF_NOTE`) and refuses on non-zero exit. Use `--no-validate` to bypass.
- **`validators.markdownRoot`** is the directory `wan doctor` scans for
  broken markdown links.

Why pluggable: a code-formalization project validates `path:lines` against
the source tree; a paper-citation project validates BibTeX entries against
a bibliography database; a REST-catalog project pings URLs. The schema is
project-specific, the hook stays user-controlled.

If neither validator is set, behavior is the prior passive (store-as-typed)
default — no breakage for existing projects.

## Building

```bash
bun install
bun run build       # → ./wan binary
ln -sf "$(pwd)/wan" ~/.local/bin/wan    # one-time
```

After a code change: `bun run build` and the symlinked binary picks up the new code.
