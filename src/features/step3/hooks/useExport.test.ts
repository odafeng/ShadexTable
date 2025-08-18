// src/features/step3/hooks/useExport.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useExport } from '@/features/step3/hooks/useExport';
import { prepareExportData, isCategorySubItem } from '@/features/step3/services/dataTransformService';
import { exportToExcel, exportToWord } from '@/features/step3/services/exportService';
import type { TableRow, GroupCounts, BinaryMapping } from '@/features/step3/types';
import { reportError } from '@/lib/reportError';
import { createError, ErrorCode, ErrorContext } from '@/utils/error';

// Mock 相依套件
vi.mock('@/features/step3/services/dataTransformService', () => ({
  prepareExportData: vi.fn(),
  isCategorySubItem: vi.fn(),
}));

vi.mock('@/features/step3/services/exportService', () => ({
  exportToExcel: vi.fn(),
  exportToWord: vi.fn(),
}));

vi.mock('@/lib/reportError', () => ({
  reportError: vi.fn(),
}));

// Mock window.alert
const mockAlert = vi.fn();
global.alert = mockAlert;

describe('useExport', () => {
  // 測試資料
  const mockSortedRows: TableRow[] = [
    { 
      Variable: 'Age', 
      'Group A': '25.5 ± 3.2', 
      'Group B': '28.3 ± 4.1', 
      P: '0.023',
      Method: 't-test' 
    },
    { 
      Variable: 'Gender', 
      'Group A': '1 (50%)', 
      'Group B': '0 (40%)', 
      P: '0.456',
      Method: 'Chi-square'
    },
    {
      Variable: '**Category',
      'Group A': '',
      'Group B': '',
      P: '',
      Method: ''
    },
    {
      Variable: 'SubItem1',
      'Group A': '5 (25%)',
      'Group B': '8 (40%)',
      P: '0.123',
      Method: 'Fisher'
    }
  ];

  const mockDisplayNames: Record<string, string> = {
    'Age': 'Patient Age',
    'Gender': 'Patient Gender',
    '**Category': 'Category Header',
    'SubItem1': 'Sub Category 1'
  };

  const mockGroupLabels: Record<string, string> = {
    'Group A': 'Control Group',
    'Group B': 'Treatment Group'
  };

  const mockBinaryMappings: Record<string, BinaryMapping> = {
    'Gender-Group A': { '0': 'Female', '1': 'Male' },
    'Gender-Group B': { '0': 'Female', '1': 'Male' }
  };

  const mockGroupCounts: GroupCounts = {
    'Group A': 20,
    'Group B': 20
  };

  const mockExportColumns = ['Variable', 'Group A', 'Group B', 'P', 'Method'];

  const mockPreparedData = [
    { 
      Variable: 'Patient Age',
      'Control Group (n=20)': '25.5 ± 3.2',
      'Treatment Group (n=20)': '28.3 ± 4.1',
      P: '0.023',
      Method: 't-test'
    }
  ];

  const defaultParams = {
    sortedRows: mockSortedRows,
    displayNames: mockDisplayNames,
    groupLabels: mockGroupLabels,
    binaryMappings: mockBinaryMappings,
    groupCounts: mockGroupCounts,
    groupVar: 'treatment_group'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prepareExportData).mockReturnValue(mockPreparedData);
    vi.mocked(isCategorySubItem).mockReturnValue(false);
    vi.mocked(exportToExcel).mockResolvedValue(undefined);
    vi.mocked(exportToWord).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初始化', () => {
    it('應該正確初始化所有函數', () => {
      const { result } = renderHook(() => useExport(defaultParams));

      expect(typeof result.current.canExport).toBe('function');
      expect(typeof result.current.handleExportToExcel).toBe('function');
      expect(typeof result.current.handleExportToWord).toBe('function');
    });
  });

  describe('canExport', () => {
    it('當有 groupVar 且群組數量 >= 2 時應返回 true', () => {
      const { result } = renderHook(() => useExport(defaultParams));
      
      const canExport = result.current.canExport();
      
      expect(canExport).toBe(true);
    });

    it('當沒有 groupVar 時應返回 false', () => {
      const paramsWithoutGroupVar = {
        ...defaultParams,
        groupVar: undefined
      };
      
      const { result } = renderHook(() => useExport(paramsWithoutGroupVar));
      
      const canExport = result.current.canExport();
      
      expect(canExport).toBe(false);
    });

    it('當群組數量 < 2 時應返回 false', () => {
      const paramsWithSingleGroup = {
        ...defaultParams,
        groupCounts: { 'Group A': 20 }
      };
      
      const { result } = renderHook(() => useExport(paramsWithSingleGroup));
      
      const canExport = result.current.canExport();
      
      expect(canExport).toBe(false);
    });

    it('當群組數量為空物件時應返回 false', () => {
      const paramsWithEmptyGroups = {
        ...defaultParams,
        groupCounts: {}
      };
      
      const { result } = renderHook(() => useExport(paramsWithEmptyGroups));
      
      const canExport = result.current.canExport();
      
      expect(canExport).toBe(false);
    });

    it('當群組數量恰好為 2 時應返回 true', () => {
      const { result } = renderHook(() => useExport(defaultParams));
      
      const canExport = result.current.canExport();
      
      expect(canExport).toBe(true);
    });

    it('當群組數量 > 2 時應返回 true', () => {
      const paramsWithMultipleGroups = {
        ...defaultParams,
        groupCounts: {
          'Group A': 20,
          'Group B': 20,
          'Group C': 15
        }
      };
      
      const { result } = renderHook(() => useExport(paramsWithMultipleGroups));
      
      const canExport = result.current.canExport();
      
      expect(canExport).toBe(true);
    });
  });

  describe('handleExportToExcel', () => {
    it('應該成功匯出 Excel 檔案', async () => {
      const { result } = renderHook(() => useExport(defaultParams));

      await act(async () => {
        await result.current.handleExportToExcel();
      });

      // 驗證 prepareExportData 被正確呼叫
      expect(prepareExportData).toHaveBeenCalledWith(
        mockSortedRows,
        mockDisplayNames,
        mockGroupLabels,
        mockBinaryMappings,
        mockGroupCounts,
        mockExportColumns
      );

      // 驗證 exportToExcel 被呼叫
      expect(exportToExcel).toHaveBeenCalledWith(mockPreparedData);

      // 驗證沒有錯誤報告
      expect(reportError).not.toHaveBeenCalled();
      expect(mockAlert).not.toHaveBeenCalled();
    });

    it('應該處理 prepareExportData 錯誤', async () => {
      const mockError = createError(
        ErrorCode.DATA_VALIDATION_FAILED,
        ErrorContext.DATA_VALIDATION,
        undefined,
        { customMessage: '資料準備失敗' }
      );
      
      vi.mocked(prepareExportData).mockImplementation(() => {
        throw mockError;
      });

      const { result } = renderHook(() => useExport(defaultParams));

      await act(async () => {
        await result.current.handleExportToExcel();
      });

      // 驗證錯誤處理
      expect(reportError).toHaveBeenCalledWith(mockError);
      expect(mockAlert).toHaveBeenCalledWith('資料準備失敗');
      expect(exportToExcel).not.toHaveBeenCalled();
    });

    it('應該處理 exportToExcel 錯誤', async () => {
      const mockError = createError(
        ErrorCode.FILE_ERROR,
        ErrorContext.FILE_PROCESSING,
        undefined,
        { customMessage: 'Excel 匯出失敗' }
      );
      
      vi.mocked(exportToExcel).mockRejectedValue(mockError);

      const { result } = renderHook(() => useExport(defaultParams));

      await act(async () => {
        await result.current.handleExportToExcel();
      });

      // 驗證錯誤處理
      expect(reportError).toHaveBeenCalledWith(mockError);
      expect(mockAlert).toHaveBeenCalledWith('Excel 匯出失敗');
    });

    it('應該處理非 AppError 類型的錯誤', async () => {
      const genericError = new Error('Unknown error');
      vi.mocked(exportToExcel).mockRejectedValue(genericError);

      const { result } = renderHook(() => useExport(defaultParams));

      await act(async () => {
        await result.current.handleExportToExcel();
      });

      // 驗證錯誤處理
      expect(reportError).toHaveBeenCalled();
      expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('Unknown error'));
    });

    it('應該處理空資料的情況', async () => {
      const paramsWithEmptyData = {
        ...defaultParams,
        sortedRows: []
      };

      vi.mocked(prepareExportData).mockReturnValue([]);

      const { result } = renderHook(() => useExport(paramsWithEmptyData));

      await act(async () => {
        await result.current.handleExportToExcel();
      });

      // 驗證仍然呼叫 exportToExcel，即使資料為空
      expect(exportToExcel).toHaveBeenCalledWith([]);
    });
  });

  describe('handleExportToWord', () => {
    it('應該成功匯出 Word 檔案', async () => {
      vi.mocked(isCategorySubItem)
        .mockReturnValueOnce(false)  // Age
        .mockReturnValueOnce(false)  // Gender
        .mockReturnValueOnce(false)  // **Category
        .mockReturnValueOnce(true);  // SubItem1

      const { result } = renderHook(() => useExport(defaultParams));

      await act(async () => {
        await result.current.handleExportToWord();
      });

      // 驗證 exportToWord 被呼叫
      expect(exportToWord).toHaveBeenCalledWith(
        expect.objectContaining({
          groupVar: 'treatment_group',
          groupCounts: {
            'Control Group': 20,
            'Treatment Group': 20
          },
          groupLabels: mockGroupLabels,
          resultTable: expect.arrayContaining([
            expect.objectContaining({
              Variable: 'Patient Age',
              _originalVariable: 'Age',
              _isSubItem: false
            })
          ])
        })
      );

      // 驗證沒有錯誤
      expect(reportError).not.toHaveBeenCalled();
      expect(mockAlert).not.toHaveBeenCalled();
    });

    it('應該正確處理二元映射', async () => {
      const { result } = renderHook(() => useExport(defaultParams));

      await act(async () => {
        await result.current.handleExportToWord();
      });

      // 驗證二元映射被正確應用
      const callArgs = vi.mocked(exportToWord).mock.calls[0][0];
      const genderRow = callArgs.resultTable.find(
        row => row._originalVariable === 'Gender'
      );

      expect(genderRow).toBeDefined();
      expect(genderRow?.['Group A']).toContain('Male');
    });

    it('應該正確識別子類別項目', async () => {
      vi.mocked(isCategorySubItem)
        .mockReturnValueOnce(false)  // Age
        .mockReturnValueOnce(false)  // Gender
        .mockReturnValueOnce(false)  // **Category
        .mockReturnValueOnce(true);  // SubItem1

      const { result } = renderHook(() => useExport(defaultParams));

      await act(async () => {
        await result.current.handleExportToWord();
      });

      const callArgs = vi.mocked(exportToWord).mock.calls[0][0];
      const subItem = callArgs.resultTable.find(
        row => row._originalVariable === 'SubItem1'
      );

      expect(subItem?._isSubItem).toBe(true);
    });

    it('應該處理 exportToWord 錯誤', async () => {
      const mockError = createError(
        ErrorCode.FILE_ERROR,
        ErrorContext.FILE_PROCESSING,
        undefined,
        { customMessage: 'Word 匯出失敗' }
      );
      
      vi.mocked(exportToWord).mockRejectedValue(mockError);

      const { result } = renderHook(() => useExport(defaultParams));

      await act(async () => {
        await result.current.handleExportToWord();
      });

      // 驗證錯誤處理
      expect(reportError).toHaveBeenCalledWith(mockError);
      expect(mockAlert).toHaveBeenCalledWith('Word 匯出失敗');
    });

    it('應該處理空群組標籤的情況', async () => {
      const paramsWithoutLabels = {
        ...defaultParams,
        groupLabels: {}
      };

      const { result } = renderHook(() => useExport(paramsWithoutLabels));

      await act(async () => {
        await result.current.handleExportToWord();
      });

      // 驗證使用原始群組名稱
      const callArgs = vi.mocked(exportToWord).mock.calls[0][0];
      expect(callArgs.groupCounts).toHaveProperty('Group A');
      expect(callArgs.groupCounts).toHaveProperty('Group B');
    });

    it('應該處理缺少二元映射的情況', async () => {
      const paramsWithoutMappings = {
        ...defaultParams,
        binaryMappings: {}
      };

      const { result } = renderHook(() => useExport(paramsWithoutMappings));

      await act(async () => {
        await result.current.handleExportToWord();
      });

      // 驗證原始值被保留
      const callArgs = vi.mocked(exportToWord).mock.calls[0][0];
      const genderRow = callArgs.resultTable.find(
        row => row._originalVariable === 'Gender'
      );

      expect(genderRow?.['Group A']).toBe('1 (50%)');
    });

    it('應該處理複雜的資料結構', async () => {
      const complexRows: TableRow[] = [
        {
          Variable: '**Demographics',
          'Group A': '',
          'Group B': '',
          P: '',
          Method: ''
        },
        {
          Variable: 'Age',
          'Group A': '45.2 ± 12.3',
          'Group B': '43.8 ± 11.7',
          P: '0.542',
          Method: 't-test'
        },
        {
          Variable: 'BMI',
          'Group A': '24.5 ± 3.2',
          'Group B': '25.1 ± 3.5',
          P: '0.321',
          Method: 't-test'
        },
        {
          Variable: '**Medical History',
          'Group A': '',
          'Group B': '',
          P: '',
          Method: ''
        },
        {
          Variable: 'Diabetes',
          'Group A': '1 (25%)',
          'Group B': '0 (20%)',
          P: '0.789',
          Method: 'Chi-square'
        }
      ];

      const complexParams = {
        ...defaultParams,
        sortedRows: complexRows
      };

      const { result } = renderHook(() => useExport(complexParams));

      await act(async () => {
        await result.current.handleExportToWord();
      });

      const callArgs = vi.mocked(exportToWord).mock.calls[0][0];
      expect(callArgs.resultTable).toHaveLength(5);
    });

    it('應該處理特殊字元的變數名稱', async () => {
      const specialRows: TableRow[] = [
        {
          Variable: 'Blood_Pressure_@_Baseline',
          'Group A': '120/80',
          'Group B': '125/82',
          P: '0.234',
          Method: 't-test'
        }
      ];

      const specialParams = {
        ...defaultParams,
        sortedRows: specialRows
      };

      const { result } = renderHook(() => useExport(specialParams));

      await act(async () => {
        await result.current.handleExportToWord();
      });

      expect(exportToWord).toHaveBeenCalled();
      expect(reportError).not.toHaveBeenCalled();
    });

    it('應該處理 null 和 undefined 值', async () => {
      const rowsWithNulls: TableRow[] = [
        {
          Variable: 'Test',
          'Group A': null,
          'Group B': undefined,
          P: 'nan',
          Method: ''
        }
      ];

      const paramsWithNulls = {
        ...defaultParams,
        sortedRows: rowsWithNulls
      };

      const { result } = renderHook(() => useExport(paramsWithNulls));

      await act(async () => {
        await result.current.handleExportToWord();
      });

      const callArgs = vi.mocked(exportToWord).mock.calls[0][0];
      const testRow = callArgs.resultTable[0];
      
      expect(testRow['Group A']).toBeNull();
      expect(testRow['Group B']).toBeUndefined();
    });
  });

  describe('錯誤處理邊界情況', () => {
    it('應該處理字串型錯誤', async () => {
      vi.mocked(exportToExcel).mockRejectedValue('String error');

      const { result } = renderHook(() => useExport(defaultParams));

      await act(async () => {
        await result.current.handleExportToExcel();
      });

      expect(reportError).toHaveBeenCalled();
      expect(mockAlert).toHaveBeenCalled();
    });

    it('應該處理未知型別的錯誤', async () => {
      vi.mocked(exportToExcel).mockRejectedValue({ code: 'UNKNOWN' });

      const { result } = renderHook(() => useExport(defaultParams));

      await act(async () => {
        await result.current.handleExportToExcel();
      });

      expect(reportError).toHaveBeenCalled();
      expect(mockAlert).toHaveBeenCalled();
    });

    it('應該處理同步錯誤', async () => {
      vi.mocked(prepareExportData).mockImplementation(() => {
        throw new Error('Sync error');
      });

      const { result } = renderHook(() => useExport(defaultParams));

      await act(async () => {
        await result.current.handleExportToExcel();
      });

      expect(reportError).toHaveBeenCalled();
      expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('Sync error'));
    });
  });

  describe('參數更新', () => {
    it('應該在參數改變時使用新參數', async () => {
      const { result, rerender } = renderHook(
        (props) => useExport(props),
        { initialProps: defaultParams }
      );

      // 第一次匯出
      await act(async () => {
        await result.current.handleExportToExcel();
      });

      expect(prepareExportData).toHaveBeenCalledWith(
        mockSortedRows,
        mockDisplayNames,
        mockGroupLabels,
        mockBinaryMappings,
        mockGroupCounts,
        mockExportColumns
      );

      vi.clearAllMocks();

      // 更新參數
      const newRows: TableRow[] = [
        { Variable: 'NewVar', 'Group A': '10', 'Group B': '20', P: '0.05' }
      ];
      
      const newParams = {
        ...defaultParams,
        sortedRows: newRows
      };

      rerender(newParams);

      // 第二次匯出
      await act(async () => {
        await result.current.handleExportToExcel();
      });

      expect(prepareExportData).toHaveBeenCalledWith(
        newRows,
        mockDisplayNames,
        mockGroupLabels,
        mockBinaryMappings,
        mockGroupCounts,
        mockExportColumns
      );
    });
  });

  describe('並發處理', () => {
    it('應該能處理同時匯出 Excel 和 Word', async () => {
      const { result } = renderHook(() => useExport(defaultParams));

      await act(async () => {
        await Promise.all([
          result.current.handleExportToExcel(),
          result.current.handleExportToWord()
        ]);
      });

      expect(exportToExcel).toHaveBeenCalledTimes(1);
      expect(exportToWord).toHaveBeenCalledTimes(1);
      expect(reportError).not.toHaveBeenCalled();
    });

    it('應該獨立處理各自的錯誤', async () => {
      const excelError = createError(
        ErrorCode.FILE_ERROR,
        ErrorContext.FILE_PROCESSING,
        undefined,
        { customMessage: 'Excel failed' }
      );

      const wordError = createError(
        ErrorCode.FILE_ERROR,
        ErrorContext.FILE_PROCESSING,
        undefined,
        { customMessage: 'Word failed' }
      );

      vi.mocked(exportToExcel).mockRejectedValue(excelError);
      vi.mocked(exportToWord).mockRejectedValue(wordError);

      const { result } = renderHook(() => useExport(defaultParams));

      await act(async () => {
        await Promise.allSettled([
          result.current.handleExportToExcel(),
          result.current.handleExportToWord()
        ]);
      });

      expect(reportError).toHaveBeenCalledTimes(2);
      expect(mockAlert).toHaveBeenCalledWith('Excel failed');
      expect(mockAlert).toHaveBeenCalledWith('Word failed');
    });
  });
});