// 更新 apiClient.ts 使用統一錯誤處理系統
import { 
  AppError, 
  ErrorCode, 
  ErrorContext,
  createError, 
  createErrorFromHttp 
} from '@/utils/error'

// API 客戶端配置
interface ApiClientConfig {
  baseURL?: string
  timeout?: number // 毫秒
  retries?: number // 重試次數（僅 GET）
  retryDelay?: number // 重試延遲基數（毫秒）
}

// 請求選項（排除與自訂選項衝突的 RequestInit 屬性）
interface RequestOptions extends Omit<RequestInit, 'method'> {
  timeout?: number
  retries?: number
  correlationId?: string
  context?: ErrorContext // 新增：錯誤情境
}

class ApiClient {
  private config: Required<ApiClientConfig>
  
  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseURL: '',
      timeout: 20000, // 預設 20 秒
      retries: 2, // 預設重試 2 次
      retryDelay: 1000, // 預設 1 秒基數
      ...config
    }
  }
  
  // GET 請求（支援重試）
  async get<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const { retries = this.config.retries, timeout, correlationId, context, ...restOptions } = options
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.request<T>(url, {
          method: 'GET',
          timeout,
          correlationId,
          context,
          ...restOptions
        })
      } catch (error) {
        // 最後一次嘗試或非網路錯誤直接拋出
        if (attempt === retries || !this.isRetryableError(error)) {
          throw error
        }
        
        // 指數退避 + 抖動
        const delay = this.config.retryDelay * Math.pow(2, attempt) + Math.random() * 1000
        await this.sleep(delay)
      }
    }
    
    throw createError(ErrorCode.UNKNOWN_ERROR, context)
  }
  
  // POST 請求
  async post<T>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const { timeout, correlationId, context, ...restOptions } = options
    
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      timeout,
      correlationId,
      context,
      ...restOptions
    })
  }
  
  // PUT 請求
  async put<T>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const { timeout, correlationId, context, ...restOptions } = options
    
    return this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      timeout,
      correlationId,
      context,
      ...restOptions
    })
  }
  
  // DELETE 請求
  async delete<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const { timeout, correlationId, context, ...restOptions } = options
    
    return this.request<T>(url, {
      method: 'DELETE',
      timeout,
      correlationId,
      context,
      ...restOptions
    })
  }
  
  // 核心請求方法
  private async request<T>(
    url: string, 
    options: RequestOptions & { method: string } = { method: 'GET' }
  ): Promise<T> {
    const correlationId = options.correlationId || crypto.randomUUID()
    const timeout = options.timeout || this.config.timeout
    const context = options.context // 錯誤情境
    
    // 建立 AbortController 處理逾時，但優先使用外部傳入的 signal
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    // 如果有外部 signal，當外部 signal abort 時也要 abort 內部 controller
    const externalSignal = options.signal
    if (externalSignal) {
      if (externalSignal.aborted) {
        throw new DOMException('Request was aborted', 'AbortError')
      }
      externalSignal.addEventListener('abort', () => controller.abort())
    }
    
    try {
      const fullUrl = this.buildURL(url)
      
      // 準備 fetch 選項，排除自訂屬性
      const { timeout: _, correlationId: __, context: ___, ...fetchOptions } = options
      
      const response = await fetch(fullUrl, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': correlationId,
          ...options.headers
        }
      })
      
      clearTimeout(timeoutId)
      
      // 處理非 2xx 回應
      if (!response.ok) {
        const body = await this.parseResponseBody(response)
        throw createErrorFromHttp(response.status, context, correlationId)
      }
      
      return await this.parseResponseBody(response)
      
    } catch (error) {
      clearTimeout(timeoutId)
      
      // AbortError (逾時或外部取消)
      if (error instanceof Error && error.name === 'AbortError') {
        const isTimeout = !externalSignal?.aborted
        throw createError(
          ErrorCode.NETWORK_ERROR, 
          context, 
          undefined, 
          {
            customMessage: isTimeout 
              ? `請求逾時（${timeout}ms），請檢查網路連線`
              : '請求已被取消',
            correlationId,
            cause: error
          }
        )
      }
      
      // TypeError (網路錯誤)
      if (error instanceof TypeError) {
        throw createError(
          ErrorCode.NETWORK_ERROR, 
          context, 
          undefined, 
          {
            customMessage: '網路連線失敗，請檢查網路狀態',
            correlationId,
            cause: error
          }
        )
      }
      
      // 已處理的 AppError 直接拋出
      if (this.isAppError(error)) {
        throw error
      }
      
      // 其他未知錯誤
      throw createError(
        ErrorCode.UNKNOWN_ERROR, 
        context, 
        undefined, 
        {
          customMessage: `API 請求發生未知錯誤：${error instanceof Error ? error.message : String(error)}`,
          correlationId,
          cause: error instanceof Error ? error : undefined
        }
      )
    }
  }
  
  // 建構完整 URL
  private buildURL(url: string): string {
    if (url.startsWith('http')) return url
    return `${this.config.baseURL}${url}`
  }
  
  // 解析回應內容
  private async parseResponseBody(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      return response.json()
    }
    
    const text = await response.text()
    return text || null
  }
  
  // 判斷是否為可重試錯誤
  private isRetryableError(error: unknown): boolean {
    if (!this.isAppError(error)) return false
    
    // 網路錯誤或 5xx 伺服器錯誤可重試
    return error.code === ErrorCode.NETWORK_ERROR || 
           error.code === ErrorCode.SERVER_ERROR ||
           (typeof error.statusCode === 'number' && error.statusCode >= 500)
  }
  
  // 類型守衛：判斷是否為 AppError
  private isAppError(error: unknown): error is AppError {
    return error instanceof Error && 'code' in error && 'userMessage' in error
  }
  
  // 睡眠函式
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 預設實例
export const apiClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
})

