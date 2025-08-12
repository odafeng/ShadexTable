#!/usr/bin/env node
// verify.mjs - 跨模組驗證腳本
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname);
const FAST = process.env.VERIFY_FAST === '1';

function hasAny(files) {
  return files.some((p) => existsSync(resolve(root, p)));
}
function hasDir(dir) {
  try {
    return readdirSync(resolve(root, dir)).length >= 0;
  } catch {
    return false;
  }
}
function readPkg() {
  try {
    return JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  } catch {
    return {};
  }
}
function run(name, cmd, opts = {}) {
  const start = Date.now();
  process.stdout.write(`\n▶ ${name} ...\n`);
  try {
    execSync(cmd, { stdio: 'inherit', env: process.env, ...opts });
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
const isTS = hasAny(['tsconfig.json']) || hasAny(['src/**/*.ts', 'src/**/*.tsx']);
const hasESLint =
  hasAny(['.eslintrc', '.eslintrc.js', '.eslintrc.cjs', '.eslintrc.json']) ||
  (pkg.devDependencies && pkg.devDependencies.eslint);
const hasPrettier =
  hasAny(['.prettierrc', '.prettierrc.js', '.prettierrc.cjs', '.prettierrc.json', 'prettier.config.js']) ||
  (pkg.devDependencies && pkg.devDependencies.prettier);
const hasTypeCoverage = pkg.devDependencies && pkg.devDependencies['type-coverage'];
const hasVitest = pkg.devDependencies && pkg.devDependencies.vitest;
const hasJest = pkg.devDependencies && pkg.devDependencies.jest;
const hasTestsDir = hasDir('tests') || hasDir('__tests__');
const hasSrc = hasDir('src');

// Globs
const tsGlob = hasSrc ? 'src/**/*.{ts,tsx}' : '**/*.{ts,tsx}';
const jsGlob = hasSrc ? 'src/**/*.{js,jsx,cjs,mjs}' : '**/*.{js,jsx,cjs,mjs}';

const steps = [];

// 1) ESLint
if (hasESLint) {
  // 若是 TS 專案優先掃 TS，否則掃 JS
  const target = isTS ? tsGlob : jsGlob;
  steps.push({
    name: 'ESLint',
    cmd: `npx -y eslint "${target}"`,
  });
} else {
  console.log('• Skip ESLint (no config or dependency)');
}

// 2) TypeScript
if (isTS) {
  steps.push({
    name: 'TypeScript (tsc)',
    cmd: `npx -y tsc --noEmit`,
  });
} else {
  console.log('• Skip tsc (no tsconfig / not TS project)');
}

// 3) Prettier (format check)
if (hasPrettier) {
  // 只檢查常見類型；若有 .prettierignore 會自動套用
  steps.push({
    name: 'Prettier check',
    cmd: `npx -y prettier --check .`,
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

// 5) Tests（Vitest/Jest 擇一；可跳過）
if (!FAST && (hasVitest || hasJest || hasTestsDir)) {
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
  } else {
    console.log('• Tests folder found but no runner detected (install vitest or jest to enable)');
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
