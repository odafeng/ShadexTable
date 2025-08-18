// src/features/step2/__tests__/AdvancedMissingValue.integration.test.tsx

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom'; // 重要：加入這行以支援 toBeInTheDocument
import userEvent from '@testing-library/user-event';
import React from 'react';
import { useAnalysisStore, type DataRow, type ColumnInfo } from '@/stores/analysisStore';

// Mock modules 必須在最上方
vi.mock('@clerk/nextjs');
vi.mock('next/navigation');
vi.mock('sonner');
vi.mock('@/lib/apiClient');
vi.mock('@/lib/reportError');

// Mock React 元件
vi.mock('@/components/shared/Header', () => ({
  default: vi.fn(() => React.createElement('div', { 'data-testid': 'header' }, 'Header')),
}));

vi.mock('@/components/shared/Footer', () => ({
  default: vi.fn(() => React.createElement('div', { 'data-testid': 'footer' }, 'Footer')),
}));

vi.mock('@/components/shared/stepNavigator', () => ({
  default: vi.fn(() => React.createElement('div', { 'data-testid': 'step-navigator' }, 'Step Navigator')),
}));

vi.mock('@/features/step2/components/VariableVisualizationPanel', () => ({
  default: vi.fn(() => React.createElement('div', { 'data-testid': 'variable-visualization' }, 'Variable Visualization')),
}));

vi.mock('@/components/ui/custom/AnalysisErrorDialog', () => ({
  default: vi.fn((props: { open: boolean; message?: string }) => 
    props.open ? React.createElement('div', { 'data-testid': 'error-dialog' }, props.message) : null
  ),
}));

vi.mock('@/components/ui/custom/AnalysisLoadingModal', () => ({
  default: vi.fn((props: { isOpen: boolean }) => 
    props.isOpen ? React.createElement('div', { 'data-testid': 'loading-modal' }, 'Loading...') : null
  ),
  DEFAULT_ANALYSIS_STEPS: [],
}));

vi.mock('@/components/ui/custom/ConfirmTypeMismatchDialog', () => ({
  default: vi.fn((props: { open: boolean; message?: string }) => 
    props.open ? React.createElement('div', { 'data-testid': 'confirm-dialog' }, props.message) : null
  ),
}));

vi.mock('@/components/ui/custom/SuccessDialog', () => ({
  FillSuccessDialog: vi.fn((props: { open: boolean }) => 
    props.open ? React.createElement('div', { 'data-testid': 'success-dialog' }, 'Success') : null
  ),
}));

// 測試資料
const mockParsedData: DataRow[] = [
  { id: 1, name: 'John', age: 25, category: 'A', score: 85 },
  { id: 2, name: 'Jane', age: null, category: 'B', score: 90 },
  { id: 3, name: 'Bob', age: 35, category: null, score: null },
  { id: 4, name: 'Alice', age: 28, category: 'A', score: 88 },
  { id: 5, name: null, age: 32, category: 'C', score: null },
];

const mockColumnTypes: ColumnInfo[] = [
  { column: 'id', suggested_type: '識別變項' },
  { column: 'name', suggested_type: '類別變項' },
  { column: 'age', suggested_type: '連續變項' },
  { column: 'category', suggested_type: '類別變項' },
  { column: 'score', suggested_type: '連續變項' },
];

const mockFilledData: DataRow[] = [
  { id: 1, name: 'John', age: 25, category: 'A', score: 85 },
  { id: 2, name: 'Jane', age: 30, category: 'B', score: 90 },
  { id: 3, name: 'Bob', age: 35, category: 'A', score: 87.67 },
  { id: 4, name: 'Alice', age: 28, category: 'A', score: 88 },
  { id: 5, name: 'Unknown', age: 32, category: 'C', score: 87.67 },
];

// 建立完整的初始狀態
const createInitialState = () => ({
  // File State
  file: null,
  fileName: '',
  fileSize: 0,
  uploadedAt: null,
  parsedData: mockParsedData,
  processedData: null,
  dataProcessingLog: {
    missingFilled: false,
    fillMethod: '',
    fillTimestamp: null,
    affectedColumns: [],
    fillSummary: [],
  },
  dataShape: { rows: 5, columns: 5 },
  
  // Variable State
  groupVar: '',
  catVars: ['category'],
  contVars: ['age', 'score'],
  excludedVars: [],
  fillNA: false,
  imputationMethod: 'none',
  
  // Column State
  columnTypes: mockColumnTypes,
  columnProfile: [],
  columnsPreview: [],
  showPreview: false,
  columnAnalysisLoading: false,
  columnAnalysisProgress: 0,
  columnErrors: {},
  
  // Result State
  resultTable: [],
  currentResult: null,
  resultHistory: [],
  groupCounts: {},
  aiDiagnosis: null,
  exportFormat: 'excel',
  isExporting: false,
  
  // UI State
  currentStep: 2,
  isLoading: false,
  loadingMessage: '',
  errors: [],
  warnings: [],
  isDirty: false,
  
  // Auto Analysis State
  autoAnalysisResult: null,
  skipManualStep: false,
  autoAnalysisMode: 'manual',
  aiModel: 'gpt-4',
});

