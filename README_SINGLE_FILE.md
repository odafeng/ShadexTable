# 單檔專案快照（Single-File Snapshot）

## 為什麼這個比向量庫更簡單？
- 你只要維護 **一個** `PROJECT_SNAPSHOT.md`，每次找 AI 寫程式就附上這份檔案。
- 不需要部署任何向量庫或 Assistants。

## 快速開始（把以下三檔丟進你的 repo 根目錄）
- `make_snapshot.py` — 產生器（掃描你的 repo 自動填資料）
- `PROJECT_SNAPSHOT.template.md` — 模板（上方規範可自行修改）
- 產出：`PROJECT_SNAPSHOT.md`（你要附給 AI 的單一檔案）

### 產生步驟
```bash
# 在你的 repo 根目錄
python make_snapshot.py
# 會輸出 PROJECT_SNAPSHOT.md
```

### 產出包含：
- 檔案樹（忽略 node_modules/.next/.venv 等）
- Next.js 路由（app/ + pages/ 模式）
- FastAPI 路由（抓 @app.get/post/put/delete 裡的 path）
- 依賴與版本（package.json / requirements.txt）

### 客製化
- 若你的後端不在 `backend/app`，請修改 `BACKEND_DIRS`
- 若你的前端路由不在 `app/` 或 `pages/`，請改 `FRONTEND_DIRS`
- 加上你自己的錯誤處理與規範（模板上方）

## 提醒
- 這是純檔案快照，不會包含大量程式內容；但已足夠讓 AI 理解你的專案輪廓與規範。
- 若要更詳細（例如 API 入參/回傳 Schema），請把重點段落手動補進模板上方的「專案定位與分層」。

— 生成時間：2025-08-10
