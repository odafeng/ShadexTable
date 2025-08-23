import {
  AppError,
  ErrorCode,
  ErrorContext,
  ErrorSeverity,
  ERROR_MESSAGES,
  ErrorHandler,
  ErrorHandlerOptions,
  Json,
  ErrorDetails,
  ErrorMetadata,
  ErrorMessageConfig,
} from "@/types/errors";

/**
 * 創建錯誤選項介面
 * 用於 createError 函數的選項參數
 */
interface CreateErrorOptions {
  customMessage?: string;
  details?: ErrorDetails;
  cause?: Error;
  correlation_id?: string;
  metadata?: ErrorMetadata;
}

/**
 * 創建應用程式錯誤
 * @param code - 錯誤代碼
 * @param context - 錯誤上下文
 * @param messageKey - 錯誤訊息的 key（對應 ERROR_MESSAGES）
 * @param options - 額外的錯誤選項
 * @returns AppError 物件
 */
export function createError(
  code: ErrorCode,
  context?: ErrorContext,
  messageKey?: string,
  options?: CreateErrorOptions,
): AppError {
  const correlation_id = options?.correlation_id || crypto.randomUUID();
  const timestamp = new Date();

  // 安全地取得錯誤訊息配置
  const errorInfo: ErrorMessageConfig | undefined = messageKey
    ? ERROR_MESSAGES[messageKey]
    : undefined;

  // 決定錯誤訊息
  const message =
    options?.customMessage || errorInfo?.userMessage || getDefaultMessage(code);
  const userMessage =
    options?.customMessage ||
    errorInfo?.userMessage ||
    getDefaultUserMessage(code);
  const action = errorInfo?.action || getDefaultAction(code);
  const severity = errorInfo?.severity || getDefaultSeverity(code);
  const canRetry = errorInfo?.canRetry ?? getDefaultCanRetry(code);

  return {
    code,
    message,
    userMessage,
    context: context || ErrorContext.UNKNOWN,
    severity,
    correlation_id,
    timestamp,
    details: options?.details,
    cause: options?.cause,
    stack: options?.cause?.stack,
    action,
    canRetry,
    metadata: options?.metadata,
  };
}

/**
 * 從 HTTP 狀態碼創建錯誤
 * @param status - HTTP 狀態碼
 * @param context - 錯誤上下文
 * @param correlation_id - 關聯 ID
 * @param responseData - 回應資料
 * @returns AppError 物件
 */
export function createErrorFromHttp(
  status: number,
  context?: ErrorContext,
  correlation_id?: string,
  responseData?: Json,
): AppError {
  const baseOptions: CreateErrorOptions = {
    correlation_id,
    details: { status, responseData },
  };

  switch (true) {
    // 4xx 客戶端錯誤
    case status === 400:
      return createError(
        ErrorCode.VALIDATION_ERROR,
        context || ErrorContext.DATA_VALIDATION,
        undefined,
        {
          ...baseOptions,
          customMessage: "請求格式錯誤，請檢查資料格式",
        },
      );

    case status === 401:
      return createError(
        ErrorCode.AUTH_ERROR,
        context || ErrorContext.AUTHENTICATION,
        "auth.unauthorized",
        baseOptions,
      );

    case status === 403:
      return createError(
        ErrorCode.AUTH_ERROR,
        context || ErrorContext.AUTHENTICATION,
        undefined,
        {
          ...baseOptions,
          customMessage: "權限不足，無法存取此資源",
        },
      );

    case status === 404:
      return createError(
        ErrorCode.VALIDATION_ERROR,
        context || ErrorContext.DATA_VALIDATION,
        undefined,
        {
          ...baseOptions,
          customMessage: "請求的資源不存在，請檢查 URL 是否正確",
        },
      );

    case status === 409:
      return createError(
        ErrorCode.DATA_VALIDATION_FAILED,
        context || ErrorContext.DATA_VALIDATION,
        undefined,
        {
          ...baseOptions,
          customMessage: "資料衝突，可能是重複提交或資料已被修改",
        },
      );

    case status === 422:
      return createError(
        ErrorCode.DATA_VALIDATION_FAILED,
        context || ErrorContext.DATA_VALIDATION,
        undefined,
        {
          ...baseOptions,
          customMessage: "資料驗證失敗，請檢查輸入內容格式",
        },
      );

    case status === 429:
      return createError(
        ErrorCode.RATE_LIMIT_ERROR,
        context || ErrorContext.NETWORK,
        "network.rate_limit",
        baseOptions,
      );

    // 5xx 伺服器錯誤
    case status >= 500 && status < 600:
      return createError(
        ErrorCode.SERVER_ERROR,
        context || ErrorContext.NETWORK,
        "network.server_error",
        {
          ...baseOptions,
          customMessage: `伺服器錯誤 (${status})，請稍後重試`,
        },
      );

    // 其他狀態碼
    default:
      return createError(
        ErrorCode.UNKNOWN_ERROR,
        context || ErrorContext.NETWORK,
        undefined,
        {
          ...baseOptions,
          customMessage: `未知的 HTTP 錯誤 (${status})`,
        },
      );
  }
}

