import fs from "fs";

const s = fs.readFileSync("scripts/merge-source/cardsData.js", "utf8");
let depth = 0;
let i = 0;
let line = 1;
const lineDepth = [];

while (i < s.length) {
  const c = s[i];
  if (c === "\n") {
    lineDepth[line] = depth;
    line++;
    i++;
    continue;
  }
  if (c === "/" && s[i + 1] === "/") {
    i += 2;
    while (i < s.length && s[i] !== "\n") i++;
    continue;
  }
  if (c === "/" && s[i + 1] === "*") {
    i += 2;
    while (i < s.length && !(s[i] === "*" && s[i + 1] === "/")) i++;
    i += 2;
    continue;
  }
  if (c === '"') {
    i++;
    while (i < s.length) {
      if (s[i] === "\\") {
        i += 2;
        continue;
      }
      if (s[i] === '"') {
        i++;
        break;
      }
      i++;
    }
    continue;
  }
  if (c === "'") {
    i++;
    while (i < s.length) {
      if (s[i] === "\\") {
        i += 2;
        continue;
      }
      if (s[i] === "'") {
        i++;
        break;
      }
      i++;
    }
    continue;
  }
  if (c === "{") depth++;
  else if (c === "}") depth--;
  i++;
}
lineDepth[line] = depth;

console.log("final depth", depth);
for (let L = Math.max(1, line - 25); L <= line; L++) {
  console.log(String(L).padStart(4), "depth", lineDepth[L] ?? "?");
}
