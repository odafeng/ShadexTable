#!/usr/bin/env node
// verify.mjs - 跨模組驗證腳本
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname);
const FAST = process.env.VERIFY_FAST === '1';

// 統一忽略路徑
const IGNORE_DIRS = ['node_modules', 'dist', 'build', 'coverage', '.next', '.turbo', 'out', 'public'];

// 實際存在的常見專案目錄
const CANDIDATE_DIRS = ['src', 'app', 'pages', 'components', 'lib', 'utils', 'hooks', 'tests', '__tests__'];

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

// 偵測專案設定
const isTS = hasFile('tsconfig.json');
const isNextJS = pkg.dependencies && pkg.dependencies.next;

// 偵測 ESLint 配置（包括新的 Flat Config）
const hasESLintConfig = 
  hasFile('eslint.config.js') ||
  hasFile('eslint.config.mjs') ||
  hasFile('eslint.config.cjs') ||
  hasFile('.eslintrc') ||
  hasFile('.eslintrc.js') ||
  hasFile('.eslintrc.cjs') ||
  hasFile('.eslintrc.json');

const hasESLint = hasESLintConfig || (pkg.devDependencies && pkg.devDependencies.eslint);

const hasPrettier =
  hasFile('.prettierrc') ||
  hasFile('.prettierrc.js') ||
  hasFile('.prettierrc.cjs') ||
  hasFile('.prettierrc.json') ||
  hasFile('prettier.config.js') ||
  hasFile('prettier.config.mjs') ||
  (pkg.devDependencies && pkg.devDependencies.prettier);

const hasTypeCoverage = pkg.devDependencies && pkg.devDependencies['type-coverage'];
const hasVitest = pkg.devDependencies && pkg.devDependencies.vitest;
const hasJest = pkg.devDependencies && pkg.devDependencies.jest;

// 依實際存在的資料夾產生掃描目標
const scanDirs = CANDIDATE_DIRS.filter((d) => hasDir(d));

// Steps
const steps = [];

// 1) ESLint
if (hasESLint) {
  if (isNextJS) {
    // Next.js 專案使用 next lint
    steps.push({
      name: 'ESLint (Next.js)',
      cmd: `npm run lint`,
    });
  } else {
    // 一般專案
    // 檢查是否使用 Flat Config
    const usesFlatConfig = hasFile('eslint.config.js') || hasFile('eslint.config.mjs') || hasFile('eslint.config.cjs');
    
    if (usesFlatConfig) {
      // Flat Config 不需要指定 -c 參數
      steps.push({
        name: 'ESLint (Flat Config)',
        cmd: `npx eslint . --max-warnings=0`,
      });
    } else {
      // 傳統配置
      const configFile = hasFile('.eslintrc.cjs') ? '.eslintrc.cjs' : 
                        hasFile('.eslintrc.js') ? '.eslintrc.js' : 
                        hasFile('.eslintrc.json') ? '.eslintrc.json' : 
                        '.eslintrc';
      
      const targetDirs = scanDirs.length > 0 ? scanDirs.join(' ') : '.';
      const ignorePattern = IGNORE_DIRS.map(d => `--ignore-pattern "${d}/**"`).join(' ');
      
      steps.push({
        name: 'ESLint',
        cmd: `npx eslint ${targetDirs} -c ${configFile} --max-warnings=0 ${ignorePattern}`,
      });
    }
  }
} else {
  console.log('• Skip ESLint (no config or dependency)');
}

// 2) TypeScript
if (isTS) {
  steps.push({
    name: 'TypeScript (tsc)',
    cmd: `npx tsc --noEmit`,
  });
} else {
  console.log('• Skip tsc (no tsconfig / not TS project)');
}

// 3) Prettier
if (hasPrettier) {
  const targetDirs = scanDirs.length > 0 ? scanDirs.join(' ') : '.';
  steps.push({
    name: 'Prettier check',
    cmd: `npx prettier --check "${targetDirs}"`,
  });
} else {
  console.log('• Skip Prettier (no config or dependency)');
}

// 4) type-coverage（可跳過）
if (isTS && hasTypeCoverage && !FAST) {
  const atLeast = process.env.TYPE_COV || '90';
  steps.push({
    name: `type-coverage ≥ ${atLeast}%`,
    cmd: `npx type-coverage --at-least ${atLeast}`,
  });
} else if (isTS && !hasTypeCoverage) {
  console.log('• Skip type-coverage (not installed)');
} else if (FAST) {
  console.log('• Skip type-coverage (VERIFY_FAST=1)');
}

// 5) 測試
if (!FAST && (hasVitest || hasJest)) {
  if (hasVitest) {
    steps.push({
      name: 'Vitest',
      cmd: `npm run test:run`,
    });
  } else if (hasJest) {
    steps.push({
      name: 'Jest',
      cmd: `npx jest --runInBand --passWithNoTests`,
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