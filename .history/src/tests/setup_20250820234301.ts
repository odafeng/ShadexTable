// src/tests/setup.ts
import { beforeAll, afterAll, beforeEach } from 'vitest';
import dotenv from 'dotenv';
import path from 'path';

// 載入測試環境變數
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

// 設定全域測試變數
beforeAll(async () => {
  console.log('🧪 測試環境初始化');
  console.log(`📍 API URL: ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}`);
  console.log(`🔐 認證模式: ${process.env.TEST_MODE || 'mock'}`);
  
  // 檢查後端是否可連線
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/health`);
    if (response.ok) {
      console.log('✅ 後端連線正常');
    } else {
      console.warn('⚠️ 後端健康檢查失敗:', response.status);
    }
  } catch (error) {
    console.error('❌ 無法連線到後端:', error);
  }
});

beforeEach(() => {
  // 每個測試前的清理
});

afterAll(() => {
  console.log('✅ 測試完成');
});