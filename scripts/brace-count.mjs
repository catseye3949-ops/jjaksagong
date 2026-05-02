import fs from "fs";

let s = fs.readFileSync("scripts/merge-source/cardsData.js", "utf8");
s = s.replace(/\/\/[^\n]*/g, "");
s = s.replace(/"(?:[^"\\]|\\.)*"/g, '""');
s = s.replace(/'(?:[^'\\]|\\.)*'/g, "''");
let d = 0;
for (const c of s) {
  if (c === "{") d++;
  if (c === "}") d--;
}
console.log("brace balance (quotes stripped):", d);
