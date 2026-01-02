#!/usr/bin/env node

import { parseArgs } from "node:util";

import { cancel, intro, log, outro } from "@clack/prompts";

import { cloneGit } from "./tasks/download.js";
import { extract } from "./tasks/extract.js";
import { gatherProjectInfo } from "./tasks/gather.js";

function printHelp() {
  intro(`unlibrary`);
  log.info(
    `The tool for ejecting library code into your project, so you never worry about 3rd party dependency compatibility.`,
  );
  log.info(`\

Usage:

  unlibrary --repo <URL> --tag <tag> --filepath <path> --output-folder <path>

Example:

  unlibrary \\
    --repo https://github.com/universal-ember/ember-primitives \\
    --tag v0.49 \\
    --filepath ember-primitives/src/create-store.ts \\
    --output-folder ./src/primitives/

Options:

	--repo <repo-url>         Repository URL
	--tag <tag-name>          Git tag name (optional) 
	--filepath <path>         Entrypoint file/path
	--output-folder <path>    The output folder relative to the current working directory to copy the files in to
	--javascript              Flag to force JavaScript output if any TypeScript files are encountered 
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
    ["output-folder"]: { type: "string" },
    javascript: { type: "boolean" },
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
const javascript = parsed.values.javascript;
const filepath = parsed.values.filepath;
const outputFolder = parsed.values["output-folder"];

if (!repo || !filepath || !outputFolder) {
  const missing = [];

  if (!repo) missing.push("--repo");
  if (!filepath) missing.push("--filepath");
  if (!outputFolder) missing.push("--outputFolder");

  exitWithError(`Missing required argument(s): ${missing.join(", ")}`);
}

intro("unlibrary");

const info = await gatherProjectInfo();
const { dir } = await cloneGit(repo, tag);

await extract({
  sourceFolder: dir,
  info,
  filepath,
  outputFolder,
  javascript,
});

log.info(`Finishing...`);

await info.writeChanges();

outro("✨ Ready ✨");
