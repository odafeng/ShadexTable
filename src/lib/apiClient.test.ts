import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { apiClient, post } from './apiClient'
import { ErrorCode, ErrorContext } from '@/utils/error'
import { AppError, ErrorSeverity } from '@/types/errors'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('成功情境', () => {
    it('應該成功處理 200 回應並返回 JSON 資料', async () => {
      const mockData = { id: 1, name: 'Test' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      })

      const result = await apiClient<typeof mockData>('/api/test')

      expect(result).toEqual(mockData)
      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        headers: {
          'Content-Type': 'application/json',
        },
      })
    })

    it('應該正確處理 204 No Content 回應', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      const result = await apiClient('/api/delete')

      expect(result).toBeUndefined()
      expect(mockFetch).toHaveBeenCalledOnce()
    })

    it('應該保留並合併自訂 headers', async () => {
      const mockData = { success: true }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      })

      await apiClient('/api/test', {
        headers: {
          'Authorization': 'Bearer token123',
          'X-Custom-Header': 'custom-value',
        },
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token123',
          'X-Custom-Header': 'custom-value',
        },
      })
    })
  })

  describe('錯誤情境', () => {
    it('應該處理非 2xx 狀態碼並拋出 AppError', async () => {
      const errorMessage = '找不到資源'
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => errorMessage,
      })

      try {
        await apiClient('/api/notfound')
        expect.fail('應該要拋出錯誤')
      } catch (error) {
        const appError = error as AppError
        expect(appError.code).toBe(ErrorCode.SERVER_ERROR)
        expect(appError.context).toBe(ErrorContext.DATA_FETCH)
        // apiClient 使用 customMessage，所以 message 和 userMessage 會相同
        expect(appError.message).toBe(errorMessage)
        expect(appError.userMessage).toBe(errorMessage)
        expect(appError.correlationId).toBeDefined()
      }
    })

    it('應該處理伺服器錯誤（500）', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      })

      try {
        await apiClient('/api/error')
        expect.fail('應該要拋出錯誤')
      } catch (error) {
        const appError = error as AppError
        expect(appError.code).toBe(ErrorCode.SERVER_ERROR)
        expect(appError.context).toBe(ErrorContext.DATA_FETCH)
        expect(appError.message).toBe('Internal Server Error')
        expect(appError.userMessage).toBe('Internal Server Error')
        expect(appError.correlationId).toBeDefined()
        expect(appError.severity).toBe(ErrorSeverity.HIGH)
        expect(appError.canRetry).toBe(true)
      }
    })

    it('應該處理無法解析回應文字的情況', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => {
          throw new Error('無法解析文字')
        },
      })

      try {
        await apiClient('/api/bad')
        expect.fail('應該要拋出錯誤')
      } catch (error) {
        const appError = error as AppError
        expect(appError.code).toBe(ErrorCode.SERVER_ERROR)
        expect(appError.context).toBe(ErrorContext.DATA_FETCH)
        expect(appError.message).toBe('HTTP 400')
        expect(appError.userMessage).toBe('HTTP 400')
        expect(appError.correlationId).toBeDefined()
      }
    })

    it('應該處理網路錯誤', async () => {
      mockFetch.mockRejectedValueOnce(new Error('網路連線失敗'))

      try {
        await apiClient('/api/test')
        expect.fail('應該要拋出錯誤')
      } catch (error) {
        const appError = error as AppError
        expect(appError.code).toBe(ErrorCode.NETWORK_ERROR)
        expect(appError.context).toBe(ErrorContext.DATA_FETCH)
        expect(appError.message).toBe('網路連線失敗')
        expect(appError.userMessage).toBe('網路連線失敗')
        expect(appError.correlationId).toBeDefined()
        expect(appError.severity).toBe(ErrorSeverity.LOW)
        expect(appError.canRetry).toBe(true)
      }
    })

    it('應該正確識別並保留已經是 AppError 的錯誤', async () => {
      // 使用 createError 來創建一個真正的 AppError
      const { createError } = await import('@/utils/error')
      
      const existingAppError = createError(
        ErrorCode.VALIDATION_ERROR,
        ErrorContext.DATA_VALIDATION,
        undefined,
        {
          customMessage: '驗證失敗',
          correlationId: 'existing-id-123'
        }
      )

      mockFetch.mockRejectedValueOnce(existingAppError)

      try {
        await apiClient('/api/test')
        expect.fail('應該要拋出錯誤')
      } catch (error) {
        expect(error).toBe(existingAppError)
        const appError = error as AppError
        expect(appError.code).toBe(ErrorCode.VALIDATION_ERROR)
        expect(appError.context).toBe(ErrorContext.DATA_VALIDATION)
        expect(appError.correlationId).toBe('existing-id-123')
      }
    })
  })
})