/**
 * 常見錯誤的快速創建函數集合
 * 提供預設錯誤創建的便利方法
 */
export const CommonErrors = {
  // 檔案相關錯誤
  fileNotSelected: (): AppError =>
    createError(
      ErrorCode.VALIDATION_ERROR,
      ErrorContext.FILE_UPLOAD,
      undefined,
      { customMessage: "請先選擇要上傳的檔案" },
    ),

  fileFormatUnsupported: (): AppError =>
    createError(
      ErrorCode.FILE_FORMAT_UNSUPPORTED,
      ErrorContext.FILE_UPLOAD,
      "file.format_unsupported",
    ),

  fileSizeExceeded: (actualSize: number, maxSize: number): AppError =>
    createError(
      ErrorCode.FILE_SIZE_EXCEEDED,
      ErrorContext.FILE_UPLOAD,
      "file.size_exceeded",
      {
        details: { actualSize, maxSize },
        customMessage: `檔案大小 ${formatFileSize(actualSize)} 已超過限制`,
      },
    ),

  fileEmpty: (): AppError =>
    createError(
      ErrorCode.FILE_EMPTY,
      ErrorContext.FILE_UPLOAD,
      "file.empty_file",
    ),

  fileCorrupted: (): AppError =>
    createError(
      ErrorCode.FILE_CORRUPTED,
      ErrorContext.FILE_PROCESSING,
      "file.corrupted",
    ),

  // 隱私相關錯誤
  sensitiveDataDetected: (): AppError =>
    createError(
      ErrorCode.SENSITIVE_DATA_DETECTED,
      ErrorContext.PRIVACY_CHECK,
      "privacy.sensitive_data_detected",
    ),

  privacyAgreementRequired: (): AppError =>
    createError(
      ErrorCode.PRIVACY_ERROR,
      ErrorContext.PRIVACY_CHECK,
      undefined,
      {
        customMessage: "請先同意隱私聲明才能繼續上傳檔案",
      },
    ),

  // 認證相關錯誤
  authTokenMissing: (): AppError =>
    createError(
      ErrorCode.AUTH_TOKEN_MISSING,
      ErrorContext.AUTHENTICATION,
      "auth.token_missing",
    ),

  authError: (context?: ErrorContext): AppError =>
    createError(
      ErrorCode.AUTH_ERROR,
      context || ErrorContext.AUTHENTICATION,
      "auth.unauthorized",
    ),

  analysisAuthFailed: (): AppError =>
    createError(
      ErrorCode.ANALYSIS_AUTH_FAILED,
      ErrorContext.ANALYSIS,
      "auth.unauthorized",
    ),

  // 分析相關錯誤
  analysisTimeout: (): AppError =>
    createError(
      ErrorCode.ANALYSIS_TIMEOUT,
      ErrorContext.ANALYSIS,
      "analysis.timeout",
    ),

  analysisFailed: (customMessage?: string): AppError =>
    createError(
      ErrorCode.ANALYSIS_ERROR,
      ErrorContext.ANALYSIS,
      "analysis.failed",
      { customMessage },
    ),

  noVariablesSelected: (customMessage?: string): AppError =>
    createError(
      ErrorCode.ANALYSIS_ERROR,
      ErrorContext.ANALYSIS,
      "analysis.novariables",
      { customMessage: customMessage || "未選擇任何變項" },
    ),

  // 資料驗證錯誤
  insufficientData: (): AppError =>
    createError(
      ErrorCode.VALIDATION_ERROR,
      ErrorContext.DATA_VALIDATION,
      undefined,
      { customMessage: "資料不足，無法進行分析" },
    ),

  invalidData: (customMessage?: string): AppError =>
    createError(
      ErrorCode.DATA_VALIDATION_FAILED,
      ErrorContext.DATA_VALIDATION,
      undefined,
      { customMessage: customMessage || "資料格式無效" },
    ),

  // 欄位相關錯誤
  columnDetectionFailed: (): AppError =>
    createError(
      ErrorCode.COLUMN_TYPE_DETECTION_FAILED,
      ErrorContext.ANALYSIS,
      "column.type_detection_failed",
    ),

  noValidColumns: (): AppError =>
    createError(
      ErrorCode.COLUMN_VALIDATION_FAILED,
      ErrorContext.DATA_VALIDATION,
      "column.no_valid_columns",
    ),

  // 網路相關錯誤
  networkError: (): AppError =>
    createError(
      ErrorCode.NETWORK_ERROR,
      ErrorContext.NETWORK,
      "network.connection_failed",
    ),

  serverError: (context?: ErrorContext): AppError =>
    createError(
      ErrorCode.SERVER_ERROR,
      context || ErrorContext.NETWORK,
      "network.server_error",
    ),

  rateLimitError: (): AppError =>
    createError(
      ErrorCode.RATE_LIMIT_ERROR,
      ErrorContext.NETWORK,
      "network.rate_limit",
    ),

  // 通用錯誤
  unknownError: (cause?: Error, customMessage?: string): AppError =>
    createError(ErrorCode.UNKNOWN_ERROR, ErrorContext.UNKNOWN, undefined, {
      customMessage: customMessage || "發生未知錯誤",
      cause,
    }),
};

