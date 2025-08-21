// src/features/step3/hooks/useTableEdit.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';


import { useTableEdit } from '@/features/step3/hooks/useTableEdit';
import { formatVariableName } from '@/features/step3/services/dataTransformService';
import type { TableRow, DragEndEvent, BinaryMapping } from '@/features/step3/types';

import type { UniqueIdentifier } from '@dnd-kit/core';

// Mock dataTransformService
vi.mock('@/features/step3/services/dataTransformService', () => ({
  formatVariableName: vi.fn((name: string) => {
    if (!name) return '';
    // 簡單的 mock 實作
    return name
      .replace(/\*+/g, '')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }),
}));

// 定義 useTableEdit 的返回型別
interface UseTableEditReturn {
  displayNames: Record<string, string>;
  groupLabels: Record<string, string>;
  binaryMappings: Record<string, BinaryMapping>;
  sortedRows: TableRow[];
  editingCell: string | null;
  tempValue: string;
  setEditingCell: (cell: string | null) => void;
  setTempValue: (value: string) => void;
  handleEditName: (originalName: string, newName: string) => void;
  handleEditGroupLabel: (originalGroup: string, newLabel: string) => void;
  handleEditBinaryMapping: (variable: string, original: string, display: string) => void;
  handleDragEnd: (event: DragEndEvent) => void;
}

// 完整定義 DragEndEvent 相關型別
interface ClientRect {
  width: number;
  height: number;
  top: number;
  left: number;
  bottom: number;
  right: number;
}

interface Active {
  id: UniqueIdentifier;
  data: {
    current: {
      sortable?: {
        containerId: UniqueIdentifier;
        items: UniqueIdentifier[];
        index: number;
      };
      [key: string]: unknown;
    } | undefined;
  };
  rect: {
    current: {
      initial: ClientRect | null;
      translated: ClientRect | null;
    } | null;
  };
}

interface Over {
  id: UniqueIdentifier;
  rect: ClientRect | null;
  disabled: boolean;
  data: {
    current: {
      sortable?: {
        containerId: UniqueIdentifier;
        items: UniqueIdentifier[];
        index: number;
      };
      [key: string]: unknown;
    } | undefined;
  };
}

interface Collision {
  id: UniqueIdentifier;
  data?: Record<string, unknown>;
}

// 創建完整的 DragEndEvent mock
function createDragEndEvent(
  activeId: string | null, 
  overId: string | null
): DragEndEvent {
  const baseRect: ClientRect = {
    width: 100,
    height: 40,
    top: 0,
    left: 0,
    bottom: 40,
    right: 100,
  };

  const active: Active | null = activeId ? {
    id: activeId,
    data: {
      current: undefined
    },
    rect: {
      current: {
        initial: baseRect,
        translated: baseRect,
      }
    }
  } : null;

  const over: Over | null = overId ? {
    id: overId,
    rect: baseRect,
    disabled: false,
    data: {
      current: undefined
    }
  } : null;

  return {
    active: active!,
    over,
    collisions: [] as Collision[],
    delta: { x: 0, y: 0 },
    activatorEvent: new MouseEvent('mousedown') as Event,
  } as DragEndEvent;
}

// 定義測試用的 Props 介面
interface TestProps {
  rows: TableRow[];
  counts: Record<string, number>;
}

