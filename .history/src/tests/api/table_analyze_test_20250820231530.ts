// tests/api/analyze.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { z } from 'zod';
import { TableAnalyzeResponse } from '@/schemas/apiContracts';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

async function getTestToken(): Promise<string> {
  return process.env.TEST_AUTH_TOKEN || 'test-token';
}

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

describe('Table Analyze API Tests', () => {
  let testData: any[];
  let authToken: string;

  beforeAll(async () => {
    testData = loadTestData();
    authToken = await getTestToken();
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

      const response = await fetch(`${API_BASE}/api/table/table-analyze`, {
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
      const result = TableAnalyzeResponse.safeParse(json);
      
      if (!result.success) {
        console.error('Zod validation errors:', result.error.format());
      }
      
      expect(result.success).toBe(true);
      
      if (result.success) {
        const data = result.data;
        
        // 驗證基本結構
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data.table).toBeDefined();
        expect(Array.isArray(data.data.table)).toBe(true);
        expect(data.data.table.length).toBeGreaterThan(0);
        
        // 驗證 groupCounts
        expect(data.data.groupCounts).toBeDefined();
        expect(data.data.groupCounts?.All).toBeDefined();
        expect(data.data.groupCounts?.All).toBe(testData.length);
        
        // 驗證表格內容
        const firstRow = data.data.table[0];
        expect(firstRow).toHaveProperty('Variable');
        expect(firstRow).toHaveProperty('P');
        expect(firstRow).toHaveProperty('Method');
        expect(firstRow).toHaveProperty('Missing');
        
        // 應該包含分組欄位
        if (data.data.groupCounts) {
          const groups = Object.keys(data.data.groupCounts).filter(k => k !== 'All');
          groups.forEach(group => {
            expect(firstRow).toHaveProperty(group);
          });
        }
      }
    });

    it('應該正確處理無分組變項的分析', async () => {
      const requestBody = {
        data: testData,
        group_col: null,
        cat_vars: ['Sex', 'Smoker'],
        cont_vars: ['Height_cm', 'Weight_kg'],
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

      expect(response.ok).toBe(true);
      const json = await response.json();
      const result = TableAnalyzeResponse.safeParse(json);
      expect(result.success).toBe(true);
      
      if (result.success) {
        // 無分組時應該只有 All 群組
        expect(result.data.data.groupCounts?.All).toBe(testData.length);
        expect(Object.keys(result.data.data.groupCounts || {}).length).toBe(1);
        
        // 檢查表格結構
        const table = result.data.data.table;
        table.forEach(row => {
          expect(row.All).toBeDefined();
          expect(row.Method).toBe('—'); // 無分組時不應有統計檢定
          expect(row.P).toBe('—');
        });
      }
    });

    it('應該正確處理填補遺漏值選項', async () => {
      // 建立有遺漏值的資料
      const dataWithMissing = [...testData];
      dataWithMissing[0] = { ...dataWithMissing[0], Height_cm: null };
      dataWithMissing[1] = { ...dataWithMissing[1], Weight_kg: null };
      dataWithMissing[2] = { ...dataWithMissing[2], Sex: null };

      const requestBody = {
        data: dataWithMissing,
        group_col: 'Group',
        cat_vars: ['Sex'],
        cont_vars: ['Height_cm', 'Weight_kg'],
        fillNA: true // 啟用填補
      };

      const response = await fetch(`${API_BASE}/api/table/table-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      expect(response.ok).toBe(true);
      const json = await response.json();
      const result = TableAnalyzeResponse.safeParse(json);
      expect(result.success).toBe(true);
      
      if (result.success) {
        // 檢查是否有進行統計檢定（填補後應該能進行）
        const table = result.data.data.table;
        const heightRow = table.find(row => row.Variable === '**Height_cm**');
        const weightRow = table.find(row => row.Variable === '**Weight_kg**');
        
        expect(heightRow).toBeDefined();
        expect(weightRow).toBeDefined();
        
        // 填補後應該有統計方法
        if (heightRow) {
          expect(heightRow.Method).not.toBe('—');
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

      const json = await response.json();
      
      // 空資料應該回傳空表格或錯誤
      if (json.success) {
        expect(json.data.table).toEqual([]);
        expect(json.data.groupCounts.All).toBe(0);
      } else {
        expect(json.message).toContain('資料');
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

      expect(response.ok).toBe(false);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.message).toMatch(/不存在|無效|錯誤/);
    });

    it('應該處理認證失敗的情況', async () => {
      const requestBody = {
        data: testData,
        group_col: 'Group',
        cat_vars: ['Sex'],
        cont_vars: ['Height_cm'],
        fillNA: false
      };

      const response = await fetch(`${API_BASE}/api/table/table-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token'
        },
        body: JSON.stringify(requestBody)
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    it('應該處理缺少認證的情況', async () => {
      const requestBody = {
        data: testData,
        group_col: 'Group',
        cat_vars: ['Sex'],
        cont_vars: ['Height_cm'],
        fillNA: false
      };

      const response = await fetch(`${API_BASE}/api/table/table-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
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

      const json = await response.json();
      
      // API 應該能處理並給出警告
      if (json.success) {
        expect(json.warnings).toBeDefined();
        expect(Array.isArray(json.warnings)).toBe(true);
        if (json.warnings && json.warnings.length > 0) {
          // 應該有關於變數類型的警告
          const hasTypeWarning = json.warnings.some((w: string) => 
            w.includes('數值型') || w.includes('類別') || w.includes('誤選')
          );
          expect(hasTypeWarning).toBe(true);
        }
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

      const json = await response.json();
      
      if (json.success) {
        expect(json.data.groupCounts.All).toBe(1);
        // 單一資料列無法進行統計檢定
        const table = json.data.table;
        table.forEach((row: any) => {
          if (row.Method) {
            expect(row.Method).toBe('—');
          }
        });
      }
    });

    it('應該處理大量變項的情況', async () => {
      // 使用所有可用的欄位
      const allColumns = Object.keys(testData[0]);
      const catVars = ['Sex', 'Group', 'Region', 'Smoker'];
      const contVars = allColumns.filter(col => !catVars.includes(col) && col !== 'Date' && col !== 'Visit_Date');

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

      expect(response.ok).toBe(true);
      const json = await response.json();
      const result = TableAnalyzeResponse.safeParse(json);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const table = result.data.data.table;
        // 應該有所有變項的分析結果
        const variableCount = catVars.length + contVars.length;
        expect(table.length).toBeGreaterThan(variableCount); // 包含類別變項的各層級
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
      const json = await response.json();
      expect(json.ok).toBe(true);
    });
  });
});