import { isEmberVirtual } from "./ember.js";

export function isRelative(importPath) {
  return importPath.startsWith(".");
}

export function isParentRelative(importPath) {
  return importPath.startsWith("..");
}

/**
 * Some vite plugins provide access to imports that are not real packages
 */
export function isVirtual(importPath) {
  if (importPath.startsWith("virtual:")) return true;

  if (isEmberVirtual(importPath)) return true;

  return false;
}
