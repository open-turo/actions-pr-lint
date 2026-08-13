import openTuroTypescriptConfig from "@open-turo/eslint-config-typescript";
import path from "node:path";

export default [
  ...openTuroTypescriptConfig({
    ignores: ["reports"],
    testFramework: "vitest",
  }),
  {
    rules: {
      // Workspaces inherit devDeps from the root package.json; point the rule at both
      // directories so it resolves packages listed in either.
      "import/no-extraneous-dependencies": [
        "error",
        { packageDir: [path.resolve("."), path.resolve("..")] },
      ],
    },
  },
];
