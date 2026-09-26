#!/usr/bin/env node
/**
 * Check this package's import surface against an installed harness tree.
 *
 * The plugin is a prebuilt artefact that links its `@deepseek-ai/*` peers at
 * load time, and a single missing named export makes an ES module fail to
 * *link*: the whole entry dies before any runtime capability probe can run. This
 * script catches exactly that class of breakage without booting anything — it
 * extracts every import this package makes and resolves the names against the
 * harness tree you point it at.
 *
 * Usage:
 *   node scripts/compat-check.mjs --modules <dsh-install>/node_modules
 *   node scripts/compat-check.mjs --modules <dir> --json
 *
 * Three outcomes, not two:
 *   - `absent module (host)` — a Node-resolved import `lib/index.js` makes that
 *     the tree does not provide. This is breakage, and it fails the run.
 *   - `MISSING <name>` — a name that module does not export. Also breakage.
 *   - `loader-provided` — a client-side specifier the browser's module registry
 *     supplies rather than `node_modules`. Measured, not assumed: the set is this
 *     package's own `lib/build-info.json` `clientExternals` plus `react` and the
 *     specifiers the harness's *own* `@deepseek-ai/dsh-client-*` modules
 *     `require()`. On `0.1.6`, 45 of those packages require
 *     `@deepseek-ai/dsh-client-store` and `@deepseek-ai/dsh-client-ui-primitives`
 *     while no package of either name is installed, and the string is present in
 *     `dsh-web-frontend`'s built asset: the frontend bundles them. Reporting them
 *     as missing would be a false positive on every tree that predates their
 *     publication.
 *
 * Repository-only tool: the published tarball ships `lib/` and has no scripts.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");

/** Files whose import surface is audited, in the order they are reported. */
const TARGETS = [
  { file: join(ROOT, "lib", "index.js"), kind: "host", specifiers: (text) => staticImports(text) },
  { file: join(ROOT, "lib", "client.js"), kind: "client", specifiers: (text) => requireCalls(text) }
];

function parseArgs(argv) {
  const parsed = { modules: undefined, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--modules") parsed.modules = argv[++index];
    else if (arg === "--json") parsed.json = true;
    else if (arg === "--help" || arg === "-h") parsed.help = true;
    else throw new Error(`unknown argument ${JSON.stringify(arg)}`);
  }
  return parsed;
}

/**
 * Blank out comments, keeping string literals and their contents.
 *
 * Needed because the source is a bundle of documented modules: a doc comment
 * containing the words `import` and `from` makes the statement regexes below
 * match prose and report a phantom module. String contents are preserved
 * because a specifier *is* a string, and a scanner rather than a two-regex
 * strip because `"https://…"` contains the characters a line-comment strip
 * would mistake for a comment.
 * @param text - source text to read imports out of.
 * @returns the same text with comment bodies removed and newlines kept.
 */
function stripComments(text) {
  let out = "";
  let index = 0;
  const length = text.length;
  while (index < length) {
    const char = text[index];
    const next = text[index + 1];
    if (char === "/" && next === "*") {
      const end = text.indexOf("*/", index + 2);
      const stop = end === -1 ? length : end + 2;
      for (let i = index; i < stop; i += 1) if (text[i] === "\n") out += "\n";
      index = stop;
      continue;
    }
    if (char === "/" && next === "/") {
      const end = text.indexOf("\n", index);
      index = end === -1 ? length : end;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      out += char;
      index += 1;
      while (index < length) {
        if (text[index] === "\\") {
          out += text.slice(index, index + 2);
          index += 2;
          continue;
        }
        out += text[index];
        if (text[index] === char) {
          index += 1;
          break;
        }
        index += 1;
      }
      continue;
    }
    out += char;
    index += 1;
  }
  return out;
}

/** Every static `import ... from "spec"` specifier, plus dynamic `import("spec")`. */
function staticImports(text) {
  const found = new Map();
  const code = stripComments(text);
  for (const match of code.matchAll(/(?:^|[^.\w$])import\s+([\s\S]*?)\s+from\s+["']([^"']+)["']/g)) {
    const clause = match[1].trim();
    // A namespace binding (`* as ns`) binds the module object, not a named
    // export, and `*` alone is recorded so the module is still resolved.
    if (/^\*\s+as\s+/.test(clause)) {
      add(found, match[2], "*");
      continue;
    }
    const braced = clause.match(/\{([\s\S]*?)\}/)?.[1] ?? "";
    for (const part of braced.split(",")) {
      const trimmed = part.trim();
      if (trimmed === "") continue;
      add(found, match[2], trimmed.split(/\s+as\s+/)[0].trim());
    }
    const defaultBinding = clause.replace(/\{[\s\S]*?\}/g, "").replace(/,/g, " ").trim();
    if (defaultBinding.length > 0 && !defaultBinding.startsWith("*")) add(found, match[2], "default");
  }
  for (const match of code.matchAll(/(?:^|[^.\w])import\s*\(\s*["']([^"']+)["']\s*\)/g)) add(found, match[1], "*");
  return found;
}

