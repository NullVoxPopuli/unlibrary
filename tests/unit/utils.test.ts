import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, test } from "vitest";

import { cleanupDir, createTmpFolder, listDirDeep } from "#tests/utils.js";

describe("listDirDeep", () => {
  test("lists files recursively (default: files only)", async () => {
    const tmp = await createTmpFolder("unlibrary-listDirDeep-");

    try {
      await mkdir(path.join(tmp, "nested", "deeper"), { recursive: true });
      await writeFile(path.join(tmp, "a.txt"), "a", "utf8");
      await writeFile(path.join(tmp, "nested", "b.txt"), "b", "utf8");
      await writeFile(path.join(tmp, "nested", "deeper", "c.md"), "c", "utf8");

      const listed = await listDirDeep(tmp);

      expect(listed).toEqual(["a.txt", "nested/b.txt", "nested/deeper/c.md"]);
    } finally {
      await cleanupDir(tmp);
    }
  });

  test("ignores node_modules by default", async () => {
    const tmp = await createTmpFolder("unlibrary-listDirDeep-");

    try {
      await mkdir(path.join(tmp, "node_modules", "some-pkg"), {
        recursive: true,
      });
      await writeFile(
        path.join(tmp, "node_modules", "some-pkg", "index.js"),
        "x",
        "utf8",
      );
      await writeFile(path.join(tmp, "keep.txt"), "y", "utf8");

      const listed = await listDirDeep(tmp);

      expect(listed).toEqual(["keep.txt"]);
    } finally {
      await cleanupDir(tmp);
    }
  });

  test("can include directories", async () => {
    const tmp = await createTmpFolder("unlibrary-listDirDeep-");

    try {
      await mkdir(path.join(tmp, "nested", "deeper"), { recursive: true });
      await writeFile(path.join(tmp, "nested", "deeper", "c.md"), "c", "utf8");

      const listed = await listDirDeep(tmp, { includeDirs: true });

      expect(listed).toEqual(["nested", "nested/deeper", "nested/deeper/c.md"]);
    } finally {
      await cleanupDir(tmp);
    }
  });
});
