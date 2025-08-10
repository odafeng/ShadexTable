#!/usr/bin/env python3
"""
make_snapshot.py — 產生單檔快照 PROJECT_SNAPSHOT.md

使用方式：
1) 把本檔與 PROJECT_SNAPSHOT.template.md 放到你的 repo 根目錄
2) 在 repo 根目錄執行：  python make_snapshot.py
3) 會輸出 PROJECT_SNAPSHOT.md ，直接附給 AI 使用

可自訂的搜尋路徑與忽略規則見 CONFIG 區塊。
"""

from __future__ import annotations
import os, re, json, datetime
from pathlib import Path
from typing import List

# ============= CONFIG =============
IGNORE_DIRS = {".git", "node_modules", ".next", ".venv", "__pycache__", "dist", "build", ".turbo", ".idea", ".vscode"}
MAX_TREE_DEPTH = 4         # 檔案樹最大深度（避免太長）
MAX_FILES_PER_DIR = 80     # 每層最多列出檔案（避免爆量）
FRONTEND_DIRS = ["app", "pages", "src/pages"]  # Next.js 路由掃描根
BACKEND_DIRS = ["app", "backend/app"]          # FastAPI 掃描根（依你的專案調整）
PACKAGE_JSON_PATHS = ["package.json", "apps/web/package.json"]
REQUIREMENTS_PATHS = ["requirements.txt", "backend/requirements.txt"]
OUTPUT_FILE = "PROJECT_SNAPSHOT.md"
TEMPLATE_FILE = "PROJECT_SNAPSHOT.template.md"
# ==================================

def is_ignored(p: Path) -> bool:
    parts = set(p.parts)
    return len(IGNORE_DIRS.intersection(parts)) > 0

def build_tree(root: Path, depth=0) -> List[str]:
    if depth > MAX_TREE_DEPTH: 
        return []
    lines = []
    try:
        entries = [e for e in root.iterdir() if not is_ignored(e)]
    except Exception:
        return lines
    dirs = [e for e in entries if e.is_dir()]
    files = [e for e in entries if e.is_file()]
    files = files[:MAX_FILES_PER_DIR]
    for d in sorted(dirs, key=lambda x: x.name)[:MAX_FILES_PER_DIR]:
        lines.append(("  " * depth) + f"📁 {d.name}/")
        lines.extend(build_tree(d, depth+1))
    for f in sorted(files, key=lambda x: x.name):
        lines.append(("  " * depth) + f"📄 {f.name}")
    return lines

def find_next_routes(repo_root: Path) -> List[str]:
    routes = set()

    # App Router: app/**/page.(tsx|jsx|mdx)
    for base in FRONTEND_DIRS:
        p = repo_root / base
        if not p.exists(): 
            continue
        for file in p.rglob("*"):
            if is_ignored(file) or not file.is_file():
                continue
            if file.name.startswith("_"):  # skip _middleware etc.
                continue
            if re.fullmatch(r"page\.(tsx|ts|jsx|js|mdx)", file.name):
                # Route path from app dir
                rel = file.parent.relative_to(p)
                route = "/" + str(rel).replace("\\", "/")
                if route == "/.":
                    route = "/"
                routes.add(route)

    # Pages Router: pages/**.tsx excluding api
    for base in FRONTEND_DIRS:
        p = repo_root / base
        if not p.exists(): 
            continue
        if p.name.endswith("pages"):
            for file in p.rglob("*"):
                if is_ignored(file) or not file.is_file():
                    continue
                if "/api/" in str(file).replace("\\", "/"):
                    continue
                if re.fullmatch(r".+\.(tsx|ts|jsx|js)", file.name):
                    rel = file.relative_to(p)
                    route = "/" + str(rel.with_suffix("")).replace("\\", "/")
                    routes.add(route)

    return sorted(routes)

def find_fastapi_routes(repo_root: Path) -> List[str]:
    pattern = re.compile(r"@(?:app|router)\.(get|post|put|delete)\(\s*[\"']([^\"']+)[\"']")
    routes = set()
    for base in BACKEND_DIRS:
        p = repo_root / base
        if not p.exists():
            continue
        for file in p.rglob("*.py"):
            if is_ignored(file):
                continue
            try:
                text = file.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue
            for m in pattern.finditer(text):
                method, path = m.group(1).upper(), m.group(2)
                routes.add(f"{method} {path}")
    return sorted(routes)

def collect_dependencies(repo_root: Path) -> List[str]:
    lines = []
    # package.json
    for path in PACKAGE_JSON_PATHS:
        p = repo_root / path
        if p.exists():
            try:
                obj = json.loads(p.read_text(encoding="utf-8"))
                deps = obj.get("dependencies", {})
                dev = obj.get("devDependencies", {})
                if deps:
                    lines.append("### 前端（package.json）")
                    for k,v in sorted(deps.items())[:30]:
                        lines.append(f"- {k}: {v}")
                if dev:
                    lines.append("### 前端開發（devDependencies）")
                    for k,v in sorted(dev.items())[:20]:
                        lines.append(f"- {k}: {v}")
            except Exception as e:
                lines.append(f"（讀取 {path} 失敗：{e}）")

    # requirements.txt
    for path in REQUIREMENTS_PATHS:
        p = repo_root / path
        if p.exists():
            lines.append(f"### 後端（{path}）")
            for raw in p.read_text(encoding="utf-8", errors="ignore").splitlines():
                raw = raw.strip()
                if not raw or raw.startswith("#"):
                    continue
                lines.append(f"- {raw}")
    return lines or ["（未找到依賴檔案，可忽略）"]

def replace_block(text: str, marker: str, new_content: List[str]) -> str:
    start = f"<!-- BEGIN AUTO:{marker} -->"
    end = f"<!-- END AUTO:{marker} -->"
    pattern = re.compile(re.escape(start) + r".*?" + re.escape(end), re.DOTALL)
    block = start + "\n" + "\n".join(new_content) + "\n" + end
    return pattern.sub(block, text)

def main():
    repo_root = Path(".").resolve()
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    try:
        template = Path(TEMPLATE_FILE).read_text(encoding="utf-8")
    except FileNotFoundError:
        print(f"找不到 {TEMPLATE_FILE} ，請把 template 檔與本檔放在 repo 根目錄。")
        return

    # FILE TREE
    file_tree = ["（掃描根目錄，忽略常見大型資料夾）", ""]
    file_tree.extend(build_tree(repo_root))
    file_tree.append("")
    file_tree.append(f"*Generated at {now}*")

    # NEXT ROUTES
    next_routes = find_next_routes(repo_root)
    next_routes_lines = (["（App Router / Pages Router）"] + [f"- {r}" for r in next_routes]) or ["（未偵測到 Next.js 路由）"]

    # FASTAPI ROUTES
    api_routes = find_fastapi_routes(repo_root)
    api_routes_lines = ([f"- {r}" for r in api_routes]) or ["（未偵測到 FastAPI 路由）"]

    # DEPENDENCIES
    deps_lines = collect_dependencies(repo_root)

    out = template
    out = replace_block(out, "FILE_TREE", file_tree)
    out = replace_block(out, "NEXT_ROUTES", next_routes_lines)
    out = replace_block(out, "FASTAPI_ROUTES", api_routes_lines)
    out = replace_block(out, "DEPENDENCIES", deps_lines)

    Path(OUTPUT_FILE).write_text(out, encoding="utf-8")
    print(f"✅ 已輸出 {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
