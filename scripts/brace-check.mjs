import fs from "fs";

const s = fs.readFileSync(
  new URL("./merge-source/cardsData.js", import.meta.url),
  "utf8",
);

let i = 0;
let inStr = null;
let esc = false;
let out = "";

while (i < s.length) {
  const c = s[i];
  if (inStr !== null) {
    out += " ";
    i++;
    if (esc) {
      esc = false;
      continue;
    }
    if (c === "\\") {
      esc = true;
      continue;
    }
    if (c === inStr) inStr = null;
    continue;
  }
  if (c === '"' || c === "'" || c === "`") {
    inStr = c;
    out += " ";
    i++;
    continue;
  }
  if (c === "/" && s[i + 1] === "/") {
    while (i < s.length && s[i] !== "\n") {
      out += " ";
      i++;
    }
    continue;
  }
  if (c === "/" && s[i + 1] === "*") {
    i += 2;
    while (i < s.length && !(s[i - 2] === "*" && s[i - 1] === "/")) i++;
    continue;
  }
  out += c;
  i++;
}

let bal = 0;
let min = 0;
for (const c of out) {
  if (c === "{") bal++;
  else if (c === "}") {
    bal--;
    min = Math.min(min, bal);
  }
}
console.log("final brace depth", bal, "min", min);
