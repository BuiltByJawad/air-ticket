module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  ignorePatterns: ["dist/", "node_modules/", "coverage/", "jest.config.ts", "prisma/seed.ts"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-namespace": "off",
  },
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      excludedFiles: ["jest.config.ts", "prisma/seed.ts"],
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "warn",
          { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
      },
    },
  ],
};
