// 錯誤代碼枚舉
export enum ErrorCode {
    // 檔案相關錯誤
    FILE_ERROR = 'FILE_ERROR',
    FILE_SIZE_EXCEEDED = 'FILE_SIZE_EXCEEDED',
    FILE_FORMAT_UNSUPPORTED = 'FILE_FORMAT_UNSUPPORTED',
    FILE_CORRUPTED = 'FILE_CORRUPTED',
    FILE_EMPTY = 'FILE_EMPTY',
    
    // 驗證錯誤
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    DATA_VALIDATION_FAILED = 'DATA_VALIDATION_FAILED',
    COLUMN_VALIDATION_FAILED = 'COLUMN_VALIDATION_FAILED',
    
    // 隱私和安全錯誤
    PRIVACY_ERROR = 'PRIVACY_ERROR',
    SENSITIVE_DATA_DETECTED = 'SENSITIVE_DATA_DETECTED',
    PRIVACY_AGREEMENT_REQUIRED = 'PRIVACY_AGREEMENT_REQUIRED',
    
    // 認證錯誤
    AUTH_ERROR = 'AUTH_ERROR',
    AUTH_TOKEN_MISSING = 'AUTH_TOKEN_MISSING',
    AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
    
    // 分析錯誤
    ANALYSIS_ERROR = 'ANALYSIS_ERROR',
    ANALYSIS_TIMEOUT = 'ANALYSIS_TIMEOUT',
    ANALYSIS_AUTH_FAILED = 'ANALYSIS_AUTH_FAILED',
    COLUMN_TYPE_DETECTION_FAILED = 'COLUMN_TYPE_DETECTION_FAILED',
    
    // 網路錯誤
    NETWORK_ERROR = 'NETWORK_ERROR',
    SERVER_ERROR = 'SERVER_ERROR',
    RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
    
    // 未知錯誤
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// 錯誤上下文
export enum ErrorContext {
    FILE_UPLOAD = 'FILE_UPLOAD',
    FILE_PROCESSING = 'FILE_PROCESSING',
    DATA_VALIDATION = 'DATA_VALIDATION',
    PRIVACY_CHECK = 'PRIVACY_CHECK',
    AUTHENTICATION = 'AUTHENTICATION',
    ANALYSIS = 'ANALYSIS',
    NETWORK = 'NETWORK',
    UNKNOWN = 'UNKNOWN'
}

// 錯誤嚴重程度
export enum ErrorSeverity {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
}

/**
 * JSON 序列化安全的資料型別
 * 用於確保錯誤詳情可以安全地序列化和傳輸
 */
export type Json = 
    | string 
    | number 
    | boolean 
    | null 
    | undefined
    | { [key: string]: Json }
    | Json[];

/**
 * 錯誤詳情介面
 * 包含錯誤的額外資訊，如 HTTP 狀態碼、回應資料等
 */
export interface ErrorDetails {
    status?: number;
    responseData?: Json;
    actualSize?: number;
    maxSize?: number;
    [key: string]: Json;
}

/**
 * 錯誤元數據介面
 * 包含錯誤的上下文資訊，幫助追蹤和除錯
 */
export interface ErrorMetadata {
    fileName?: string;
    fileSize?: number;
    userType?: string;
    step?: string;
    component?: string;
    handlerContext?: string;
    [key: string]: Json;
}

/**
 * 應用程式錯誤介面
 * 統一的錯誤結構，用於整個應用程式的錯誤處理
 */
export interface AppError {
    // 基本錯誤資訊
    code: ErrorCode;
    message: string;
    userMessage: string;
    context?: ErrorContext;
    severity: ErrorSeverity;
    
    // 錯誤追蹤
    correlationId: string;
    timestamp: Date;
    
    // 錯誤詳情 - 使用具名介面替代 Record<string, any>
    details?: ErrorDetails;
    cause?: Error;
    stack?: string;
    
    // 用戶指導
    action: string;
    canRetry: boolean;
    
