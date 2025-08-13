import { beforeAll, afterEach, afterAll, vi } from 'vitest'

// 定義 Crypto 介面的部分實作
interface MockCrypto {
  randomUUID: () => string;
}

// Mock crypto.randomUUID 如果在 Node 環境中不存在
if (!global.crypto) {
  const mockCrypto: MockCrypto = {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  }
  
  // 使用型別斷言來擴展 global.crypto
  global.crypto = mockCrypto as Crypto
}

// 清理 fetch mocks
afterEach(() => {
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

// 設定全域的 fetch mock（如果需要）
beforeAll(() => {
  // 可以在這裡設定全域的 mock
})

afterAll(() => {
  // 清理
})