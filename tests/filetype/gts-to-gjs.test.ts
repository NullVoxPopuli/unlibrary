import { join } from "node:path";

import { expect, listDirDeep, readDeps, readFile, test } from "#vitest";

test("with no dependencies", async ({ projectDir, unlibrary }) => {
  await unlibrary({
    repo: "https://github.com/universal-ember/ember-primitives",
    filepath: "./ember-primitives/src/head.gts",
    outputFolder: "./src/primitives/",
    javascript: true,
  });

  expect(await listDirDeep(projectDir)).toMatchInlineSnapshot(`
        [
          "package.json",
          "src/primitives/head.gjs",
        ]
    `);
});

test("with a local import and external dependency", async ({
  projectDir,
  unlibrary,
}) => {
  expect(await readDeps(projectDir)).not.toContain("ember-element-helper");
  expect(await readDeps(projectDir)).not.toContain("ember-modifier");

  await unlibrary({
    repo: "https://github.com/universal-ember/ember-primitives",
    filepath: "./ember-primitives/src/viewport/in-viewport.gts",
    outputFolder: "./src/primitives/",
    javascript: true,
  });

  expect(await readDeps(projectDir)).toContain("ember-element-helper");
  expect(await readDeps(projectDir)).toContain("ember-modifier");
  expect(await listDirDeep(projectDir)).toMatchInlineSnapshot(`
      [
        "package.json",
        "src/primitives/in-viewport.gjs",
        "src/primitives/service.js",
        "src/primitives/store.js",
        "src/primitives/type-utils.js",
        "src/primitives/utils.js",
        "src/primitives/viewport.js",
      ]
    `);
  expect(
    await readFile(join(projectDir, "src/primitives/in-viewport.gjs")),
  ).toContain("./viewport.js");
});
