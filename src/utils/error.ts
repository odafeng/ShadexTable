import {
  AppError,
  ErrorCode,
  ErrorContext,
  ErrorSeverity,
  ERROR_MESSAGES,
  ErrorHandler,
  ErrorHandlerOptions
} from '@/types/errors';

// 創建應用程式錯誤
export function createError(
  code: ErrorCode,
  context?: ErrorContext,
  messageKey?: string,
  options?: {
    customMessage?: string;
    details?: Record<string, any>;
    cause?: Error;
    correlationId?: string;
    metadata?: Record<string, any>;
  }
): AppError {
  const correlationId = options?.correlationId || crypto.randomUUID();
  const timestamp = new Date();
  // 將 ERROR_MESSAGES 轉為 any 以允許以字串索引，避免 ts7053 錯誤
  const errorInfo = messageKey ? (ERROR_MESSAGES as any)[messageKey] : undefined;

  // 決定錯誤訊息
  const message = options?.customMessage || errorInfo?.userMessage || getDefaultMessage(code);
  const userMessage = options?.customMessage || errorInfo?.userMessage || getDefaultUserMessage(code);
  const action = errorInfo?.action || getDefaultAction(code);
  const severity = errorInfo?.severity || getDefaultSeverity(code);
  const canRetry = errorInfo?.canRetry ?? getDefaultCanRetry(code);

  return {
    code,
    message,
    userMessage,
    context: context || ErrorContext.UNKNOWN,
    severity,
    correlationId,
    timestamp,
    details: options?.details,
    cause: options?.cause,
    stack: options?.cause?.stack,
    action,
    canRetry,
    metadata: options?.metadata
  };
}

export function createErrorFromHttp(
  status: number,
  context?: ErrorContext,
  correlationId?: string,
  responseData?: any
): AppError {
  const baseOptions = {
    correlationId,
    details: { status, responseData }
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
          customMessage: '請求格式錯誤，請檢查資料格式'
        }
      );

    case status === 401:
      return createError(
        ErrorCode.AUTH_ERROR,
        context || ErrorContext.AUTHENTICATION,
        'auth.unauthorized',
        baseOptions
      );

    case status === 403:
      return createError(
        ErrorCode.AUTH_ERROR,
        context || ErrorContext.AUTHENTICATION,
        undefined,
        {
          ...baseOptions,
          customMessage: '權限不足，無法存取此資源'
        }
      );

    case status === 404:
      return createError(
        ErrorCode.VALIDATION_ERROR,
        context || ErrorContext.DATA_VALIDATION,
        undefined,
        {
          ...baseOptions,
          customMessage: '請求的資源不存在，請檢查 URL 是否正確'
        }
      );

    case status === 409:
      return createError(
        ErrorCode.DATA_VALIDATION_FAILED,
        context || ErrorContext.DATA_VALIDATION,
        undefined,
        {
          ...baseOptions,
          customMessage: '資料衝突，可能是重複提交或資料已被修改'
        }
      );

    case status === 422:
      return createError(
        ErrorCode.DATA_VALIDATION_FAILED,
        context || ErrorContext.DATA_VALIDATION,
        undefined,
        {
          ...baseOptions,
          customMessage: '資料驗證失敗，請檢查輸入內容格式'
        }
      );

    case status === 429:
      return createError(
        ErrorCode.RATE_LIMIT_ERROR,
        context || ErrorContext.NETWORK,
        'network.rate_limit',
        baseOptions
      );

    // 5xx 伺服器錯誤
    case status >= 500 && status < 600:
      return createError(
        ErrorCode.SERVER_ERROR,
        context || ErrorContext.NETWORK,
        'network.server_error',
        {
          ...baseOptions,
          customMessage: `伺服器錯誤 (${status})，請稍後重試`
        }
      );

    // 其他狀態碼
    default:
      return createError(
        ErrorCode.UNKNOWN_ERROR,
        context || ErrorContext.NETWORK,
        undefined,
        {
          ...baseOptions,
          customMessage: `未知的 HTTP 錯誤 (${status})`
        }
      );
  }
}

