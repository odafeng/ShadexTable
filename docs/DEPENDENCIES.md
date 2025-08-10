# 主要依賴清單（Top Dependencies）

> 請保持此清單為「人讀」摘要，說明用途與注意事項。次要依賴不必列出。

## 前端（Next.js / TypeScript）
- next / react / react-dom：前端框架
- tailwindcss / @shadcn/ui：UI 樣式與元件
- framer-motion：動畫
- @clerk/nextjs：登入/註冊與保護頁面
- lucide-react：Icon（僅必要時使用）
- zod：Schema 驗證（建議）

## 後端（FastAPI / Python）
- fastapi / uvicorn：Web 伺服器
- pydantic：Schema 驗證
- sqlalchemy：資料庫 ORM
- openai：OpenAI API 用戶端
- tiktoken：token 計數
- pandas / numpy / scipy / scikit-learn：統計與 ML
- python-docx：報告匯出（若使用）

## 平台
- Vercel（前端）
- Render（後端）
- Supabase（DB）

> 新增依賴時：請先更新此檔案說明用途與注意事項，再提交 PR 安裝。
