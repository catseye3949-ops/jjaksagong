import fs from "fs";
import vm from "vm";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
/** Legacy merged file (basicCard + loveStrategy per pillar). Edit here, then run this script. */
const srcPath = path.join(root, "scripts", "merge-source", "cardsData.js");
const raw = fs.readFileSync(srcPath, "utf8");

/**
 * Tracks `{`/`}` and `[`/`]` depth while skipping strings and comments.
 * Records depth at each physical line end so diagnostics align with editor line numbers.
 *
 * On `\n`: saves depth for the line being completed, then advances line.
 * After EOF: saves depth for the last line (with or without trailing `\n`).
 *
 * @returns {{ lineCount: number, braceDepthAtLineEnd: number[], bracketDepthAtLineEnd: number[] }}
 */
function computeLineEndBraceBracketDepths(source) {
  let braceDepth = 0;
  let bracketDepth = 0;
  let line = 1;
  const braceDepthAtLineEnd = [];
  const bracketDepthAtLineEnd = [];

  const flushEndOfCurrentLine = () => {
    braceDepthAtLineEnd[line] = braceDepth;
    bracketDepthAtLineEnd[line] = bracketDepth;
  };

  let i = 0;
  while (i < source.length) {
    const c = source[i];

    if (c === "\n") {
      flushEndOfCurrentLine();
      line++;
      i++;
      continue;
    }

    if (c === "/" && source[i + 1] === "/") {
      i += 2;
      while (i < source.length && source[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && source[i + 1] === "*") {
      i += 2;
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (c === '"') {
      i++;
      while (i < source.length) {
        if (source[i] === "\\") {
          i += 2;
          continue;
        }
        if (source[i] === '"') {
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    if (c === "'") {
      i++;
      while (i < source.length) {
        if (source[i] === "\\") {
          i += 2;
          continue;
        }
        if (source[i] === "'") {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    if (c === "{") braceDepth++;
    else if (c === "}") braceDepth--;
    else if (c === "[") bracketDepth++;
    else if (c === "]") bracketDepth--;

    i++;
  }

  flushEndOfCurrentLine();

  return {
    lineCount: line,
    braceDepthAtLineEnd,
    bracketDepthAtLineEnd,
  };
}

/** VM wraps source as `${raw}\n; cardsData;` — map 1-based VM line to merge-source line (or null if synthetic tail). */
function vmLineToMergeSourceLine(vmLine1Based, mergeSourceLineCount) {
  if (vmLine1Based == null || vmLine1Based < 1) return null;
  if (vmLine1Based <= mergeSourceLineCount) return vmLine1Based;
  return null;
}

function extractVmSyntaxErrorLine(err) {
  const stack = String(err?.stack ?? "");
  const message = String(err?.message ?? "");
  /** Prefer VM script positions only — avoid matching stack frames like `node:vm:117:7`. */
  const vmLoc =
    stack.match(/evalmachine\.<anonymous>:(\d+)(?::(\d+))?/) ||
    message.match(/evalmachine\.<anonymous>:(\d+)(?::(\d+))?/) ||
    `${message}\n${stack}`.match(/\(<anonymous>:(\d+):(\d+)\)/);
  if (!vmLoc) return { line: null, column: null };
  return {
    line: Number(vmLoc[1]),
    column: vmLoc[2] != null ? Number(vmLoc[2]) : null,
  };
}

const code = `${raw}\n; cardsData;`;

const lineMeta = computeLineEndBraceBracketDepths(raw);
const mergeSourceLineCount = lineMeta.lineCount;

let full;
try {
  full = vm.runInNewContext(code, Object.create(null));
} catch (err) {
  const { line: vmLine, column: vmCol } = extractVmSyntaxErrorLine(err);
  const sourceLine = vmLineToMergeSourceLine(vmLine, mergeSourceLineCount);
  const rel = path.relative(root, srcPath);
  console.error(`Syntax error while evaluating ${rel}`);
  if (sourceLine != null) {
    console.error(
      `  Location (merge source file): line ${sourceLine}, column ${vmCol ?? "?"}`,
    );
    const bd = lineMeta.braceDepthAtLineEnd[sourceLine];
    const pk = lineMeta.bracketDepthAtLineEnd[sourceLine];
    if (bd !== undefined || pk !== undefined) {
      console.error(
        `  Depth at end of that line: {} depth ${bd ?? "?"}, [] depth ${pk ?? "?"}`,
      );
    }
  } else if (vmLine != null) {
    console.error(
      `  VM reported line ${vmLine} (outside merge file ${mergeSourceLineCount} lines — likely the injected '; cardsData;' tail)`,
    );
  }
  console.error(err);
  process.exit(1);
}

const basic = {};
const premium = {};
for (const [k, v] of Object.entries(full)) {
  if (!v || typeof v !== "object") continue;
  if (k.includes("_")) continue;
  if (!v.basicCard || !v.loveStrategy) continue;
  basic[k] = { basicCard: v.basicCard };
  premium[k] = { loveStrategy: v.loveStrategy };
}

function toJsObject(obj, indent = 2) {
  return JSON.stringify(obj, null, indent).replace(/"([^"]+)":/g, "$1:");
}

const basicOut = `/** Auto-generated from data/cardsData.js — edit source then re-run scripts/split-cards-data.mjs */\nexport const cardsBasicData = ${toJsObject(basic)};\n`;
const premiumOut = `import "server-only";\n\n/** Server-only. Do not import from client components. */\nexport const cardsPremiumData = ${toJsObject(premium)};\n`;

fs.writeFileSync(path.join(root, "data", "cardsBasicData.js"), basicOut, "utf8");
fs.writeFileSync(path.join(root, "data", "cardsPremiumData.ts"), premiumOut, "utf8");
console.log("Wrote data/cardsBasicData.js and data/cardsPremiumData.ts");
console.log("Keys:", Object.keys(basic).join(", "));