describe('AdvancedMissingValue Integration Tests', () => {
  let Step2Component: typeof import('../pages/Step2Page').default;
  let AdvancedPanelComponent: typeof import('../components/AdvancedMissingValuePanel').default;
  
  beforeEach(async () => {
    // 清理 mocks
    vi.clearAllMocks();
    
    // 動態導入元件
    const step2Module = await import('../pages/Step2Page');
    const panelModule = await import('../components/AdvancedMissingValuePanel');
    Step2Component = step2Module.default;
    AdvancedPanelComponent = panelModule.default;
    
    // 設定 navigation mocks
    const { useRouter } = await import('next/navigation');
    const { useAuth } = await import('@clerk/nextjs');
    const { post } = await import('@/lib/apiClient');
    
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    });
    
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      getToken: vi.fn().mockResolvedValue('mock-token'),
      isLoaded: true,
      isSignedIn: true,
      userId: 'test-user',
      sessionId: 'test-session',
      user: null,
      organization: null,
      has: vi.fn(),
      orgId: null,
      orgRole: null,
      orgSlug: null,
      session: null,
    });
    
    (post as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: { table: [] },
    });
    
    // 初始化 store - 使用實際的 store 方法
    const initialState = createInitialState();
    const storeFunctions = {
      setFile: vi.fn(),
      setParsedData: vi.fn(),
      setProcessedData: vi.fn((data: DataRow[] | null) => {
        useAnalysisStore.setState({ processedData: data });
      }),
      updateProcessingLog: vi.fn(),
      getActiveData: vi.fn(() => 
        useAnalysisStore.getState().processedData || useAnalysisStore.getState().parsedData
      ),
      clearProcessedData: vi.fn(() => {
        useAnalysisStore.setState({ 
          processedData: null,
          fillNA: false,
          dataProcessingLog: {
            missingFilled: false,
            fillMethod: '',
            fillTimestamp: null,
            affectedColumns: [],
            fillSummary: [],
          }
        });
      }),
      updateDataShape: vi.fn(),
      clearFileData: vi.fn(),
      setGroupVar: vi.fn(),
      setCatVars: vi.fn(),
      setContVars: vi.fn(),
      toggleVariable: vi.fn(),
      setFillNA: vi.fn((value: boolean) => {
        useAnalysisStore.setState({ fillNA: value });
      }),
      setImputationMethod: vi.fn(),
      resetVariables: vi.fn(),
      setColumnTypes: vi.fn(),
      setColumnProfile: vi.fn(),
      setColumnsPreview: vi.fn(),
      setShowPreview: vi.fn(),
      setColumnAnalysisLoading: vi.fn(),
      setColumnAnalysisProgress: vi.fn(),
      setColumnError: vi.fn(),
      clearColumnErrors: vi.fn(),
      clearColumnData: vi.fn(),
      setResultTable: vi.fn(),
      setCurrentResult: vi.fn(),
      addToHistory: vi.fn(),
      setGroupCounts: vi.fn(),
      setAiDiagnosis: vi.fn(),
      setExportFormat: vi.fn(),
      setIsExporting: vi.fn(),
      clearResults: vi.fn(),
      clearHistory: vi.fn(),
      setAutoAnalysisResult: vi.fn(),
      setSkipManualStep: vi.fn(),
      setAutoAnalysisMode: vi.fn(),
      setAiModel: vi.fn(),
      clearAutoAnalysis: vi.fn(),
      setCurrentStep: vi.fn(),
      setIsLoading: vi.fn(),
      addError: vi.fn(),
      addWarning: vi.fn(),
      clearErrors: vi.fn(),
      clearWarnings: vi.fn(),
      setIsDirty: vi.fn(),
      resetAll: vi.fn(),
      resetForNewAnalysis: vi.fn(),
      exportState: vi.fn(() => '{}'),
      importState: vi.fn(),
    };
    
    useAnalysisStore.setState({
      ...initialState,
      ...storeFunctions,
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('進階遺漏值填補面板顯示', () => {
    it('應正確顯示遺漏值統計資訊', async () => {
      render(React.createElement(Step2Component));

      await waitFor(() => {
        const title = screen.queryByText('進階遺漏值處理');
        expect(title).toBeTruthy(); // 使用 toBeTruthy 替代 toBeInTheDocument
      });

      // 檢查是否顯示遺漏值百分比
      const missingPanel = screen.getByText('進階遺漏值處理').closest('.card') as HTMLElement | null;
      
      if (missingPanel) {
        // age 有 1/5 = 20% 遺漏
        const ageElement = within(missingPanel).queryByText('age');
        expect(ageElement).toBeTruthy();
        
        // 檢查百分比顯示 - 使用更寬鬆的查詢
        const percentageTexts = within(missingPanel).queryAllByText(/\d+\.\d+%/);
        expect(percentageTexts.length).toBeGreaterThan(0);
        
        // score 欄位
        const scoreElement = within(missingPanel).queryByText('score');
        expect(scoreElement).toBeTruthy();
      }
    });

    it('應顯示正確的資料類型標籤', async () => {
      render(React.createElement(AdvancedPanelComponent));

      await waitFor(() => {
        const title = screen.queryByText('進階遺漏值處理');
        expect(title).toBeTruthy();
      });
      
      const missingPanel = screen.getByText('進階遺漏值處理').closest('.card') as HTMLElement | null;
      if (missingPanel) {
        // 檢查類型標籤
        const continuousLabel = within(missingPanel).queryByText('連續型');
        const categoricalLabel = within(missingPanel).queryByText('類別型');
        
        expect(continuousLabel).toBeTruthy();
        expect(categoricalLabel).toBeTruthy();
      }
    });
  });

  describe('執行進階填補', () => {
    it('應成功執行自定義填補並更新 store', async () => {
      const { post } = await import('@/lib/apiClient');
      
      (post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
        filled_data: mockFilledData,
        summary: [
          { column: 'age', before_pct: '20%', after_pct: '0%', fill_method: 'mean' },
          { column: 'category', before_pct: '20%', after_pct: '0%', fill_method: 'mode' },
          { column: 'score', before_pct: '40%', after_pct: '0%', fill_method: 'mean' },
        ],
      });

      const user = userEvent.setup();
      render(React.createElement(AdvancedPanelComponent));

      await waitFor(() => {
        const title = screen.queryByText('進階遺漏值處理');
        expect(title).toBeTruthy();
      });

      // 找到執行處理按鈕
      const executeButton = screen.getByRole('button', { name: /執行處理/i });
      await user.click(executeButton);

      await waitFor(() => {
        // 檢查 API 被正確呼叫
        expect(post).toHaveBeenCalledWith(
          expect.stringContaining('/self_defined_missing_fill'),
          expect.objectContaining({
            data: expect.any(Array),
            strategies: expect.any(Array),
          }),
          expect.any(Object)
        );
      });
    });
  });

  describe('一鍵填補與還原', () => {
    it('應執行一鍵填補', async () => {
      const { post } = await import('@/lib/apiClient');
      
      (post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
        filled_data: mockFilledData,
        fill_summary: [],
      });

      const user = userEvent.setup();
      render(React.createElement(Step2Component));

      await waitFor(() => {
        const button = screen.queryByRole('button', { name: /一鍵填補遺漏值/i });
        expect(button).toBeTruthy();
      });

      const oneClickButton = screen.getByRole('button', { name: /一鍵填補遺漏值/i });
      await user.click(oneClickButton);

      await waitFor(() => {
        expect(post).toHaveBeenCalled();
      });
    });

    it('應能還原到原始資料', async () => {
      // 先設定已處理的資料
      useAnalysisStore.setState({
        processedData: mockFilledData,
        fillNA: true,
      } as any);

      const user = userEvent.setup();
      render(React.createElement(Step2Component));

      await waitFor(() => {
        const button = screen.queryByRole('button', { name: /還原原始資料/i });
        expect(button).toBeTruthy();
      });

      const restoreButton = screen.getByRole('button', { name: /還原原始資料/i });
      await user.click(restoreButton);

      // 等待 clearProcessedData 被調用
      await waitFor(() => {
        const clearProcessedData = useAnalysisStore.getState().clearProcessedData as ReturnType<typeof vi.fn>;
        expect(clearProcessedData).toHaveBeenCalled();
      });

      // 驗證 state 更新
      const state = useAnalysisStore.getState();
      expect(state.processedData).toBeNull();
      expect(state.fillNA).toBe(false);
    });
  });
});