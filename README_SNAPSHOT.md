# Snapshot Pack 使用說明

## 你會得到什麼？
- `docs/ARCHITECTURE.md`：專案分層與規範
- `docs/API_SURFACE.md`：路由與 API 一覽（可自動產生）
- `docs/DEPENDENCIES.md`：主要依賴用途說明
- `docs/CODEMAP.txt`：檔案樹（可自動產生）
- `.cursor/rules`：Cursor 的持久規則
- `.github/workflows/refresh_snapshot.yml`：主分支 push 時自動更新快照
- `scripts/build_snapshot_zip.py`：把上述文件打包成 `snapshot_2025-08-10.zip`
- `scripts/upload_snapshot.py`：上傳 zip 到 OpenAI Vector Store（骨架）

## 快速開始
1. 把整個 `snapshot_pack` 夾複製進你的 repo 根目錄（或融入既有結構）。
2. 在 GitHub 專案設定 secrets：`OPENAI_API_KEY`, `OPENAI_VECTOR_STORE_ID`。
3. 推一個 commit 到 `main` 分支，檢查 Actions 是否成功生成 zip。

## 平時如何用？
- 每次請 AI 幫你寫程式時，把 `snapshot_YYYY-MM-DD.zip` 當作「專案快照」附上；
  或者把 `docs/*.md` 與 `.cursor/rules` 直接上傳到你的向量庫助理。

## 可加碼的東西
- 新增 `docs/AI_PROMPTS.md`：常用 Prompt 模板。
- 為前端/後端各自加上 `CONTRIBUTING.md` 與 `CODEOWNERS`。
