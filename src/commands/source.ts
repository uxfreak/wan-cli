import { existsSync } from "node:fs";
import { ensureInitialized, nextSourceId, writeSource } from "../store";

export async function sourceAdd(args: string[]): Promise<void> {
  ensureInitialized();

  let content: string;

  if (args.length > 0 && args[0] !== "-") {
    const filePath = args[0];
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    content = await Bun.file(filePath).text();
  } else {
    if (process.stdin.isTTY) {
      console.log("Enter source content (Ctrl+D to finish):");
    }
    content = await new Response(process.stdin as unknown as ReadableStream).text();
  }

  if (!content.trim()) {
    throw new Error("Source content cannot be empty.");
  }

  const id = nextSourceId();
  await writeSource(id, content);
  console.log(`Source added: ${id}`);
}
