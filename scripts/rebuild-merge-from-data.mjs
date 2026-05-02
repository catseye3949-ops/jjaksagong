/**
 * Rebuilds scripts/merge-source/cardsData.js from data/cardsBasicData.js
 * and data/cardsPremiumData.ts (read-only). Does not modify the data files.
 */
import fs from "fs";
import vm from "vm";
import path from "path";
import { fileURLToPath } from "url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function toJsObject(obj, indent = 2) {
  return JSON.stringify(obj, null, indent).replace(/"([^"]+)":/g, "$1:");
}

const basicPath = path.join(root, "data", "cardsBasicData.js");
const premPath = path.join(root, "data", "cardsPremiumData.ts");

const basicSrc = fs.readFileSync(basicPath, "utf8");
const basicCode = basicSrc.replace(
  /export const cardsBasicData\s*=\s*/,
  "var cardsBasicData = ",
);
const ctx = vm.createContext({});
vm.runInContext(basicCode, ctx);
const basic = ctx.cardsBasicData;
if (!basic || typeof basic !== "object")
  throw new Error("Failed to load cardsBasicData");

let premText = fs.readFileSync(premPath, "utf8");
premText = premText.replace(/import\s+["']server-only["'];?\s*/g, "");
premText = premText.replace(
  /export const cardsPremiumData\s*=\s*/,
  "var cardsPremiumData = ",
);
const premJs = ts.transpileModule(premText, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.None,
    removeComments: false,
  },
}).outputText;
vm.runInContext(premJs, ctx);
const premium = ctx.cardsPremiumData;
if (!premium || typeof premium !== "object")
  throw new Error("Failed to load cardsPremiumData");

const keys = [
  ...Object.keys(basic),
  ...Object.keys(premium).filter((k) => !Object.prototype.hasOwnProperty.call(basic, k)),
];

const cardsData = {};
for (const k of keys) {
  const b = basic[k];
  const p = premium[k];
  if (!b?.basicCard) {
    console.warn(`Skip ${k}: missing basicCard in basic data`);
    continue;
  }
  if (!p?.loveStrategy?.male || !p?.loveStrategy?.female) {
    console.warn(`Skip ${k}: missing loveStrategy male/female in premium data`);
    continue;
  }
  cardsData[k] = {
    basicCard: b.basicCard,
    loveStrategy: p.loveStrategy,
  };
}

const outPath = path.join(root, "scripts", "merge-source", "cardsData.js");
const header = `/** Canonical merged card source (basicCard + loveStrategy per 일주). Rebuilt from data/cardsBasicData.js + data/cardsPremiumData.ts. Run 'node scripts/split-cards-data.mjs' to rewrite data after manual merge edits. */
`;
const body = `const cardsData = ${toJsObject(cardsData, 2)};\n`;
fs.writeFileSync(outPath, header + body, "utf8");
console.log("Wrote", path.relative(root, outPath), "keys:", Object.keys(cardsData).length);
