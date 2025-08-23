// src/tests/scripts/diagnose-api.ts
import fs from 'fs';
import path from 'path';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

async function diagnoseAPI() {
  console.log('🔍 API 診斷開始...\n');
  console.log(`API URL: ${API_BASE}`);
  
  // 1. 測試 API 是否可連線
  console.log('\n1️⃣ 測試 API 連線...');
  try {
    const healthResponse = await fetch(`${API_BASE}/health`);
    console.log(`   健康檢查: ${healthResponse.status} ${healthResponse.statusText}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.text();
      console.log(`   回應: ${healthData}`);
    }
  } catch (error) {
    console.error('   ❌ 無法連線到 API:', error);
    console.log('   💡 請確認後端是否正在運行');
    return;
  }

  // 2. 測試認證
  console.log('\n2️⃣ 測試認證...');
  const testToken = process.env.TEST_AUTH_TOKEN || 'test-token-for-development';
  console.log(`   使用 Token: ${testToken.substring(0, 20)}...`);
  
  // 3. 載入測試資料
  console.log('\n3️⃣ 載入測試資料...');
  const csvPath = path.join(process.cwd(), 'src/tests/fixtures/Shady_test.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`   ❌ 找不到 CSV 檔案: ${csvPath}`);
    return;
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  
  console.log(`   ✅ 載入 ${lines.length - 1} 筆資料`);
  console.log(`   欄位: ${headers.join(', ')}`);
  
  // 建立簡單的測試資料
  const testData = [];
  for (let i = 1; i < Math.min(6, lines.length); i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: any = {};
    headers.forEach((header, index) => {
      const value = values[index];
      if (!value || value === '' || value === 'null') {
        row[header] = null;
      } else if (!isNaN(Number(value))) {
        row[header] = Number(value);
      } else {
        row[header] = value;
      }
    });
    testData.push(row);
  }
  
  // 4. 測試 table-analyze API
  console.log('\n4️⃣ 測試 table-analyze API...');
  
  const requestBody = {
    data: testData,
    group_col: null,  // 先不使用分組
    cat_vars: ['Sex'],  // 只用一個類別變項
    cont_vars: ['Height_cm'],  // 只用一個連續變項
    fillNA: false,
    enableExport: false,
    enableAI: false
  };
  
  console.log('   請求內容:');
  console.log(`   - 資料筆數: ${testData.length}`);
  console.log(`   - 類別變項: ${requestBody.cat_vars}`);
  console.log(`   - 連續變項: ${requestBody.cont_vars}`);
  console.log(`   - 資料範例:`, testData[0]);
  
  try {
    const response = await fetch(`${API_BASE}/api/table/table-analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log(`\n   回應狀態: ${response.status} ${response.statusText}`);
    
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      console.log('   回應內容:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('   回應內容 (Text):', text);
    }
    
    if (response.ok) {
      console.log('   ✅ API 測試成功！');
    } else {
      console.log('   ❌ API 測試失敗');
      
      // 提供解決建議
      if (response.status === 401) {
        console.log('\n💡 解決建議：');
        console.log('   1. 確認後端是否需要真實的認證 token');
        console.log('   2. 如果需要，從瀏覽器開發者工具複製有效的 token');
        console.log('   3. 將 token 加入 .env.test 檔案：');
        console.log('      TEST_AUTH_TOKEN=<你的token>');
      } else if (response.status === 422) {
        console.log('\n💡 解決建議：');
        console.log('   1. 檢查資料欄位名稱是否正確');
        console.log('   2. 確認變項名稱存在於資料中');
        console.log('   3. 檢查資料格式是否正確');
      } else if (response.status === 500) {
        console.log('\n💡 解決建議：');
        console.log('   1. 檢查後端 console 的錯誤訊息');
        console.log('   2. 確認後端的相依套件都已安裝');
        console.log('   3. 檢查資料庫連線是否正常');
      }
    }
  } catch (error) {
    console.error('   ❌ 請求失敗:', error);
  }
  
  console.log('\n✨ 診斷完成');
}

// 執行診斷
diagnoseAPI().catch(console.error);