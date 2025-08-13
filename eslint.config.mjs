import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // 先定義要忽略的檔案（使用更精確的路徑）
  {
    ignores: [
      "node_modules",
      ".next",
      "out",
      "dist",
      "build",
      ".cache",
      "coverage",
      "public",
      "*.min.js",
      "**/*.min.js",
      ".git",
      ".vscode",
      ".idea"
    ]
  },
  // 套用 Next.js 的規則
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // 明確指定要檢查的檔案
  {
    files: ["src/**/*.{js,jsx,ts,tsx,mjs,cjs}"],
    rules: {
      // 您的自訂規則可以放這裡
    }
  },
  {
    files: ["app/**/*.{js,jsx,ts,tsx}"],
    rules: {
      // app 目錄的規則
    }
  },
  {
    files: ["components/**/*.{js,jsx,ts,tsx}"],
    rules: {
      // components 目錄的規則
    }
  },
  {
    files: ["*.config.{js,mjs,ts}"],
    rules: {
      // 配置檔案的規則
    }
  }
];

export default eslintConfig;