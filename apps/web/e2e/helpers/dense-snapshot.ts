import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export function snapshotDatabase(source: string, destination: string) {
  execFileSync("python3", [
    "-c",
    "import sqlite3,sys\na=sqlite3.connect(sys.argv[1]); b=sqlite3.connect(sys.argv[2]); a.backup(b); b.close(); a.close()",
    source,
    destination,
  ]);
}

export function sha256File(filename: string) {
  return createHash("sha256").update(fs.readFileSync(filename)).digest("hex");
}

export function hashAssetTree(directory: string): string {
  const hash = createHash("sha256");
  function visit(root: string) {
    for (const entry of fs
      .readdirSync(root, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
      const filename = path.join(root, entry.name);
      if (entry.isDirectory()) visit(filename);
      else if (entry.isFile())
        hash.update(`${path.relative(directory, filename)}\0${sha256File(filename)}\n`);
    }
  }
  visit(directory);
  return hash.digest("hex");
}
