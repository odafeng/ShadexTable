import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import unusedImports from "eslint-plugin-unused-imports";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // 忽略檔案
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "dist/**",
      "build/**",
      ".cache/**",
      "coverage/**",
      "public/**",
      "*.min.js",
      "**/*.min.js",
      ".git/**",
      ".vscode/**",
      ".idea/**",
      "*.md",
      "*.lock",
      "*.yaml",
      "*.yml"
    ]
  },
  
  // 套用 Next.js 的規則
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  
  // 全域設定
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs,cjs}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
      "unused-imports": unusedImports,
    },
    rules: {
      // ===== 未使用的 imports 和變數 =====
      // 關閉 TypeScript 的未使用變數檢查（由 unused-imports 處理）
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
      
      // 自動移除未使用的 imports
      "unused-imports/no-unused-imports": "error",
      
      // 檢測未使用的變數（會警告但不自動刪除）
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",  // 忽略 _ 開頭的變數
          args: "after-used",
          argsIgnorePattern: "^_",  // 忽略 _ 開頭的參數
          destructuredArrayIgnorePattern: "^_",  // 忽略解構中的 _
          ignoreRestSiblings: true,  // 忽略 rest 參數的兄弟屬性
        }
      ],
      
      // ===== TypeScript 嚴格規則 =====
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-empty-interface": "warn",
      
      // ===== React/Next.js 規則 =====
      "react/react-in-jsx-scope": "off",  // Next.js 不需要
      "react/prop-types": "off",  // 使用 TypeScript
      "react/display-name": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      
      // ===== Import 排序規則 =====
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling"],
            "index",
            "object",
            "type"
          ],
          "newlines-between": "always",
          pathGroups: [
            {
              pattern: "react",
              group: "external",
              position: "before"
            },
            {
              pattern: "@/**",
              group: "internal",
              position: "after"
            }
          ],
          pathGroupsExcludedImportTypes: ["react"],
          alphabetize: {
            order: "asc",
            caseInsensitive: true
          }
        }
      ],
      
      // ===== 其他通用規則 =====
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error", "always"],
    }
  },
  
  // src 目錄特定規則
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      // src 資料夾內更嚴格的規則
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
    }
  },
  
  // 測試檔案規則
  {
    files: ["**/*.test.{js,jsx,ts,tsx}", "**/*.spec.{js,jsx,ts,tsx}"],
    rules: {
      // 測試檔案可以使用 console 和 any
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
    }
  },
  
  // 配置檔案規則
  {
    files: ["*.config.{js,mjs,ts}", "*.setup.{js,mjs,ts}"],
    rules: {
      // 配置檔案較寬鬆的規則
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-require-imports": "off",
    }
  }
];

export default eslintConfig;