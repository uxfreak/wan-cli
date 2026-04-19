// `wan doctor` — consistency checks against doc-rot.
//
// Two modes:
//
// (1) wan-cli-internal mode (when run inside the wan-cli source tree):
//     - a command exists in cli.ts switch but isn't documented in HELP
//     - a commands/*.ts file exists but isn't imported / wired by cli.ts
//     - HELP doesn't mention `wan guide` and `wan philosophy`
//     - README.md misses a public command
//     - guide/philosophy text is out of date relative to the command set
//
// (2) project mode (when run inside any wan-initialized project):
//     - if .wan/config.json has validators.markdownRoot, scan that directory
//       for broken [text](path) markdown links
//
// Both modes apply if both conditions hold. Run before committing.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, resolve as pathResolve } from "node:path";
import { isInitialized, getWanRoot, readConfig } from "../store";

interface Issue {
  level: "error" | "warning";
  area: string;
  message: string;
}

export async function doctor(_args: string[]): Promise<void> {
  // Locate the wan-cli repo root by looking for src/cli.ts in cwd, then in the
  // standard install location. Allows running `wan doctor` from anywhere.
  const root = findWanRoot();
  if (!root) {
    throw new Error(
      "wan doctor must run inside the wan-cli source tree (could not find src/cli.ts).",
    );
  }

  const issues: Issue[] = [];

  const cliText = await Bun.file(join(root, "src/cli.ts")).text();
  const helpText = await Bun.file(join(root, "src/cli.ts")).text(); // HELP is inside cli.ts
  const readmeText = (await safeRead(join(root, "README.md"))) ?? "";
  const guideText = (await safeRead(join(root, "src/commands/guide.ts"))) ?? "";
  const philosophyText =
    (await safeRead(join(root, "src/commands/philosophy.ts"))) ?? "";

  const commandsDir = join(root, "src/commands");
  const commandFiles = readdirSync(commandsDir)
    .filter((f) => f.endsWith(".ts") && !f.startsWith("."))
    .map((f) => f.replace(/\.ts$/, ""));

  // 1. Every commands/*.ts file should be imported by cli.ts
  for (const cf of commandFiles) {
    if (!cliText.includes(`from "./commands/${cf}"`)) {
      issues.push({
        level: "error",
        area: "wiring",
        message: `commands/${cf}.ts exists but is not imported by cli.ts`,
      });
    }
  }

  // 2. Top-level commands surfaced in cli.ts switch (case "X":) should appear in HELP
  // Extract case labels under the main run() switch.
  const caseRegex = /case\s+"([a-z][a-z0-9-]*)":/g;
  const cases = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = caseRegex.exec(cliText)) !== null) {
    cases.add(m[1]);
  }

  // Filter out subcommand cases (those nested inside note/source/affinity/task switches).
  // Heuristic: a top-level command is one of the import names in cli.ts.
  const topLevel = new Set<string>([
    "init",
    "resume",
    "source",
    "note",
    "affinity",
    "task",
    "t",
    "ref",
    "link",
    "session",
    "ses",
    "status",
    "todo",
    "stats",
    "export",
    "render",
    "philosophy",
    "guide",
    "doctor",
  ]);
  for (const c of cases) {
    if (!topLevel.has(c)) continue;
    // Aliases (t, ses) don't need their own HELP line.
    if (c === "t" || c === "ses") continue;
    if (!helpText.includes(`\n  ${c}`) && !helpText.includes(`  ${c} `) && !helpText.includes(` ${c}\n`)) {
      // very loose match — just check the name appears in the HELP block at all
      if (!new RegExp(`\\b${c}\\b`).test(helpText)) {
        issues.push({
          level: "error",
          area: "help",
          message: `case "${c}" is wired in cli.ts but does not appear in HELP text`,
        });
      }
    }
  }

  // 3. HELP must point readers at guide and philosophy
  if (!helpText.includes("wan guide")) {
    issues.push({
      level: "warning",
      area: "help",
      message: "HELP does not mention `wan guide` (workflow runbook pointer)",
    });
  }
  if (!helpText.includes("wan philosophy")) {
    issues.push({
      level: "warning",
      area: "help",
      message: "HELP does not mention `wan philosophy` (methodology pointer)",
    });
  }

  // 4. README.md should mention the major command groups
  for (const cmd of ["wan resume", "wan task", "wan note", "wan session", "wan affinity", "wan link", "wan ref", "wan status"]) {
    if (!readmeText.includes(cmd)) {
      issues.push({
        level: "warning",
        area: "readme",
        message: `README.md does not mention \`${cmd}\``,
      });
    }
  }

  // 5. guide.ts should cover the core protocol
  for (const phrase of ["wan resume", "wan session start", "wan task focus", "wan note add", "wan session end"]) {
    if (!guideText.includes(phrase)) {
      issues.push({
        level: "warning",
        area: "guide",
        message: `wan guide doesn't mention \`${phrase}\``,
      });
    }
  }

  // 6. philosophy.ts should cover the extension methodology
  for (const phrase of ["WORK TREE", "PROVENANCE", "wan task", "wan ref", "wan resume"]) {
    if (!philosophyText.includes(phrase)) {
      issues.push({
        level: "warning",
        area: "philosophy",
        message: `wan philosophy doesn't mention \`${phrase}\``,
      });
    }
  }

  // 7. CONTRIBUTING.md exists (the doc-rot checklist)
  if (!existsSync(join(root, "CONTRIBUTING.md"))) {
    issues.push({
      level: "warning",
      area: "contributing",
      message: "CONTRIBUTING.md missing — should hold the pre-commit doc checklist",
    });
  }

  // 8. CLAUDE.md global instructions should reference wan (best effort — only check if file exists)
  const claudeMd = `${process.env.HOME}/.claude/CLAUDE.md`;
  if (existsSync(claudeMd)) {
    const claudeText = await Bun.file(claudeMd).text();
    if (!claudeText.includes("wan resume")) {
      issues.push({
        level: "warning",
        area: "claude.md",
        message: `~/.claude/CLAUDE.md does not mention \`wan resume\` — AI agents won't know to use wan`,
      });
    }
  }

  // ── PROJECT MODE — markdown link checking per validators.markdownRoot ──
  if (isInitialized()) {
    try {
      const config = await readConfig();
      const mdRoot = config.validators?.markdownRoot;
      if (mdRoot) {
        const wanRoot = getWanRoot();
        const projectRoot = dirname(wanRoot);
        const scanRoot = isAbsolute(mdRoot) ? mdRoot : pathResolve(projectRoot, mdRoot);
        if (!existsSync(scanRoot)) {
          issues.push({
            level: "warning",
            area: "markdown",
            message: `validators.markdownRoot is set to "${mdRoot}" but ${scanRoot} doesn't exist`,
          });
        } else {
          const broken = scanMarkdownLinks(scanRoot);
          for (const b of broken) {
            issues.push({ level: "error", area: "markdown", message: b });
          }
        }
      }
    } catch {
      // Config read failed; project mode skipped silently.
    }
  }

  // ── Report ─────────────────────────────────────────────
  if (issues.length === 0) {
    console.log("✓ wan doctor: all consistency checks passed.");
    return;
  }
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");
  console.log(`wan doctor: ${errors.length} error(s), ${warnings.length} warning(s)\n`);
  for (const i of issues) {
    const tag = i.level === "error" ? "ERROR" : "warn ";
    console.log(`  [${tag}] (${i.area}) ${i.message}`);
  }
  if (errors.length > 0) process.exit(1);
}

