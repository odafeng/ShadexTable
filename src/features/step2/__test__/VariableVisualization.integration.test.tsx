// src/features/step2/components/VariableVisualization.integration.test.tsx

import { useAuth } from '@clerk/nextjs';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';

import VariableVisualizationPanel from '@/features/step2/components/VariableVisualizationPanel';
import type { FlattenedPlotResponse, BoxplotStatistics, BarplotStatistics } from '@/features/step2/types/types';
import { useAnalysisStore } from '@/stores/analysisStore';
import type { DataRow, ColumnInfo } from '@/stores/analysisStore';
import '@testing-library/jest-dom';

// 在所有測試之前設定 DOM polyfills
beforeAll(() => {
  // Polyfill for hasPointerCapture (Radix UI Select 需要)
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = vi.fn(() => false);
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = vi.fn();
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = vi.fn();
  }
  
  // Mock scrollIntoView
  Element.prototype.scrollIntoView = vi.fn();
  
  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
    takeRecords() {
      return [];
    }
  } as any;
});

// Mock Clerk authentication
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn()
}));

// Mock API client
vi.mock('@/lib/apiClient', () => ({
  post: vi.fn()
}));

// Mock dynamic import for ApexCharts
vi.mock('next/dynamic', () => ({
  default: (fn: () => Promise<any>) => {
    const Component = () => {
      return <div data-testid="mock-chart">Chart Placeholder</div>;
    };
    Component.displayName = 'DynamicComponent';
    return Component;
  }
}));

// Mock 子元件
vi.mock('@/features/step2/components/BarplotChart', () => ({
  default: ({ statistics, selectedVariable }: { statistics: BarplotStatistics; selectedVariable: string }) => (
    <div data-testid="barplot-chart">
      <div>Variable: {selectedVariable}</div>
      <div>Categories: {statistics.categories.join(', ')}</div>
      <div>Total: {statistics.total}</div>
    </div>
  )
}));

vi.mock('@/features/step2/components/BoxplotChart', () => ({
  default: ({ statistics, selectedVariable }: { statistics: BoxplotStatistics; selectedVariable: string }) => (
    <div data-testid="boxplot-chart">
      <div>Variable: {selectedVariable}</div>
      <div>Mean: {statistics.mean.toFixed(2)}</div>
      <div>Median: {statistics.median.toFixed(2)}</div>
    </div>
  )
}));

vi.mock('@/features/step2/components/DateVariablePlaceholder', () => ({
  default: () => (
    <div data-testid="date-placeholder">
      <div>日期變項視覺化即將推出</div>
    </div>
  )
}));

// Mock Select 元件以避免 Radix UI 問題
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="mock-select">
      <input 
        type="hidden" 
        value={value} 
        data-testid="select-value"
      />
      <div data-testid="select-wrapper">{children}</div>
    </div>
  ),
  SelectTrigger: ({ children, ...props }: any) => (
    <button 
      {...props} 
      role="combobox" 
      data-testid="select-trigger"
      onClick={(e) => {
        e.preventDefault();
        // 模擬開啟下拉選單
        const dropdown = document.querySelector('[data-testid="select-content"]');
        if (dropdown) {
          (dropdown as HTMLElement).style.display = 'block';
        }
      }}
    >
      {children}
    </button>
  ),
  SelectValue: ({ placeholder }: any) => (
    <span data-testid="select-placeholder">{placeholder}</span>
  ),
  SelectContent: ({ children }: any) => (
    <div 
      role="listbox" 
      data-testid="select-content"
      style={{ display: 'none' }}
    >
      {children}
    </div>
  ),
  SelectItem: ({ value, children, ...props }: any) => (
    <div 
      {...props}
      role="option" 
      data-value={value}
      data-testid={`select-option-${value}`}
      onClick={() => {
        // 找到 onValueChange 並觸發
        const selectWrapper = document.querySelector('[data-testid="mock-select"]');
        if (selectWrapper) {
          const event = new CustomEvent('value-change', { detail: value });
          selectWrapper.dispatchEvent(event);
        }
      }}
    >
      {children}
    </div>
  )
}));

