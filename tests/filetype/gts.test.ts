import { join } from "node:path";

import { expect, listDirDeep, readDeps, readFile, test } from "#vitest";

test("with no dependencies", async ({ projectDir, unlibrary }) => {
  await unlibrary({
    repo: "https://github.com/universal-ember/ember-primitives",
    filepath: "./ember-primitives/src/head.gts",
    outputFolder: "./src/primitives/",
  });

  expect(await listDirDeep(projectDir)).toMatchInlineSnapshot(`
        [
          "package.json",
          "src/primitives/head.gts",
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
  });

  expect(await readDeps(projectDir)).toContain("ember-element-helper");
  expect(await readDeps(projectDir)).toContain("ember-modifier");
  expect(await listDirDeep(projectDir)).toMatchInlineSnapshot(`
      [
        "package.json",
        "src/primitives/in-viewport.gts",
        "src/primitives/service.ts",
        "src/primitives/store.ts",
        "src/primitives/type-utils.ts",
        "src/primitives/utils.ts",
        "src/primitives/viewport.ts",
      ]
    `);
  expect(
    await readFile(join(projectDir, "src/primitives/in-viewport.gts")),
  ).toContain("./viewport.ts");
  expect(
    await readFile(join(projectDir, "src/primitives/viewport.ts")),
  ).toContain("./service.ts");
  expect(
    await readFile(join(projectDir, "src/primitives/viewport.ts")),
  ).not.toContain("../service.ts");
});
