import assert from "node:assert";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

import { log } from "@clack/prompts";
import { removeTypes } from "babel-remove-types";
import { init, parse } from "es-module-lexer";

import { cwd } from "../consts.js";
import { isRelative, isVirtual } from "../imports.js";
import { cleanPath } from "../path.js";

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
    contents = await removeTypes(contents, false);
  }

  const [imports, exports] = parse(contents);

  const deps = findDependencies({ imports, exports, info });

  for (const dep of deps) {
    info.addDep(dep);
  }

  /**
   * TODO:
   * - rewrite relative imports
   * - crawl imports
   */
  await writeFile(destinationPath, contents);
}

function findDependencies({ imports /* , exports, info */ }) {
  const result = [];

  for (const { n: importPath } of imports) {
    if (isRelative(importPath)) continue;

    const depName = cleanImportPath(importPath);

    if (isVirtual(depName)) continue;

    result.push(importPath);
  }

  return result;
}

export function cleanImportPath(importPath) {
  if (importPath.startsWith("@")) {
    const [scope, pkg] = importPath.split("/");

    return `${scope}/${pkg}`;
  }

  const [pkg] = importPath.split("/");

  return pkg;
}
