module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript'
  ],
  plugins: ['@typescript-eslint', 'import', 'unused-imports'],
  rules: {
    // ★ 刪除未用的 import
    'unused-imports/no-unused-imports': 'error',

    // ★ 刪除未用的變數（或改成 _ 開頭）
    'unused-imports/no-unused-vars': [
      'error', // 這裡用 error，保證會被 --fix 處理
      { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' }
    ],

    // 關閉只會標紅不會自動修的版本
    '@typescript-eslint/no-unused-vars': 'off',
    'import/no-unused-modules': 'off'
  },
  settings: {
    'import/resolver': {
      typescript: {}
    }
  }
};
