import { stat } from "node:fs/promises";

import { describe, expect } from "vitest";

import {
  createProject,
  listDirDeep,
  runCli,
  test,
} from "#tests/utils.js";

describe("tmp folder setup", () => {
  test("creates a temporary directory", async ({ tmpFolder }) => {
    const stats = await stat(tmpFolder);

    expect(stats.isDirectory()).toBe(true);
  });
});

describe("cli", () => {
  test("--help exits cleanly", async () => {
    const result = await runCli(["--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("unlibrary");
  });
});

test("copies a TS file with no dependencies", async ({ tmpFolder }) => {
  const { dir: projectDir } = await createProject(tmpFolder);

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
