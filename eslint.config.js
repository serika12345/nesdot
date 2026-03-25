import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import reactHooksPlugin from "eslint-plugin-react-hooks";

/** @type {import("eslint").Linter.FlatConfig[]} */
const config = [
  {
    ignores: ["node_modules", "dist", "src-tauri/target", ".git"],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        globalThis: "readonly",
        global: "readonly",
        process: "readonly",
        Buffer: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      import: importPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      ...importPlugin.configs.recommended.rules,
      ...importPlugin.configs.typescript?.rules,

      "no-undef": "off",
      "no-undefined": "error",

      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/prefer-as-const": "off",

      "prefer-const": "error",
      "no-var": "error",
      "no-nested-ternary": "error",
      eqeqeq: ["error", "always"],
      "no-implicit-coercion": "error",

      "no-restricted-syntax": [
        "error",
        {
          selector: "ThrowStatement",
          message:
            "Do not throw exceptions from application code. Prefer explicit error values and boundary handling.",
        },
        {
          selector: 'VariableDeclaration[kind="let"]',
          message:
            "Use `const` instead of `let`. If reassignment seems necessary, restructure the logic.",
        },
        {
          selector: "Literal[value=null]",
          message:
            "Avoid using `null`. Prefer explicit optional modeling or early returns.",
        },
        {
          selector: "Identifier[name='undefined']",
          message:
            "Avoid using `undefined`. Prefer explicit optional modeling or early returns.",
        },
        {
          selector: "TSUndefinedKeyword",
          message:
            "Avoid `undefined` in type positions. Prefer explicit optional/domain modeling.",
        },
        {
          selector: "IfStatement[test.type='Identifier']",
          message:
            "Do not use bare value conditions like `if (value)`. Use explicit comparisons.",
        },
        {
          selector:
            "IfStatement[test.type='UnaryExpression'][test.operator='!'][test.argument.type='Identifier']",
          message:
            "Do not use bare negation conditions like `if (!value)`. Use explicit comparisons.",
        },
        {
          selector: 'UnaryExpression[operator="typeof"]',
          message:
            "Avoid runtime `typeof`. Prefer validated boundaries and explicit predicates.",
        },
        {
          selector: 'BinaryExpression[operator="instanceof"]',
          message:
            "Avoid `instanceof`. Prefer validated boundaries and explicit predicates.",
        },
        {
          selector: "TSAsExpression",
          message:
            "Do not use `as` type assertions. Prefer narrowing, validated boundaries, or redesigned interfaces.",
        },
        {
          selector:
            'CallExpression[callee.property.name="push"], CallExpression[callee.property.name="pop"], CallExpression[callee.property.name="shift"], CallExpression[callee.property.name="unshift"], CallExpression[callee.property.name="splice"], CallExpression[callee.property.name="sort"], CallExpression[callee.property.name="reverse"]',
          message: "Use immutable operations. Avoid mutating array methods.",
        },
      ],

      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
    settings: {
      "import/resolver": {
        typescript: true,
        node: true,
      },
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/no-unsafe-call": "error",
    },
  },
];

export default config;
