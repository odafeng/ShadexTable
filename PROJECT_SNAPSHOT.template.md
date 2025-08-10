# PROJECT_SNAPSHOT — 單檔專案快照（v2025-08-10)

> 把這份檔案丟給任何 AI（或附在對話裡），就能快速理解你的專案架構與規範。
> 下面區塊會由 `make_snapshot.py` 自動填充（你也可手動編輯）。

---
## 🔒 使用規範（給 AI 的指示）
- 嚴格遵循本檔案中的分層與命名規範，不得擅自重構專案結構。
- 產生程式碼時：
  1) 明確列出「修改檔案清單與路徑」；
  2) 提供完整可貼上的程式碼區塊；
  3) 若需要新依賴，先更新〈依賴與版本〉說明再安裝；
  4) 錯誤處理統一走 `AppError`（前端）與 `StandardResponse`（後端）。
- 不要更動既有 i18n 與型別定義；嚴格 TypeScript `strict`。

---
## 🧭 專案定位與分層（可手動補充）
- 前端：Next.js + TypeScript + Tailwind + shadcn/ui（RWD 不能破壞桌機版結構）
- 後端：FastAPI + Python；`api/`（路由）與 `core/`（功能）分離
- 認證：Clerk（前端），後端以 token 解析 user id
- DB/平台：Supabase / Render / Vercel
- 主要模組：ShadexTable、ShadexSurv、ShadexReg
- 風格：專業、低調、圓角 2xl、陰影適度；動畫用 framer-motion 適量

---
<!-- 以下區塊由產生器覆蓋，勿手動編輯 'BEGIN AUTO' 與 'END AUTO' 之間的內容 -->
## 📂 檔案樹（重點目錄）
<!-- BEGIN AUTO:FILE_TREE -->
（將由 make_snapshot.py 自動產生）
<!-- END AUTO:FILE_TREE -->

## 🗺️ 前端路由（Next.js）
<!-- BEGIN AUTO:NEXT_ROUTES -->
（將由 make_snapshot.py 自動產生）
<!-- END AUTO:NEXT_ROUTES -->

## 🔌 後端 API 一覽（FastAPI）
<!-- BEGIN AUTO:FASTAPI_ROUTES -->
（將由 make_snapshot.py 自動產生）
<!-- END AUTO:FASTAPI_ROUTES -->

## 📦 依賴與版本（Top）
<!-- BEGIN AUTO:DEPENDENCIES -->
（將由 make_snapshot.py 自動產生）
<!-- END AUTO:DEPENDENCIES -->

## 🧱 共用規範與錯誤處理
- 前端錯誤：轉為 `AppError(code, context, userMessage, action, statusCode?, correlationId?)`
- 後端回應：`StandardResponse`（`success/message/data/error/correlation_id`）
- p 值顯示：`< 0.001`；其餘四位小數
- 文字輸出：可投稿的 Methods/Results 需保留可追溯參數與流程

## ✅ PR 檢查清單
- 是否遵循本檔案分層與規範
- 是否更新了本檔（若新增路由/依賴/頁面）
- 是否提供完整、可直接貼上的程式碼與路徑
