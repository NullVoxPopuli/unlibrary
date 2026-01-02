import { configs } from "@nullvoxpopuli/eslint-configs";

export default [
  ...configs.node(import.meta.dirname),

  {
    files: ["**/*.{js,ts}"],
    rules: {
      "n/no-process-exit": "off",
      "no-console": "off",
      // incorrect, handled by TS plugin anyway
      "no-unused-vars": "off",
    },
  },
];