// 常見錯誤的快速創建函數
export const CommonErrors = {
  // 檔案相關錯誤
  fileNotSelected: (): AppError => createError(
    ErrorCode.VALIDATION_ERROR,
    ErrorContext.FILE_UPLOAD,
    undefined,
    { customMessage: '請先選擇要上傳的檔案' }
  ),

  fileFormatUnsupported: (): AppError => createError(
    ErrorCode.FILE_FORMAT_UNSUPPORTED,
    ErrorContext.FILE_UPLOAD,
    'file.format_unsupported'
  ),

  fileSizeExceeded: (actualSize: number, maxSize: number): AppError => createError(
    ErrorCode.FILE_SIZE_EXCEEDED,
    ErrorContext.FILE_UPLOAD,
    'file.size_exceeded',
    {
      details: { actualSize, maxSize },
      customMessage: `檔案大小 ${formatFileSize(actualSize)} 已超過限制`
    }
  ),

  fileEmpty: (): AppError => createError(
    ErrorCode.FILE_EMPTY,
    ErrorContext.FILE_UPLOAD,
    'file.empty_file'
  ),

  fileCorrupted: (): AppError => createError(
    ErrorCode.FILE_CORRUPTED,
    ErrorContext.FILE_PROCESSING,
    'file.corrupted'
  ),

  // 隱私相關錯誤
  sensitiveDataDetected: (): AppError => createError(
    ErrorCode.SENSITIVE_DATA_DETECTED,
    ErrorContext.PRIVACY_CHECK,
    'privacy.sensitive_data_detected'
  ),

  privacyAgreementRequired: (): AppError => createError(
  ErrorCode.PRIVACY_ERROR,
  ErrorContext.PRIVACY_CHECK,
  undefined,
  {
    customMessage: '請先同意隱私聲明才能繼續上傳檔案'
  }
),

  // 認證相關錯誤
  authTokenMissing: (): AppError => createError(
    ErrorCode.AUTH_TOKEN_MISSING,
    ErrorContext.AUTHENTICATION,
    'auth.token_missing'
  ),

  authError: (context?: ErrorContext): AppError => createError(
    ErrorCode.AUTH_ERROR,
    context || ErrorContext.AUTHENTICATION,
    'auth.unauthorized'
  ),

  analysisAuthFailed: (): AppError => createError(
    ErrorCode.ANALYSIS_AUTH_FAILED,
    ErrorContext.ANALYSIS,
    'auth.unauthorized'
  ),

  // 分析相關錯誤
  analysisTimeout: (): AppError => createError(
    ErrorCode.ANALYSIS_TIMEOUT,
    ErrorContext.ANALYSIS,
    'analysis.timeout'
  ),

  analysisFailed: (customMessage?: string): AppError => createError(
    ErrorCode.ANALYSIS_ERROR,
    ErrorContext.ANALYSIS,
    'analysis.failed',
    { customMessage }
  ),

  noVariablesSelected: (customMessage?: string): AppError => createError(
    ErrorCode.ANALYSIS_ERROR,
    ErrorContext.ANALYSIS,
    'analysis.novariables',
    { customMessage: '未選擇任何變項' }
  ),


  // 資料驗證錯誤
  insufficientData: (): AppError => createError(
    ErrorCode.VALIDATION_ERROR,
    ErrorContext.DATA_VALIDATION,
    undefined,
    { customMessage: '資料不足，無法進行分析' }
  ),

  invalidData: (customMessage?: string): AppError => createError(
    ErrorCode.DATA_VALIDATION_FAILED,
    ErrorContext.DATA_VALIDATION,
    undefined,
    { customMessage: customMessage || '資料格式無效' }
  ),

  // 欄位相關錯誤
  columnDetectionFailed: (): AppError => createError(
    ErrorCode.COLUMN_TYPE_DETECTION_FAILED,
    ErrorContext.ANALYSIS,
    'column.type_detection_failed'
  ),

  noValidColumns: (): AppError => createError(
    ErrorCode.COLUMN_VALIDATION_FAILED,
    ErrorContext.DATA_VALIDATION,
    'column.no_valid_columns'
  ),

  // 網路相關錯誤
  networkError: (): AppError => createError(
    ErrorCode.NETWORK_ERROR,
    ErrorContext.NETWORK,
    'network.connection_failed'
  ),

  serverError: (context?: ErrorContext): AppError => createError(
    ErrorCode.SERVER_ERROR,
    context || ErrorContext.NETWORK,
    'network.server_error'
  ),

  rateLimitError: (): AppError => createError(
    ErrorCode.RATE_LIMIT_ERROR,
    ErrorContext.NETWORK,
    'network.rate_limit'
  ),

  // 通用錯誤
  unknownError: (cause?: Error, customMessage?: string): AppError => createError(
    ErrorCode.UNKNOWN_ERROR,
    ErrorContext.UNKNOWN,
    undefined,
    {
      customMessage: customMessage || '發生未知錯誤',
      cause
    }
  )
};

