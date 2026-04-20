#!/usr/bin/env node
// Verify repository for invisible / control / BiDi Unicode characters
// Exit code 0 if none found, non-zero if any occurrences are detected.
import { execSync } from "child_process";
import fs from "fs";

function listGitFiles() {
  try {
    const out = execSync("git ls-files -z", { encoding: "utf8" });
    return out.split("\0").filter(Boolean);
  } catch (e) {
    console.error("Failed to run git ls-files:", e.message);
    process.exit(1);
  }
}

function isBinaryBuffer(buf) {
  // quick heuristic: NUL byte presence
  return buf.includes(0);
}

const controlRE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u; // C0 controls except tab/newline/carriage
const formatRE = /\p{Cf}/u; // Unicode format characters (zero-width, BiDi overrides, etc.)

const MAX_SIZE = 1024 * 1024; // skip files larger than 1MB
const SKIP_PREFIXES = [
  "node_modules/",
  "target/",
  "dist/",
  "result/",
  "public/",
  "src-tauri/target/",
  ".git/",
];

const files = listGitFiles();
const failures = [];

for (const file of files) {
  if (SKIP_PREFIXES.some((p) => file.startsWith(p))) continue;
  let stat;
  try {
    stat = fs.statSync(file);
  } catch (e) {
    continue;
  }
  if (!stat.isFile()) continue;
  if (stat.size > MAX_SIZE) continue;
  let buf;
  try {
    buf = fs.readFileSync(file);
  } catch (e) {
    continue;
  }
  if (isBinaryBuffer(buf)) continue;
  const s = buf.toString("utf8");
  if (!controlRE.test(s) && !formatRE.test(s)) continue;
  const lines = s.split(/\r?\n/);
  for (let lineno = 0; lineno < lines.length; lineno++) {
    const line = lines[lineno];
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (controlRE.test(ch) || formatRE.test(ch)) {
        const cp = ch.codePointAt(0);
        const hex = cp.toString(16).toUpperCase().padStart(4, "0");
        const name = codepointName(cp);
        const display = line.replace(/\t/g, "\\t");
        failures.push({
          file,
          lineno: lineno + 1,
          col: i + 1,
          hex,
          name,
          display,
        });
      }
    }
  }
}

if (failures.length === 0) {
  console.log("verify-no-invisible-chars: OK — no matches found.");
  process.exit(0);
}

console.error(
  "verify-no-invisible-chars: Found suspicious invisible/control Unicode characters:",
);
for (const f of failures) {
  console.error(`${f.file}:${f.lineno}:${f.col} U+${f.hex} ${f.name}`);
  console.error(`  ${f.display}`);
}
console.error(
  "\nPlease remove the offending characters or normalize the files.",
);
process.exit(2);

function codepointName(cp) {
  switch (cp) {
    case 0x200b:
      return "ZERO WIDTH SPACE";
    case 0x200c:
      return "ZERO WIDTH NON-JOINER";
    case 0x200d:
      return "ZERO WIDTH JOINER";
    case 0xfeff:
      return "ZERO WIDTH NO-BREAK SPACE (BOM)";
    case 0x200e:
      return "LEFT-TO-RIGHT MARK";
    case 0x200f:
      return "RIGHT-TO-LEFT MARK";
    case 0x202a:
      return "LEFT-TO-RIGHT EMBEDDING";
    case 0x202b:
      return "RIGHT-TO-LEFT EMBEDDING";
    case 0x202d:
      return "LEFT-TO-RIGHT OVERRIDE";
    case 0x202e:
      return "RIGHT-TO-LEFT OVERRIDE";
    case 0x202c:
      return "POP DIRECTIONAL FORMATTING";
    case 0x2066:
      return "LEFT-TO-RIGHT ISOLATE";
    case 0x2067:
      return "RIGHT-TO-LEFT ISOLATE";
    case 0x2068:
      return "FIRST STRONG ISOLATE";
    case 0x2069:
      return "POP DIRECTIONAL ISOLATE";
    default:
      return "";
  }
}
