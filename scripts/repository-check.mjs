import { readFile } from "node:fs/promises";
import { glob } from "node:fs/promises";
import process from "node:process";

const ignored = ["node_modules", "dist", "dist-types", "coverage", "target", ".git"];
const secretPatterns = [
  { name: "PEM private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: "GitHub token", pattern: /gh[pousr]_[A-Za-z0-9]{30,}/ },
  { name: "AWS access key", pattern: /AKIA[0-9A-Z]{16}/ },
  { name: "Solana keypair array", pattern: /\[(?:\s*\d{1,3}\s*,){31,}\s*\d{1,3}\s*\]/ }
];

const findings = [];
for await (const path of glob("**/*", { exclude: ignored.map((part) => `**/${part}/**`) })) {
  if (path === "scripts/repository-check.mjs") continue;
  if (/\.(?:png|jpg|jpeg|gif|ico|woff2?|lock|tsbuildinfo)$/i.test(path)) continue;
  let content;
  try {
    content = await readFile(path, "utf8");
  } catch {
    continue;
  }
  for (const check of secretPatterns) {
    if (check.pattern.test(content)) findings.push(`${path}: ${check.name}`);
  }
}

if (findings.length > 0) {
  process.stderr.write(`Potential secrets detected:\n${findings.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("Repository secret-pattern check passed.\n");
}
