import assert from "node:assert";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";

import { log } from "@clack/prompts";
import { removeTypes } from "babel-remove-types";
import { init, parse } from "es-module-lexer";

import { cwd } from "../consts.js";
import { isRelative, isVirtual } from "../imports.js";
import { cleanPath, isTSish, jsifyExtension } from "../path.js";

await init;

export async function extract({
  sourceFolder,
  info,
  filepath,
  outputFolder,
  javascript,
}) {
  log.info(`Extracting ${filepath}`);

  const fullPath = join(sourceFolder, filepath);

  assert(existsSync(fullPath), `Specified file does not exist: ${fullPath}`);

  await mkdir(join(cwd, outputFolder), { recursive: true });

  await importBasedCopy({ info, fullPath, outputFolder, javascript });
}

/*******************************
 *
 * Helpers
 *
 * ****************************/

/**
 * As we recurse here, we'll omit a bunch of sibling files (probably)
 * and potentially add dependencies to the package.json of the
 * host project, depending on the imports encountered.
 */
async function importBasedCopy({ info, javascript, fullPath, outputFolder }) {
  let base = basename(fullPath);

  if (javascript) {
    base = base.replace(/\.ts$/, ".js").replace(/\.gts$/, ".gjs");
  }

  const destinationPath = join(cwd, outputFolder, base);

  log.info(`cp ${cleanPath(fullPath)} to ${cleanPath(destinationPath)}`);

  const buffer = await readFile(fullPath);
  let contents = buffer.toString();

  if (!info.hasTypescript) {
    contents = await removeTypes(contents);
  }

  const [imports, exports] = parse(contents);

  const { external, relative } = filterImports({ imports, exports, info });

  for (const dep of external) {
    info.addDep(dep);
  }

  const pathsToWrite = {
    /* original => new */
  };

  for (const dep of relative) {
    const absolutePath = await resolveFile(dep, fullPath);

    if (isTSish(dep) && javascript) {
      const replacement = jsifyExtension(dep);

      pathsToWrite[dep] = replacement;
    }

    await importBasedCopy({
      info,
      javascript,
      fullPath: absolutePath,
      outputFolder,
    });
  }

  // Rewrite module specifiers using es-module-lexer indices.
  // As we mutate `contents`, we track a running offset.
  let offset = 0;

  for (const { n: original, s, e } of imports) {
    const replacement = pathsToWrite[original];

    if (!replacement) continue;

    const start = s + offset;
    const end = e + offset;
    const existing = contents.slice(start, end);

    // If this trips, the indices likely refer to a different slice than expected.
    assert(
      existing === original,
      `Unexpected import slice at [${start}, ${end}): expected '${original}', got '${existing}'`,
    );

    contents = `${contents.slice(0, start)}${replacement}${contents.slice(end)}`;
    offset += replacement.length - (e - s);
  }

  /**
   * TODO:
   * - rewrite relative imports
   * - crawl imports
   */
  await writeFile(destinationPath, contents);
}

function filterImports({ imports /* , exports, info */ }) {
  const external = [];
  const relative = [];

  for (const { n: importPath } of imports) {
    if (isRelative(importPath)) {
      relative.push(importPath);
      continue;
    }

    const depName = cleanImportPath(importPath);

    if (isVirtual(depName)) continue;

    external.push(depName);
  }

  return { external, relative };
}

export function cleanImportPath(importPath) {
  if (importPath.startsWith("@")) {
    const [scope, pkg] = importPath.split("/");

    return `${scope}/${pkg}`;
  }

  const [pkg] = importPath.split("/");

  return pkg;
}

const SUPPORTED_EXTENSIONS = new Set([
  ".js",
  ".ts",
  ".gts",
  ".json",
  ".mjs",
  ".cjs",
  ".gjs",
  ".css",
]);

async function resolveFile(importPath, fromPath) {
  const fromDir = dirname(fromPath);
  const existingExtension = extname(importPath);

  if (existingExtension) {
    const candidate = join(fromDir, importPath);

    assert(
      existsSync(candidate),
      `Unable to resolve import '${importPath}' from ${cleanPath(fromPath)} (tried ${cleanPath(candidate)})`,
    );

    return candidate;
  }

  for (const extension of SUPPORTED_EXTENSIONS) {
    const candidate = join(fromDir, `${importPath}${extension}`);

    if (existsSync(candidate)) {
      return candidate;
    }
  }

  assert(
    false,
    `Unable to resolve import '${importPath}' from ${cleanPath(fromPath)} (tried extensions: ${[...SUPPORTED_EXTENSIONS].join(", ")})`,
  );
}
