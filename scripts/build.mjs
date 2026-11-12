// Bundles the Action (src/main.ts → dist/index.js) and the command-line tool
// (src/cli.ts → dist/cli.js): plain CommonJS files with every dependency
// inlined, so they run from a checkout or a download without npm install.
// Commit dist/ after every source change; CI fails when it is stale.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSync } from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const OUTPUTS = [
  { entry: "src/main.ts", out: "dist/index.js", shebang: false, what: "GitHub Action" },
  { entry: "src/cli-main.ts", out: "dist/cli.js", shebang: true, what: "command-line tool" },
];

/**
 * esbuild names bundled packages by their path relative to this folder. A
 * checkout nested in another project can find them in a parent (or linked)
 * node_modules ("../node_modules/saxes/…"); writing them as "node_modules/…"
 * keeps the bundle byte-identical wherever it is built.
 */
function normalisePaths(code) {
  return code.replace(/(?:\.\.\/)+(?:[\w.@-]+\/)*?node_modules\//g, "node_modules/");
}

/** One bundle as text. */
export function bundleOne({ entry, shebang, what }) {
  const result = buildSync({
    absWorkingDir: root,
    entryPoints: [resolve(root, entry)],
    bundle: true,
    platform: "node",
    target: "node20",
    format: "cjs",
    write: false,
    minify: false,
    legalComments: "inline",
    charset: "utf8",
    logLevel: "silent",
    banner: {
      js:
        (shebang ? "#!/usr/bin/env node\n" : "") +
        `// Peppol UBL check by InvoiceVerify, ${what} (MIT). Built from src/ with \`npm run build\`; do not edit by hand.\n` +
        "// Bundled third-party code: saxes (ISC) and xmlchars (MIT), see THIRD_PARTY_LICENSES.md.",
    },
  });
  return normalisePaths(result.outputFiles[0].text);
}

/** Every bundle: [{ out, code }]. */
export function bundle() {
  return OUTPUTS.map((o) => ({ out: o.out, code: bundleOne(o) }));
}

// `node scripts/build.mjs` writes dist/; `--check` only compares and exits 1 when dist/ is stale.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes("--check");
  const stale = [];
  if (!check) mkdirSync(resolve(root, "dist"), { recursive: true });
  for (const { out, code } of bundle()) {
    const path = resolve(root, out);
    if (check) {
      if (!existsSync(path) || readFileSync(path, "utf8") !== code) stale.push(out);
    } else {
      writeFileSync(path, code);
      console.log(`${out}: ${code.length} bytes`);
    }
  }
  if (check) {
    if (stale.length) {
      console.error(`Stale: ${stale.join(", ")}. Run npm run build and commit dist/.`);
      process.exit(1);
    }
    console.log("dist/ is up to date");
  }
}
