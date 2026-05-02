import fs from "fs";

const s = fs.readFileSync("scripts/merge-source/cardsData.js", "utf8");
let depth = 0;
let inStr = null; // " ' `
let esc = false;
const lineDepths = [];
let line = 1,
  col = 0;

function pushLineDepth() {
  if (!lineDepths[line - 1]) lineDepths[line - 1] = [];
  lineDepths[line - 1].push(depth);
}

for (let i = 0; i < s.length; i++) {
  const c = s[i];
  const next = s[i + 1];
  col++;
  if (c === "\n") {
    line++;
    col = 0;
    continue;
  }
  if (inStr) {
    if (esc) {
      esc = false;
      continue;
    }
    if (c === "\\" && (inStr === '"' || inStr === "'" || inStr === "`")) {
      esc = true;
      continue;
    }
    if (c === inStr) {
      if (inStr === "`" && next === "`" && s[i - 1] === "`")
        /* ignore */;
      inStr = null;
    }
    if (inStr === "`" && c === "$" && next === "{") {
      /* template — simplify: stay in string for now, bump i when we see } for nested - skip for this rough tool */
    }
    continue;
  }
  if (c === "/" && next === "/") {
    while (i < s.length && s[i] !== "\n") i++;
    line++;
    col = 0;
    continue;
  }
  if (c === '"' || c === "'" || c === "`") {
    inStr = c;
    continue;
  }
  if (c === "{") {
    depth++;
  } else if (c === "}") {
    depth--;
  }
  if (i > 0 && s[i - 1] === "\n" && c !== "\n") {
    /* start of line content */
  }
}

console.log("final depth", depth);
// sample line starts: track depth at each newline
let d = 0;
inStr = null;
esc = false;
line = 1;
const atLineStart = [0];
for (let i = 0; i < s.length; i++) {
  const c = s[i];
  const next = s[i + 1];
  if (c === "\n") {
    atLineStart[line] = d;
    line++;
    continue;
  }
  if (inStr) {
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
  if (c === "/" && next === "/") {
    while (i < s.length && s[i] !== "\n") i++;
    atLineStart[line] = d;
    line++;
    continue;
  }
  if (c === '"' || c === "'" || c === "`") {
    inStr = c;
    continue;
  }
  if (c === "{") d++;
  else if (c === "}") d--;
}
atLineStart[line] = d;
console.log("depth at EOF line", atLineStart[line], "total lines", line);
