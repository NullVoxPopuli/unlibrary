import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { test as baseTest } from "vitest";

export const CLI_PATH = fileURLToPath(
  new URL("../src/index.js", import.meta.url),
);

export type RunCliResult = {
  exitCode: number | null;
  stdout: string;
  stderr: string;
};

export type UnlibraryArgs = {
  repo: string;
  filepath: string;
  outputFolder: string;
  javascript?: boolean;
};

export async function runCli(
  args: string[],
  options: {
    cwd?: string;
    env?: typeof process.env;
  } = {},
): Promise<RunCliResult> {
  return await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI_PATH, ...args], {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", reject);
    child.on("close", (exitCode) => {
      resolve({ exitCode, stdout, stderr });
    });
  });
}

export async function createTmpFolder(prefix = "unlibrary-"): Promise<string> {
  return await mkdtemp(path.join(os.tmpdir(), prefix));
}

export async function cleanupDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}

/**
 * Extended `test` with fixtures.
 *
 * Docs: https://vitest.dev/guide/test-context.html#extend-test-context
 *
 * Note: Vitest requires destructuring the context argument for fixtures to work:
 *   test('...', ({ tmpFolder }) => { ... })
 */
export const test = baseTest.extend<{
  tmpFolderPrefix: string;
  tmpFolder: string;
  projectDir: string;
  unlibrary: (args: UnlibraryArgs) => Promise<RunCliResult>;
}>({
  // Can be overridden per suite via `test.scoped({ tmpFolderPrefix: '...' })`
  tmpFolderPrefix: "unlibrary-",

  tmpFolder: async ({ tmpFolderPrefix }, use) => {
    const dir = await createTmpFolder(tmpFolderPrefix);

    try {
      await use(dir);
    } finally {
      await cleanupDir(dir);
    }
  },

  projectDir: async ({ tmpFolder }, use) => {
    const { dir } = await createProject(tmpFolder);

    await use(dir);
  },

  unlibrary: async ({ projectDir }, use) => {
    await use(async ({ repo, filepath, outputFolder, javascript }) => {
      const args = [
        "--repo",
        repo,
        "--filepath",
        filepath,
        "--output-folder",
        outputFolder,
      ];

      if (javascript) args.push("--javascript");

      return await runCli(args, { cwd: projectDir });
    });
  },
});

async function createProject(
  tmpFolder: string,
): Promise<{ dir: string }> {
  const dir = await mkdtemp(path.join(tmpFolder, "project-"));

  const manifest = {
    name: "test-project",
    private: true,
    version: "0.0.0",
    type: "module",
    devDependencies: {
      typescript: "^5.0.0",
    },
  };

  await mkdir(path.join(dir, "src"), { recursive: true });
  await writeFile(
    path.join(dir, "package.json"),
    JSON.stringify(manifest, null, 2),
    "utf8",
  );

  return { dir };
}

export type ListDirDeepOptions = {
  relativeTo?: string;
  includeDirs?: boolean;
  includeFiles?: boolean;
  ignoreDirNames?: string[];
};

export async function listDirDeep(
  rootDir: string,
  options: ListDirDeepOptions = {},
): Promise<string[]> {
  const {
    relativeTo = rootDir,
    includeDirs = false,
    includeFiles = true,
    ignoreDirNames = ["node_modules"],
  } = options;

  const ignored = new Set(ignoreDirNames);
  const results: string[] = [];

  const toRel = (absPath: string) => {
    const rel = path.relative(relativeTo, absPath);

    return rel.split(path.sep).join("/");
  };

  const walk = async (dir: string) => {
    const dirents = await readdir(dir, { withFileTypes: true });

    for (const dirent of dirents) {
      if (dirent.isDirectory() && ignored.has(dirent.name)) continue;

      const abs = path.join(dir, dirent.name);
      const rel = toRel(abs);

      if (dirent.isDirectory()) {
        if (includeDirs) results.push(rel);
        await walk(abs);
        continue;
      }

      if (includeFiles) results.push(rel);
    }
  };

  await walk(rootDir);
  results.sort();

  return results;
}
