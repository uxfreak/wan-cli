import { existsSync } from "node:fs";
import { join } from "node:path";
import { ensureInitialized, getWanRoot } from "../store";

// ── Data types ──────────────────────────────────────────────

interface Card {
  label: string;       // "S007-01" or "LAYER 1"
  title: string;       // "4 hours for 35 km."
  body: string;        // main paragraph
  highlight?: string;  // italic pull-quote
  accent: string;      // hex color for this card
  tag?: string;        // "DOMESTIC TOURIST"
}

interface Deck {
  title: string;       // deck title (page 1 if shown)
  subtitle?: string;
  author?: string;
  date?: string;
  cards: Card[];
}

// ── Design System ───────────────────────────────────────────
//
//  PRINCIPLES:
//    1. Focal point — title is the only thing that matters
//    2. Attention flow — label (orient) → SILENCE → title (hit) → rule (breath) → body (explain) → highlight (resonate) → SILENCE → footer (ground)
//    3. Contrast — scale (3.3x label-to-title), weight, style (mono/serif/sans), color, case, tracking
//    4. Active negative space — three zones separated by deliberate silence
//    5. Balance — label floats top, content clusters middle, footer anchors bottom
//
//  Fonts: Cormorant Garamond (display) + Plus Jakarta Sans (body) + IBM Plex Mono (data)
//  Palette: Indian natural dyes — indigo night, turmeric gold, warm cotton
//

const W = 390;
const H = 620;
const PAD_X = 44;
const PAD_TOP = 40;
const PAD_BOT = 36;
const CONTENT_H = H - PAD_TOP - PAD_BOT;

// ── Palette ──
const PAGE_BG     = "#F0EBE1";  // aged cotton
const NOTE_BG     = "#151925";  // deep indigo night
const NOTE_GOLD   = "#C9A24D";  // turmeric
const NOTE_CREAM  = "#F0EBE1";  // warm cream on dark
const NOTE_MUTED  = "#8890A6";  // steel-blue body
const NOTE_DIM    = "#3D4460";  // indigo-grey meta
const INK         = "#1A1814";  // deepest ink
const BODY_CLR    = "#5A5347";  // warm umber
const META_CLR    = "#ADA596";  // warm stone
const RULE_THIN   = 1.5;

function txt(text: string, opts: Record<string, unknown>) {
  return { type: "text", text, width: "fill", ...opts };
}

function gap(h: number) {
  return { type: "rectangle", width: "fill", height: h, fill: "transparent" };
}

function rule(w: number, color: string) {
  return { type: "rectangle", width: w, height: RULE_THIN, fill: color };
}

// ── Layer card ──────────────────────────────────────────────
//
//  Zone A (top):     label — orients the reader
//  [active silence]
//  Zone B (middle):  title → rule → body → highlight — the content
//  [active silence]
//  Zone C (bottom):  footer — grounds the page
//

function layerCard(card: Card, index: number, total: number): Record<string, unknown> {

  // Zone A — label, floating at top, light, dissolving into the page
  const zoneA = txt(card.label, {
    fontFamily: "IBM Plex Mono",
    fontWeight: "Light",
    fontSize: 9,
    letterSpacing: 3.0,
    color: card.accent,
    textCase: "upper",
  });

  // Zone B — content cluster
  const content: Record<string, unknown>[] = [];

  // Title — focal point, HEAVIEST element on the page, maximum density
  content.push(txt(card.title, {
    fontFamily: "DM Serif Display",
    fontWeight: "Regular",
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.4,
    color: INK,
    textRole: "heading-display",
    lineBreakStrategy: "ragged",
  }));

  content.push(gap(12));
  content.push(rule(28, card.accent));
  content.push(gap(16));

  // Body — LIGHT weight, recedes behind the title, airy
  content.push(txt(card.body, {
    fontFamily: "Nunito Sans",
    fontWeight: "Medium",
    fontSize: 14.5,
    lineHeight: 27,
    color: BODY_CLR,
    textRole: "body-digital",
    lineBreakStrategy: "ragged",
  }));

  // Highlight — serif italic, emotional resonance
  if (card.highlight) {
    content.push(gap(14));
    content.push(txt(card.highlight, {
      fontFamily: "Cormorant Garamond",
      fontWeight: "Regular",
      fontStyle: "italic",
      fontSize: 17,
      lineHeight: 25,
      color: card.accent,
      textRole: "standfirst",
      lineBreakStrategy: "magazine",
    }));
  }

  const zoneB: Record<string, unknown> = {
    type: "column", width: "fill", gap: 0, children: content,
  };

  // Zone C — footer, near-invisible
  const footerChildren: Record<string, unknown>[] = [];
  if (card.tag) {
    footerChildren.push(txt(card.tag, {
      width: "hug",
      fontFamily: "IBM Plex Mono",
      fontWeight: "Light",
      fontSize: 7,
      letterSpacing: 1.6,
      color: META_CLR,
      textCase: "upper",
    }));
  }
  footerChildren.push(txt(`${index + 1} / ${total}`, {
    width: "hug",
    fontFamily: "IBM Plex Mono",
    fontWeight: "Light",
    fontSize: 7,
    letterSpacing: 0.8,
    color: META_CLR,
  }));

  const zoneC: Record<string, unknown> = {
    type: "row", width: "fill", justify: "space-between", children: footerChildren,
  };

  // Single flow — label, content, footer all in one column, vertically centered
  return {
    type: "column",
    width: "fill",
    height: CONTENT_H,
    justify: "center",
    gap: 0,
    children: [
      {
        type: "column",
        width: "fill",
        gap: 14,
        children: [
          zoneA,
          zoneB,
          zoneC,
        ],
      },
    ],
  };
}

