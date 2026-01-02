import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const CLI_PATH = fileURLToPath(new URL('../../src/index.js', import.meta.url));

export type RunCliResult = {
	exitCode: number | null;
	stdout: string;
	stderr: string;
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

export async function createTmpFolder(prefix = 'unlibrary-'): Promise<string> {
	return await mkdtemp(path.join(os.tmpdir(), prefix));
}

export async function cleanupDir(dir: string): Promise<void> {
	await rm(dir, { recursive: true, force: true });
}

export async function createProject(tmpFolder: string): Promise<{ dir: string }> {
	// Must be inside the per-test tmp folder so it gets cleaned up automatically.
	const dir = await mkdtemp(path.join(tmpFolder, 'project-'));

	// Provide the minimum required for the CLI's project detection.
	// Include `typescript` so the tool treats this as a TS project and preserves TS.
	const manifest = {
		name: 'test-project',
		private: true,
		version: '0.0.0',
		type: 'module',
		devDependencies: {
			typescript: '^5.0.0',
		},
	};

	await mkdir(path.join(dir, 'src'), { recursive: true });
	await writeFile(
		path.join(dir, 'package.json'),
		JSON.stringify(manifest, null, 2),
		'utf8',
	);

	return { dir };
}

export type ListDirDeepOptions = {
	/**
	 * Base directory used for returned paths.
	 * Defaults to the `rootDir` passed to `listDirDeep`.
	 */
	relativeTo?: string;
	/** Include directory entries in the returned list (defaults to false). */
	includeDirs?: boolean;
	/** Include file entries in the returned list (defaults to true). */
	includeFiles?: boolean;
	/** Directory names to skip entirely (defaults to ['node_modules']). */
	ignoreDirNames?: string[];
};

/**
 * Recursively lists the contents of a directory.
 *
 * Returns a stable, sorted array of paths relative to `options.relativeTo` (posix-style `/`).
 */
export async function listDirDeep(
	rootDir: string,
	options: ListDirDeepOptions = {},
): Promise<string[]> {
	const {
		relativeTo = rootDir,
		includeDirs = false,
		includeFiles = true,
		ignoreDirNames = ['node_modules'],
	} = options;

	const ignored = new Set(ignoreDirNames);
	const results: string[] = [];

	const toRel = (absPath: string) => {
		const rel = path.relative(relativeTo, absPath);

		// Keep results consistent across platforms.
		return rel.split(path.sep).join('/');
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
