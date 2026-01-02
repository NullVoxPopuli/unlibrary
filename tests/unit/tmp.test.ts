import { stat } from "node:fs/promises";

import { expect } from "vitest";

import { test } from "#tests/utils.js";

test("creates a temporary directory", async ({ tmpFolder }) => {
    const stats = await stat(tmpFolder);

    expect(stats.isDirectory()).toBe(true);
});
