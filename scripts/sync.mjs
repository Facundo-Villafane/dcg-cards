// Mirrors the card scans of TakaOtaku's Digimon Card App into cards/, downloading only what's
// missing. The card list (with each print's image file) comes from their GitHub repo; the images
// from their CDN. Unreleased cards only have a "-Sample" scan: those are re-checked every run and
// the real scan replaces them once it exists.
//
// Usage: node scripts/sync.mjs [--limit N]   (no dependencies; Node 18+)
// Prints a summary and writes the number of downloaded files to downloaded.txt (for the workflow).
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const LIST_URL = "https://raw.githubusercontent.com/TakaOtaku/Digimon-Card-App/main/src/assets/cardlists/PreparedDigimonCardsENG.json";
const IMAGE_BASE = "https://web-garage.takaotaku.de";
const OUT = path.resolve("cards");
const CONCURRENCY = 8;

const limitArg = process.argv.indexOf("--limit");
const limit = limitArg > 0 ? Number(process.argv[limitArg + 1]) : Infinity;

mkdirSync(OUT, { recursive: true });
const have = new Set(readdirSync(OUT));

const res = await fetch(LIST_URL);
if (!res.ok) throw new Error(`card list: HTTP ${res.status}`);
const list = await res.json();
const entries = Array.isArray(list) ? list : Object.values(list);

// Each print's file name, e.g. "BT1-084.webp", "BT1-084_P1.webp".
const names = new Set();
for (const c of entries) {
  const file = String(c.cardImage ?? "").split("/").pop() || (c.id ? `${c.id}.webp` : "");
  if (file.endsWith(".webp")) names.add(file.replace(/-Sample\.webp$/, ".webp"));
}

// Missing scans, plus the ones we only have as "-Sample" (the real one may exist now).
const todo = [...names].filter((f) => !have.has(f)).slice(0, limit);

async function download(url, dest) {
  const r = await fetch(url);
  if (!r.ok) return false;
  writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
  return true;
}

let downloaded = 0;
let samples = 0;
let missing = 0;
let next = 0;
async function worker() {
  while (next < todo.length) {
    const file = todo[next++];
    const sample = file.replace(/\.webp$/, "-Sample.webp");
    try {
      if (await download(`${IMAGE_BASE}/${file}`, path.join(OUT, file))) {
        downloaded++;
        // The real scan supersedes the sample.
        if (have.has(sample)) rmSync(path.join(OUT, sample));
      } else if (!have.has(sample) && (await download(`${IMAGE_BASE}/${sample}`, path.join(OUT, sample)))) {
        downloaded++;
        samples++;
      } else if (!have.has(sample)) {
        missing++;
      }
    } catch (e) {
      console.warn(`${file}: ${e.message}`);
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const left = [...names].filter((f) => !existsSync(path.join(OUT, f))).length;
console.log(`${names.size} prints listed · ${downloaded} downloaded (${samples} samples) · ${missing} with no scan yet · ${left} without a final scan`);
writeFileSync("downloaded.txt", String(downloaded));
