import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
    },
  },
  {
    files: ["src/**/*.js"],
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
      "no-irregular-whitespace": "off",
      "no-empty": "warn",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**"],
  },
];