// 錯誤回報函式 - 更新為使用新的錯誤系統
export async function reportError(
  error: AppError,
  extra?: Record<string, any>
): Promise<void> {
  const errorReport = {
    code: error.code,
    context: error.context,
    message: error.message,
    userMessage: error.userMessage,
    action: error.action,
    statusCode: error.statusCode,
    correlationId: error.correlationId,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'server',
    ...extra
  }
  
  // 開發環境：console 輸出
  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 Client Error Report:', errorReport)
    return
  }
  
  // 生產環境：上報到後端
  try {
    await fetch('/api/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorReport)
    })
  } catch (reportingError) {
    console.error('Failed to report error:', reportingError)
  }
  
  // TODO: 整合 Sentry
  // Sentry.captureException(error, { extra: errorReport })
}

// 範例使用方式：
/*
// 基本使用
try {
  const result = await apiClient.get('/api/users')
} catch (error) {
  if (error instanceof AppError) {
    alert(error.userMessage) // 顯示給用戶的友善訊息
    console.error(error.message) // 開發者除錯訊息
  }
}

// 帶情境的使用
try {
  const result = await apiClient.post('/api/files/upload', formData, {
    context: ErrorContext.FILE_UPLOAD,
    timeout: 60000 // 檔案上傳需要更長時間
  })
} catch (error) {
  if (error instanceof AppError) {
    // 會根據 FILE_UPLOAD 情境顯示客製化的錯誤訊息
    showToast(error.userMessage, error.action)
  }
}

// 分析 API 呼叫
try {
  const analysis = await apiClient.post('/api/analysis', data, {
    context: ErrorContext.ANALYSIS,
    correlationId: analysisId
  })
} catch (error) {
  if (error instanceof AppError) {
    // 分析相關的錯誤會有對應的訊息和建議動作
    showErrorDialog(error.userMessage, error.action)
    reportError(error, { analysisId, dataSize: data.length })
  }
}
*/

// 範例 API handler（需在 app/api/client-error/route.ts 實作）
/*
export async function POST(request: Request) {
  const errorReport = await request.json()
  
  // 記錄到資料庫或日誌系統
  console.error('Client Error:', errorReport)
  
  // TODO: 儲存到資料庫、發送告警
  
  return Response.json({ received: true })
}
*/