// 創建錯誤處理器
export function createErrorHandler(
  onError: ErrorHandler,
  options?: ErrorHandlerOptions
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
          cause: error
        }
      );
    } else {
      appError = createError(
        ErrorCode.UNKNOWN_ERROR,
        ErrorContext.UNKNOWN,
        undefined,
        {
          customMessage: String(error)
        }
      );
    }

    // 添加上下文到元數據
    if (context) {
      if (!appError.metadata) {
        appError.metadata = {};
      }
      appError.metadata.handlerContext = context;
    }

    // 記錄錯誤
    if (options?.shouldLog !== false) {
      console.error(`[${appError.code}] ${appError.message}`, {
        correlationId: appError.correlationId,
        context: appError.context,
        severity: appError.severity,
        cause: appError.cause
      });
    }

    onError(appError, context);
  };
}

// 檢查是否為應用程式錯誤
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'correlationId' in error
  );
}

// 提取錯誤訊息
export function extractErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.userMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// 檔案大小格式化
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 預設錯誤訊息
function getDefaultMessage(code: ErrorCode): string {
  switch (code) {
    case ErrorCode.FILE_ERROR:
      return '檔案處理錯誤';
    case ErrorCode.VALIDATION_ERROR:
      return '資料驗證失敗';
    case ErrorCode.PRIVACY_ERROR:
      return '隱私檢查失敗';
    case ErrorCode.AUTH_ERROR:
      return '認證錯誤';
    case ErrorCode.ANALYSIS_ERROR:
      return '分析錯誤';
    case ErrorCode.NETWORK_ERROR:
      return '網路錯誤';
    case ErrorCode.SERVER_ERROR:
      return '伺服器錯誤';
    default:
      return '未知錯誤';
  }
}

function getDefaultUserMessage(code: ErrorCode): string {
  switch (code) {
    case ErrorCode.FILE_ERROR:
      return '檔案處理時發生錯誤，請重新選擇檔案';
    case ErrorCode.VALIDATION_ERROR:
      return '資料格式不正確，請檢查檔案內容';
    case ErrorCode.PRIVACY_ERROR:
      return '檔案包含敏感資料，請移除後重新上傳';
    case ErrorCode.AUTH_ERROR:
      return '認證失敗，請重新登入';
    case ErrorCode.ANALYSIS_ERROR:
      return '分析過程中發生錯誤，請重試';
    case ErrorCode.NETWORK_ERROR:
      return '網路連線問題，請檢查連線狀態';
    case ErrorCode.SERVER_ERROR:
      return '伺服器暫時無法回應，請稍後重試';
    default:
      return '發生未預期的錯誤，請重試或聯絡客服';
  }
}

function getDefaultAction(code: ErrorCode): string {
  switch (code) {
    case ErrorCode.FILE_ERROR:
      return '請重新選擇正確的檔案';
    case ErrorCode.VALIDATION_ERROR:
      return '請檢查資料格式並重新上傳';
    case ErrorCode.PRIVACY_ERROR:
      return '請移除敏感資料後重新上傳';
    case ErrorCode.AUTH_ERROR:
      return '請重新登入';
    case ErrorCode.ANALYSIS_ERROR:
      return '請重試或聯絡客服';
    case ErrorCode.NETWORK_ERROR:
      return '請檢查網路連線並重試';
    case ErrorCode.SERVER_ERROR:
      return '請稍後重試';
    default:
      return '請重試或聯絡客服';
  }
}

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
