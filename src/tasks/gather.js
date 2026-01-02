import assert from "node:assert";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { log } from "@clack/prompts";
import latestVersion from "latest-version";

import { cwd } from "../consts.js";

export async function gatherProjectInfo() {
  log.info("Gathering metadata about your project");

  const manifestPath = join(cwd, "package.json");

  assert(
    existsSync(manifestPath),
    `Please run this directory in a project with a package.json. Checked ${manifestPath}`,
  );

  const manifestBuffer = await readFile(manifestPath);
  const manifest = JSON.parse(manifestBuffer.toString());
  const deps = [
    ...Object.keys(manifest.dependencies || {}),
    ...Object.keys(manifest.devDependencies || {}),
  ];

  const newDeps = [];

  function hasDep(name) {
    return new Set([...deps, ...newDeps]).has(name);
  }

  return {
    manifest,
    manifestPath,
    hasVite: hasDep("vite"),
    hasTypescript: hasDep("typescript"),
    hasDep,
    addDep(name) {
      if (hasDep(name)) return;

      newDeps.push(name);
    },
    async writeChanges() {
      manifest.dependencies ||= {};

      for (const dep of newDeps) {
        const version = await latestVersion(dep);

        manifest.dependencies[dep] = `^${version}`;
      }

      const data = JSON.stringify(manifest, null, 2);

      await writeFile(manifestPath, data);
    },
  };
}
