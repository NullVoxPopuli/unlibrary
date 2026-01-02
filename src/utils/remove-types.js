import { substringBytes } from "./buffer.js";

/**
 * Inspired by https://github.com/ember-cli/ember-cli/blob/8ea5b2e22d37805f5749a4917e0ef25fac3c9cda/lib/models/blueprint.js#L537
 * @param {*} extension
 * @param {*} code
 * @returns
 */
export async function removeTypes(extension, code) {
  const { removeTypes } = await import("babel-remove-types");

  if (extension === ".gts") {
    const { wrappedRemoveTypes } = await import("#utils/ember.js");

    return await wrappedRemoveTypes(code, (strippedCode) =>
      removeTypes(strippedCode),
    );
  }

  return await removeTypes(code);
}