/**
 * 創建錯誤處理器
 * @param onError - 錯誤處理回調函數
 * @param options - 錯誤處理選項
 * @returns 錯誤處理函數
 */
export function createErrorHandler(
  onError: ErrorHandler,
  options?: ErrorHandlerOptions,
): (error: unknown, context?: string) => void {
  return (error: unknown, context?: string) => {
    let appError: AppError;

    if (isAppError(error)) {
      appError = error;
    } else if (error instanceof Error) {
      appError = createError(
        ErrorCode.UNKNOWN_ERROR,
        ErrorContext.UNKNOWN,
        undefined,
        {
          customMessage: error.message,
          cause: error,
        },
      );
    } else {
      appError = createError(
        ErrorCode.UNKNOWN_ERROR,
        ErrorContext.UNKNOWN,
        undefined,
        {
          customMessage: String(error),
        },
      );
    }

    // 添加上下文到元數據
    if (context) {
      if (!appError.metadata) {
        appError.metadata = {} as ErrorMetadata;
      }
      appError.metadata.handlerContext = context;
    }

    // 記錄錯誤
    if (options?.shouldLog !== false) {
      console.error(`[${appError.code}] ${appError.message}`, {
        correlation_id: appError.correlation_id,
        context: appError.context,
        severity: appError.severity,
        cause: appError.cause,
      });
    }

    onError(appError, context);
  };
}

/**
 * 檢查是否為應用程式錯誤
 * 使用型別守衛確保型別安全
 * @param error - 要檢查的錯誤物件
 * @returns 是否為 AppError 型別
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    "correlation_id" in error
  );
}

/**
 * 提取錯誤訊息
 * @param error - 錯誤物件
 * @returns 用戶友好的錯誤訊息
 */
export function extractErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.userMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * 檔案大小格式化
 * @param bytes - 檔案大小（位元組）
 * @returns 格式化的檔案大小字串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"]; // 新增 TB 和 PB
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  // 確保 i 不超過 sizes 陣列的長度
  const sizeIndex = Math.min(i, sizes.length - 1);
  return (
    parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(2)) +
    " " +
    sizes[sizeIndex]
  );
}

/**
 * 取得預設錯誤訊息
 * @param code - 錯誤代碼
 * @returns 預設訊息
 */
