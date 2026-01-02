import { join } from "node:path";

import { expect, listDirDeep, readDeps, readFile, test } from "#vitest";

test("copies a TS file with no dependencies", async ({
  projectDir,
  unlibrary,
}) => {
  await unlibrary({
    repo: "https://github.com/universal-ember/ember-primitives",
    filepath: "./ember-primitives/src/qp.ts",
    outputFolder: "./src/primitives/",
  });

  expect(await listDirDeep(projectDir)).toMatchInlineSnapshot(`
		[
		  "package.json",
		  "src/primitives/qp.ts",
		]
	`);
});

test("copies a TS file with a local import and external dependency", async ({
  projectDir,
  unlibrary,
}) => {
  expect(await readDeps(projectDir)).not.toContain("reactiveweb");

  await unlibrary({
    repo: "https://github.com/universal-ember/ember-primitives",
    filepath: "./ember-primitives/src/store.ts",
    outputFolder: "./src/primitives/",
  });

  expect(await readDeps(projectDir)).toContain("reactiveweb");
  expect(await listDirDeep(projectDir)).toMatchInlineSnapshot(`
    [
      "package.json",
      "src/primitives/store.ts",
      "src/primitives/utils.ts",
    ]
  `);
  expect(await readFile(join(projectDir, "src/primitives/store.ts"))).toContain(
    "./utils.ts",
  );
});
