import { stat } from "node:fs/promises";

import { expect, test } from "#vitest";

test("creates a temporary directory", async ({ tmpFolder }) => {
  const stats = await stat(tmpFolder);

  expect(stats.isDirectory()).toBe(true);
});
