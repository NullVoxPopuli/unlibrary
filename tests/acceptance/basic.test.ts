import { stat } from "node:fs/promises";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import {
  cleanupDir,
  createProject,
  createTmpFolder,
  listDirDeep,
  runCli,
} from "#tests/utils.js";

let tmpFolder: string;

beforeEach(async () => {
  tmpFolder = await createTmpFolder();
});

afterEach(async () => {
  await cleanupDir(tmpFolder);
});

describe("tmp folder setup", () => {
  test("creates a temporary directory", async () => {
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

test("copies a TS file with no dependencies", async () => {
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
