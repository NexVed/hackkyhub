import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const srcDir = path.join("public", "gif");
const outDir = path.join("public", "hero-seq");
fs.mkdirSync(outDir, { recursive: true });

function frameIndex(name) {
  const match = name.match(/(\d+)\.png$/);
  return match ? Number(match[1].slice(-3)) : -1;
}

const files = fs
  .readdirSync(srcDir)
  .filter((file) => file.endsWith(".png"))
  .sort((a, b) => frameIndex(a) - frameIndex(b));

console.log("frames", files.length, "first", files[0], "last", files.at(-1));

let cursor = 0;
const concurrency = 6;
const started = Date.now();

async function worker() {
  while (cursor < files.length) {
    const idx = cursor++;
    const out = path.join(outDir, `${String(idx).padStart(3, "0")}.webp`);
    await sharp(path.join(srcDir, files[idx]))
      .resize({ width: 900, withoutEnlargement: true })
      .webp({ quality: 52, effort: 4 })
      .toFile(out);
    if (idx % 30 === 0) console.log("done", idx);
  }
}

await Promise.all(Array.from({ length: concurrency }, worker));

const outs = fs.readdirSync(outDir).filter((file) => file.endsWith(".webp"));
const sum = outs.reduce((total, file) => total + fs.statSync(path.join(outDir, file)).size, 0);
console.log(
  "outCount",
  outs.length,
  "totalMB",
  (sum / 1048576).toFixed(1),
  "elapsedMs",
  Date.now() - started,
);
