import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const staticDirectory = path.resolve(".next", "static");
const outputFile = path.resolve("public", "sw-static-assets.json");

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      return entry.isDirectory() ? collectFiles(fullPath) : [fullPath];
    }),
  );
  return files.flat();
}

const files = (await collectFiles(staticDirectory)).filter(
  (file) => path.extname(file) !== ".map",
);
if (files.length === 0) {
  throw new Error("No Next.js static assets were found to precache.");
}

const urls = files
  .map(
    (file) =>
      `/_next/static/${path.relative(staticDirectory, file).split(path.sep).join("/")}`,
  )
  .sort();

await writeFile(outputFile, `${JSON.stringify(urls, null, 2)}\n`, "utf8");
console.log(`Generated ${urls.length} Service Worker static asset URLs.`);
