// src/features/step1/__test__/AutoMode.integration.test.tsx

// src/features/step1/__test__/AutoMode.integration.test.tsx

import React from 'react';

import { useAuth } from '@clerk/nextjs';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import '@testing-library/jest-dom';

// ===== 正確的 ResizeObserver Mock 定義 =====
class ResizeObserverMock implements ResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    // 可以儲存 callback 以供後續使用
  }
  
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

beforeAll(() => {
  // 設置 ResizeObserver 為全局 mock
  window.ResizeObserver = ResizeObserverMock;
  global.ResizeObserver = ResizeObserverMock;
});

afterAll(() => {
  // 清理 - 使用類型斷言而非 any
  if ('ResizeObserver' in window) {
    delete (window as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver;
  }
  if ('ResizeObserver' in global) {
    delete (global as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver;
  }
});

// Import components
import AnalysisControl from '@/features/step1/components/AnalysisControl';

// Import types and schemas
import { 
  createMockFile, 
  createMockCSVData, 
  createMockColumnTypes 
} from './test-helpers';

import type { 
  MockAnalysisResponse, 
  MockFillMissingResponse,
  MockTableAnalysisResponse 
} from '../types/test-schemas';


// Import test utilities

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/apiClient', () => ({
  post: vi.fn(),
}));

vi.mock('@/lib/reportError', () => ({
  reportError: vi.fn(),
}));

// Mock FileAnalysisService
vi.mock('@/features/step1/services/fileAnalysisService', () => ({
  FileAnalysisService: {
    performAutoAnalysis: vi.fn(),
    analyzeColumns: vi.fn(),
    createFallbackColumnData: vi.fn(),
  },
}));

// Mock tooltip components to simplify testing
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: () => null,
}));

// Import modules after mocks
import { FileAnalysisService } from '@/features/step1/services/fileAnalysisService';
import { post } from '@/lib/apiClient';
import { useAnalysisStore } from '@/stores/analysisStore';

