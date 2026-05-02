import fs from "fs";

const s = fs.readFileSync("scripts/merge-source/cardsData.js", "utf8");
let d = 0;
let i = 0;
function lineOf(pos) {
  let n = 1;
  for (let k = 0; k < pos; k++) if (s[k] === "\n") n++;
  return n;
}

while (i < s.length) {
  const c = s[i];
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
  if (c === "{") d++;
  else if (c === "}") d--;
  i++;
}
console.log("final depth", d);
