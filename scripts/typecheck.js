import { spawnSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const files = await collectJs(["apps", "packages", "tests", "scripts"]);
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log("typecheck ok");

async function collectJs(paths) {
  const files = [];
  for (const path of paths) await walk(path, files);
  return files.filter((file) => file.endsWith(".js"));
}

async function walk(path, files) {
  const entries = await readdir(path, { withFileTypes: true });
  for (const entry of entries) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) await walk(child, files);
    else files.push(child);
  }
}
