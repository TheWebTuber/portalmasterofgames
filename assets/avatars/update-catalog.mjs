import { readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

const directory = new URL("./", import.meta.url);
const catalog = new URL("catalog.json", directory);
const entries = await readdir(directory, { withFileTypes: true });
const files = entries
  .filter(entry => entry.isFile() && /\.vrm$/i.test(entry.name))
  .map(entry => entry.name)
  .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

let previous = "[]";
try {
  previous = await readFile(catalog, "utf8");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const models = JSON.parse(previous.replace(/^\uFEFF/, ""));
if (!Array.isArray(models)) throw new Error("Expected an array in catalog.json.");

// The viewer resolves file as a URL. Escape characters with special URL meanings.
const remaining = new Map(files.map(filename => [
  filename.replace(/[%#?]/g, character => encodeURIComponent(character)),
  filename
]));
const next = [];
for (const model of models) {
  if (remaining.delete(model?.file)) next.push(model);
}
for (const [file, filename] of remaining) {
  const name = filename.replace(/\.vrm$/i, "").replace(/[-_\s]+/g, " ").trim();
  next.push({ name: name || filename, file });
}

const output = JSON.stringify(next, null, 2) + "\n";
if (output !== previous) {
  const temporary = new URL(".catalog-" + randomUUID() + ".tmp", directory);
  try {
    await writeFile(temporary, output, { flag: "wx" });
    await rename(temporary, catalog);
  } finally {
    await rm(temporary, { force: true });
  }
}
console.log("Avatar catalog: " + next.length + " model(s).");
