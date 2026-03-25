import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import functionalPlugin from "eslint-plugin-functional";
import importPlugin from "eslint-plugin-import";
import reactHooksPlugin from "eslint-plugin-react-hooks";

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
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/hooks/useImportImage.ts", "src/hooks/useExportImage.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...restrictedSyntaxCommon,
        ...restrictedSyntaxDomainOnly,
      ],
    },
  },
  {
    files: ["src/hooks/useImportImage.ts", "src/hooks/useExportImage.ts"],
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
      "src/App.styles.tsx",
      "src/App.tsx",
      "src/main.tsx",
      "src/characters/**/*.ts",
      "src/components/CharacterMode.tsx",
      "src/components/PalettePicker.styles.tsx",
      "src/components/PalettePicker.tsx",
      "src/components/ProjectActions.tsx",
      "src/components/ScreenMode.tsx",
      "src/components/ScreenCanvas.tsx",
      "src/components/SpriteMode.tsx",
      "src/components/SpriteCanvas.tsx",
      "src/components/ui/**/*.tsx",
      "src/components/hooks/swapPreview.ts",
      "src/components/hooks/swapPreview.test.ts",
      "src/components/hooks/useSwap.ts",
      "src/hooks/useExportImage.ts",
      "src/hooks/useImportImage.ts",
      "src/nes/chr.ts",
      "src/nes/chr.test.ts",
      "src/nes/drawingPath.ts",
      "src/nes/drawingPath.test.ts",
      "src/nes/palette.ts",
      "src/nes/rendering.ts",
      "src/nes/rendering.test.ts",
      "src/screen/constraints.ts",
      "src/screen/constraints.test.ts",
      "src/screen/oamSync.ts",
      "src/screen/oamSync.test.ts",
      "src/screen/spriteGroup.ts",
      "src/screen/spriteGroup.test.ts",
      "src/store/characterState.ts",
      "src/store/characterState.test.ts",
      "src/store/nesProjectState.ts",
      "src/store/nesProjectState.test.ts",
      "src/store/projectState.ts",
      "src/tiles/swap.ts",
      "src/tiles/swap.test.ts",
      "src/tiles/utils.ts",
      "src/tiles/utils.test.ts",
      "src/utils/arrayAccess.ts",
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
    files: [
      "src/components/hooks/useGhost.ts",
      "src/components/hooks/useScreenCanvas.ts",
      "src/components/hooks/useSpriteCanvas.ts",
    ],
    rules: {
      // Canvas/DOM操作は命令的代入が本質のため、ここだけ許可アクセサを限定して運用
      "functional/immutable-data": [
        "error",
        {
          ignoreImmediateMutation: true,
          ignoreNonConstDeclarations: true,
          ignoreMapsAndSets: true,
          ignoreIdentifierPattern: [
            "cvs",
            "ctx",
            "ghostCvs",
            "gctx",
            "img",
            "canvasRef",
            "ghostImgRef",
            "dragInfoRef",
            "hoverTileRef",
            "paintingRef",
          ],
          ignoreAccessorPattern: [
            "current",
            "*.current",
            "style",
            "*.style",
            "*.style.*",
            "data",
            "*.data",
            "width",
            "height",
            "imageSmoothingEnabled",
            "fillStyle",
            "strokeStyle",
            "lineWidth",
            "globalCompositeOperation",
            "filter",
            "src",
          ],
        },
      ],
    },
  },
];

export default config;
