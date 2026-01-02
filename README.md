# unlibrary

The tool for ejecting library code into your project, so you never worry about 3rd party dependency compatibility.

Automatically handles stripping TypeScript types for JavaScript projects.

```
│  Usage:
│  
│    unlibrary --repo <git repo URL> --tag <tag> --filepath <path-to-file-in-repo>
│  
│  Example:
│  
│    unlibrary \
│      --repo https://github.com/universal-ember/ember-primitives \
│      --tag v0.49 \
│      --filepath ember-primitives/src/create-store.ts
│  
│  Options:
│  
│  	--repo <repo-url>         Repository URL (alternative to positional)
│  	--tag <tag-name>          Git tag name (alternative to positional)
│  	--filepath <path>       Entrypoint file/path (alternative to positional)
│  	-h, --help                Show help
│  
```