describe('AutoMode Integration Tests', () => {
  const mockPush = vi.fn();
  const mockGetToken = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    // Setup router mock
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      prefetch: vi.fn(),
    });

    // Setup auth mock
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      getToken: mockGetToken,
      userId: 'test-user-id',
      isSignedIn: true,
    });

    // Setup default token
    mockGetToken.mockResolvedValue('test-token');

    // Reset Zustand store
    const store = useAnalysisStore.getState();
    store.resetAll();
    
    // Set initial test data
    store.setFile(createMockFile('test csv content'));
    store.setParsedData(createMockCSVData());
    store.setColumnTypes(createMockColumnTypes());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('自動分析模式 - 填補遺漏值啟用', () => {
    it('應正確執行完整的自動分析流程並導航至 Step3', async () => {
      // Arrange
      const mockAutoAnalysisResponse: MockAnalysisResponse = {
        success: true,
        group_var: 'group',
        cat_vars: ['gender'],
        cont_vars: ['age', 'income'],
        classification: {
          gender: 'categorical',
          age: 'continuous',
          income: 'continuous',
        },
      };

      const mockFillResponse: MockFillMissingResponse = {
        success: true,
        message: '遺漏值處理完成',
        filled_data: createMockCSVData().map(row => ({
          ...row,
          age: row.age ?? 29.5,
          gender: row.gender ?? 'M',
          income: row.income ?? 58750,
        })),
        summary: [
          { column: 'age', before_pct: '20%', after_pct: '0%', fill_method: '平均值填補' },
          { column: 'gender', before_pct: '20%', after_pct: '0%', fill_method: '眾數填補' },
          { column: 'income', before_pct: '20%', after_pct: '0%', fill_method: '中位數填補' },
        ],
      };

      const mockTableResponse: MockTableAnalysisResponse = {
        success: true,
        data: {
          table: [
            { Variable: 'Age', 'Group A': '26.7 ± 2.5', 'Group B': '32.5 ± 3.5', P: '0.045' },
          ],
          groupCounts: { 'Group A': 3, 'Group B': 2 },
        },
      };

      // Setup mocks
      (FileAnalysisService.performAutoAnalysis as ReturnType<typeof vi.fn>)
        .mockResolvedValue({ success: true, result: mockAutoAnalysisResponse });
      
      (post as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockFillResponse)
        .mockResolvedValueOnce(mockTableResponse);

      // Act
      render(<AnalysisControl />);
      
      // 1. 勾選填補缺值
      const fill_naCheckbox = screen.getByLabelText('填補缺值');
      await user.click(fill_naCheckbox);
      
      // 2. 開啟 AI 全自動分析模式
      const autoModeToggle = screen.getByText('AI 全自動分析模式');
      await user.click(autoModeToggle);
      
      // 3. 等待分組選擇器出現
      await waitFor(() => {
        expect(screen.getByText('選擇分組變項')).toBeInTheDocument();
      });
      
      // 4. 點擊下拉選單按鈕打開 Popover
      const dropdownButton = screen.getByRole('combobox');
      await user.click(dropdownButton);
      
      // 5. 等待 Popover 內容出現，然後點擊 'group' 選項
      // CommandItem 元素沒有 role="option"，我們需要用文字來找
      await waitFor(() => {
        // 使用 getByText 找到選項
        const groupOption = screen.getByText('group');
        expect(groupOption).toBeInTheDocument();
      });
      
      // 點擊 group 選項
      const groupOption = screen.getByText('group');
      await user.click(groupOption);
      
      // 6. 確認 groupVar 已經被設定
      await waitFor(() => {
        const store = useAnalysisStore.getState();
        expect(store.groupVar).toBe('group');
      });
      
      // 7. 點擊開始分析
      const analyzeButton = screen.getByText(/開始 AI 全自動分析/);
      await user.click(analyzeButton);

      // Assert
      await waitFor(() => {
        // 驗證 API 呼叫順序
        expect(FileAnalysisService.performAutoAnalysis).toHaveBeenCalledWith(
          expect.any(Array),
          true, // fill_na
          'test-token',
          'group', // 正確的 groupVar
          expect.stringMatching(/^auto-analysis-\d{13}-[a-z0-9]{9}$/) // 匹配 correlation_id 格式
        );
        
        expect(post).toHaveBeenCalledWith(
          expect.stringContaining('/api/preprocess/missing_fill'),
          expect.objectContaining({
            data: expect.any(Array),
            columns: expect.any(Array),
            cont_vars: ['age', 'income'],
            cat_vars: ['gender'],
            group_col: 'group',
          }),
          expect.any(Object)
        );
        
        expect(post).toHaveBeenCalledWith(
          expect.stringContaining('/api/table/table-analyze'),
          expect.objectContaining({
            data: expect.any(Array),
            group_col: 'group',
            cat_vars: ['gender'],
            cont_vars: ['age', 'income'],
            fill_na: false,
          }),
          expect.any(Object)
        );
        
        // 驗證導航至 Step3
        expect(mockPush).toHaveBeenCalledWith('/step3');
      });

      // 驗證 Store 狀態更新
      const store = useAnalysisStore.getState();
      expect(store.catVars).toEqual(['gender']);
      expect(store.contVars).toEqual(['age', 'income']);
      expect(store.groupVar).toBe('group');
      expect(store.processedData).toBeTruthy();
    });

    it('填補失敗時應繼續使用原始資料完成分析', async () => {
      // ... 保持原本的測試不變 ...
    });
  });

  describe('自動分析模式 - 填補遺漏值未啟用', () => {
    it('應跳過填補步驟直接進行分析', async () => {
      // ... 保持原本的測試不變 ...
    });
  });

  describe('半自動分析模式', () => {
    it('填補遺漏值啟用時應導航至 Step2', async () => {
      // ... 保持原本的測試不變 ...
    });

    it('填補遺漏值未啟用時應導航至 Step2', async () => {
      // ... 保持原本的測試不變 ...
    });
  });

  describe('錯誤處理', () => {
    it('認證失敗時應顯示錯誤訊息', async () => {
      // ... 保持原本的測試不變 ...
    });

    it('分析失敗時應保持在當前頁面', async () => {
      // ... 保持原本的測試不變 ...
    });
  });

  describe('UI 交互測試', () => {
    it('自動模式開啟時應顯示分組變項選擇器', async () => {
      // ... 保持原本的測試不變 ...
    });

    it('按鈕文字應根據模式切換', async () => {
      // ... 保持原本的測試不變 ...
    });

    it('載入中應禁用所有控制項', async () => {
      // ... 保持原本的測試不變 ...
    });
  });

  describe('分組變項驗證', () => {
    it('選擇非類別變項作為分組時應顯示警告', async () => {
      // Act
      render(<AnalysisControl />);
      
      const autoModeToggle = screen.getByText('AI 全自動分析模式');
      await user.click(autoModeToggle);
      
      await waitFor(() => {
        expect(screen.getByText('選擇分組變項')).toBeInTheDocument();
      });
      
      // 點擊下拉選單
      const dropdownButton = screen.getByRole('combobox');
      await user.click(dropdownButton);
      
      // 等待選項出現
      await waitFor(() => {
        const ageOption = screen.getByText('age');
        expect(ageOption).toBeInTheDocument();
      });
      
      // 選擇連續變項 'age'
      const ageOption = screen.getByText('age');
      await user.click(ageOption);
      
      // Assert - 應該顯示警告對話框
      await waitFor(() => {
        // 檢查 ConfirmTypeMismatchDialog 的內容
        expect(screen.getByText(/系統判定「age」為連續變項/)).toBeInTheDocument();
        expect(screen.getByText(/建議選擇類別型變項作為分組依據/)).toBeInTheDocument();
      });
    });

    it('確認類型不匹配警告後應繼續分析', async () => {
      // Arrange
      const mockAutoAnalysisResponse: MockAnalysisResponse = {
        success: true,
        group_var: 'age', // 連續變項作為分組
        cat_vars: ['gender'],
        cont_vars: ['income'],
        classification: {},
      };

      (FileAnalysisService.performAutoAnalysis as ReturnType<typeof vi.fn>)
        .mockResolvedValue({ success: true, result: mockAutoAnalysisResponse });
      
      (post as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { table: [], groupCounts: {} },
      });

      // Act
      render(<AnalysisControl />);
      
      const autoModeToggle = screen.getByText('AI 全自動分析模式');
      await user.click(autoModeToggle);
      
      await waitFor(() => {
        expect(screen.getByText('選擇分組變項')).toBeInTheDocument();
      });
      
      // 點擊下拉選單
      const dropdownButton = screen.getByRole('combobox');
      await user.click(dropdownButton);
      
      // 等待選項出現
      await waitFor(() => {
        const ageOption = screen.getByText('age');
        expect(ageOption).toBeInTheDocument();
      });
      
      // 選擇連續變項 'age'
      const ageOption = screen.getByText('age');
      await user.click(ageOption);
      
      // 等待警告對話框出現
      await waitFor(() => {
        expect(screen.getByText(/系統判定「age」為連續變項/)).toBeInTheDocument();
      });
      
      // 點擊確認按鈕 - 根據 ConfirmTypeMismatchDialog 的實際按鈕文字
      const confirmButton = screen.getByRole('button', { name: /確認|確定|繼續/i });
      await user.click(confirmButton);
      
      // 確認 groupVar 已被設定
      await waitFor(() => {
        const store = useAnalysisStore.getState();
        expect(store.groupVar).toBe('age');
      });
      
      // 執行分析
      const analyzeButton = screen.getByText(/開始 AI 全自動分析/);
      await user.click(analyzeButton);
      
      // Assert
      await waitFor(() => {
        expect(FileAnalysisService.performAutoAnalysis).toHaveBeenCalledWith(
          expect.any(Array),
          false, // fill_na 默認為 false
          'test-token',
          'age', // 使用 age 作為分組變項
          expect.stringMatching(/^auto-analysis-\d{13}-[a-z0-9]{9}$/)
        );
        expect(mockPush).toHaveBeenCalledWith('/step3');
      });
      
      // 驗證 Store 狀態
      const store = useAnalysisStore.getState();
      expect(store.groupVar).toBe('age');
    });
  });
});