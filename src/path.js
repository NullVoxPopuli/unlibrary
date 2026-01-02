import { resolve } from "node:path";

import { cwd } from "./consts.js";

export function cleanPath(fullPath) {
  return fullPath.replace(cwd, ".");
}

export function cachePathFor(name, tag) {
  const base = cacheBasename(name, tag);

  const dir = resolve(
    process.cwd(),
    "node_modules",
    ".cache",
    "unlibrary",
    base,
  );

  return dir;
}

export function isTSish(path) {
  return path.endsWith(".ts") || path.endsWith(".gts");
}

export function jsifyExtension(path) {
  if (path.endsWith(".ts")) {
    return path.replace(/\.ts$/, ".js");
  }

  if (path.endsWith(".gts")) {
    return path.replace(/\.gts$/, ".gjs");
  }

  return path;
}

/*******************************
 *
 * Helpers
 *
 * ****************************/

function cacheBasename(name, tag) {
  const cleaned = sanitizeName(name);

  if (tag) {
    return `cleaned-${tag}`;
  }

  return cleaned;
}

/**
 * name could be a URL
 */
function sanitizeName(name) {
  if (name.includes("/")) {
    const lastSlash = name.split("/").at(-1);

    return lastSlash.replace(".git", "");
  }

  return name;
}