function getDefaultMessage(code: ErrorCode): string {
  switch (code) {
    case ErrorCode.FILE_ERROR:
      return "檔案處理錯誤";
    case ErrorCode.VALIDATION_ERROR:
      return "資料驗證失敗";
    case ErrorCode.PRIVACY_ERROR:
      return "隱私檢查失敗";
    case ErrorCode.AUTH_ERROR:
      return "認證錯誤";
    case ErrorCode.ANALYSIS_ERROR:
      return "分析錯誤";
    case ErrorCode.NETWORK_ERROR:
      return "網路錯誤";
    case ErrorCode.SERVER_ERROR:
      return "伺服器錯誤";
    default:
      return "未知錯誤";
  }
}

/**
 * 取得預設用戶訊息
 * @param code - 錯誤代碼
 * @returns 用戶友好的訊息
 */
function getDefaultUserMessage(code: ErrorCode): string {
  switch (code) {
    case ErrorCode.FILE_ERROR:
      return "檔案處理時發生錯誤，請重新選擇檔案";
    case ErrorCode.VALIDATION_ERROR:
      return "資料格式不正確，請檢查檔案內容";
    case ErrorCode.PRIVACY_ERROR:
      return "檔案包含敏感資料，請移除後重新上傳";
    case ErrorCode.AUTH_ERROR:
      return "認證失敗，請重新登入";
    case ErrorCode.ANALYSIS_ERROR:
      return "分析過程中發生錯誤，請重試";
    case ErrorCode.NETWORK_ERROR:
      return "網路連線問題，請檢查連線狀態";
    case ErrorCode.SERVER_ERROR:
      return "伺服器暫時無法回應，請稍後重試";
    default:
      return "發生未預期的錯誤，請重試或聯絡客服";
  }
}

/**
 * 取得預設操作建議
 * @param code - 錯誤代碼
 * @returns 建議的操作
 */
function getDefaultAction(code: ErrorCode): string {
  switch (code) {
    case ErrorCode.FILE_ERROR:
      return "請重新選擇正確的檔案";
    case ErrorCode.VALIDATION_ERROR:
      return "請檢查資料格式並重新上傳";
    case ErrorCode.PRIVACY_ERROR:
      return "請移除敏感資料後重新上傳";
    case ErrorCode.AUTH_ERROR:
      return "請重新登入";
    case ErrorCode.ANALYSIS_ERROR:
      return "請重試或聯絡客服";
    case ErrorCode.NETWORK_ERROR:
      return "請檢查網路連線並重試";
    case ErrorCode.SERVER_ERROR:
      return "請稍後重試";
    default:
      return "請重試或聯絡客服";
  }
}

/**
 * 取得預設嚴重程度
 * @param code - 錯誤代碼
 * @returns 錯誤嚴重程度
 */
function getDefaultSeverity(code: ErrorCode): ErrorSeverity {
  switch (code) {
    case ErrorCode.PRIVACY_ERROR:
    case ErrorCode.AUTH_ERROR:
      return ErrorSeverity.HIGH;
    case ErrorCode.SERVER_ERROR:
      return ErrorSeverity.HIGH;
    case ErrorCode.FILE_ERROR:
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.ANALYSIS_ERROR:
      return ErrorSeverity.MEDIUM;
    case ErrorCode.NETWORK_ERROR:
      return ErrorSeverity.LOW;
    default:
      return ErrorSeverity.MEDIUM;
  }
}

/**
 * 取得預設重試設定
 * @param code - 錯誤代碼
 * @returns 是否可重試
 */
function getDefaultCanRetry(code: ErrorCode): boolean {
  switch (code) {
    case ErrorCode.FILE_FORMAT_UNSUPPORTED:
    case ErrorCode.FILE_SIZE_EXCEEDED:
    case ErrorCode.SENSITIVE_DATA_DETECTED:
    case ErrorCode.AUTH_TOKEN_MISSING:
      return false;
    case ErrorCode.NETWORK_ERROR:
    case ErrorCode.SERVER_ERROR:
    case ErrorCode.ANALYSIS_TIMEOUT:
      return true;
    default:
      return true;
  }
}

export { ErrorContext, ErrorCode };