// ── Note card (observation — dark, distinct) ────────────────
//
//  Dark rounded card inset into the page.
//  Title is the star — enormous. Body is quiet. Gold is the only color.
//

function noteCard(card: Card): Record<string, unknown> {

  const inner: Record<string, unknown>[] = [];

  // Role tag — lightest element, barely there
  if (card.tag) {
    inner.push(txt(card.tag, {
      fontFamily: "IBM Plex Mono",
      fontWeight: "Light",
      fontSize: 7.5,
      letterSpacing: 2.4,
      color: NOTE_DIM,
      textCase: "upper",
    }));
  }

  // Note ID — gold, medium weight — not competing with title
  inner.push(txt(card.label, {
    fontFamily: "IBM Plex Mono",
    fontWeight: "Regular",
    fontSize: 10,
    letterSpacing: 3.2,
    color: NOTE_GOLD,
    textCase: "upper",
  }));

  inner.push(gap(16));

  // Title — HEAVIEST element, commanding
  inner.push(txt(card.title, {
    fontFamily: "DM Serif Display",
    fontWeight: "Regular",
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.3,
    color: NOTE_CREAM,
    textRole: "heading-display",
    lineBreakStrategy: "ragged",
  }));

  inner.push(gap(8));
  inner.push(rule(44, NOTE_GOLD));
  inner.push(gap(10));

  // Body — LIGHT, receding, provides context without competing
  inner.push(txt(card.body, {
    fontFamily: "Nunito Sans",
    fontWeight: "Medium",
    fontSize: 13,
    lineHeight: 23,
    color: NOTE_MUTED,
    textRole: "body-digital",
    lineBreakStrategy: "ragged",
  }));

  // Footer — near-invisible, lightest possible
  const footer: Record<string, unknown> = {
    type: "row",
    width: "fill",
    justify: "end",
    children: [
      txt("WORK ACTIVITY NOTE", {
        width: "hug",
        fontFamily: "IBM Plex Mono",
        fontWeight: "Thin",
        fontSize: 6.5,
        letterSpacing: 2.4,
        color: NOTE_DIM,
        textCase: "upper",
      }),
    ],
  };

  return {
    type: "column",
    width: "fill",
    height: CONTENT_H,
    justify: "center",
    children: [
      {
        type: "column",
        width: "fill",
        fill: NOTE_BG,
        cornerRadius: 8,
        padding: { top: 28, right: 28, bottom: 22, left: 28 },
        justify: "space-between",
        children: [
          { type: "column", width: "fill", gap: 5, children: inner },
          gap(8),
          footer,
        ],
      },
    ],
  };
}

// ── Build schema ────────────────────────────────────────────

