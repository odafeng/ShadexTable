// app/step3/services/dataTransformService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { TableRow, GroupCounts, BinaryMapping } from '@/features/step3/types';
import { ErrorCode, ErrorContext, createError } from '@/utils/error';

import {
  prepareExportData,
  formatVariableName,
  isCategorySubItem,
  createCoreSummaryData
} from './dataTransformService';

// Mock error utilities
vi.mock('@/utils/error', () => ({
  ErrorCode: {
    DATA_VALIDATION_FAILED: 'DATA_VALIDATION_FAILED'
  },
  ErrorContext: {
    DATA_VALIDATION: 'DATA_VALIDATION'
  },
  createError: vi.fn((code, context, messageKey, options) => ({
    code,
    context,
    message: options?.customMessage || 'Error',
    correlationId: 'test-correlation-id',
    timestamp: new Date(),
    severity: 'MEDIUM',
    userMessage: options?.customMessage || 'Error',
    canRetry: true,
    cause: options?.cause
  }))
}));

describe('dataTransformService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('prepareExportData', () => {
    const mockGroupCounts: GroupCounts = {
      'Group1': 100,
      'Group2': 200,
      'Group3': 150
    };

    const mockDisplayNames: Record<string, string> = {
      'age': 'Age (years)',
      'gender': 'Gender',
      'bmi': 'Body Mass Index'
    };

    const mockGroupLabels: Record<string, string> = {
      'Group1': 'Control Group',
      'Group2': 'Treatment A',
      'Group3': 'Treatment B'
    };

    const mockBinaryMappings: Record<string, BinaryMapping> = {
      'gender-Group1': { '0': 'Female', '1': 'Male' },
      'smoking-Group1': { '0': 'No', '1': 'Yes' }
    };

    describe('成功案例', () => {
      it('應該正確處理基本的資料轉換', () => {
        const sortedRows: TableRow[] = [
          { Variable: 'age', Normal: 'Yes', P: '0.05', Method: 't-test', Group1: '50.2 ± 10.5' },
          { Variable: 'gender', Normal: 'No', P: '0.12', Method: 'chi-square', Group1: '1 (60%)' }
        ];

        const exportColumns = ['Variable', 'Normal', 'P', 'Method', 'Group1'];

        const result = prepareExportData(
          sortedRows,
          mockDisplayNames,
          mockGroupLabels,
          mockBinaryMappings,
          mockGroupCounts,
          exportColumns
        );

        expect(result).toHaveLength(2);
        expect(result[0]['Variable']).toBe('Age (years)');
        expect(result[0]['Control Group (n=100)']).toBe('50.2 ± 10.5');
        expect(result[1]['Variable']).toBe('Gender');
        expect(result[1]['Control Group (n=100)']).toBe('Male (60%)');
      });

      it('應該處理主變數（以**開頭）', () => {
        const sortedRows: TableRow[] = [
          { Variable: '**Demographics', Normal: '', P: '', Method: '', Group1: '' },
          { Variable: 'age', Normal: 'Yes', P: '0.05', Method: 't-test', Group1: '50.2' }
        ];

        const exportColumns = ['Variable', 'Group1'];

        const result = prepareExportData(
          sortedRows,
          {},
          mockGroupLabels,
          {},
          mockGroupCounts,
          exportColumns
        );

        expect(result[0]['Variable']).toBe('Demographics');
        expect(result[1]['Variable']).toContain('├─'); // 子項目應該有縮排
      });

      it('應該處理統計描述行（mean ± sd）', () => {
        const sortedRows: TableRow[] = [
          { Variable: '**Blood Pressure', Normal: '', P: '', Method: '', Group1: '' },
          { Variable: 'mean ± sd', Normal: '', P: '', Method: '', Group1: '120 ± 15' }
        ];

        const exportColumns = ['Variable', 'Group1'];

        const result = prepareExportData(
          sortedRows,
          {},
          mockGroupLabels,
          {},
          mockGroupCounts,
          exportColumns
        );

        expect(result[1]['Variable']).toContain('•'); // 統計描述應該用點標記
      });

      it('應該處理多個群組欄位', () => {
        const sortedRows: TableRow[] = [
          { 
            Variable: 'age', 
            Normal: 'Yes', 
            P: '0.05', 
            Method: 't-test',
            Group1: '50.2',
            Group2: '52.3',
            Group3: '51.8'
          }
        ];

        const exportColumns = ['Variable', 'Group1', 'Group2', 'Group3', 'P'];

        const result = prepareExportData(
          sortedRows,
          mockDisplayNames,
          mockGroupLabels,
          {},
          mockGroupCounts,
          exportColumns
        );

        expect(result[0]['Control Group (n=100)']).toBe('50.2');
        expect(result[0]['Treatment A (n=200)']).toBe('52.3');
        expect(result[0]['Treatment B (n=150)']).toBe('51.8');
        expect(result[0]['P']).toBe('0.05');
      });

      it('應該處理空值和 nan 值', () => {
        const sortedRows: TableRow[] = [
          { 
            Variable: 'test', 
            Normal: null, 
            P: undefined, 
            Method: 'nan',
            Group1: '',
            Group2: 'nan'
          }
        ];

        const exportColumns = ['Variable', 'Normal', 'P', 'Method', 'Group1', 'Group2'];

        const result = prepareExportData(
          sortedRows,
          {},
          mockGroupLabels,
          {},
          mockGroupCounts,
          exportColumns
        );

        expect(result[0]['Normal']).toBe('');
        expect(result[0]['P']).toBe('');
        expect(result[0]['Method']).toBe('');
        expect(result[0]['Control Group (n=100)']).toBe('');
        expect(result[0]['Treatment A (n=200)']).toBe('');
      });

      it('應該正確應用二元映射', () => {
        const sortedRows: TableRow[] = [
          { Variable: 'gender', Group1: '0 (40%)', Group2: '1 (60%)' },
          { Variable: 'smoking', Group1: '1 (30%)', Group2: '0 (70%)' }
        ];

        const exportColumns = ['Variable', 'Group1', 'Group2'];

        const result = prepareExportData(
          sortedRows,
          {},
          mockGroupLabels,
          mockBinaryMappings,
          mockGroupCounts,
          exportColumns
        );

        expect(result[0]['Control Group (n=100)']).toBe('Female (40%)');
        expect(result[0]['Treatment A (n=200)']).toBe('1 (60%)'); // 沒有對應的映射
        expect(result[1]['Control Group (n=100)']).toBe('Yes (30%)');
      });

      it('應該處理沒有群組計數的情況', () => {
        const sortedRows: TableRow[] = [
          { Variable: 'test', UnknownGroup: '123' }
        ];

        const exportColumns = ['Variable', 'UnknownGroup'];

        const result = prepareExportData(
          sortedRows,
          {},
          {},
          {},
          {}, // 空的 groupCounts
          exportColumns
        );

        expect(result[0]['UnknownGroup (n=?)']).toBe('123');
      });
    });

    describe('錯誤案例', () => {
      it('應該處理資料轉換時的錯誤', () => {
        const sortedRows: TableRow[] = [
          { Variable: 'test' }
        ];

        // 模擬在處理過程中拋出錯誤
        const exportColumns = ['Variable'];
        
        // 創建一個會拋出錯誤的 sortedRows
        const problematicRows = new Proxy(sortedRows, {
          get() {
            throw new Error('資料存取錯誤');
          }
        });

        expect(() => 
          prepareExportData(
            problematicRows,
            {},
            {},
            {},
            {},
            exportColumns
          )
        ).toThrow();

        expect(createError).toHaveBeenCalledWith(
          ErrorCode.DATA_VALIDATION_FAILED,
          ErrorContext.DATA_VALIDATION,
          undefined,
          expect.objectContaining({
            customMessage: '資料轉換失敗'
          })
        );
      });
    });

    describe('邊界案例', () => {
      it('應該處理空陣列', () => {
        const result = prepareExportData(
          [],
          {},
          {},
          {},
          {},
          ['Variable']
        );

        expect(result).toEqual([]);
      });

      it('應該處理特殊字元的變數名稱', () => {
        const sortedRows: TableRow[] = [
          { Variable: '**Test/Variable (n=100) [%]', Group1: '50' }
        ];

        const exportColumns = ['Variable', 'Group1'];

        const result = prepareExportData(
          sortedRows,
          {},
          mockGroupLabels,
          {},
          mockGroupCounts,
          exportColumns
        );

        expect(result[0]['Variable']).toBe('Test/Variable (n=100) [%]');
      });

      it('應該處理深層嵌套的子項目', () => {
        const sortedRows: TableRow[] = [
          { Variable: '**Main Category', Group1: '' },
          { Variable: 'Sub Item 1', Group1: '10' },
          { Variable: 'Sub Item 2', Group1: '20' },
          { Variable: '**Another Category', Group1: '' },
          { Variable: 'Another Sub', Group1: '30' }
        ];

        const exportColumns = ['Variable', 'Group1'];

        const result = prepareExportData(
          sortedRows,
          {},
          mockGroupLabels,
          {},
          mockGroupCounts,
          exportColumns
        );

        expect(result[1]['Variable']).toContain('├─');
        expect(result[2]['Variable']).toContain('├─');
        expect(result[4]['Variable']).toContain('├─');
      });
    });
  });

  describe('formatVariableName', () => {
    it('應該正確格式化醫學縮寫', () => {
      expect(formatVariableName('bmi')).toBe('BMI');
      expect(formatVariableName('hdl_cholesterol')).toBe('HDL Cholesterol');
      expect(formatVariableName('egfr')).toBe('eGFR');
      expect(formatVariableName('ckd_stage')).toBe('CKD Stage');
    });

    it('應該處理駝峰命名', () => {
      expect(formatVariableName('bloodPressure')).toBe('Blood Pressure');
      expect(formatVariableName('heartRate')).toBe('Heart Rate');
      expect(formatVariableName('BMICategory')).toBe('BMI Category');
    });

    it('應該移除星號', () => {
      expect(formatVariableName('**Demographics')).toBe('Demographics');
      expect(formatVariableName('***Important***')).toBe('Important');
    });

    it('應該處理底線分隔', () => {
      expect(formatVariableName('first_name')).toBe('First Name');
      expect(formatVariableName('patient_id_number')).toBe('Patient Id Number');
    });

    it('應該保留大寫縮寫', () => {
      expect(formatVariableName('HIV')).toBe('HIV');
      expect(formatVariableName('AIDS')).toBe('AIDS');
      expect(formatVariableName('USA')).toBe('USA');
    });

    it('應該處理空字串和 undefined', () => {
      expect(formatVariableName('')).toBe('');
      expect(formatVariableName(null as any)).toBe('');
      expect(formatVariableName(undefined as any)).toBe('');
    });

    it('應該處理混合格式', () => {
      expect(formatVariableName('**patient_BMI_value')).toBe('Patient BMI Value');
      expect(formatVariableName('HDLcholesterol')).toBe('HDL Cholesterol');
    });
  });

  describe('isCategorySubItem', () => {
    it('應該識別類別子項目', () => {
      const allRows: TableRow[] = [
        { Variable: '**Region', Group1: '' },
        { Variable: '北', Group1: '10' },
        { Variable: '南', Group1: '20' },
        { Variable: '**Gender', Group1: '' },
        { Variable: 'Male', Group1: '50' },
        { Variable: 'Female', Group1: '50' }
      ];

      expect(isCategorySubItem(allRows[1], allRows, 1)).toBe(true);
      expect(isCategorySubItem(allRows[2], allRows, 2)).toBe(true);
      expect(isCategorySubItem(allRows[4], allRows, 4)).toBe(true);
      expect(isCategorySubItem(allRows[5], allRows, 5)).toBe(true);
    });

    it('應該排除主變數', () => {
      const allRows: TableRow[] = [
        { Variable: '**Demographics', Group1: '' },
        { Variable: 'Age', Group1: '50' }
      ];

      expect(isCategorySubItem(allRows[0], allRows, 0)).toBe(false);
    });

    it('應該排除統計描述', () => {
      const allRows: TableRow[] = [
        { Variable: '**Blood Pressure', Group1: '' },
        { Variable: 'mean ± sd', Group1: '120 ± 15' },
        { Variable: 'median (IQR)', Group1: '118 (110-130)' },
        { Variable: '112.5 ± 10.2', Group1: '' }
      ];

      expect(isCategorySubItem(allRows[1], allRows, 1)).toBe(false);
      expect(isCategorySubItem(allRows[2], allRows, 2)).toBe(false);
      expect(isCategorySubItem(allRows[3], allRows, 3)).toBe(false);
    });

    it('應該在沒有父主變數時返回 false', () => {
      const allRows: TableRow[] = [
        { Variable: 'Age', Group1: '50' },
        { Variable: 'Gender', Group1: 'Male' }
      ];

      expect(isCategorySubItem(allRows[0], allRows, 0)).toBe(false);
      expect(isCategorySubItem(allRows[1], allRows, 1)).toBe(false);
    });

    it('應該識別中文類別', () => {
      const allRows: TableRow[] = [
        { Variable: '**地區', Group1: '' },
        { Variable: '台北市', Group1: '30' },
        { Variable: '高雄市', Group1: '25' }
      ];

      expect(isCategorySubItem(allRows[1], allRows, 1)).toBe(true);
      expect(isCategorySubItem(allRows[2], allRows, 2)).toBe(true);
    });

    it('應該識別 Yes/No 選項', () => {
      const allRows: TableRow[] = [
        { Variable: '**Smoking', Group1: '' },
        { Variable: 'Yes', Group1: '30' },
        { Variable: 'No', Group1: '70' }
      ];

      expect(isCategorySubItem(allRows[1], allRows, 1)).toBe(true);
      expect(isCategorySubItem(allRows[2], allRows, 2)).toBe(true);
    });

    it('應該處理純數字類別', () => {
      const allRows: TableRow[] = [
        { Variable: '**Score', Group1: '' },
        { Variable: '1', Group1: '10' },
        { Variable: '2', Group1: '20' },
        { Variable: '3', Group1: '30' }
      ];

      expect(isCategorySubItem(allRows[1], allRows, 1)).toBe(true);
      expect(isCategorySubItem(allRows[2], allRows, 2)).toBe(true);
    });
  });

  describe('createCoreSummaryData', () => {
    it('應該創建正確的摘要資料', () => {
      const filteredRows: TableRow[] = [
        { Variable: 'Age', Normal: 'Yes', P: '0.05', Group1: '50' },
        { Variable: 'Gender', Normal: 'No', P: '0.12', Group1: 'Male' }
      ];

      const exportColumns = ['Variable', 'Normal', 'P', 'Group1'];

      const result = createCoreSummaryData(filteredRows, exportColumns);

      expect(result).toContain('Variable: Age');
      expect(result).toContain('Normal: Yes');
      expect(result).toContain('P: 0.05');
      expect(result).toContain('Group1: 50');
      expect(result).toContain('Variable: Gender');
      expect(result).toContain('|');
      expect(result.split('\n')).toHaveLength(2);
    });

    it('應該處理空值', () => {
      const filteredRows: TableRow[] = [
        { Variable: 'Test', Normal: null, P: undefined, Group1: '' }
      ];

      const exportColumns = ['Variable', 'Normal', 'P', 'Group1'];

      const result = createCoreSummaryData(filteredRows, exportColumns);

      expect(result).toContain('Normal: —');
      expect(result).toContain('P: —');
      expect(result).toContain('Group1: —');
    });

    it('應該處理空陣列', () => {
      const result = createCoreSummaryData([], ['Variable']);
      expect(result).toBe('');
    });

    it('應該處理特殊字元', () => {
      const filteredRows: TableRow[] = [
        { Variable: 'Test & Demo', Value: '< 0.05', Symbol: '±' }
      ];

      const exportColumns = ['Variable', 'Value', 'Symbol'];

      const result = createCoreSummaryData(filteredRows, exportColumns);

      expect(result).toContain('Test & Demo');
      expect(result).toContain('< 0.05');
      expect(result).toContain('±');
    });

    it('應該保持欄位順序', () => {
      const filteredRows: TableRow[] = [
        {
            C: '3', B: '2', A: '1',
            Variable: ''
        }
      ];

      const exportColumns = ['A', 'B', 'C'];

      const result = createCoreSummaryData(filteredRows, exportColumns);
      const parts = result.split(' | ');

      expect(parts[0]).toContain('A: 1');
      expect(parts[1]).toContain('B: 2');
      expect(parts[2]).toContain('C: 3');
    });

    it('應該處理布林值', () => {
      const filteredRows: TableRow[] = [
        { Variable: 'Test', IsValid: true, IsActive: false }
      ];

      const exportColumns = ['Variable', 'IsValid', 'IsActive'];

      const result = createCoreSummaryData(filteredRows, exportColumns);

      expect(result).toContain('IsValid: true');
      expect(result).toContain('IsActive: false');
    });

    it('應該處理日期物件', () => {
      const testDate = new Date('2024-01-15T10:30:00');
      const filteredRows: TableRow[] = [
        { Variable: 'Test', Date: testDate }
      ];

      const exportColumns = ['Variable', 'Date'];

      const result = createCoreSummaryData(filteredRows, exportColumns);

      expect(result).toContain('Date:');
      expect(result).toContain(testDate.toString());
    });
  });
});