describe('useTableEdit', () => {
  // 測試資料 - 確保完整的 TableRow 型別
  const createMockRow = (
    variable: string,
    groupA: string | number | null = null,
    groupB: string | number | null = null,
    p: string | number | null = null
  ): TableRow => ({
    Variable: variable,
    'Group A': groupA,
    'Group B': groupB,
    P: p,
  });

  const mockFilteredRows: TableRow[] = [
    createMockRow('**age', '25.5 ± 3.2', '28.3 ± 4.1', '0.023'),
    createMockRow('mean ± sd', '25.5 ± 3.2', '28.3 ± 4.1', '-'),
    createMockRow('**gender', '15 (50%)', '18 (60%)', '0.456'),
    createMockRow('Male', '8 (53.3%)', '10 (55.6%)', '-'),
    createMockRow('Female', '7 (46.7%)', '8 (44.4%)', '-'),
  ];

  const mockGroupCounts: Record<string, number> = {
    'Group A': 30,
    'Group B': 30,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('初始化', () => {
    it('應該正確初始化顯示名稱和群組標籤', () => {
      const { result } = renderHook(() => 
        useTableEdit(mockFilteredRows, mockGroupCounts)
      );

      // 驗證顯示名稱初始化
      expect(result.current.displayNames).toEqual({
        '**age': 'Age',
        'mean ± sd': 'Mean ± Sd',
        '**gender': 'Gender',
        'Male': 'Male',
        'Female': 'Female',
      });

      // 驗證群組標籤初始化
      expect(result.current.groupLabels).toEqual({
        'Group A': 'Group A',
        'Group B': 'Group B',
      });

      // 驗證排序後的列
      expect(result.current.sortedRows).toEqual(mockFilteredRows);

      // 驗證其他初始狀態
      expect(result.current.binaryMappings).toEqual({});
      expect(result.current.editingCell).toBeNull();
      expect(result.current.tempValue).toBe('');
    });

    it('應該在空資料時正確處理', () => {
      const emptyRows: TableRow[] = [];
      const emptyGroupCounts: Record<string, number> = {};

      const { result } = renderHook(() => 
        useTableEdit(emptyRows, emptyGroupCounts)
      );

      expect(result.current.displayNames).toEqual({});
      expect(result.current.groupLabels).toEqual({});
      expect(result.current.sortedRows).toEqual([]);
      expect(result.current.binaryMappings).toEqual({});
    });

    it('應該處理沒有 Variable 欄位的資料列', () => {
      const rowsWithOptionalVariable: TableRow[] = [
        createMockRow('', '25.5', '28.3', '0.023'),
        createMockRow('test', '15', '18', '0.456'),
      ];

      const { result } = renderHook(() => 
        useTableEdit(rowsWithOptionalVariable, mockGroupCounts)
      );

      // 只有有 Variable 的列會被處理
      expect(result.current.displayNames).toHaveProperty('test');
      expect(result.current.displayNames['test']).toBe('Test');
    });
  });

  describe('編輯功能', () => {
    it('應該正確處理編輯變數名稱', () => {
      const { result } = renderHook(() => 
        useTableEdit(mockFilteredRows, mockGroupCounts)
      );

      act(() => {
        result.current.handleEditName('**age', 'Patient Age');
      });

      expect(result.current.displayNames['**age']).toBe('Patient Age');
      
      // 其他名稱不應受影響
      expect(result.current.displayNames['**gender']).toBe('Gender');
    });

    it('應該正確處理編輯群組標籤', () => {
      const { result } = renderHook(() => 
        useTableEdit(mockFilteredRows, mockGroupCounts)
      );

      act(() => {
        result.current.handleEditGroupLabel('Group A', 'Control Group');
      });

      expect(result.current.groupLabels['Group A']).toBe('Control Group');
      expect(result.current.groupLabels['Group B']).toBe('Group B');
    });

    it('應該正確處理二進制映射', () => {
      const { result } = renderHook(() => 
        useTableEdit(mockFilteredRows, mockGroupCounts)
      );

      act(() => {
        result.current.handleEditBinaryMapping('gender', 'No', 'Yes');
      });

      expect(result.current.binaryMappings).toEqual({
        'gender': { '0': 'No', '1': 'Yes' }
      });
    });

    it('應該正確設置編輯單元格狀態', () => {
      const { result } = renderHook(() => 
        useTableEdit(mockFilteredRows, mockGroupCounts)
      );

      act(() => {
        result.current.setEditingCell('cell-1-1');
      });

      expect(result.current.editingCell).toBe('cell-1-1');

      act(() => {
        result.current.setEditingCell(null);
      });

      expect(result.current.editingCell).toBeNull();
    });

    it('應該正確設置臨時值', () => {
      const { result } = renderHook(() => 
        useTableEdit(mockFilteredRows, mockGroupCounts)
      );

      act(() => {
        result.current.setTempValue('New Value');
      });

      expect(result.current.tempValue).toBe('New Value');
    });

    it('應該支援多次編輯操作', () => {
      const { result } = renderHook(() => 
        useTableEdit(mockFilteredRows, mockGroupCounts)
      );

      // 連續編輯多個名稱
      act(() => {
        result.current.handleEditName('**age', 'Age (years)');
        result.current.handleEditName('**gender', 'Sex');
        result.current.handleEditName('Male', 'M');
      });

      expect(result.current.displayNames).toMatchObject({
        '**age': 'Age (years)',
        '**gender': 'Sex',
        'Male': 'M',
      });
    });
  });

  describe('拖放排序', () => {
    it('應該處理同群組內的拖放', () => {
      const { result } = renderHook(() => 
        useTableEdit(mockFilteredRows, mockGroupCounts)
      );

      const dragEvent = createDragEndEvent('sortable-3-Male', 'sortable-4-Female');

      act(() => {
        result.current.handleDragEnd(dragEvent);
      });

      // Male 應該移動到 Female 的位置
      const sortedVariables = result.current.sortedRows.map(row => row.Variable);
      const maleIndex = sortedVariables.indexOf('Male');
      const femaleIndex = sortedVariables.indexOf('Female');
      
      expect(femaleIndex).toBe(3);
      expect(maleIndex).toBe(4);
    });

    it('應該阻止跨群組的拖放', () => {
      const { result } = renderHook(() => 
        useTableEdit(mockFilteredRows, mockGroupCounts)
      );

      const originalRows = [...result.current.sortedRows];

      // 嘗試將 age 群組的項目拖到 gender 群組
      const dragEvent = createDragEndEvent('sortable-1-mean ± sd', 'sortable-3-Male');

      act(() => {
        result.current.handleDragEnd(dragEvent);
      });

      // 順序不應該改變
      expect(result.current.sortedRows).toEqual(originalRows);
    });

    it('應該處理無效的拖放操作', () => {
      const { result } = renderHook(() => 
        useTableEdit(mockFilteredRows, mockGroupCounts)
      );

      const originalRows = [...result.current.sortedRows];

      // over 為 null 的情況
      const dragEventNoOver = createDragEndEvent('sortable-0-age', null);

      act(() => {
        result.current.handleDragEnd(dragEventNoOver);
      });

      expect(result.current.sortedRows).toEqual(originalRows);

      // active 和 over 相同
      const dragEventSameId = createDragEndEvent('sortable-0-age', 'sortable-0-age');

      act(() => {
        result.current.handleDragEnd(dragEventSameId);
      });

      expect(result.current.sortedRows).toEqual(originalRows);
    });

    it('應該處理找不到元素的情況', () => {
      const { result } = renderHook(() => 
        useTableEdit(mockFilteredRows, mockGroupCounts)
      );

      const originalRows = [...result.current.sortedRows];

      const dragEvent = createDragEndEvent('non-existent-id', 'sortable-0-age');

      act(() => {
        result.current.handleDragEnd(dragEvent);
      });

      expect(result.current.sortedRows).toEqual(originalRows);
    });

    it('應該正確處理主變數開頭的群組', () => {
      const { result } = renderHook(() => 
        useTableEdit(mockFilteredRows, mockGroupCounts)
      );

      // 在 gender 群組內移動（主變數是 **gender）
      const dragEvent = createDragEndEvent('sortable-4-Female', 'sortable-3-Male');

      act(() => {
        result.current.handleDragEnd(dragEvent);
      });

      const sortedVariables = result.current.sortedRows.map(row => row.Variable);
      const maleIndex = sortedVariables.indexOf('Male');
      const femaleIndex = sortedVariables.indexOf('Female');
      
      // Female 應該移動到 Male 的位置
      expect(femaleIndex).toBe(3);
      expect(maleIndex).toBe(4);
    });
  });

  describe('資料變更偵測', () => {
    it('應該在資料顯著變化時重新初始化', () => {
      const { result, rerender } = renderHook<UseTableEditReturn, TestProps>(
        (props: TestProps) => useTableEdit(props.rows, props.counts),
        {
          initialProps: { 
            rows: mockFilteredRows, 
            counts: mockGroupCounts 
          },
        }
      );

      // 修改一個顯示名稱
      act(() => {
        result.current.handleEditName('**age', 'Modified Age');
      });

      expect(result.current.displayNames['**age']).toBe('Modified Age');

      // 提供完全不同的資料（觸發重新初始化條件）
      const newRowsWithNewGroups: TableRow[] = [
        { Variable: '**height', 'Group C': '170', 'Group D': '175', P: '0.05' },
        { Variable: '**weight', 'Group C': '70', 'Group D': '75', P: '0.03' },
      ];

      const newGroupCounts: Record<string, number> = { 
        'Group C': 20, 
        'Group D': 25 
      };

      rerender({ rows: newRowsWithNewGroups, counts: newGroupCounts });

      // 應該重新初始化
      expect(result.current.displayNames).not.toHaveProperty('**age');
      expect(result.current.displayNames).toHaveProperty('**height');
      expect(result.current.displayNames).toHaveProperty('**weight');
    });

    it('應該在小幅變化時保持狀態', () => {
      const { result, rerender } = renderHook<UseTableEditReturn, TestProps>(
        (props: TestProps) => useTableEdit(props.rows, props.counts),
        {
          initialProps: { 
            rows: mockFilteredRows, 
            counts: mockGroupCounts 
          },
        }
      );

      // 修改顯示名稱
      act(() => {
        result.current.handleEditName('**age', 'Custom Age');
      });

      // 小幅修改資料（不觸發重新初始化）
      const slightlyModifiedRows: TableRow[] = [
        { ...mockFilteredRows[0], 'Group A': '26.0 ± 3.2' },
        ...mockFilteredRows.slice(1),
      ];

      rerender({ rows: slightlyModifiedRows, counts: mockGroupCounts });

      // 狀態應該保持
      expect(result.current.displayNames['**age']).toBe('Custom Age');
    });

    it('應該正確處理從有資料到無資料的變化', () => {
      const { result, rerender } = renderHook<UseTableEditReturn, TestProps>(
        (props: TestProps) => useTableEdit(props.rows, props.counts),
        {
          initialProps: { 
            rows: mockFilteredRows, 
            counts: mockGroupCounts 
          },
        }
      );

      expect(result.current.sortedRows).toHaveLength(5);

      const emptyRows: TableRow[] = [];
      const emptyGroupCounts: Record<string, number> = {};

      rerender({ rows: emptyRows, counts: emptyGroupCounts });

      // 不應觸發重新初始化（hasInitialized 仍為 true）
      expect(result.current.sortedRows).toHaveLength(5);
    });
  });

  describe('formatVariableName 整合', () => {
    it('應該正確使用 formatVariableName 函數', () => {
      renderHook(() => useTableEdit(mockFilteredRows, mockGroupCounts));

      // 驗證 formatVariableName 被正確呼叫
      expect(formatVariableName).toHaveBeenCalledWith('**age');
      expect(formatVariableName).toHaveBeenCalledWith('**gender');
      expect(formatVariableName).toHaveBeenCalledWith('Male');
      expect(formatVariableName).toHaveBeenCalledWith('Female');
      expect(formatVariableName).toHaveBeenCalledWith('Group A');
      expect(formatVariableName).toHaveBeenCalledWith('Group B');
    });

    it('應該處理 formatVariableName 返回空字串的情況', () => {
    vi.mocked(formatVariableName).mockImplementationOnce((name: string) => {
      if (!name) return '';
      if (name === 'special_case') return '';
      return name;
    }).mockImplementationOnce((name: string) => {
      return name === 'normal' ? 'normal' : '';
    });

      const rowsWithSpecialCase: TableRow[] = [
        createMockRow('special_case', '10', null, '0.05'),
        createMockRow('normal', '20', null, '0.03'),
      ];

      const specialGroupCounts: Record<string, number> = { 
        'Group A': 10 
      };

      const { result } = renderHook(() => 
        useTableEdit(rowsWithSpecialCase, specialGroupCounts)
      );

      expect(result.current.displayNames).toEqual({
        'special_case': '',
        'normal': 'normal',
      });
    });
  });

  describe('邊界情況', () => {
    it('應該處理特殊字元的變數名稱', () => {
      const specialRows: TableRow[] = [
        createMockRow('**test_var*', '10', null, '0.05'),
        createMockRow('***multiple***', '20', null, '0.03'),
      ];

      const specialGroupCounts: Record<string, number> = { 
        'Group A': 10 
      };

      const { result } = renderHook(() => 
        useTableEdit(specialRows, specialGroupCounts)
      );

      expect(result.current.displayNames).toBeDefined();
      expect(Object.keys(result.current.displayNames)).toHaveLength(2);
    });

    it('應該處理非常長的變數名稱', () => {
      const longName = 'a'.repeat(100);
      const longRows: TableRow[] = [
        createMockRow(longName, '10', null, '0.05'),
      ];

      const longGroupCounts: Record<string, number> = { 
        'Group A': 10 
      };

      const { result } = renderHook(() => 
        useTableEdit(longRows, longGroupCounts)
      );

      expect(result.current.displayNames[longName]).toBeDefined();
    });

    it('應該處理包含數字和特殊符號的群組名稱', () => {
      const specialGroupCounts: Record<string, number> = {
        'Group-1': 10,
        'Group_2': 20,
        'Group#3': 30,
      };

      const { result } = renderHook(() => 
        useTableEdit(mockFilteredRows, specialGroupCounts)
      );

      expect(result.current.groupLabels).toHaveProperty('Group-1');
      expect(result.current.groupLabels).toHaveProperty('Group_2');
      expect(result.current.groupLabels).toHaveProperty('Group#3');
    });

    it('應該處理重複的變數名稱', () => {
      const duplicateRows: TableRow[] = [
        createMockRow('test', '10', null, '0.05'),
        createMockRow('test', '20', null, '0.03'),
        createMockRow('test', '30', null, '0.01'),
      ];

      const duplicateGroupCounts: Record<string, number> = { 
        'Group A': 10 
      };

      const { result } = renderHook(() => 
        useTableEdit(duplicateRows, duplicateGroupCounts)
      );

      // 最後一次的值會覆蓋前面的
      expect(result.current.displayNames['test']).toBe('Test');
      
      // 修改時會影響所有同名變數
      act(() => {
        result.current.handleEditName('test', 'Modified Test');
      });

      expect(result.current.displayNames['test']).toBe('Modified Test');
    });
  });

  describe('效能相關', () => {
    it('應該避免不必要的重新初始化', () => {
      const { result, rerender } = renderHook<UseTableEditReturn, TestProps>(
        (props: TestProps) => useTableEdit(props.rows, props.counts),
        {
          initialProps: { 
            rows: mockFilteredRows, 
            counts: mockGroupCounts 
          },
        }
      );

      const initialDisplayNames = result.current.displayNames;

      // 相同的資料重新渲染
      rerender({ rows: mockFilteredRows, counts: mockGroupCounts });

      // 應該是相同的物件引用（沒有重新初始化）
      expect(result.current.displayNames).toBe(initialDisplayNames);
    });

    it('應該處理大量資料', () => {
      const largeRows: TableRow[] = Array.from({ length: 1000 }, (_, i) => 
        createMockRow(`var_${i}`, `${i}`, `${i * 2}`, '0.05')
      );

      const { result } = renderHook(() => 
        useTableEdit(largeRows, mockGroupCounts)
      );

      expect(Object.keys(result.current.displayNames)).toHaveLength(1000);
      
      // 測試拖放在大量資料下的效能
      const dragEvent = createDragEndEvent('sortable-0-var_0', 'sortable-1-var_1');

      act(() => {
        result.current.handleDragEnd(dragEvent);
      });

      expect(result.current.sortedRows[0].Variable).toBe('var_1');
      expect(result.current.sortedRows[1].Variable).toBe('var_0');
    });
  });

  describe('並發操作', () => {
    it('應該正確處理連續的編輯操作', () => {
      const { result } = renderHook(() => 
        useTableEdit(mockFilteredRows, mockGroupCounts)
      );

      act(() => {
        // 快速連續編輯
        result.current.handleEditName('**age', 'Age1');
        result.current.handleEditName('**age', 'Age2');
        result.current.handleEditName('**age', 'Age3');
        result.current.handleEditGroupLabel('Group A', 'GroupA1');
        result.current.handleEditGroupLabel('Group A', 'GroupA2');
      });

      // 最後的值應該被保留
      expect(result.current.displayNames['**age']).toBe('Age3');
      expect(result.current.groupLabels['Group A']).toBe('GroupA2');
    });

    it('應該處理同時編輯和拖放', () => {
      const { result } = renderHook(() => 
        useTableEdit(mockFilteredRows, mockGroupCounts)
      );

      act(() => {
        // 編輯名稱
        result.current.handleEditName('Male', 'Male Gender');
        
        // 同時進行拖放
        const dragEvent = createDragEndEvent('sortable-3-Male', 'sortable-4-Female');
        
        result.current.handleDragEnd(dragEvent);
      });

      // 兩個操作都應該成功
      expect(result.current.displayNames['Male']).toBe('Male Gender');
      
      const sortedVariables = result.current.sortedRows.map(row => row.Variable);
      const maleIndex = sortedVariables.indexOf('Male');
      expect(maleIndex).toBe(4);
    });
  });
});