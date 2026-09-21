#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateManifest, type LaunchManifest } from "@loompad/protocol";

const HELP = `LoomPad developer CLI

Usage:
  loompad manifest validate <path>
  loompad manifest print <path>
  loompad help

Commands that submit transactions are intentionally SDK-driven until a program ID is deployed.`;

function reviveBigInts(_: string, value: unknown): unknown {
  if (typeof value === "string" && /^\d+n$/.test(value)) return BigInt(value.slice(0, -1));
  return value;
}

async function readManifest(path: string | undefined): Promise<LaunchManifest> {
  if (!path) throw new Error("A manifest path is required");
  const content = await readFile(resolve(path), "utf8");
  return JSON.parse(content, reviveBigInts) as LaunchManifest;
}

async function main(): Promise<void> {
  const [group, command, path] = process.argv.slice(2);
  if (!group || group === "help" || group === "--help") {
    process.stdout.write(`${HELP}\n`);
    return;
  }
  if (group !== "manifest" || !["validate", "print"].includes(command ?? ""))
    throw new Error("Unknown command. Run `loompad help`.");
  const manifest = await readManifest(path);
  validateManifest(manifest);
  if (command === "validate")
    process.stdout.write(`Valid LaunchManifest ${manifest.version}: ${manifest.launch}\n`);
  else
    process.stdout.write(
      `${JSON.stringify(manifest, (_, value: unknown) => (typeof value === "bigint" ? `${value}n` : value), 2)}\n`
    );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  process.stderr.write(`loompad: ${message}\n`);
  process.exitCode = 1;
});
