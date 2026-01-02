import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import { log } from "@clack/prompts";

import { cachePathFor, cleanPath } from "../path.js";

/**
 * Clone a git repository at a specific tag into a deterministic cache directory:
 *   node_modules/.cache/unplugin/{repo-name}-{tag}/
 *
 * If the target directory already exists, this function is a no-op.
 *
 * @param {string} repoUrl
 * @param {string} tag
 * @returns {Promise<{ dir: string, reused: boolean }>} absolute cache directory path and whether it was reused
 */
export async function cloneGit(repoUrl, tag) {
  if (!repoUrl || typeof repoUrl !== "string") {
    throw new TypeError(
      "cloneGitTag(repoUrl, tag): repoUrl must be a non-empty string",
    );
  }

  const dir = cachePathFor(repoUrl, tag);

  const stat = await fs.stat(dir).catch(() => null);

  if (stat?.isDirectory()) {
    return { dir };
  }

  if (stat) {
    throw new Error(
      `Expected cache path to be a directory, but found a file at: ${cleanPath(dir)}`,
    );
  }

  await fs.mkdir(path.dirname(dir), { recursive: true });

  log.step(`Cloning 
  ${repoUrl} 
into
  ${cleanPath(dir)}`);

  await run("git", [
    "clone",
    "--depth",
    "1",
    ...(tag ? ["--branch", tag] : []),
    "--single-branch",
    repoUrl,
    dir,
  ]);

  return { dir };
}

function run(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stderr: "inherit",
      shell: false,
      ...options,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) return resolve();
      reject(new Error(`${cmd} ${args.join(" ")} exited with code ${code}`));
    });
  });
}
