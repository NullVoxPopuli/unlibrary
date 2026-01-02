import { expect } from "vitest";

import { listDirDeep, runCli, test } from "#tests/utils.js";

test("copies a TS file with no dependencies", async ({ projectDir }) => {
  await runCli(
    [
      "--repo",
      "https://github.com/universal-ember/ember-primitives",
      "--filepath",
      "./ember-primitives/src/qp.ts",
      "--output-folder",
      "./src/primitives/",
    ],
    { cwd: projectDir },
  );

  expect(await listDirDeep(projectDir)).toMatchInlineSnapshot(`
		[
		  "package.json",
		  "src/primitives/qp.ts",
		]
	`);
});