/** Every `require("spec")` specifier — the shape the client factory uses. */
function requireCalls(text) {
  const found = new Map();
  for (const match of stripComments(text).matchAll(/(?:^|[^.\w])require\s*\(\s*["']([^"']+)["']\s*\)/g)) add(found, match[1], "*");
  return found;
}

function add(map, specifier, name) {
  if (!map.has(specifier)) map.set(specifier, new Set());
  map.get(specifier).add(name);
}

/** Node builtins and relative paths are not the harness's to provide. */
function isBuiltin(specifier) {
  return specifier.startsWith("node:") || specifier.startsWith(".");
}

/** Bundled into the web frontend, so never present in `node_modules` on any tree. */
const ALWAYS_LOADER_PROVIDED = new Set(["react", "react-dom", "react/jsx-runtime"]);

/** The modules the client bundle was built to expect from the loader, as built. */
function declaredClientExternals() {
  const file = join(ROOT, "lib", "build-info.json");
  if (!existsSync(file)) return [];
  try {
    const manifest = JSON.parse(readFileSync(file, "utf8"));
    return Array.isArray(manifest.clientExternals) ? manifest.clientExternals : [];
  } catch {
    return [];
  }
}

/**
 * Every specifier the browser's module registry supplies.
 *
 * Seeded from this package's own `lib/build-info.json`, which records the
 * externals the client bundle was built against — the authoritative answer —
 * and widened by reading the harness's own client modules: if the harness ships
 * a client module that requires a specifier, the registry resolves it for
 * plugins too, whether or not the harness publishes a package of that name.
 * @param modules - absolute path to the harness's `node_modules`.
 * @returns the specifier set; computed once per run.
 */
let loaderProvidedCache;
function loaderProvided(modules) {
  if (loaderProvidedCache !== undefined) return loaderProvidedCache;
  const found = new Set(ALWAYS_LOADER_PROVIDED);
  for (const specifier of declaredClientExternals()) found.add(specifier);
  const scope = join(modules, "@deepseek-ai");
  if (existsSync(scope)) {
    for (const entry of readdirSync(scope)) {
      if (!entry.startsWith("dsh-client-")) continue;
      const file = join(scope, entry, "lib", "client.js");
      if (!existsSync(file)) continue;
      for (const specifier of requireCalls(readFileSync(file, "utf8")).keys()) found.add(specifier);
    }
  }
  loaderProvidedCache = found;
  return found;
}

/** Pick the file an `exports` map entry names, following a `*` pattern. */
function exportsTargets(exports, subpath) {
  const keys = Object.keys(exports);
  const exact = keys.find((key) => key === subpath);
  const candidates = exact !== undefined ? [exact] : keys.filter((key) => key.includes("*") && matchesPattern(key, subpath));
  return { candidates, wildcard: exact === undefined };
}

function matchesPattern(key, subpath) {
  const [prefix, suffix = ""] = key.split("*");
  return subpath.startsWith(prefix) && subpath.endsWith(suffix) && subpath.length >= prefix.length + suffix.length;
}

/** Replace the `*` in an exports target with the part the pattern matched. */
function substituteStar(target, key, subpath) {
  const [prefix, suffix = ""] = key.split("*");
  return target.replace("*", subpath.slice(prefix.length, subpath.length - suffix.length));
}

/** Resolve one specifier to an absolute JS file under `modules`, following `exports`. */
function resolveSpecifier(modules, specifier) {
  if (specifier.startsWith("node:") || specifier.startsWith(".")) return undefined;
  let packageName = specifier;
  let subpath = ".";
  if (specifier.startsWith("@")) {
    const [scope, name, ...rest] = specifier.split("/");
    packageName = `${scope}/${name}`;
    if (rest.length > 0) subpath = `./${rest.join("/")}`;
  } else if (specifier.includes("/")) {
    const [name, ...rest] = specifier.split("/");
    packageName = name;
    subpath = `./${rest.join("/")}`;
  }
  const dir = join(modules, packageName);
  if (!existsSync(dir)) return undefined;
  const manifestPath = join(dir, "package.json");
  if (!existsSync(manifestPath)) return undefined;
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (manifest.exports !== undefined) {
    const { candidates, wildcard } = exportsTargets(manifest.exports, subpath);
    for (const key of candidates) {
      const entry = manifest.exports[key];
      const declared = typeof entry === "string" ? entry : entry.default ?? entry.import ?? entry.require;
      if (typeof declared !== "string") continue;
      const target = wildcard ? substituteStar(declared, key, subpath) : declared;
      const file = join(dir, target);
      if (existsSync(file)) return file;
    }
    return undefined;
  }
  if (subpath !== ".") {
    const file = join(dir, subpath);
    if (existsSync(file) && statSync(file).isFile()) return file;
    return undefined;
  }
  const main = manifest.module ?? manifest.main ?? "index.js";
  const file = join(dir, main);
  return existsSync(file) ? file : undefined;
}