function findWanRoot(): string | null {
  // Try cwd, then the symlink target if `wan` is on PATH.
  const candidates = [
    process.cwd(),
    "/Users/kasa/Desktop/pitch/wan-cli",
  ];
  for (const c of candidates) {
    if (existsSync(join(c, "src/cli.ts"))) return c;
  }
  return null;
}

async function safeRead(path: string): Promise<string | null> {
  if (!existsSync(path)) return null;
  return Bun.file(path).text();
}

// Recursively walk a directory and collect all .md files.
function walkMarkdown(dir: string): string[] {
  const out: string[] = [];
  const stack = [dir];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    let entries: string[];
    try {
      entries = readdirSync(cur);
    } catch {
      continue;
    }
    for (const e of entries) {
      if (e.startsWith(".")) continue;
      const full = join(cur, e);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) stack.push(full);
      else if (e.endsWith(".md")) out.push(full);
    }
  }
  return out;
}

// Scan all markdown files under `root` for [text](path) links.
// Verify each link's target file resolves (skip URLs and pure anchors).
// Returns a list of broken-link descriptions.
function scanMarkdownLinks(root: string): string[] {
  const broken: string[] = [];
  const linkRegex = /\]\(([^)]+)\)/g;
  for (const md of walkMarkdown(root)) {
    let text: string;
    try {
      text = readFileSync(md, "utf8");
    } catch {
      continue;
    }
    const seen = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = linkRegex.exec(text)) !== null) {
      const link = m[1];
      if (seen.has(link)) continue;
      seen.add(link);
      // Skip URLs and pure anchors
      if (link.startsWith("http://") || link.startsWith("https://") || link.startsWith("mailto:")) continue;
      const filePart = link.split("#")[0];
      if (!filePart) continue;
      const target = isAbsolute(filePart)
        ? filePart
        : pathResolve(dirname(md), filePart);
      if (!existsSync(target)) {
        const rel = md.startsWith(root) ? md.slice(root.length + 1) : md;
        broken.push(`broken link in ${rel}: ${link}`);
      }
    }
  }
  return broken;
}
