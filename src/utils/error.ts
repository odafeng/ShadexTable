import { 
    AppError, 
    ErrorCode, 
    ErrorContext, 
    ErrorSeverity,
    ErrorHandler,
    ErrorHandlerOptions 
} from '@/types/errors';

export const ERROR_MESSAGES = {
  errors: {
    validation: '請檢查輸入的資料是否正確',
    network: '網路連線不穩定，請檢查網路後重試',
    auth: '登入已過期，請重新登入',
    rateLimit: '操作太頻繁了，請稍等一下再試',
    server: '系統正在維護中，請稍後再試',
    unknown: '出了點小狀況，請重新操作',
    notFound: '找不到這個頁面，可能網址有誤',
    file: {
      not_selected: '請先選擇檔案後再上傳',
      validation_failed: '檔案格式或大小不符合要求，請重新選擇',
      sensitive_data_check_failed: '檔案安全檢測失敗，請重新上傳',
      selection_failed: '檔案選擇失敗，請重新嘗試',
      privacy_confirm_failed: '隱私確認處理失敗，請重試',
      process_failed: '檔案處理失敗，請檢查檔案是否損壞',
      unexpected_process_error: '檔案處理時發生未預期錯誤，請重新上傳',
      size_exceeded: '檔案大小超過限制，請選擇較小的檔案',
      format_unsupported: '不支援的檔案格式，請選擇 CSV 或 Excel 檔案',
      empty_file: '檔案內容為空，請檢查檔案後重新上傳',
      corrupted: '檔案可能已損壞，請重新準備檔案',
      basic_info_failed: '無法讀取檔案基本資訊，請檢查檔案格式',
      read_failed: '檔案讀取失敗，請重新選擇檔案'
    },
    analysis: {
      auto_failed: 'AI 全自動分析失敗，請稍後再試或改用手動模式',
      manual_failed: '半自動分析失敗，請檢查資料後重試',
      unexpected: '分析過程中發生未預期錯誤，請重新操作',
      insufficient_data: '資料量不足以進行分析，請提供更多資料',
      timeout: '分析處理時間過長，請稍後再試',
      auth_failed: '授權失敗，請重新登入後再試',
      api_error: 'API 呼叫失敗，請稍後再試',
      network_error: '網路連線異常，請檢查網路後重試',
      server_error: '伺服器處理異常，請稍後再試',
      validation_error: '輸入資料驗證失敗，請檢查設定',
      no_variables_selected: '請至少選擇一個類別變項或連續變項',
      type_mismatch: '部分變項類型與系統判定不一致，請確認後繼續'
    },
    column: {
      analysis_failed: '欄位分析失敗，請檢查資料格式是否正確',
      unexpected_error: '欄位分析時發生未預期錯誤，請重試',
      no_valid_columns: '找不到有效的資料欄位，請檢查檔案內容',
      type_detection_failed: '無法自動判斷欄位類型，請手動設定',
      api_auth_missing: '授權資訊遺失，請重新登入',
      api_url_missing: 'API 設定異常，請聯絡系統管理員',
      api_response_invalid: 'API 回應格式異常，請稍後再試',
      no_data: '沒有資料可分析，請檢查檔案內容'
    },
    privacy: {
      agreement_required: '請先閱讀並同意隱私聲明',
      sensitive_data_blocked: '偵測到敏感資料，請移除個人識別資訊後重新上傳',
      confirm_failed: '隱私確認失敗，請重試',
      cancel_failed: '取消操作時發生錯誤'
    },
    table: {
      analysis_failed: '表格分析失敗，請檢查資料格式',
      api_error: '分析服務暫時無法使用，請稍後再試',
      api_parse_error: '分析結果解析失敗，請重新分析',
      missing_table_data: '分析結果不完整，請重新分析',
      invalid_table_format: '分析結果格式異常，請重新分析',
      network_error: '網路連線異常，請檢查網路後重試',
      auth_failed: '授權已過期，請重新登入',
      validation_failed: '分析參數驗證失敗，請檢查設定'
    },
    auto_analysis: {
      service_unavailable: 'AI 自動分析服務暫時無法使用',
      api_error: 'AI 分析 API 呼叫失敗',
      network_error: '網路連線異常，無法完成 AI 分析',
      auth_failed: '授權失敗，請重新登入後使用 AI 分析',
      validation_failed: 'AI 分析參數驗證失敗',
      response_invalid: 'AI 分析結果格式異常',
      processing_failed: 'AI 分析處理失敗，請稍後再試'
    },
    sensitive_detection: {
      check_failed: '敏感資料檢測失敗',
      file_read_error: '無法讀取檔案進行敏感資料檢測',
      processing_error: '敏感資料檢測處理異常'
    },
    user: {
      points_fetch_failed: '無法取得點數資訊，請稍後再試',
      logs_fetch_failed: '讀取分析紀錄失敗',
      auth_token_missing: '未登入，無法取得相關資料',
      token_invalid: '登入狀態已過期，請重新登入'
    }
  },
  actions: {
    retry: '重試',
    goHome: '回到首頁',
    dismiss: '我知道了',
    login: '重新登入',
    contact: '聯絡客服',
    reselect_file: '重新選擇檔案',
    remove_sensitive_data: '移除敏感資料',
    check_file_format: '檢查檔案格式',
    reduce_file_size: '縮小檔案大小',
    use_manual_mode: '改用手動模式',
    restart_analysis: '重新開始分析',
    close_error: '關閉',
    clear_and_retry: '清除並重試',
    recheck_variables: '重新檢查變項設定',
    confirm_type_mismatch: '確認類型不一致',
    go_back_step1: '回到上一步',
    refresh_data: '重新整理資料'
  },
  errorBoundary: {
    title: '哎呀！頁面出錯了',
    subtitle: '別擔心，我們會儘快修復這個問題',
    correlationId: '錯誤代碼'
  },
  dialog: {
    title: '錯誤',
    sensitive_data: {
      title: '偵測到敏感資料',
      detected: '發現敏感欄位',
      columns_message: '以下欄位可能包含個人敏感資料',
      suggestions_title: '建議處理方式',
      action_required: '為保護個人隱私，請移除敏感欄位後重新上傳'
    },
    privacy: {
      title: '資料隱私聲明',
      statement: {
        no_personal_data: '請確認您的檔案不包含任何個人識別資訊，包括但不限於：',
        examples: {
          names_ids: '姓名、身分證號、病歷號',
          contact_info: '電話號碼、地址、電子郵件',
          birth_dates: '出生日期或其他可識別個人身分的資訊'
        },
        analysis_only: '上傳的資料僅用於統計分析，不會用於其他用途',
        no_storage: '分析結果不會儲存個人資料',
        deidentification_advice: '如有疑慮，請先進行資料去識別化處理'
      },
      agreement: '我確認已詳細閱讀上述聲明，並保證上傳的檔案不包含任何個人敏感資料。我理解並同意按照隱私聲明使用此服務。'
    },
    file_info: {
      title: '檔案資訊',
      name: '檔案名稱',
      size: '檔案大小',
      multiple_sheets_warning: '檔案包含多個工作表，系統將讀取第一個工作表'
    },
    warnings: {
      title: '注意事項'
    },
    buttons: {
      cancel: '取消',
      reselect_file: '重新選擇檔案',
      confirm_upload: '確認上傳',
      confirming: '確認中...',
      close: '關閉'
    }
  },
  status: {
    uploading: '正在上傳檔案...',
    processing: '正在處理檔案...',
    analyzing: '正在分析欄位...',
    validating: '正在驗證檔案...',
    detecting_sensitive: '正在檢測敏感資料...',
    running_analysis: '正在執行分析...',
    ai_processing: 'AI 正在處理中...',
    complete: '處理完成',
    ready: '準備就緒'
  },
  hints: {
    file_format: '支援 CSV、Excel (.xlsx、.xls) 格式',
    file_size: '檔案大小建議在 10MB 以內',
    data_privacy: '請確保檔案不包含個人識別資訊',
    column_types: '系統將自動判斷欄位類型，您也可以手動調整',
    sensitive_detection: '系統會自動檢測可能的敏感資料欄位',
    variable_selection: '請選擇至少一個類別變項或連續變項',
    group_variable: '分組變項建議選擇類別型欄位'
  }
} as const;

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
    
    // 從預定義訊息中獲取錯誤資訊
    const errorInfo = messageKey ? ERROR_MESSAGES[messageKey] : undefined;
    
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

