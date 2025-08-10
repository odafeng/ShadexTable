檔案結構與核心組件
errors.ts（型別定義）：

ErrorCode 枚舉定義通用錯誤（VALIDATION_ERROR、NETWORK_ERROR、AUTH_ERROR、RATE_LIMIT_ERROR、SERVER_ERROR、UNKNOWN_ERROR）與業務特定錯誤（FILE_ERROR、ANALYSIS_ERROR、PRIVACY_ERROR）。

ErrorContext 枚舉描述錯誤情境，例如 FILE_UPLOAD、ANALYSIS、DATA_FETCH、USER_LOGIN、PAYMENT、OTHER 等。

AppErrorInterface 定義錯誤物件的結構，包含 code、context、userMessage、action、statusCode、correlationId、messageDev、cause、data 等屬性。

utils/error.ts（統一錯誤系統）：

AppError 類別繼承原生 Error 並實作 AppErrorInterface，用來保存錯誤代碼、情境、顯示給使用者的訊息與建議動作、HTTP 狀態碼、關聯 ID 等。

GENERAL_ERRORS、CONTEXTUAL_ERRORS、SPECIFIC_ERRORS 三層訊息配置，用於定義通用訊息、依情境覆蓋訊息，以及更細緻的類別特定訊息。例如，檔案上傳失敗會給出「檔案處理失敗，請檢查檔案是否損壞」並建議「重新選擇檔案」。

createError(code, context?, specificType?, options?)：根據錯誤代碼、情境與特定類型建構 AppError，會自動選擇適當的訊息與建議動作。

createErrorFromHttp(status, context?, correlationId?)：把 HTTP 狀態碼轉換為對應的 AppError（例如 401/403 轉成 AUTH_ERROR）。

extractErrorMessage、fromAnalysisError：安全地從未知錯誤中取得訊息，或將舊版 AnalysisError 轉換為 AppError。

createErrorHandler(onError)：回傳一個函式，接收任意錯誤並轉換成 AppError 後交由 onError 處理，便於在 UI 或 hook 中統一處理錯誤。

CommonErrors：一些常用錯誤的快速建立函式，例如 fileTooLarge()、analysisTimeout()、networkError(context?) 等。

errorHandler.ts（分析模組的舊處理器）：

定義了簡單的 AnalysisError 類別。

createErrorHandler(setError) 回傳函式，用於處理 AnalysisError 或其他未知錯誤並安全擷取訊息，屬於舊模組的過渡解決方案。

apiClient.ts（API 請求封裝）：

包裝原生 fetch，提供 get/post/put/delete 方法，支援逾時控制 (timeout)、重試 (retries)、指數退避、產生 correlationId 等功能。

失敗時會根據 HTTP 狀態呼叫 createErrorFromHttp，逾時或網路錯誤則呼叫 createError，並附帶當前 context，最後拋出 AppError。

isRetryableError 和 isAppError 用於判斷錯誤類型、是否重試。

reportError(AppError, extra?) 將錯誤資訊整合並上傳到後端（在開發環境下會打印到 console），可後續整合 Sentry。

使用建議
使用 API 客戶端：呼叫資料時請使用 apiClient.get/post/put/delete 並傳入對應的 context，避免直接使用 fetch。這樣可以享受逾時、重試與錯誤統一處理。

拋出自訂錯誤：在應用邏輯中不要 throw new Error()；改用 createError(code, context, specificType?, options?) 或 CommonErrors 中的快捷方法，確保訊息與建議一致。

捕獲與顯示錯誤：在 try/catch 中捕獲錯誤，若為 AppError 則使用 error.userMessage 及 error.action 提示使用者，再視情況呼叫 reportError(error) 上報。例如：

ts
複製
編輯
try {
  const data = await apiClient.post('/api/files/upload', formData, { context: ErrorContext.FILE_UPLOAD });
} catch (error) {
  if (error instanceof AppError) {
    showToast(error.userMessage);
    // 可根據 error.action 顯示重試按鈕或其他操作提示
    reportError(error);
  }
}
建立統一處理器：對於複雜的元件，可以使用 createErrorHandler(onError) 將任意錯誤轉換為 AppError 再處理，或在 hook 中統一處理分析模組的 AnalysisError。

上報與監控：在非開發環境下，reportError 會將錯誤資料送往 /api/client-error；你可以在伺服器端儲存到資料庫並發送告警，或整合 Sentry 等第三方監控。