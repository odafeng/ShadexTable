// tests/api/missing_fill.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { z } from 'zod';
import { MissingFillResponse } from '@/schemas/apiContracts';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// 模擬 Clerk 的 getToken 函數
async function getTestToken(): Promise<string> {
  // 在測試環境中，你需要設定一個有效的測試 token
  // 可以從環境變數獲取或使用測試用的固定 token
  return process.env.TEST_AUTH_TOKEN || 'test-token';
}

// 載入測試資料
function loadTestData() {
  const csvPath = path.join(process.cwd(), 'tests/fixtures/Shady_test.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const parsed = Papa.parse(csvContent, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });
  return parsed.data;
}

// 建立測試用的 columns 資料
function createColumnsData(data: any[]): any[] {
  if (!data || data.length === 0) return [];
  
  const firstRow = data[0];
  return Object.keys(firstRow).map(col => {
    const values = data.map(row => row[col]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    const missingCount = values.length - nonNullValues.length;
    const missingPct = ((missingCount / values.length) * 100).toFixed(1);
    
    // 判斷欄位類型
    let suggestedType = '類別變項';
    if (typeof nonNullValues[0] === 'number') {
      suggestedType = '連續變項';
    } else if (col.toLowerCase().includes('date')) {
      suggestedType = '日期變項';
    }
    
    return {
      column: col,
      missing_pct: missingPct,
      suggested_type: suggestedType
    };
  });
}

describe('Missing Fill API Tests', () => {
  let testData: any[];
  let authToken: string;

  beforeAll(async () => {
    testData = loadTestData();
    authToken = await getTestToken();
  });

  describe('正常情況測試', () => {
    it('應該成功處理遺漏值填補請求', async () => {
      const columns = createColumnsData(testData);
      
      const requestBody = {
        columns,
        data: testData,
        cont_vars: ['Height_cm', 'Weight_kg', 'BMI', 'Cholesterol', 'Blood_Sugar'],
        cat_vars: ['Sex', 'Group', 'Region', 'Smoker'],
        group_col: 'Group'
      };

      const response = await fetch(`${API_BASE}/api/preprocess/missing_fill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      expect(response.ok).toBe(true);
      const json = await response.json();

      // 使用 Zod 驗證回應格式
      const result = MissingFillResponse.safeParse(json);
      
      if (!result.success) {
        console.error('Zod validation errors:', result.error.format());
      }
      
      expect(result.success).toBe(true);
      
      if (result.success) {
        const data = result.data;
        
        // 驗證必要欄位存在
        expect(data.success).toBe(true);
        expect(data.filled_data).toBeDefined();
        expect(Array.isArray(data.filled_data)).toBe(true);
        
        // 驗證 summary 結構
        expect(data.summary).toBeDefined();
        expect(Array.isArray(data.summary)).toBe(true);
        
        if (data.summary && data.summary.length > 0) {
          const firstSummary = data.summary[0];
          expect(firstSummary).toHaveProperty('column');
          expect(firstSummary).toHaveProperty('before_pct');
          expect(firstSummary).toHaveProperty('after_pct');
          expect(firstSummary).toHaveProperty('fill_method');
        }
        
        // 驗證 statistics 結構
        expect(data.statistics).toBeDefined();
        expect(data.statistics?.total_rows).toBeGreaterThan(0);
        expect(data.statistics?.total_columns).toBeGreaterThan(0);
        expect(data.statistics?.validated_continuous_vars).toBeDefined();
        expect(data.statistics?.categorical_vars).toBeDefined();
        expect(data.statistics?.normality_test_results).toBeDefined();
        expect(data.statistics?.fill_methods_used).toBeDefined();
        expect(Array.isArray(data.statistics?.fill_methods_used)).toBe(true);
      }
    });

    it('應該正確處理不同遺漏率的欄位', async () => {
      // 建立有不同遺漏率的測試資料
      const modifiedData = [...testData];
      
      // 設定 10% 遺漏率
      for (let i = 0; i < 10; i++) {
        modifiedData[i] = { ...modifiedData[i], Height_cm: null };
      }
      
      // 設定 15% 遺漏率
      for (let i = 0; i < 15; i++) {
        modifiedData[i] = { ...modifiedData[i], Weight_kg: null };
      }
      
      // 設定 25% 遺漏率
      for (let i = 0; i < 25; i++) {
        modifiedData[i] = { ...modifiedData[i], BMI: null };
      }

      const columns = createColumnsData(modifiedData);
      
      const requestBody = {
        columns,
        data: modifiedData,
        cont_vars: ['Height_cm', 'Weight_kg', 'BMI'],
        cat_vars: ['Sex', 'Group'],
        group_col: ''
      };

      const response = await fetch(`${API_BASE}/api/preprocess/missing_fill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      expect(response.ok).toBe(true);
      const json = await response.json();
      const result = MissingFillResponse.safeParse(json);
      expect(result.success).toBe(true);
      
      if (result.success && result.data.summary) {
        // 檢查不同遺漏率的處理方法
        const heightSummary = result.data.summary.find(s => s.column === 'Height_cm');
        const weightSummary = result.data.summary.find(s => s.column === 'Weight_kg');
        const bmiSummary = result.data.summary.find(s => s.column === 'BMI');
        
        // < 10% 應該使用平均值或中位數填補
        expect(heightSummary?.fill_method).toMatch(/平均值|中位數/);
        
        // 10-20% 可能使用 KNN 填補
        expect(weightSummary?.fill_method).toMatch(/KNN|中位數/);
        
        // > 20% 應該不建議填補
        expect(bmiSummary?.fill_method).toMatch(/不建議/);
      }
    });
  });

  describe('錯誤情況測試', () => {
    it('應該處理空資料的情況', async () => {
      const requestBody = {
        columns: [],
        data: [],
        cont_vars: [],
        cat_vars: [],
        group_col: ''
      };

      const response = await fetch(`${API_BASE}/api/preprocess/missing_fill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      // 預期會回傳錯誤
      expect(response.ok).toBe(false);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.message).toContain('資料不足');
    });

    it('應該處理缺少必要欄位的情況', async () => {
      const requestBody = {
        // 缺少 columns 欄位
        data: testData,
        cont_vars: ['Height_cm'],
        cat_vars: ['Sex'],
        group_col: 'Group'
      };

      const response = await fetch(`${API_BASE}/api/preprocess/missing_fill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(422); // Unprocessable Entity
    });

    it('應該處理無效變數類型的情況', async () => {
      const columns = createColumnsData(testData);
      
      const requestBody = {
        columns,
        data: testData,
        // 將類別變項誤標為連續變項
        cont_vars: ['Sex', 'Group', 'InvalidColumn'],
        cat_vars: ['Height_cm', 'Weight_kg'],
        group_col: 'Group'
      };

      const response = await fetch(`${API_BASE}/api/preprocess/missing_fill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      const json = await response.json();
      
      // API 應該能處理這種情況並給出警告
      if (json.success) {
        expect(json.statistics?.validated_continuous_vars).toBeDefined();
        // InvalidColumn 不應該在驗證後的連續變項中
        expect(json.statistics?.validated_continuous_vars).not.toContain('InvalidColumn');
      }
    });

    it('應該處理認證失敗的情況', async () => {
      const columns = createColumnsData(testData);
      
      const requestBody = {
        columns,
        data: testData,
        cont_vars: ['Height_cm'],
        cat_vars: ['Sex'],
        group_col: 'Group'
      };

      // 使用無效的 token
      const response = await fetch(`${API_BASE}/api/preprocess/missing_fill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token'
        },
        body: JSON.stringify(requestBody)
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401); // Unauthorized
    });

    it('應該處理缺少認證 header 的情況', async () => {
      const columns = createColumnsData(testData);
      
      const requestBody = {
        columns,
        data: testData,
        cont_vars: ['Height_cm'],
        cat_vars: ['Sex'],
        group_col: 'Group'
      };

      // 不提供 Authorization header
      const response = await fetch(`${API_BASE}/api/preprocess/missing_fill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });
  });

  describe('邊界情況測試', () => {
    it('應該處理所有欄位都是遺漏值的情況', async () => {
      const emptyData = testData.map(row => {
        const newRow: any = {};
        Object.keys(row).forEach(key => {
          newRow[key] = null;
        });
        return newRow;
      });

      const columns = createColumnsData(emptyData);
      
      const requestBody = {
        columns,
        data: emptyData,
        cont_vars: ['Height_cm'],
        cat_vars: ['Sex'],
        group_col: ''
      };

      const response = await fetch(`${API_BASE}/api/preprocess/missing_fill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      const json = await response.json();
      
      // 應該能處理但可能會有警告
      if (json.success && json.summary) {
        json.summary.forEach((item: any) => {
          expect(item.before_pct).toBe('100.0%');
        });
      }
    });

    it('應該處理超大資料集的情況', async () => {
      // 建立 1000 筆資料
      const largeData = [];
      for (let i = 0; i < 1000; i++) {
        largeData.push({ ...testData[i % testData.length], id: i });
      }

      const columns = createColumnsData(largeData);
      
      const requestBody = {
        columns,
        data: largeData,
        cont_vars: ['Height_cm', 'Weight_kg'],
        cat_vars: ['Sex', 'Group'],
        group_col: 'Group'
      };

      const response = await fetch(`${API_BASE}/api/preprocess/missing_fill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      expect(response.ok).toBe(true);
      const json = await response.json();
      const result = MissingFillResponse.safeParse(json);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.statistics?.total_rows).toBe(1000);
      }
    }, 10000); // 增加 timeout 時間
  });
});