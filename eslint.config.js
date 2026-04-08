import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import functionalPlugin from "eslint-plugin-functional";
import importPlugin from "eslint-plugin-import";
import reactHooksPlugin from "eslint-plugin-react-hooks";

const MUI_SX_MAX_PROPERTIES = 5;
const HEX_COLOR_PATTERN =
  /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
const PIXEL_VALUE_PATTERN = /\b-?\d+(?:\.\d+)?px\b/;
const NESTED_SX_KEY_PATTERN = /^(&|:|@media|@supports|@container)/;
const THEME_Z_INDEX_TOKEN_PATTERN = /^[A-Za-z][A-Za-z0-9.]*$/;

const getPropertyName = (property) => {
  if (property.type !== "Property") {
    return false;
  }

  if (property.key.type === "Identifier" && property.computed === false) {
    return property.key.name;
  }

  if (
    property.key.type === "Literal" &&
    typeof property.key.value === "string"
  ) {
    return property.key.value;
  }

  return false;
};

const getTemplateLiteralValue = (node) => {
  if (node.expressions.length > 0) {
    return false;
  }

  return node.quasis.map((quasi) => quasi.value.cooked ?? "").join("");
};

const muiGuidancePlugin = {
  rules: {
    "restrict-sx": {
      meta: {
        type: "suggestion",
        docs: {
          description:
            "Restrict MUI `sx` usage to small shallow objects backed by theme tokens.",
        },
        schema: [],
        messages: {
          inlineObject:
            "Keep `sx` inline as a short object literal. Extract reusable styling into a shared component, theme override, or `styled(...)`.",
          tooManyProperties:
            "`sx` must stay small. Use at most 5 top-level properties before extracting structure.",
          noSpread:
            "Do not compose `sx` with spreads. Keep it local or extract a shared styled wrapper.",
          noNestedSelectors:
            "Keep `sx` shallow. Avoid nested selectors, breakpoint objects, and at-rules inline.",
          noConditionalLogic:
            "Avoid complex conditional styling logic inside `sx`. Derive values before JSX or extract a component.",
          noHexColor:
            "Do not use raw hex colors inside `sx`. Use theme palette tokens instead.",
          noPixelValue:
            "Do not use raw pixel strings inside `sx`. Use theme-backed values instead.",
          noZIndexLiteral:
            "Do not use ad hoc z-index values inside `sx`. Use theme zIndex tokens.",
        },
      },
      create: (context) => {
        const report = (node, messageId) => {
          context.report({
            node,
            messageId,
          });
        };

        const inspectLiteralValue = (node, value) => {
          if (typeof value !== "string") {
            return;
          }

          if (HEX_COLOR_PATTERN.test(value)) {
            report(node, "noHexColor");
          }

          if (PIXEL_VALUE_PATTERN.test(value)) {
            report(node, "noPixelValue");
          }
        };

        const inspectSxValue = (node) => {
          if (node.type === "ObjectExpression") {
            node.properties.forEach((property) => {
              if (property.type === "SpreadElement") {
                report(property, "noSpread");
                return;
              }

              const propertyName = getPropertyName(property);
              const hasNestedKey =
                typeof propertyName === "string" &&
                NESTED_SX_KEY_PATTERN.test(propertyName);

              if (property.value.type === "ObjectExpression" || hasNestedKey) {
                report(property, "noNestedSelectors");
              }

              if (propertyName === "zIndex") {
                const isNumericLiteral =
                  property.value.type === "Literal" &&
                  typeof property.value.value === "number";
                const isNumericStringLiteral =
                  property.value.type === "Literal" &&
                  typeof property.value.value === "string" &&
                  THEME_Z_INDEX_TOKEN_PATTERN.test(property.value.value) ===
                    false;

                if (isNumericLiteral || isNumericStringLiteral) {
                  report(property.value, "noZIndexLiteral");
                }
              }

              inspectSxValue(property.value);
            });
            return;
          }

          if (
            node.type === "ConditionalExpression" ||
            node.type === "LogicalExpression" ||
            node.type === "ArrayExpression" ||
            node.type === "ArrowFunctionExpression"
          ) {
            report(node, "noConditionalLogic");
          }

          if (node.type === "Literal") {
            inspectLiteralValue(node, node.value);
            return;
          }

          if (node.type === "TemplateLiteral") {
            const templateLiteralValue = getTemplateLiteralValue(node);

            if (templateLiteralValue !== false) {
              inspectLiteralValue(node, templateLiteralValue);
            }

            return;
          }

          if (node.type === "ConditionalExpression") {
            inspectSxValue(node.consequent);
            inspectSxValue(node.alternate);
            return;
          }

          if (node.type === "LogicalExpression") {
            inspectSxValue(node.left);
            inspectSxValue(node.right);
            return;
          }

          if (node.type === "ArrayExpression") {
            node.elements.forEach((element) => {
              if (typeof element?.type === "string") {
                inspectSxValue(element);
              }
            });
            return;
          }

          if (node.type === "ArrowFunctionExpression") {
            if (node.body.type !== "BlockStatement") {
              inspectSxValue(node.body);
            }
          }
        };

        return {
          JSXAttribute: (node) => {
            if (node.name.type !== "JSXIdentifier" || node.name.name !== "sx") {
              return;
            }

            if (
              node.value?.type !== "JSXExpressionContainer" ||
              node.value.expression.type !== "ObjectExpression"
            ) {
              report(node, "inlineObject");
              return;
            }

            const topLevelPropertyCount =
              node.value.expression.properties.filter(
                (property) => property.type === "Property",
              ).length;

            if (topLevelPropertyCount > MUI_SX_MAX_PROPERTIES) {
              report(node.value.expression, "tooManyProperties");
            }

            inspectSxValue(node.value.expression);
          },
        };
      },
    },
  },
};

