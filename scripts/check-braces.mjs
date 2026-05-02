import fs from "fs";

const s = fs.readFileSync("scripts/merge-source/cardsData.js", "utf8");
// Strip // comments and string literals (rough) for brace count
let t = s.replace(/\/\/.*$/gm, "");
t = t.replace(/"(?:[^"\\]|\\.)*"/g, '""');
t = t.replace(/'(?:[^'\\]|\\.)*'/g, "''");
let bal = 0;
for (const c of t) {
  if (c === "{") bal++;
  if (c === "}") bal--;
}
console.log("brace balance (strings stripped):", bal);
