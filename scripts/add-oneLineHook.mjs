import fs from "fs";
import vm from "vm";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sourcePath = path.join(root, "scripts", "merge-source", "cardsData.js");

const raw = fs.readFileSync(sourcePath, "utf8");
const full = vm.runInNewContext(`${raw}\n; cardsData;`, Object.create(null));

function normalizePhrase(text) {
  return text
    .replace(/^이 사람이 마음(이|을)\s*(흔들릴 때는|열기 쉬운 지점은)\s*/u, "")
    .replace(/^이 사람(이|을)\s*(마음이 흔들릴 때는|마음을 열기 쉬운 지점은)\s*/u, "")
    .replace(/^자신(을|의)\s*/u, "")
    .replace(/^단순(한|히)\s*/u, "")
    .replace(/(입니다|중요합니다|핵심입니다)\.?$/u, "")
    .trim();
}

function buildHook(trigger) {
  const normalized = normalizePhrase(String(trigger ?? ""));
  let segment = normalized.split(/[.!?]/u)[0]?.trim() ?? "";
  if (!segment) segment = "진심으로 이해받는 순간";
  if (segment.length > 34) {
    segment = `${segment.slice(0, 34).trim()}...`;
  }
  return `네가 마음을 여는 포인트, ${segment} 그걸 내가 놓치지 않을게.`;
}

for (const value of Object.values(full)) {
  if (!value || typeof value !== "object") continue;
  if (!value.loveStrategy || typeof value.loveStrategy !== "object") continue;
  for (const side of ["male", "female"]) {
    const entry = value.loveStrategy[side];
    if (!entry || typeof entry !== "object") continue;
    entry.oneLineHook = buildHook(entry.trigger);
  }
}

const jsObject = JSON.stringify(full, null, 2).replace(/"([^"]+)":/g, "$1:");
const output = `/** Canonical merged card source (basicCard + loveStrategy per 일주). Run \`node scripts/split-cards-data.mjs\` to regenerate data/cardsBasicData.js and data/cardsPremiumData.ts */\nconst cardsData = ${jsObject};\n`;

fs.writeFileSync(sourcePath, output, "utf8");
console.log("Updated oneLineHook for all loveStrategy male/female.");
