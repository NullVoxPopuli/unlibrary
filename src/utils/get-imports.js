import { init, parse } from "es-module-lexer";

import { isRelative, isVirtual } from "./imports.js";

await init;

export async function getImports(contents, { ext }) {
  if (ext === ".gts" || ext === ".gjs") {
    const { prepareForImportAnalysis } = await import("#utils/ember.js");

    contents = await prepareForImportAnalysis(contents);
  }

  const [imports, exports] = parse(contents);

  const { external, relative } = filterImports({ imports });

  return { imports, exports, external, relative };
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
