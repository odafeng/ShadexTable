ShadexTable

ShadexTable 是一個以 Next.js 14、React、TypeScript 為基礎的統計分析平台，提供醫療研究人員與統計分析師友善的資料上傳、檢驗與分析流程。它結合了簡單易用的前端介面、強大的錯誤處理機制與 AI 輔助分析功能，協助使用者快速完成資料清理與統計報表產出。

✨ 特色
•	即時資料預覽與上傳：支援 CSV、Excel 等格式的檔案上傳，並在瀏覽器內預覽欄位內容與類型。系統會自動偵測檔案大小、格式與敏感欄位，為使用者提供安全提示。
•	AI 輔助統計分析：內建自動與半自動分析流程，可依資料類型產生描述性統計、列聯表、t 檢定、卡方檢定等報表，並以圖表與表格呈現。
•	統一錯誤處理與回報：專案提供集中式的錯誤處理框架，開發者只需 throw createError(...) 或使用 CommonErrors 工廠函式，即可觸發情境化錯誤訊息、建議動作與自動回報，避免散落的 try/catch 及不一致的訊息。
•	可重用的 API 客戶端：apiClient 封裝了 fetch，內建逾時控制、重試、指數退避與錯誤轉換，可減少重複的網路請求程式碼。
•	TypeScript 型別安全：使用嚴謹的型別定義與介面，涵蓋錯誤代碼、情境、伺服器回應與資料模型，在編譯期間發現潛在錯誤。
•	Tailwind CSS 樣式：採用 Tailwind 進行樣式設計，提供響應式且易於客製的使用者介面。

📦 專案結構
├── app/                # Next.js 應用程式入口與路由
├── components/         # 可重用的 React UI 元件
├── lib/                # 封裝外部服務 (例如 apiClient)
├── utils/              # 工具函式與統一錯誤系統
├── types/              # TypeScript 型別與枚舉定義
├── public/             # 靜態資源
├── package.json
└── README.md
•	types/errors.ts：定義 ErrorCode、ErrorContext 及 AppErrorInterface 等型別。
•	utils/error.ts：集中錯誤處理邏輯，包含 createError、CommonErrors、createErrorHandler 以及錯誤訊息表 (ERROR_MESSAGES) 等。
•	lib/apiClient.ts：封裝 HTTP 請求，統一處理逾時與錯誤轉換，並暴露 reportError() 用於上報。
•	app/：使用 App Router 組織頁面與 API routes。

🚀 安裝與啟動
1.	克隆專案
git clone https://github.com/odafeng/ShadexTable.git
cd ShadexTable

2.	安裝相依套件
# 使用你偏好的包管理器
npm install
# yarn install
# pnpm install

3.	設定環境變數
複製 .env.example 為 .env.local，並填入後端 API 網域、認證金鑰、Sentry DSN 等設定。例如：
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
NEXT_PUBLIC_SENTRY_DSN=...

4.	啟動開發伺服器
npm run dev
# 或 yarn dev / pnpm dev
開啟瀏覽器至 http://localhost:3000 查看結果。修改檔案會自動更新。

5.	建置與部署
npm run build    # 建置產生可部署的產物
npm run start    # 使用 Node 伺服器執行產生的產物
本專案可部署至 Vercel 或其他支援 Node.js 的雲服務。請參考 Next.js 部署文件進行設定。

🛠️ 使用統一錯誤處理機制
為確保使用者體驗一致並方便除錯，請遵循以下原則建立與處理錯誤：
1.	建立錯誤：不要 throw new Error()；使用 createError(ErrorCode, ErrorContext, messageKey?, options?) 或 CommonErrors 中的函式。
2.	處理錯誤：在 try/catch 中，判斷錯誤是否為 AppError，如果是，顯示 error.userMessage，並依 error.action 提供重試或其他操作；最後調用 reportError(error) 上報。
import { apiClient } from '@/lib/apiClient';
import { ErrorContext, isAppError } from '@/utils/error';

try {
  const res = await apiClient.post('/api/files/upload', formData, { context: ErrorContext.FILE_UPLOAD });
} catch (err) {
  if (isAppError(err)) {
    alert(err.userMessage);
    // 根據 err.action 顯示重試或其他選項
    apiClient.reportError(err);
  }
}

3.	共用處理器：對於重複呼叫的非同步邏輯，可使用 createErrorHandler((appError) => {...}) 包裝，集中處理所有例外。
更多資訊請參考 utils/error.ts 中的文件與實作。

🤝 貢獻
歡迎提交 issue 或 pull request 來改進此專案！請遵循以下步驟：
1.	Fork 專案並建立功能分支
2.	執行 npm run lint 確保程式碼符合規範
3.	提供清楚的 commit 訊息與 PR 說明
4.	等待維護者審查與合併

📄 授權
除非另有說明，本專案採用 MIT License 授權。詳細內容請參閱 LICENSE 檔案。
________________________________________