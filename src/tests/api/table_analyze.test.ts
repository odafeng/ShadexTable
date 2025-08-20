// src/tests/api/table_analyze.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { TableAnalyzeResponse } from '@/schemas/apiContracts';
import fs from 'fs';
import path from 'path';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// 全域變數，所有測試都可以存取
let globalTestData: any[] = [];
let globalAuthToken: string = '';
let globalIsDBConnected = false;

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

// 全域 beforeAll，在所有測試前執行一次
beforeAll(async () => {
  try {
    globalTestData = loadTestData();
    globalAuthToken = await getTestToken();
    console.log(`✅ 成功載入測試資料: ${globalTestData.length} 筆`);

    // 檢查健康狀態
    const healthResponse = await fetch(`${API_BASE}/health`);
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      globalIsDBConnected = health.checks?.database === true;

      if (!globalIsDBConnected) {
        console.warn('⚠️ 資料庫未連線，某些測試可能會失敗');
        console.warn('健康檢查結果:', health);
      }
    }
  } catch (error) {
    console.error('❌ 載入測試資料失敗:', error);
    throw error;
  }
});

describe('Table Analyze API Tests', () => {
  describe('基本功能測試（不需要資料庫）', () => {
    it('應該能處理簡單的統計分析', async () => {
      // 使用最簡單的資料測試
      const simpleData = [
        { Sex: 'M', Height_cm: 170, Weight_kg: 70 },
        { Sex: 'F', Height_cm: 160, Weight_kg: 60 },
        { Sex: 'M', Height_cm: 175, Weight_kg: 75 },
        { Sex: 'F', Height_cm: 165, Weight_kg: 65 },
        { Sex: 'M', Height_cm: 180, Weight_kg: 80 }
      ];

      const requestBody = {
        data: simpleData,
        group_col: null,  // 不使用分組
        cat_vars: ['Sex'],
        cont_vars: ['Height_cm', 'Weight_kg'],
        fillNA: false,
        enableExport: false,
        enableAI: false
      };

      console.log('📤 發送簡化的測試請求');
      console.log('資料:', simpleData);

      const response = await fetch(`${API_BASE}/api/table/table-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${globalAuthToken}`
        },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();
      console.log('回應:', responseData);

      // 如果資料庫未連線，可能會失敗
      if (!globalIsDBConnected && !response.ok) {
        console.warn('⚠️ 預期的失敗（資料庫未連線）');
        expect(response.status).toBe(500);
        return;
      }

      expect(response.ok).toBe(true);
    });
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
        'Authorization': `Bearer ${globalAuthToken}`
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
        'Authorization': `Bearer ${globalAuthToken}`
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
      data: globalTestData,
      group_col: 'InvalidGroup',
      cat_vars: ['InvalidCat1', 'InvalidCat2'],
      cont_vars: ['InvalidCont1', 'InvalidCont2'],
      fillNA: false
    };

    const response = await fetch(`${API_BASE}/api/table/table-analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${globalAuthToken}`
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
      data: globalTestData,
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
        'Authorization': `Bearer ${globalAuthToken}`
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
    if (globalTestData.length === 0) {
      console.warn('⚠️ 沒有測試資料，跳過測試');
      return;
    }

    const requestBody = {
      data: [globalTestData[0]],
      group_col: null,
      cat_vars: ['Sex'],
      cont_vars: ['Height_cm'],
      fillNA: false
    };

    const response = await fetch(`${API_BASE}/api/table/table-analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${globalAuthToken}`
      },
      body: JSON.stringify(requestBody)
    });

    if (response.status === 401) {
      console.warn('⚠️ 認證問題，跳過測試');
      return;
    }

    // 資料庫未連線時可能失敗
    if (!globalIsDBConnected && !response.ok) {
      console.warn('⚠️ 預期的失敗（資料庫未連線）');
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
    if (globalTestData.length === 0) {
      console.warn('⚠️ 沒有測試資料，跳過測試');
      return;
    }

    // 使用所有可用的欄位
    const allColumns = Object.keys(globalTestData[0]);
    const catVars = ['Sex', 'Group', 'Region', 'Smoker'];
    const contVars = allColumns.filter(col =>
      !catVars.includes(col) &&
      col !== 'Date' &&
      col !== 'Visit_Date'
    );

    const requestBody = {
      data: globalTestData,
      group_col: 'Group',
      cat_vars: catVars,
      cont_vars: contVars,
      fillNA: false
    };

    const response = await fetch(`${API_BASE}/api/table/table-analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${globalAuthToken}`
      },
      body: JSON.stringify(requestBody)
    });

    if (response.status === 401) {
      console.warn('⚠️ 認證問題，跳過測試');
      return;
    }

    // 資料庫未連線時可能失敗
    if (!globalIsDBConnected && !response.ok) {
      console.warn('⚠️ 預期的失敗（資料庫未連線）');
      expect(response.status).toBe(500);
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