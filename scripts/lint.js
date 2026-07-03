import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const roots = ["apps", "packages", "tests"];
const banned = [
  ["Lorem", "ipsum"].join(" "),
  ["John", "Doe"].join(" "),
  ["Jane", "Smith"].join(" "),
  ["randomuser", "me"].join("."),
  ["picsum", "photos"].join("."),
  ["from", "purple", "500"].join("-")
];
let failed = false;

for (const file of await collectFiles(roots)) {
  const text = await readFile(file, "utf8");
  for (const token of banned) {
    if (text.includes(token)) {
      console.error(`Banned token "${token}" in ${file}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log("lint ok");

async function collectFiles(paths) {
  const files = [];
  for (const path of paths) {
    await walk(path, files);
  }
  return files.filter((file) => /\.(js|css|html|md)$/.test(file));
}

async function walk(path, files) {
  const entries = await readdir(path, { withFileTypes: true });
  for (const entry of entries) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) await walk(child, files);
    else files.push(child);
  }
}