describe('post 函數', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('應該發送 POST 請求並包含資料', async () => {
    const requestData = { username: 'test', password: 'pass123' }
    const responseData = { token: 'abc123', userId: 1 }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => responseData,
    })

    const result = await post('/api/login', requestData)

    expect(result).toEqual(responseData)
    expect(mockFetch).toHaveBeenCalledWith('/api/login', {
      method: 'POST',
      body: JSON.stringify(requestData),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })

  it('應該處理沒有 body 的 POST 請求', async () => {
    const responseData = { success: true }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => responseData,
    })

    const result = await post('/api/trigger')

    expect(result).toEqual(responseData)
    expect(mockFetch).toHaveBeenCalledWith('/api/trigger', {
      method: 'POST',
      body: undefined,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })

  it('應該支援自訂選項', async () => {
    const requestData = { data: 'test' }
    const responseData = { result: 'success' }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => responseData,
    })

    await post('/api/custom', requestData, {
      headers: {
        'X-API-Key': 'secret-key',
      },
      credentials: 'include',
      context: ErrorContext.ANALYSIS,
      correlationId: 'custom-correlation-id',
      timeout: 5000,
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/custom', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(requestData),
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'secret-key',
      },
      credentials: 'include',
      context: ErrorContext.ANALYSIS,
      correlationId: 'custom-correlation-id',
      timeout: 5000,
    }))
  })

  it('應該處理 POST 請求的錯誤', async () => {
    const requestData = { invalid: 'data' }

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      text: async () => '驗證錯誤：欄位不正確',
    })

    try {
      await post('/api/validate', requestData)
      expect.fail('應該要拋出錯誤')
    } catch (error) {
      const appError = error as AppError
      expect(appError.code).toBe(ErrorCode.SERVER_ERROR)
      expect(appError.context).toBe(ErrorContext.DATA_FETCH)
      expect(appError.message).toBe('驗證錯誤：欄位不正確')
      expect(appError.userMessage).toBe('驗證錯誤：欄位不正確')
      expect(appError.correlationId).toBeDefined()
    }
  })
})

describe('邊界情況測試', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('應該處理空的 JSON 回應', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => null,
    })

    const result = await apiClient('/api/null-response')
    expect(result).toBeNull()
  })

  it('應該處理非常大的回應', async () => {
    const largeData = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      data: `item-${i}`,
    }))

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => largeData,
    })

    const result = await apiClient('/api/large-data')
    expect(result).toEqual(largeData)
    expect(result).toHaveLength(10000)
  })

  it('應該處理特殊字元的 URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    })

    await apiClient('/api/test?param=value&special=測試')
    
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test?param=value&special=測試',
      expect.any(Object)
    )
  })

  it('應該正確產生唯一的 correlationId', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'Bad Request',
    })

    const errors: AppError[] = []
    
    try {
      await apiClient('/api/error1')
    } catch (e) {
      errors.push(e as AppError)
    }

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'Bad Request',
    })

    try {
      await apiClient('/api/error2')
    } catch (e) {
      errors.push(e as AppError)
    }

    expect(errors).toHaveLength(2)
    expect(errors[0].correlationId).toBeDefined()
    expect(errors[1].correlationId).toBeDefined()
    expect(errors[0].correlationId).not.toBe(errors[1].correlationId)
  })

  it('應該處理請求超時', async () => {
    // 模擬超時
    mockFetch.mockImplementationOnce(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 100)
      )
    )

    try {
      await apiClient('/api/slow')
      expect.fail('應該要拋出錯誤')
    } catch (error) {
      const appError = error as AppError
      expect(appError.code).toBe(ErrorCode.NETWORK_ERROR)
      expect(appError.message).toContain('timeout')
      expect(appError.userMessage).toContain('timeout')
    }
  })

  it('應該處理 JSON 解析錯誤', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('Invalid JSON')
      },
    })

    try {
      await apiClient('/api/invalid-json')
      expect.fail('應該要拋出錯誤')
    } catch (error) {
      const appError = error as AppError
      expect(appError.code).toBe(ErrorCode.NETWORK_ERROR)
      expect(appError.message).toContain('Invalid JSON')
      expect(appError.userMessage).toContain('Invalid JSON')
    }
  })
})

describe('錯誤物件完整性測試', () => {
  it('應該包含所有必要的 AppError 屬性', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => '權限不足',
    })

    try {
      await apiClient('/api/forbidden')
      expect.fail('應該要拋出錯誤')
    } catch (error) {
      const appError = error as AppError
      
      // 檢查所有必要屬性
      expect(appError).toHaveProperty('code')
      expect(appError).toHaveProperty('message')
      expect(appError).toHaveProperty('userMessage')
      expect(appError).toHaveProperty('context')
      expect(appError).toHaveProperty('severity')
      expect(appError).toHaveProperty('correlationId')
      expect(appError).toHaveProperty('timestamp')
      expect(appError).toHaveProperty('action')
      expect(appError).toHaveProperty('canRetry')
      
      // 檢查屬性類型
      expect(typeof appError.code).toBe('string')
      expect(typeof appError.message).toBe('string')
      expect(typeof appError.userMessage).toBe('string')
      expect(appError.timestamp).toBeInstanceOf(Date)
      expect(typeof appError.correlationId).toBe('string')
      expect(typeof appError.canRetry).toBe('boolean')
      
      // 檢查枚舉值
      expect(Object.values(ErrorCode)).toContain(appError.code)
      expect(Object.values(ErrorContext)).toContain(appError.context)
      expect(Object.values(ErrorSeverity)).toContain(appError.severity)
    }
  })

  it('應該正確處理帶有 details 的錯誤', async () => {
    const responseData = { 
      errors: ['欄位1錯誤', '欄位2錯誤'],
      code: 'VALIDATION_FAILED'
    }
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      text: async () => JSON.stringify(responseData),
      json: async () => responseData,
    })

    try {
      await apiClient('/api/validation-error')
      expect.fail('應該要拋出錯誤')
    } catch (error) {
      const appError = error as AppError
      expect(appError.code).toBe(ErrorCode.SERVER_ERROR)
      // 檢查 details 或 metadata 中是否包含額外資訊
      if (appError.details) {
        expect(appError.details).toHaveProperty('status')
      }
    }
  })
})