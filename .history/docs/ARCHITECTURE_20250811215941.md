# 專案系統架構（Snapshot v2025-08-10)

> 本檔案描述目前專案的分層、資料流、關鍵模組與規範。請所有 PR 嚴格遵守此架構。

## 1. 分層與資料流（前後端分離）
- **前端（Next.js + TypeScript + Tailwind + shadcn/ui）**
  - 主要路由：`/step1`, `/step2`, `/step3`, `/dashboard`, `/marketing/*`, `/sign-in`, `/sign-up`
  - 狀態管理：以 React hooks 為主（`useState/useEffect/useMemo`），以元件內部狀態為優先
  - UI 原則：白底、深藍、圓角 2xl、陰影、適度動畫（framer-motion），RWD 不得破壞桌機版結構
  - 錯誤處理：全域 `AppErrorBoundary` + 統一錯誤模型 `AppError`（參見「錯誤處理規範」）

- **後端（FastAPI + Python）**
  - 模組化：`api/`（路由層）與 `core/`（功能層）分離
  - 資料處理：Shadex 家族（ShadyTable / ShadySurv / ShadexReg），包含前處理、統計、AI 摘要
  - 認證：Clerk（前端）與後端驗證（token 轉 user id）
  - 回應規格：**StandardResponse**（成功/錯誤/訊息/資料）

- **基礎設施**
  - 前端：Vercel；後端：Render；資料庫：Supabase
  - 向量知識庫：OpenAI Vector Store（用於「快照包」與設計規範）

## 2. 目錄概觀（高層）
```
apps/web                # Next.js 前端
  app/                  # App Router 頁面
  components/           # UI + 模組化元件（shadcn/ui, 自訂）
  lib/                  # 前端工具（apiClient、i18n、hooks 等）
  utils/                # 共用工具（error.ts 等）
backend/                # FastAPI 後端
  app/                  # FastAPI app & 路由
  core/                 # 統計/AI/資料處理核心
  schemas/              # pydantic schema（含 StandardResponse）
scripts/                # 開發/自動化腳本
.github/workflows/      # CI/CD 與快照自動化
docs/                   # 文件（本檔、API 一覽、依賴清單等）
```

## 3. 錯誤處理規範
- **前端**：所有可預期錯誤轉為 `AppError`（含 `code`, `context`, `userMessage`, `action`, `statusCode`, `correlationId`）。
- **後端**：統一包成 `StandardResponse`，錯誤時寫入 `error.code` 與 `message`，並保留 `correlation_id`。
- **UI 行為**：錯誤彈窗不阻斷送出（除非 P0），提供「重試」與「回報」按鈕。

## 4. i18n
- 預設繁體中文（zh-TW）。錯誤與 UI 文案統一走 i18n key。

## 5. 型別與代碼風格
- TypeScript：`strict: true`；避免 `any`，以 `unknown` + 斷言替代。
- Python：PEP8；模組化與單一職責；核心不可依賴前端。

## 6. 統計與 AI 原則
- 統計：Logistic / Linear（ShadexReg 起步），KM + Cox（ShadySurv），描述統計/表格（ShadyTable）。
- AI：方法學/摘要需可投稿、可追溯；Prompt 寫入 `docs/AI_PROMPTS.md`。

## 7. 快照包
- 每次 `main` push 觸發更新，生成 `CODEMAP.txt`、`API_SURFACE.md`、壓縮為 `snapshot_YYYY-MM-DD.zip` 並上傳到 OpenAI Vector Store。
- 前端與後端的規範另外放在 `.cursor/rules` 與 `docs/DEPENDENCIES.md`。