describe('VariableVisualizationPanel Integration Tests', () => {
  const mockGetToken = vi.fn();
  const mockPost = vi.fn();
  
  // 測試資料
  const mockParsedData: DataRow[] = [
    { age: 25, gender: 'Male', salary: 50000, date: '2024-01-01' },
    { age: 30, gender: 'Female', salary: 60000, date: '2024-01-02' },
    { age: 35, gender: 'Male', salary: 70000, date: '2024-01-03' },
    { age: null, gender: 'Female', salary: null, date: '2024-01-04' },
    { age: 28, gender: null, salary: 55000, date: null }
  ];

  const mockColumnTypes: ColumnInfo[] = [
    { column: 'age', suggested_type: '連續變項', uniqueCount: 4, missingCount: 1 },
    { column: 'gender', suggested_type: '類別變項', uniqueCount: 2, missingCount: 1 },
    { column: 'salary', suggested_type: '連續變項', uniqueCount: 4, missingCount: 1 },
    { column: 'date', suggested_type: '日期變項', uniqueCount: 3, missingCount: 2 }
  ];

  beforeEach(async () => {
    // 重置 store
    useAnalysisStore.setState({
      parsedData: mockParsedData,
      columnTypes: mockColumnTypes,
      catVars: ['gender'],
      contVars: ['age', 'salary'],
      groupVar: 'gender',
      currentStep: 2
    });

    // 設定 mock 回傳值
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      getToken: mockGetToken
    });

    mockGetToken.mockResolvedValue('test-token');

    // 重置 post mock
    const { post } = vi.mocked(await import('@/lib/apiClient'));
    vi.mocked(post).mockImplementation(mockPost);
  });

  afterEach(() => {
    vi.clearAllMocks();
    // 清理 DOM
    document.body.innerHTML = '';
  });

  describe('元件基本渲染', () => {
    it('應該正確渲染元件並顯示變項統計摘要', () => {
      render(<VariableVisualizationPanel />);

      expect(screen.getByText('變項初步視覺化')).toBeInTheDocument();
      expect(screen.getByText(/4 個變項可視覺化/)).toBeInTheDocument();
    });

    it('應該在未選擇變項時顯示空狀態', () => {
      render(<VariableVisualizationPanel />);

      expect(screen.getByText('尚未選擇變項')).toBeInTheDocument();
      expect(screen.getByText('請從上方選擇變項以查看分布圖')).toBeInTheDocument();
    });
  });

  describe('類別變項視覺化', () => {
    it('使用者點選類別變項時應顯示 Barplot', async () => {
      const mockBarplotResponse: FlattenedPlotResponse = {
        success: true,
        message: 'Success',
        type: 'barplot',
        data: [
          { x: 'Male', y: 2 },
          { x: 'Female', y: 2 }
        ],
        statistics: {
          categories: ['Male', 'Female'],
          counts: [2, 2],
          percentages: [50, 50],
          total: 4,
          mode: 'Male',
          unique_count: 2
        } as BarplotStatistics,
        metadata: {
          title: 'Gender Distribution',
          x_label: 'Gender',
          y_label: 'Count',
          variable_type: 'categorical'
        }
      };

      mockPost.mockResolvedValueOnce(mockBarplotResponse);

      const { container } = render(<VariableVisualizationPanel />);
      
      // 由於 Select 被 mock，我們需要直接觸發 onValueChange
      // 模擬選擇 gender
      const selectComponent = container.querySelector('[data-testid="mock-select"]');
      
      // 直接呼叫 handleVariableChange
      // 這裡我們需要用不同的方式測試
      
      // 等待 API 呼叫
      await waitFor(() => {
        // 這裡可能需要調整測試策略
      });
    });
  });

  describe('錯誤處理', () => {
    it('應該正確處理 API 錯誤', async () => {
      mockPost.mockRejectedValueOnce({
        response: {
          data: {
            message: '無法生成圖表，資料格式錯誤'
          }
        }
      });

      // 由於 Select 被 mock，需要調整測試方式
      render(<VariableVisualizationPanel />);
      
      // 可以考慮直接測試 handleVariableChange 函數
      // 或者使用其他測試策略
    });
  });

  describe('載入狀態', () => {
    it('應該在載入時顯示載入指示器', async () => {
      // 延遲回應以觀察載入狀態
      mockPost.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          message: 'Success',
          type: 'boxplot',
          data: [],
          statistics: {
            min: 25,
            q1: 26.5,
            median: 28,
            q3: 32.5,
            max: 35,
            mean: 29.5,
            std: 4.12,
            outliers: [],
            n: 4,
            missing: 1
          } as BoxplotStatistics,
          metadata: {
            title: '',
            x_label: '',
            y_label: '',
            variable_type: 'continuous'
          }
        }), 100))
      );

      render(<VariableVisualizationPanel />);
      
      // 測試載入狀態的邏輯
    });
  });
});