    // 元數據 - 使用具名介面替代內聯定義
    metadata?: ErrorMetadata;
}

// 錯誤處理選項
export interface ErrorHandlerOptions {
    shouldLog?: boolean;
    shouldReport?: boolean;
    autoRetry?: boolean;
    maxRetries?: number;
    customAction?: string;
}

// 錯誤處理函數類型
export type ErrorHandler = (error: AppError, context?: string) => void;

/**
 * 錯誤報告介面
 * 用於向後端報告錯誤時的資料結構
 */
export interface ErrorReport {
    error: AppError;
    userAgent?: string;
    url?: string;
    additionalContext?: Record<string, Json>;  // 使用 Json 型別確保序列化安全
}

/**
 * 錯誤訊息配置型別
 * 定義錯誤訊息的結構
 */
export interface ErrorMessageConfig {
    userMessage: string;
    action: string;
    severity: ErrorSeverity;
    canRetry: boolean;
}

/**
 * 常見錯誤訊息對應表
 * 使用具名介面替代內聯型別定義
 */
export const ERROR_MESSAGES: Record<string, ErrorMessageConfig> = {
    // 檔案錯誤
    'file.format_unsupported': {
        userMessage: '不支援的檔案格式，請選擇 CSV 或 Excel 檔案',
        action: '請上傳 .csv、.xls 或 .xlsx 格式的檔案',
        severity: ErrorSeverity.MEDIUM,
        canRetry: false
    },
    'file.size_exceeded': {
        userMessage: '檔案大小超過限制',
        action: '請選擇較小的檔案或升級到專業版',
        severity: ErrorSeverity.MEDIUM,
        canRetry: false
    },
    'file.empty_file': {
        userMessage: '檔案是空的或沒有有效資料',
        action: '請檢查檔案內容並重新上傳',
        severity: ErrorSeverity.MEDIUM,
        canRetry: false
    },
    'file.corrupted': {
        userMessage: '檔案損壞或格式錯誤',
        action: '請檢查檔案完整性並重新上傳',
        severity: ErrorSeverity.MEDIUM,
        canRetry: false
    },
    'file.read_failed': {
        userMessage: '檔案讀取失敗',
        action: '請重試或檢查檔案是否正常',
        severity: ErrorSeverity.HIGH,
        canRetry: true
    },
    
    // 隱私錯誤
    'privacy.sensitive_data_detected': {
        userMessage: '檔案包含敏感資料，無法繼續處理',
        action: '請移除個人資料欄位後重新上傳',
        severity: ErrorSeverity.HIGH,
        canRetry: false
    },
    'privacy.agreement_required': {
        userMessage: '需要同意隱私條款才能繼續',
        action: '請閱讀並同意隱私保護條款',
        severity: ErrorSeverity.MEDIUM,
        canRetry: false
    },
    
    // 認證錯誤
    'auth.token_missing': {
        userMessage: '認證失效，請重新登入',
        action: '請重新登入後再試',
        severity: ErrorSeverity.HIGH,
        canRetry: false
    },
    'auth.unauthorized': {
        userMessage: '沒有權限執行此操作',
        action: '請檢查權限或聯絡管理員',
        severity: ErrorSeverity.HIGH,
        canRetry: false
    },
    
    // 分析錯誤
    'analysis.failed': {
        userMessage: '資料分析失敗',
        action: '請重試或檢查資料格式',
        severity: ErrorSeverity.HIGH,
        canRetry: true
    },
    'analysis.timeout': {
        userMessage: '分析超時，請稍後重試',
        action: '請稍後重試，或選擇較小的資料集',
        severity: ErrorSeverity.MEDIUM,
        canRetry: true
    },
    'analysis.novariables': {
        userMessage: '未選擇任何變項',
        action: '請至少選擇一個變項進行分析',
        severity: ErrorSeverity.MEDIUM,
        canRetry: false
    },
    'column.type_detection_failed': {
        userMessage: '欄位類型識別失敗',
        action: '請檢查資料格式或手動指定欄位類型',
        severity: ErrorSeverity.MEDIUM,
        canRetry: true
    },
    'column.no_valid_columns': {
        userMessage: '沒有找到有效的資料欄位',
        action: '請檢查檔案格式和內容',
        severity: ErrorSeverity.HIGH,
        canRetry: false
    },
    
    // 網路錯誤
    'network.connection_failed': {
        userMessage: '網路連線失敗',
        action: '請檢查網路連線並重試',
        severity: ErrorSeverity.MEDIUM,
        canRetry: true
    },
    'network.server_error': {
        userMessage: '伺服器錯誤，請稍後重試',
        action: '請稍後重試，問題持續請聯絡客服',
        severity: ErrorSeverity.HIGH,
        canRetry: true
    },
    'network.rate_limit': {
        userMessage: '請求過於頻繁，請稍後重試',
        action: '請稍候片刻再重試',
        severity: ErrorSeverity.LOW,
        canRetry: true
    }
};