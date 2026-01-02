import { expect } from "vitest";

import { listDirDeep, test } from "#tests/utils.js";

test("copies a TS file with no dependencies", async ({ projectDir, unlibrary }) => {
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