// 常見錯誤的快速創建函數
export const CommonErrors = {
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
            customMessage: `檔案大小 ${formatFileSize(actualSize)} 超過限制 ${formatFileSize(maxSize)}`
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

    sensitiveDataDetected: (): AppError => createError(
        ErrorCode.SENSITIVE_DATA_DETECTED,
        ErrorContext.PRIVACY_CHECK,
        'privacy.sensitive_data_detected'
    ),

    authTokenMissing: (): AppError => createError(
        ErrorCode.AUTH_TOKEN_MISSING,
        ErrorContext.AUTHENTICATION,
        'auth.token_missing'
    ),

    analysisAuthFailed: (): AppError => createError(
        ErrorCode.ANALYSIS_AUTH_FAILED,
        ErrorContext.ANALYSIS,
        'auth.unauthorized'
    ),

    analysisTimeout: (): AppError => createError(
        ErrorCode.ANALYSIS_TIMEOUT,
        ErrorContext.ANALYSIS,
        'analysis.timeout'
    ),

    serverError: (context?: ErrorContext): AppError => createError(
        ErrorCode.SERVER_ERROR,
        context || ErrorContext.NETWORK,
        'network.server_error'
    ),

    networkError: (): AppError => createError(
        ErrorCode.NETWORK_ERROR,
        ErrorContext.NETWORK,
        'network.connection_failed'
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
        if (context && appError.metadata) {
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

export { ErrorCode, ErrorContext };
