import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // 全域忽略規則
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/dist/**",
      "**/build/**",
      "**/.cache/**",
      "**/coverage/**",
      "**/*.min.js",
      "**/vendor/**",
      "**/.git/**",
      "**/.vscode/**",
      "**/.idea/**"
    ]
  },
  // Next.js 配置
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // 檔案特定規則
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      // 您的自訂規則
    }
  }
];

export default eslintConfig;