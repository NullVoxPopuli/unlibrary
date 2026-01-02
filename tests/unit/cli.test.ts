import { expect, runCli, test } from "#vitest";

test("--help exits cleanly", async () => {
  const result = await runCli(["--help"]);

  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("unlibrary");
});
