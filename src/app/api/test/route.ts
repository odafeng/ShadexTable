/**
 * 錯誤處理測試用 API 路由
 * 使用方式：/api/test?type=success|404|500|slow|auth|rateLimit
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  
  // 模擬處理延遲
  await new Promise(resolve => setTimeout(resolve, 200))
  
  switch (type) {
    case 'success':
      return Response.json({
        message: '請求成功！',
        timestamp: new Date().toISOString(),
        data: {
          users: ['Alice', 'Bob', 'Charlie'],
          total: 3,
          page: 1
        }
      })
    
    case '404':
      return Response.json(
        { 
          error: 'Resource not found',
          code: 'NOT_FOUND',
          message: 'The requested resource does not exist'
        },
        { status: 404 }
      )
    
    case '500':
      return Response.json(
        {
          error: 'Internal server error',
          code: 'SERVER_ERROR',
          message: 'Something went wrong on our end'
        },
        { status: 500 }
      )
    
    case 'slow':
      // 模擬超過 20 秒的慢請求（會觸發 apiClient 的逾時設定）
      await new Promise(resolve => setTimeout(resolve, 25000))
      return Response.json({
        message: '這個回應應該不會被看到，因為會逾時',
        delay: '25 seconds'
      })
    
    case 'auth':
      return Response.json(
        {
          error: 'Unauthorized',
          code: 'AUTH_ERROR',
          message: 'Authentication required'
        },
        { status: 401 }
      )
    
    case 'forbidden':
      return Response.json(
        {
          error: 'Forbidden',
          code: 'AUTH_ERROR',
          message: 'Insufficient permissions'
        },
        { status: 403 }
      )
    
    case 'rateLimit':
      return Response.json(
        {
          error: 'Too many requests',
          code: 'RATE_LIMIT_ERROR',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: 60
        },
        { 
          status: 429,
          headers: {
            'Retry-After': '60'
          }
        }
      )
    
    case 'validation':
      return Response.json(
        {
          error: 'Bad request',
          code: 'VALIDATION_ERROR',
          message: 'Invalid input parameters',
          details: {
            field: 'email',
            message: 'Email format is invalid'
          }
        },
        { status: 400 }
      )
    
    default:
      return Response.json(
        {
          error: 'Bad request',
          code: 'VALIDATION_ERROR',
          message: 'Missing or invalid type parameter',
          availableTypes: ['success', '404', '500', 'slow', 'auth', 'forbidden', 'rateLimit', 'validation']
        },
        { status: 400 }
      )
  }
}

// 支援 POST 請求（用於測試表單提交錯誤）
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  
  try {
    const body = await request.json()
    
    switch (type) {
      case 'success':
        return Response.json({
          message: 'Data created successfully',
          id: Math.random().toString(36).substr(2, 9),
          data: body
        })
      
      case 'validation':
        return Response.json(
          {
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            message: 'Required fields are missing',
            fields: ['name', 'email']
          },
          { status: 400 }
        )
      
      default:
        return Response.json(
          { error: 'Invalid POST type' },
          { status: 400 }
        )
    }
  } catch (error) {
    return Response.json(
      {
        error: 'Invalid JSON',
        code: 'VALIDATION_ERROR',
        message: 'Request body must be valid JSON'
      },
      { status: 400 }
    )
  }
}