function buildSchema(deck: Deck): Record<string, unknown> {
  const isNote = (c: Card) => /^S\d{3}-\d{2}$/.test(c.label);
  const pages = deck.cards.map((c, i) =>
    isNote(c) ? noteCard(c) : layerCard(c, i, deck.cards.length)
  );

  return {
    type: "column",
    width: W,
    fill: PAGE_BG,
    padding: { top: PAD_TOP, right: PAD_X, bottom: PAD_BOT, left: PAD_X },
    gap: 0,
    output: { pagination: "paginated", pageHeight: H },
    children: pages,
  };
}

// ── Deck file helpers ───────────────────────────────────────

function deckPath(): string {
  return join(getWanRoot(), "deck.json");
}

async function readDeck(): Promise<Deck> {
  const p = deckPath();
  if (!existsSync(p)) {
    return { title: "Untitled", cards: [] };
  }
  return JSON.parse(await Bun.file(p).text());
}

async function writeDeck(deck: Deck): Promise<void> {
  await Bun.write(deckPath(), JSON.stringify(deck, null, 2));
}

// ── Sub-commands ────────────────────────────────────────────

async function deckInit(args: string[]): Promise<void> {
  ensureInitialized();
  const title = args.join(" ") || "Untitled Deck";
  const deck: Deck = { title, cards: [] };
  await writeDeck(deck);
  console.log(`Deck initialized: ${deckPath()}`);
}

async function deckAdd(args: string[]): Promise<void> {
  ensureInitialized();
  const deck = await readDeck();

  // Parse: wan render add --label "X" --title "Y" --body "Z" --highlight "H" --accent "#FFF" --tag "T"
  let label = "", title = "", body = "", highlight = "", accent = "#FFFFFF", tag = "";
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const next = args[i + 1] || "";
    if (a === "--label" || a === "-l") { label = next; i++; }
    else if (a === "--title" || a === "-t") { title = next; i++; }
    else if (a === "--body" || a === "-b") { body = next; i++; }
    else if (a === "--highlight" || a === "-h") { highlight = next; i++; }
    else if (a === "--accent" || a === "-a") { accent = next; i++; }
    else if (a === "--tag") { tag = next; i++; }
  }

  if (!title) {
    console.error("Usage: wan render add --label 'LAYER 1' --title 'The Desire' --body '...' [--highlight '...'] [--accent '#FFB84D'] [--tag 'TOURIST']");
    process.exit(1);
  }

  const card: Card = { label, title, body, accent };
  if (highlight) card.highlight = highlight;
  if (tag) card.tag = tag;

  deck.cards.push(card);
  await writeDeck(deck);
  console.log(`Card ${deck.cards.length} added: "${title}"`);
}

async function deckList(): Promise<void> {
  ensureInitialized();
  const deck = await readDeck();
  if (deck.cards.length === 0) {
    console.log("No cards. Add one with: wan render add --title '...' --body '...'");
    return;
  }
  console.log(`${deck.title} — ${deck.cards.length} card(s)\n`);
  for (let i = 0; i < deck.cards.length; i++) {
    const c = deck.cards[i];
    const lbl = c.label ? `[${c.label}] ` : "";
    console.log(`  ${i + 1}. ${lbl}${c.title}`);
  }
}

async function deckShow(args: string[]): Promise<void> {
  ensureInitialized();
  const idx = parseInt(args[0], 10);
  if (isNaN(idx) || idx < 1) {
    console.error("Usage: wan render show <card-number>");
    process.exit(1);
  }
  const deck = await readDeck();
  if (idx > deck.cards.length) {
    console.error(`Card ${idx} does not exist.`);
    process.exit(1);
  }
  const c = deck.cards[idx - 1];
  console.log(`Card ${idx} of ${deck.cards.length}`);
  console.log(`  Label:     ${c.label || "(none)"}`);
  console.log(`  Title:     ${c.title}`);
  console.log(`  Body:      ${c.body}`);
  console.log(`  Highlight: ${c.highlight || "(none)"}`);
  console.log(`  Accent:    ${c.accent}`);
  console.log(`  Tag:       ${c.tag || "(none)"}`);
}

