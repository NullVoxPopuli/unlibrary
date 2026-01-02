#!/usr/bin/env node

import { parseArgs } from "node:util";

import { cancel, intro, log, outro } from "@clack/prompts";

import { cloneGitTag } from "./tasks/download.js";

function printHelp() {
  intro(`unlibrary`);
  log.info(
    `The tool for ejecting library code into your project, so you never worry about 3rd party dependency compatibility.`,
  );
  log.info(`\

Usage:

  unlibrary --repo <git repo URL> --tag <tag> --filepath <path-to-file-in-repo>

Example:

  unlibrary \\
    --repo https://github.com/universal-ember/ember-primitives \\
    --tag v0.49 \\
    --filepath ember-primitives/src/create-store.ts

Options:

	--repo <repo-url>         Repository URL (alternative to positional)
	--tag <tag-name>          Git tag name (alternative to positional)
	--filepath <path>       Entrypoint file/path (alternative to positional)
	-h, --help                Show help

`);
}

function exitWithError(message) {
  cancel(message);
  console.log();
  printHelp();
  process.exit(1);
}

const parsed = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: false,
  options: {
    repo: { type: "string" },
    tag: { type: "string" },
    filepath: { type: "string" },
    help: { type: "boolean", short: "h" },
  },
});

if (parsed.values.help) {
  printHelp();
  process.exit(0);
}

const repo = parsed.values.repo;
// Default to "main", or whatever the default branch is.
const tag = parsed.values.tag;
const filepath = parsed.values.filepath;

if (!repo || !filepath) {
  const missing = [];

  if (!repo) missing.push("--repo");
  if (!filepath) missing.push("--filepath");

  exitWithError(`Missing required argument(s): ${missing.join(", ")}`);
}

intro("unlibrary");

const { dir } = await cloneGitTag(repo, tag);

log.info(`You may browse the files yourself at any time in ${dir}`);

outro("✨ Ready ✨");
