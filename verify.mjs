#!/usr/bin/env node
// verify.mjs - 跨模組驗證腳本（避免掃 node_modules 版）
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname);
const FAST = process.env.VERIFY_FAST === '1';

// 統一忽略路徑
const IGNORE_DIRS = ['node_modules', 'dist', 'build', 'coverage', '.next', '.turbo'];

// 實際存在的常見專案目錄（用來限制掃描範圍）
const CANDIDATE_DIRS = ['src', 'app', 'pages', 'tests', '__tests__', 'packages'];

function rel(p) {
  return resolve(root, p);
}
function hasFile(p) {
  return existsSync(rel(p));
}
function hasDir(dir) {
  try {
    return readdirSync(rel(dir)).length >= 0;
  } catch {
    return false;
  }
}
function readPkg() {
  try {
    return JSON.parse(readFileSync(rel('package.json'), 'utf8'));
  } catch {
    return {};
  }
}
function run(name, cmd, opts = {}) {
  const start = Date.now();
  process.stdout.write(`\n▶ ${name} ...\n`);
  try {
    execSync(cmd, { stdio: 'inherit', env: process.env, cwd: root, ...opts });
    const ms = Date.now() - start;
    console.log(`✓ ${name} passed in ${ms}ms`);
    return { name, ok: true, ms };
  } catch (e) {
    const ms = Date.now() - start;
    console.error(`✗ ${name} failed in ${ms}ms`);
    return { name, ok: false, ms, error: e };
  }
}

const pkg = readPkg();

// Heuristics
const isTS = hasFile('tsconfig.json');
const hasESLint =
  hasFile('.eslintrc') ||
  hasFile('.eslintrc.js') ||
  hasFile('.eslintrc.cjs') ||
  hasFile('.eslintrc.json') ||
  (pkg.devDependencies && pkg.devDependencies.eslint);
const hasPrettier =
  hasFile('.prettierrc') ||
  hasFile('.prettierrc.js') ||
  hasFile('.prettierrc.cjs') ||
  hasFile('.prettierrc.json') ||
  hasFile('prettier.config.js') ||
  (pkg.devDependencies && pkg.devDependencies.prettier);
const hasTypeCoverage = pkg.devDependencies && pkg.devDependencies['type-coverage'];
const hasVitest = pkg.devDependencies && pkg.devDependencies.vitest;
const hasJest = pkg.devDependencies && pkg.devDependencies.jest;

// 依實際存在的資料夾產生掃描目標（避免使用 **/* 造成誤掃）
const scanDirs = CANDIDATE_DIRS.filter((d) => hasDir(d));

/** 將要掃描的資料夾攤平成空白分隔字串，若不存在就預設用當前專案根目錄（但用 ignore-path 避免誤掃） */
const targetDirs = scanDirs.length > 0 ? scanDirs.map((d) => `"${d}"`).join(' ') : '"."';

// 建議的副檔名集合
const TS_EXTS = '"**/*.{ts,tsx}"';
const JS_EXTS = '"**/*.{js,jsx,cjs,mjs}"';

// Cmd 組裝輔助：加上忽略參數（ESLint/Prettier 會自動讀 .gitignore/.eslintignore/.prettierignore，這裡再保險）
const IGNORE_FLAGS_ESLINT = IGNORE_DIRS.map((d) => `--ignore-pattern "${d}/**"`).join(' ');
const IGNORE_FLAGS_PRETTIER = `--ignore-path .prettierignore`;

// Steps
const steps = [];

// 1) ESLint
if (hasESLint) {
  // 只掃描我們偵測到的 dirs；避免全域 **/*
  // 若是 TS 專案，優先掃 TS，並允許 JS/JSX 一併檢查
  const exts = isTS ? `${TS_EXTS} ${JS_EXTS}` : JS_EXTS;
  // 使用 --cache 加速，也確保不會讀到 node_modules
  steps.push({
    name: 'ESLint',
    cmd: `npx -y eslint ${targetDirs} -c .eslintrc.cjs -f stylish --cache --cache-location "node_modules/.cache/eslint" --max-warnings=0 ${IGNORE_FLAGS_ESLINT}`,
  });
} else {
  console.log('• Skip ESLint (no config or dependency)');
}

// 2) TypeScript
if (isTS) {
  // 強制指定 tsconfig，避免抓到其他子包設定
  steps.push({
    name: 'TypeScript (tsc)',
    cmd: `npx -y tsc -p tsconfig.json --noEmit`,
  });
} else {
  console.log('• Skip tsc (no tsconfig / not TS project)');
}

// 3) Prettier（format check）
if (hasPrettier) {
  // 只檢查我們偵測到的資料夾；沒有就檢查根目錄，但依賴 ignore 檔案
  steps.push({
    name: 'Prettier check',
    cmd: `npx -y prettier --check ${targetDirs} ${IGNORE_FLAGS_PRETTIER}`,
  });
} else {
  console.log('• Skip Prettier (no config or dependency)');
}

// 4) type-coverage（可跳過）
if (isTS && hasTypeCoverage && !FAST) {
  const atLeast = process.env.TYPE_COV || '90';
  steps.push({
    name: `type-coverage ≥ ${atLeast}%`,
    cmd: `npx -y type-coverage --at-least ${atLeast}`,
  });
} else if (isTS && !hasTypeCoverage) {
  console.log('• Skip type-coverage (not installed)');
} else if (FAST) {
  console.log('• Skip type-coverage (VERIFY_FAST=1)');
}

// 5) 測試（Vitest/Jest 擇一；可跳過）
if (!FAST && (hasVitest || hasJest)) {
  if (hasVitest) {
    steps.push({
      name: 'Vitest',
      cmd: `npx -y vitest run --passWithNoTests`,
    });
  } else if (hasJest) {
    steps.push({
      name: 'Jest',
      cmd: `npx -y jest --runInBand --passWithNoTests`,
    });
  }
} else if (FAST) {
  console.log('• Skip tests (VERIFY_FAST=1)');
} else {
  console.log('• Skip tests (no runner detected)');
}

// Execute
let ok = true;
const results = [];
for (const s of steps) {
  const r = run(s.name, s.cmd);
  results.push(r);
  if (!r.ok) ok = false;
}

const totalMs = results.reduce((a, b) => a + (b.ms || 0), 0);
console.log('\n— Summary —');
for (const r of results) {
  console.log(`${r.ok ? '✓' : '✗'} ${r.name} (${r.ms}ms)`);
}
console.log(`Total: ${totalMs}ms`);
process.exit(ok ? 0 : 1);
