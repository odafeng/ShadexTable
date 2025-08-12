🔔 AI 提示：使用 ShadexTable 現有錯誤處理框架
您（AI 開發助手）在編寫或修改 ShadexTable 的程式碼時，請務必遵循以下規則。這些規則基於目前專案已實作的錯誤處理與回報機制，為了保持一致，請不要重新發明新的錯誤體系。

📂 已有架構
型別定義在 types/errors.ts：

ErrorCode 列舉包含通用錯誤（驗證、網路、授權、伺服器、未知）與業務錯誤（檔案、分析、隱私）。

ErrorContext 列舉描述發生錯誤的情境（檔案上傳、分析、資料取得、登入、支付、其他）。

AppErrorInterface 規範錯誤物件欄位，如 code、context、userMessage、action、statusCode、correlationId 等。

統一錯誤系統在 utils/error.ts：

不要使用 new Error()；請使用 createError(code, context?, messageKey?, options?) 或 CommonErrors 中的函式來建立錯誤。

檔案內提供 ERROR_MESSAGES 常數作為多語訊息來源（原 i18n/errors.ts 已整合至此），並定義預設訊息、建議動作、嚴重程度與是否可重試。

使用 createErrorHandler(onError, options?) 產生錯誤處理函式，它會將任意錯誤轉為 AppError 並呼叫回呼函式。這取代了舊版 errorHandler.ts。

使用 isAppError(error) 判斷錯誤類型，使用 extractErrorMessage(error) 安全取得錯誤訊息。

API 請求在 apiClient.ts：

請透過 apiClient.get/post/put/delete 送出 HTTP 請求，並提供 context；這些方法會自動處理逾時、重試、錯誤轉換與關聯 ID。

發生錯誤時，apiClient 會拋出 AppError；請在 catch 區塊中判斷 err instanceof AppError，再顯示 err.userMessage、err.action，並呼叫 reportError(err) 上報。

✅ 開發時必須遵守
一律使用既有的錯誤工廠與處理器：不要自行建立錯誤類別或重複封裝錯誤邏輯。

傳入正確的錯誤情境：在呼叫 createError 或 apiClient 時，請傳遞合適的 ErrorContext，以便系統產生情境化的提示。

善用 messageKey 覆寫訊息：如果需要特定的使用者訊息或動作，請傳入 messageKey（對應 ERROR_MESSAGES 的鍵）。

統一上報錯誤：呼叫 reportError(AppError, extra?) 將錯誤送往伺服器或監控系統；請勿自行記錄或忽略錯誤。

不要引用已刪除的檔案：原有的 i18n/errors.ts 和 errorHandler.ts 已被整合/淘汰，禁止重新引入或創建類似檔案。

💡 範例
import { ErrorContext, ErrorCode, createError, CommonErrors, createErrorHandler, isAppError } from '@/utils/error';
import { apiClient } from '@/apiClient';

// 正確的 API 呼叫
async function uploadFile(formData: FormData) {
  try {
    const res = await post('/api/files/upload', formData, { context: ErrorContext.FILE_UPLOAD });
    return res;
  } catch (err) {
    if (isAppError(err)) {
      // 友善的使用者訊息與建議
      alert(err.userMessage);
      // 上報錯誤
      apiClient.reportError(err);
    } else {
      // 其他未知錯誤
      const appErr = createError(ErrorCode.UNKNOWN_ERROR, ErrorContext.FILE_UPLOAD, undefined, { customMessage: String(err) });
      alert(appErr.userMessage);
      apiClient.reportError(appErr);
    }
  }
}

// 使用 CommonErrors
function validateFileSelected(file?: File) {
  if (!file) {
    throw CommonErrors.fileNotSelected();
  }
}

// 使用 createErrorHandler 包裝
const handleError = createErrorHandler((appError) => {
  console.error(appError.code, appError.userMessage);
});

async function doAnalysis() {
  try {
    // ...某些可能拋出錯誤的操作
  } catch (err) {
    handleError(err, 'doAnalysis');
  }
}