const restrictedSyntaxCommon = [
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
    selector: "TSAsExpression",
    message:
      "Do not use `as` type assertions. Prefer narrowing, validated boundaries, or redesigned interfaces.",
  },
];

const restrictedSyntaxDomainOnly = [
  {
    selector: 'UnaryExpression[operator="typeof"]',
    message:
      "Avoid runtime `typeof` in domain/application code. Prefer validated boundaries and explicit predicates.",
  },
  {
    selector: 'BinaryExpression[operator="instanceof"]',
    message:
      "Avoid `instanceof` in domain/application code. Prefer validated boundaries and explicit predicates.",
  },
];

/** @type {import("eslint").Linter.FlatConfig[]} */
const config = [
  {
    ignores: [
      "node_modules",
      "dist",
      "src-tauri/target",
      ".git",
      "playwright-report",
      "test-results",
      "blob-report",
    ],
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
      functional: functionalPlugin,
      import: importPlugin,
      "mui-guidance": muiGuidancePlugin,
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

      "no-var": "error",
      "no-nested-ternary": "error",
      eqeqeq: ["error", "always"],
      "no-implicit-coercion": "error",
      "no-param-reassign": ["error", { props: true }],

      "functional/no-let": "error",
      "functional/no-throw-statements": "error",

      "mui-guidance/restrict-sx": "error",

      "no-restricted-syntax": ["error", ...restrictedSyntaxCommon],

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
    files: ["src/domain/**/*.{ts,tsx}", "src/application/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...restrictedSyntaxCommon,
        ...restrictedSyntaxDomainOnly,
      ],
    },
  },
  {
    files: [
      "src/infrastructure/**/*.{ts,tsx}",
      "src/presentation/**/*.{ts,tsx}",
      "src/main.tsx",
    ],
    rules: {
      "no-restricted-syntax": ["error", ...restrictedSyntaxCommon],
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
  {
    files: [
      "src/domain/**/*.{ts,tsx}",
      "src/application/**/*.{ts,tsx}",
      "src/presentation/**/*.{ts,tsx}",
      "src/shared/**/*.{ts,tsx}",
      "src/main.tsx",
    ],
    rules: {
      "functional/immutable-data": [
        "error",
        {
          ignoreImmediateMutation: true,
          ignoreNonConstDeclarations: true,
          ignoreMapsAndSets: true,
          ignoreAccessorPattern: [
            "current",
            "*.current",
            "style",
            "*.style",
            "*.style.*",
            "data",
            "*.data",
          ],
        },
      ],
    },
  },
  {
    files: ["src/infrastructure/**/*.ts", "src/infrastructure/**/*.tsx"],
    rules: {
      // 副作用は infrastructure 配下に閉じ込め、ここだけ命令的操作を許可する
      "functional/immutable-data": "off",
    },
  },
];

export default config;
