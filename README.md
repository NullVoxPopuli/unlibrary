# unlibrary

The tool for ejecting library code into your project, so you never worry about 3rd party dependency compatibility.

Automatically handles stripping TypeScript types for JavaScript projects.

```
│  Usage:
│
│    unlibrary --repo <URL> --tag <tag> --filepath <path> --output-folder <path>
│
│  Example:
│
│    unlibrary \
│      --repo https://github.com/universal-ember/ember-primitives \
│      --tag v0.49 \
│      --filepath ember-primitives/src/create-store.ts \
│      --output-folder ./src/primitives/
│
│  Options:
│
│  	--repo <repo-url>         Repository URL
│  	--tag <tag-name>          Git tag name (optional)
│  	--filepath <path>         Entrypoint file/path
│  	--output-folder <path>    The output folder relative to the current working directory to copy the files in to
│  	--javascript              Flag to force JavaScript output if any TypeScript files are encountered
│  	-h, --help                Show help
│
│
```
