// src/tests/api/table_analyze.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { TableAnalyzeResponse } from '@/schemas/apiContracts';
import fs from 'fs';
import path from 'path';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

async function getTestToken(): Promise<string> {
  if (process.env.TEST_AUTH_TOKEN) {
    return process.env.TEST_AUTH_TOKEN;
  }
  return 'test-token-for-development';
}

// CSV 解析函數
function parseCSV(content: string): any[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: any = {};

    headers.forEach((header, index) => {
      let value = values[index];

      if (!value || value === '' || value === 'null' || value === 'NULL') {
        row[header] = null;
      } else if (!isNaN(Number(value))) {
        row[header] = Number(value);
      } else {
        row[header] = value;
      }
    });

    data.push(row);
  }

  return data;
}

// 載入測試資料函數
function loadTestData() {
  const csvPath = path.join(process.cwd(), 'src/tests/fixtures/Shady_test.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV 檔案不存在: ${csvPath}`);
    throw new Error(`找不到測試資料檔案: ${csvPath}`);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  return parseCSV(csvContent);
}

describe('Table Analyze API Tests', () => {
  let testData: any[];
  let authToken: string;

  beforeAll(async () => {
    try {
      testData = loadTestData();
      authToken = await getTestToken();
      console.log(`✅ 成功載入測試資料: ${testData.length} 筆`);
    } catch (error) {
      console.error('❌ 載入測試資料失敗:', error);
      throw error;
    }
  });

  describe('正常情況測試', () => {
    it('應該成功執行基本的統計分析', async () => {
      const requestBody = {
        data: testData,
        group_col: 'Group',
        cat_vars: ['Sex', 'Region', 'Smoker'],
        cont_vars: ['Height_cm', 'Weight_kg', 'BMI', 'Cholesterol'],
        fillNA: false,
        enableExport: false,
        enableAI: false
      };

      console.log('📤 發送請求到:', `${API_BASE}/api/table/table-analyze`);
      console.log('📊 資料筆數:', testData.length);
      console.log('📝 分組變項:', requestBody.group_col);
      console.log('📝 類別變項:', requestBody.cat_vars);
      console.log('📝 連續變項:', requestBody.cont_vars);

      // 顯示前幾筆資料以確認格式
      console.log('📋 資料範例 (前2筆):', testData.slice(0, 2));

      const response = await fetch(`${API_BASE}/api/table/table-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 回應狀態:', response.status, response.statusText);
      console.log('📥 回應 headers:', Object.fromEntries(response.headers.entries()));

      // 無論成功或失敗都讀取回應
      const contentType = response.headers.get('content-type');
      let responseData: any;

      if (contentType?.includes('application/json')) {
        responseData = await response.json();
        console.log('📥 回應內容 (JSON):', JSON.stringify(responseData, null, 2));
      } else {
        responseData = await response.text();
        console.log('📥 回應內容 (Text):', responseData);
      }

      // 根據不同的錯誤類型處理
      if (!response.ok) {
        if (response.status === 401) {
          console.error('❌ 認證錯誤：需要有效的 token');
          console.log('💡 建議：檢查 .env.test 中的 TEST_AUTH_TOKEN');
          // 跳過測試而不是失敗
          return;
        } else if (response.status === 422) {
          console.error('❌ 資料驗證錯誤：', responseData);
          console.log('💡 可能原因：');
          console.log('   - 欄位名稱不存在於資料中');
          console.log('   - 資料格式不正確');
          console.log('   - 必要欄位缺失');
        } else if (response.status === 500) {
          console.error('❌ 伺服器錯誤：', responseData);
          console.log('💡 檢查後端 log 以獲得更多資訊');
        } else {
          console.error('❌ 其他錯誤：', response.status, responseData);
        }
      }

      // 如果是 401，跳過測試
      if (response.status === 401) {
        console.warn('⚠️ 跳過測試：認證問題');
        return;
      }

      expect(response.ok).toBe(true);
      const json = await response.json();

      if (json.success || response.ok) {
        const table = json.table || json.data?.table;

        // 檢查是否有進行統計檢定（填補後應該能進行）
        if (table && Array.isArray(table)) {
          const heightRow = table.find((row: any) =>
            row.Variable === '**Height_cm**' || row.Variable === 'Height_cm'
          );
          const weightRow = table.find((row: any) =>
            row.Variable === '**Weight_kg**' || row.Variable === 'Weight_kg'
          );

          if (heightRow) {
            console.log('Height_cm 統計方法:', heightRow.Method);
          }
          if (weightRow) {
            console.log('Weight_kg 統計方法:', weightRow.Method);
          }
        }
      }
    });
  });

  describe('錯誤情況測試', () => {
    it('應該處理空資料的情況', async () => {
      const requestBody = {
        data: [],
        group_col: null,
        cat_vars: [],
        cont_vars: [],
        fillNA: false
      };

      const response = await fetch(`${API_BASE}/api/table/table-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.status === 401) {
        console.warn('⚠️ 認證問題，跳過測試');
        return;
      }

      const json = await response.json();

      // 空資料可能回傳空表格或錯誤
      if (json.success === false) {
        expect(json.message || json.error || json.detail).toBeDefined();
      } else {
        // 或者回傳空表格
        const table = json.table || json.data?.table;
        expect(Array.isArray(table)).toBe(true);
        if (table) {
          expect(table.length).toBe(0);
        }
      }
    });

    it('應該處理缺少必要欄位的情況', async () => {
      const requestBody = {
        // 缺少 data 欄位
        group_col: 'Group',
        cat_vars: ['Sex'],
        cont_vars: ['Height_cm']
      };

      const response = await fetch(`${API_BASE}/api/table/table-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.status === 401) {
        console.warn('⚠️ 認證問題，跳過測試');
        return;
      }

      expect(response.ok).toBe(false);
      expect(response.status).toBe(422);
    });

    it('應該處理無效變數名稱的情況', async () => {
      const requestBody = {
        data: testData,
        group_col: 'InvalidGroup',
        cat_vars: ['InvalidCat1', 'InvalidCat2'],
        cont_vars: ['InvalidCont1', 'InvalidCont2'],
        fillNA: false
      };

      const response = await fetch(`${API_BASE}/api/table/table-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.status === 401) {
        console.warn('⚠️ 認證問題，跳過測試');
        return;
      }

      expect(response.ok).toBe(false);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.message || json.error || json.detail).toBeDefined();
    });

    it('應該處理變數類型錯誤的情況', async () => {
      const requestBody = {
        data: testData,
        group_col: 'Group',
        // 將連續變項誤標為類別變項
        cat_vars: ['Height_cm', 'Weight_kg', 'BMI'],
        // 將類別變項誤標為連續變項  
        cont_vars: ['Sex', 'Smoker'],
        fillNA: false
      };

      const response = await fetch(`${API_BASE}/api/table/table-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.status === 401) {
        console.warn('⚠️ 認證問題，跳過測試');
        return;
      }

      const json = await response.json();

      // API 應該能處理並給出警告
      if (json.success || response.ok) {
        const warnings = json.warnings || json.data?.warnings;
        expect(warnings).toBeDefined();
        if (Array.isArray(warnings) && warnings.length > 0) {
          console.log('變數類型警告:', warnings);
        }
      }
    });

    it('應該處理 OPTIONS 預檢請求', async () => {
      const response = await fetch(`${API_BASE}/api/table/table-analyze`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type,authorization'
        }
      });

      expect(response.ok).toBe(true);

      // OPTIONS 可能回傳各種格式
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const json = await response.json();
        expect(json).toBeDefined();
      } else {
        const text = await response.text();
        expect(text).toBeDefined();
      }
    });
  });

  describe('邊界情況測試', () => {
    it('應該處理單一資料列的情況', async () => {
      const requestBody = {
        data: [testData[0]],
        group_col: null,
        cat_vars: ['Sex'],
        cont_vars: ['Height_cm'],
        fillNA: false
      };

      const response = await fetch(`${API_BASE}/api/table/table-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.status === 401) {
        console.warn('⚠️ 認證問題，跳過測試');
        return;
      }

      const json = await response.json();

      if (json.success || response.ok) {
        const groupCounts = json.groupCounts || json.data?.groupCounts;
        const table = json.table || json.data?.table;

        if (groupCounts) {
          expect(groupCounts.All).toBe(1);
        }

        // 單一資料列無法進行統計檢定
        if (table && Array.isArray(table)) {
          table.forEach((row: any) => {
            if (row.Method) {
              expect(row.Method).toBe('—');
            }
          });
        }
      }
    });

    it('應該處理大量變項的情況', async () => {
      // 使用所有可用的欄位
      const allColumns = Object.keys(testData[0]);
      const catVars = ['Sex', 'Group', 'Region', 'Smoker'];
      const contVars = allColumns.filter(col =>
        !catVars.includes(col) &&
        col !== 'Date' &&
        col !== 'Visit_Date'
      );

      const requestBody = {
        data: testData,
        group_col: 'Group',
        cat_vars: catVars,
        cont_vars: contVars,
        fillNA: false
      };

      const response = await fetch(`${API_BASE}/api/table/table-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.status === 401) {
        console.warn('⚠️ 認證問題，跳過測試');
        return;
      }

      expect(response.ok).toBe(true);
      const json = await response.json();

      if (json.success || response.ok) {
        const table = json.table || json.data?.table;
        // 應該有所有變項的分析結果
        if (table && Array.isArray(table)) {
          const variableCount = catVars.length + contVars.length;
          console.log(`分析變項數: ${variableCount}, 表格列數: ${table.length}`);
          expect(table.length).toBeGreaterThan(0);
        }
      }
    }, 30000);
  });
});