async function deckEdit(args: string[]): Promise<void> {
  ensureInitialized();
  const idx = parseInt(args[0], 10);
  if (isNaN(idx) || idx < 1) {
    console.error("Usage: wan render edit <card-number> --title 'New title' [--body '...'] [--highlight '...'] [--accent '#FFF'] [--label '...'] [--tag '...']");
    process.exit(1);
  }
  const deck = await readDeck();
  if (idx > deck.cards.length) {
    console.error(`Card ${idx} does not exist.`);
    process.exit(1);
  }
  const card = deck.cards[idx - 1];
  const rest = args.slice(1);
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    const next = rest[i + 1] || "";
    if (a === "--label" || a === "-l") { card.label = next; i++; }
    else if (a === "--title" || a === "-t") { card.title = next; i++; }
    else if (a === "--body" || a === "-b") { card.body = next; i++; }
    else if (a === "--highlight" || a === "-h") { card.highlight = next; i++; }
    else if (a === "--accent" || a === "-a") { card.accent = next; i++; }
    else if (a === "--tag") { card.tag = next; i++; }
  }
  await writeDeck(deck);
  console.log(`Card ${idx} updated: "${card.title}"`);
}

async function deckRm(args: string[]): Promise<void> {
  ensureInitialized();
  const idx = parseInt(args[0], 10);
  if (isNaN(idx) || idx < 1) {
    console.error("Usage: wan render rm <card-number>");
    process.exit(1);
  }
  const deck = await readDeck();
  if (idx > deck.cards.length) {
    console.error(`Card ${idx} does not exist. Deck has ${deck.cards.length} cards.`);
    process.exit(1);
  }
  const removed = deck.cards.splice(idx - 1, 1)[0];
  await writeDeck(deck);
  console.log(`Removed card ${idx}: "${removed.title}"`);
}

async function deckClear(): Promise<void> {
  ensureInitialized();
  const deck = await readDeck();
  const count = deck.cards.length;
  deck.cards = [];
  await writeDeck(deck);
  console.log(`Cleared ${count} cards from deck.`);
}

// ── Main CLI handler ────────────────────────────────────────

export async function render(args: string[]): Promise<void> {
  // Route sub-commands
  if (args[0] === "init") return deckInit(args.slice(1));
  if (args[0] === "add") return deckAdd(args.slice(1));
  if (args[0] === "list" || args[0] === "ls") return deckList();
  if (args[0] === "show") return deckShow(args.slice(1));
  if (args[0] === "edit") return deckEdit(args.slice(1));
  if (args[0] === "rm") return deckRm(args.slice(1));
  if (args[0] === "clear") return deckClear();

  ensureInitialized();

  // Parse args
  let inputPath: string | null = null;
  let outputPath: string | null = null;
  let rendererPath = "/Users/kasa/Downloads/Projects/faux-render/target/release/faux-render";

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === "-o" || args[i] === "--output") && args[i + 1]) {
      outputPath = args[++i];
    } else if (args[i] === "--renderer" && args[i + 1]) {
      rendererPath = args[++i];
    } else if (!inputPath) {
      inputPath = args[i];
    }
  }

  // Default: look for .wan/deck.json
  if (!inputPath) {
    inputPath = join(getWanRoot(), "deck.json");
  }

  if (!existsSync(inputPath)) {
    console.error(`Deck file not found: ${inputPath}`);
    console.error(`Create one with: wan render init`);
    process.exit(1);
  }

  // Default output
  if (!outputPath) {
    outputPath = join(
      process.env.HOME || ".",
      "Downloads",
      "wan-deck.pdf"
    );
  }

  // Read deck
  const deckText = await Bun.file(inputPath).text();
  const deck: Deck = JSON.parse(deckText);

  if (!deck.cards || deck.cards.length === 0) {
    console.error("Deck has no cards.");
    process.exit(1);
  }

  // Generate schema
  const schema = buildSchema(deck);
  const schemaPath = join(getWanRoot(), "_render_schema.json");
  await Bun.write(schemaPath, JSON.stringify(schema, null, 2));

  // Call faux-render
  if (!existsSync(rendererPath)) {
    console.error(`faux-render binary not found at: ${rendererPath}`);
    console.error(`Build it: cd /Users/kasa/Downloads/Projects/faux-render && cargo build --release`);
    process.exit(1);
  }

  const proc = Bun.spawn([
    rendererPath, "render", schemaPath,
    "--backend", "pdf",
    "--width", String(W),
    "--height", String(H),
    "-o", outputPath,
  ], { stdout: "inherit", stderr: "inherit" });

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    console.error(`faux-render exited with code ${exitCode}`);
    process.exit(1);
  }

  console.log(`\n  ${deck.cards.length} cards → ${outputPath}`);
}
