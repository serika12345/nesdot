import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default [
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

      // TypeScript handles undefined symbols via type checking
      "no-undef": "off",

      // Null Safety: Disallow undefined as a value
      "no-undefined": "error",

      // Type Safety: Disallow any type
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/prefer-as-const": "off",
      "@typescript-eslint/no-non-null-assertion": "error",

      // Immutability: Always use const, never use let or var
      "prefer-const": "error",
      "no-var": "error",

      // Immutable Operations: Avoid nested ternary operators
      "no-nested-ternary": "error",

      // Strict equality only
      eqeqeq: ["error", "always"],

      // Disallow implicit truthy/falsy coercion
      "no-implicit-coercion": "error",

      // No Exceptions: Disallow throw statements
      "no-throw-literal": "error",

      // Immutability: Disallow let declarations and mutating operations
      "no-restricted-syntax": [
        "error",
        {
          selector: 'VariableDeclaration[kind="let"]',
          message:
            "Use `const` instead of `let`. If reassignment is needed, extract logic into separate functions.",
        },
        {
          selector: "Literal[value=null]",
          message:
            "Avoid using `null`. Use Option patterns or early returns instead.",
        },
        {
          selector: "Identifier[name='undefined']",
          message:
            "Avoid using `undefined`. Use Option patterns or early returns instead.",
        },
        {
          selector: "TSUndefinedKeyword",
          message:
            "Avoid `undefined` in type positions. Use Option-like patterns instead.",
        },
        {
          selector: "IfStatement[test.type='Identifier']",
          message:
            "Do not use bare value conditions like `if (value)`. Use explicit strict comparisons.",
        },
        {
          selector:
            "IfStatement[test.type='UnaryExpression'][test.operator='!'][test.argument.type='Identifier']",
          message:
            "Do not use bare negation conditions like `if (!value)`. Use explicit strict comparisons.",
        },
        {
          selector: 'UnaryExpression[operator="typeof"]',
          message:
            "Avoid using `typeof`. Prefer explicit, type-safe predicates and domain modeling.",
        },
        {
          selector: 'BinaryExpression[operator="instanceof"]',
          message:
            "Avoid using `instanceof`. Prefer explicit, type-safe predicates and domain modeling.",
        },
        {
          selector: "TSAsExpression",
          message:
            "Do not use `as` type assertions. Prefer type guards, explicit data modeling, or narrowed function interfaces.",
        },
        {
          selector:
            'CallExpression[callee.property.name="push"], CallExpression[callee.property.name="pop"], CallExpression[callee.property.name="shift"], CallExpression[callee.property.name="unshift"], CallExpression[callee.property.name="splice"], CallExpression[callee.property.name="sort"], CallExpression[callee.property.name="reverse"]',
          message:
            "Use immutable operations. Avoid mutating array methods like push(), splice(), etc. Use spread operator or functional methods instead.",
        },
      ],

      // useEffect Usage: Minimize useEffect hooks
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
];
