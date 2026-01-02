import { describe, expect } from "vitest";

import { runCli, test } from "#tests/utils.js";

describe("cli", () => {
  test("--help exits cleanly", async () => {
    const result = await runCli(["--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("unlibrary");
  });
});
