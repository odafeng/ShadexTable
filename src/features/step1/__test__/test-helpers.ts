//tests/utils/test-helpers.ts
import { MockFile } from '@/features/step1/types/test-schemas';

export function createMockFile(
  content: string,
  fileName: string = 'test.csv',
  mimeType: string = 'text/csv'
): File {
  // 使用 File 構造函數而不是 Blob
  const file = new File([content], fileName, { 
    type: mimeType,
    lastModified: Date.now()
  });
  
  return file;
}

export function createMockCSVData() {
  return [
    { age: 25, gender: 'M', income: 50000, group: 'A' },
    { age: 30, gender: 'F', income: 60000, group: 'B' },
    { age: null, gender: 'M', income: 55000, group: 'A' },
    { age: 35, gender: null, income: 70000, group: 'B' },
    { age: 28, gender: 'F', income: null, group: 'A' },
  ];
}

export function createMockColumnTypes() {
  return [
    { column: 'age', suggested_type: '連續變項', missingCount: 1 },
    { column: 'gender', suggested_type: '類別變項', missingCount: 1 },
    { column: 'income', suggested_type: '連續變項', missingCount: 1 },
    { column: 'group', suggested_type: '類別變項', missingCount: 0 },
  ];
}