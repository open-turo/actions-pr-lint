import openTuroTypescriptConfig from "@open-turo/eslint-config-typescript";

// eslint-disable-next-line import/no-default-export
export default [
  ...openTuroTypescriptConfig({
    ignores: ["dist", "node_modules", "reports"],
    testFramework: "vitest",
  }),
  {
    files: ["vitest.config.ts"],
    rules: {
      "import/no-default-export": "off",
      "import/no-extraneous-dependencies": "off",
    },
  },
];