const EXPORT_BLOCK = /export\s*\{([^}]*)\}(?:\s*from\s*["']([^"']+)["'])?/g;
const EXPORT_DECL = /export\s+(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z0-9_$]+)/g;
const EXPORT_STAR = /export\s*\*\s*(?:as\s+([A-Za-z0-9_$]+)\s*)?from\s*["']([^"']+)["']/g;

/**
 * Every name one module exports, following `export *` re-exports.
 * @param file - absolute module file to read.
 * @param seen - files already visited, so a re-export cycle terminates.
 * @returns export names, with `default` when the module declares one.
 */
function exportNames(file, seen = new Set()) {
  if (seen.has(file)) return new Set();
  seen.add(file);
  const text = readFileSync(file, "utf8");
  const names = new Set();
  for (const match of text.matchAll(EXPORT_BLOCK)) {
    for (const part of match[1].split(",")) {
      const trimmed = part.trim();
      if (trimmed === "") continue;
      const alias = trimmed.split(/\s+as\s+/);
      names.add((alias[1] ?? alias[0]).trim());
    }
  }
  for (const match of text.matchAll(EXPORT_DECL)) names.add(match[1]);
  if (/export\s+default\b/.test(text)) names.add("default");
  for (const match of text.matchAll(EXPORT_STAR)) {
    if (match[1] !== undefined) {
      names.add(match[1]);
      continue;
    }
    const target = match[2].startsWith(".")
      ? resolve(dirname(file), match[2])
      : undefined;
    if (target !== undefined && existsSync(target)) for (const name of exportNames(target, seen)) names.add(name);
  }
  return names;
}

/** The `dsh.client.inject` list, which the host resolves the same way. */
function declaredClientInjects() {
  const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  return manifest.dsh?.client?.inject ?? [];
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.modules === undefined) {
    process.stdout.write("usage: node scripts/compat-check.mjs --modules <dsh-install>/node_modules [--json]\n");
    process.exitCode = args.help ? 0 : 2;
    return;
  }
  const modules = resolve(args.modules);
  if (!existsSync(modules)) throw new Error(`no such directory: ${modules}`);

  const report = { modules, files: [], missing: [], absent: [], unresolved: [], loaderProvided: [], ok: true };
  const specs = [];
  for (const target of TARGETS) {
    const text = readFileSync(target.file, "utf8");
    report.files.push({ file: relative(ROOT, target.file).replaceAll("\\", "/"), kind: target.kind });
    for (const [specifier, names] of target.specifiers(text)) specs.push({ specifier, names, origin: target.kind });
  }
  for (const specifier of declaredClientInjects()) specs.push({ specifier, names: new Set(["*"]), origin: "dsh.client.inject" });

  for (const { specifier, names, origin } of specs) {
    if (isBuiltin(specifier)) continue;
    const file = resolveSpecifier(modules, specifier);
    if (file === undefined) {
      if (origin === "host") {
        report.ok = false;
        report.absent.push({ specifier, origin });
      } else if (loaderProvided(modules).has(specifier)) {
        report.loaderProvided.push({ specifier, origin });
      } else {
        report.unresolved.push({ specifier, origin, names: [...names] });
      }
      continue;
    }
    const exported = exportNames(file);
    const absent = [...names].filter((name) => name !== "*" && !exported.has(name));
    if (absent.length > 0) {
      report.ok = false;
      report.missing.push({ specifier, origin, names: absent, resolved: relative(modules, file).replaceAll("\\", "/") });
    }
  }

  if (args.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    for (const entry of report.files) process.stdout.write(`audited ${entry.kind}: ${entry.file}\n`);
    for (const entry of report.absent) {
      process.stdout.write(`ABSENT MODULE  ${entry.specifier} (${entry.origin}) — this tree does not provide it; a host import cannot link\n`);
    }
    for (const entry of report.missing) {
      process.stdout.write(`MISSING  ${entry.specifier} (${entry.origin}): ${entry.names.join(", ")}\n           resolved to ${entry.resolved}\n`);
    }
    for (const entry of report.unresolved) {
      process.stdout.write(`unresolved  ${entry.specifier} (${entry.origin}) — not provided by this tree\n`);
    }
    for (const entry of report.loaderProvided) {
      process.stdout.write(`loader-provided  ${entry.specifier} (${entry.origin}) — bundled into the web frontend, not a node_modules package\n`);
    }
    process.stdout.write(
      report.ok
        ? `\nOK: every import this package makes is exported by the tree at ${modules}\n`
        : `\nFAIL: ${report.missing.length} missing name(s), ${report.absent.length} absent host module(s)\n`
    );
  }
  process.exitCode = report.ok ? 0 : 1;
}

main();
