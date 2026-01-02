const cwd = process.cwd();

export function cleanPath(fullPath) {
  return fullPath.replace(cwd, "./");
}
