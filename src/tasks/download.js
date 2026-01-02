import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

import { log } from "@clack/prompts";

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
export async function cloneGitTag(repoUrl, tag) {
  if (!repoUrl || typeof repoUrl !== "string") {
    throw new TypeError(
      "cloneGitTag(repoUrl, tag): repoUrl must be a non-empty string",
    );
  }

  const repoName = repoNameFromGitUrl(repoUrl);
  const safeTag = tag ? sanitizePathSegment(tag) : "default";
  const dir = path.resolve(
    process.cwd(),
    "node_modules",
    ".cache",
    "unlibrary",
    `${repoName}-${safeTag}`,
  );

  const stat = await fs.stat(dir).catch(() => null);

  if (stat?.isDirectory()) {
    return { dir };
  }

  if (stat) {
    throw new Error(
      `Expected cache path to be a directory, but found a file at: ${dir}`,
    );
  }

  await fs.mkdir(path.dirname(dir), { recursive: true });

  log.step(`Cloning 
  ${repoUrl} 
into
  ${dir}`);

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

function sanitizePathSegment(value) {
  // Keep common tag characters; replace everything else so we don't accidentally create nested paths.
  return String(value).replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function repoNameFromGitUrl(repoUrl) {
  const input = String(repoUrl).trim().replace(/\/+$/, "");

  // SSH form: git@github.com:owner/repo(.git)
  const sshMatch = input.match(/^[^@]+@[^:]+:(.+)$/);

  if (sshMatch) {
    return stripDotGit(lastPathSegment(sshMatch[1]));
  }

  // HTTPS form: https://github.com/owner/repo(.git)
  try {
    const u = new URL(input);

    return stripDotGit(lastPathSegment(u.pathname));
  } catch {
    // Fall through.
  }

  // Fallback: treat it like a path-ish string.
  return stripDotGit(lastPathSegment(input));
}

function lastPathSegment(p) {
  const normalized = String(p).replace(/\/+$/, "");
  const parts = normalized.split(/[/]/).filter(Boolean);

  return parts.length ? parts[parts.length - 1] : "repo";
}

function stripDotGit(name) {
  return String(name).replace(/\.git$/i, "") || "repo";
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
