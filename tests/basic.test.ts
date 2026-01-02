import { spawn } from 'node:child_process';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, test } from 'vitest';

let tmpFolder: string;

const CLI_PATH = fileURLToPath(new URL('../src/index.js', import.meta.url));

type RunCliResult = {
	exitCode: number | null;
	stdout: string;
	stderr: string;
};

async function runCli(
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
			stdio: ['ignore', 'pipe', 'pipe'],
		});

		let stdout = '';
		let stderr = '';

		child.stdout.setEncoding('utf8');
		child.stderr.setEncoding('utf8');

		child.stdout.on('data', (chunk) => {
			stdout += chunk;
		});

		child.stderr.on('data', (chunk) => {
			stderr += chunk;
		});

		child.on('error', reject);
		child.on('close', (exitCode) => {
			resolve({ exitCode, stdout, stderr });
		});
	});
}

beforeEach(async () => {
	tmpFolder = await mkdtemp(path.join(os.tmpdir(), 'unlibrary-'));
});

afterEach(async () => {
	await rm(tmpFolder, { recursive: true, force: true });
});

describe('tmp folder setup', () => {
	test('creates a temporary directory', async () => {
		const stats = await stat(tmpFolder);

		expect(stats.isDirectory()).toBe(true);
	});
});

describe('cli', () => {
	test('--help exits cleanly', async () => {
		const result = await runCli(['--help']);

		expect(result.exitCode).toBe(0);
		expect(result.stdout).toContain('unlibrary');
	});
});


