// src/tests/api/table_analyze.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { TableAnalyzeResponse } from '@/schemas/apiContracts';
import fs from 'fs';
import path from 'path';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

async function getTestToken(): Promise<string> {
  return 'test-token';
}

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

      const response = await fetch(`${API_BASE}/api/table/table-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 回應狀態:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API 錯誤:', errorText);
      }

      expect(response.ok).toBe(true);
      const json = await response.json();
      
      console.log('回應 keys:', Object.keys(json));
      
      // 檢查基本結構
      expect(json.success).toBeDefined();
      expect(json.success).toBe(true);
      
      // 檢查 flattened 結構（因為使用 dict_with_flatten）
      expect(json.table).toBeDefined();
      expect(Array.isArray(json.table)).toBe(true);
      expect(json.groupCounts).toBeDefined();
      
      // 驗證表格內容
      if (json.table && json.table.length > 0) {
        const firstRow = json.table[0];
        expect(firstRow).toHaveProperty('Variable');
        expect(firstRow).toHaveProperty('P');
        expect(firstRow).toHaveProperty('Method');
      }
    }, 30000);
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
      
      // 根據實際回應調整預期
      if (!response.ok) {
        expect(json.success).toBe(false);
      } else {
        // 空資料可能回傳空表格
        expect(json.table).toEqual([]);
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
      
      // OPTIONS 可能回傳純文字 "OK" 而非 JSON
      const text = await response.text();
      expect(text).toBeTruthy();
    });
  });
});