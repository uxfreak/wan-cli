#!/usr/bin/env bun
import { run } from "./cli";

try {
  await run();
} catch (err) {
  console.error(`wan: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
