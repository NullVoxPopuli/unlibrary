import { configs } from "@nullvoxpopuli/eslint-configs";

export default [
  ...configs.node(import.meta.dirname),

  {
    files: ["**/*.{js,ts}"],
    rules: {
      "n/no-process-exit": "off",
      "no-console": "off",
    },
  },
];
