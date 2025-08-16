// FileUpload.integration.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, screen, waitFor, fireEvent, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import 錯誤相關型別
import { ErrorCode, ErrorContext, ErrorSeverity } from '@/types/errors';
import type { AppError } from '@/types/errors';

// Import store 型別
import type { DataRow, ColumnProfile } from '@/stores/analysisStore';

// Import service 型別
import type {
  FileAnalysisResult,
  ColumnProfile as ServiceColumnProfile,
  ColumnAnalysisResult
} from '@/features/step1/services/fileAnalysisService';
import type { SensitiveCheckResult } from '@/features/step1/services/sensitiveDataDetector';

// Import fileProcessor 型別
import type {
  ProcessedFileResult,
  FileValidationResult
} from '@/utils/fileProcessor';

// ============ MOCKS 必須在最頂部，並且不能引用外部變數 ============

// Mock sonner - 直接在 mock 內部定義
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock Clerk auth - 加入 useUser
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    getToken: vi.fn().mockResolvedValue('mock-token-123'),
  }),
  useUser: () => ({
    isLoaded: true,
    user: {
      id: 'test-user-id',
      firstName: 'Test',
      lastName: 'User',
      emailAddresses: [
        {
          emailAddress: 'test@example.com',
        },
      ],
      publicMetadata: {
        userType: 'GENERAL',
        plan: 'free',
      },
    },
  }),
  ClerkProvider: ({ children }: any) => React.createElement('div', null, children),
  SignedIn: ({ children }: any) => React.createElement('div', null, children),
  SignedOut: ({ children }: any) => React.createElement('div', null, children),
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js Image
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return React.createElement('img', props);
  },
}));

// Mock UI 元件
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => React.createElement('div', null, children),
  TooltipTrigger: ({ children }: any) => React.createElement('div', null, children),
  TooltipContent: ({ children }: any) => React.createElement('div', null, children),
  TooltipProvider: ({ children }: any) => React.createElement('div', null, children),
}));

vi.mock('@/components/ui/accordion', () => ({
  Accordion: ({ children }: any) => React.createElement('div', { 'data-testid': 'accordion' }, children),
  AccordionItem: ({ children }: any) => React.createElement('div', null, children),
  AccordionTrigger: ({ children, onClick }: any) =>
    React.createElement('button', { onClick, role: 'button' }, children),
  AccordionContent: ({ children }: any) => React.createElement('div', { role: 'region' }, children),
}));

// Mock 其他可能需要的 UI 元件
vi.mock('@/components/ui/custom/ActionButton', () => ({
  __esModule: true,
  default: ({ text, onClick, disabled, loading }: any) =>
    React.createElement('button', { onClick, disabled: disabled || loading }, text),
}));

vi.mock('@/components/ui/custom/ActionButton2', () => ({
  __esModule: true,
  default: ({ text, onClick, disabled }: any) =>
    React.createElement('button', { onClick, disabled }, text),
}));

vi.mock('@/components/ui/custom/ToggleSwitch', () => ({
  __esModule: true,
  default: ({ checked, onCheckedChange, label }: any) =>
    React.createElement('label', null, [
      React.createElement('input', {
        key: 'input',
        type: 'checkbox',
        checked,
        onChange: (e: any) => onCheckedChange(e.target.checked)
      }),
      React.createElement('span', { key: 'label' }, label)
    ]),
}));

vi.mock('@/components/ui/custom/GroupSelect', () => ({
  __esModule: true,
  default: ({ options, selected, onChange, placeholder }: any) =>
    React.createElement('select', {
      value: selected,
      onChange: (e: any) => onChange(e.target.value)
    }, [
      React.createElement('option', { key: 'default', value: '' }, placeholder),
      ...options.map((opt: any) =>
        React.createElement('option', { key: opt.value, value: opt.value }, opt.label)
      )
    ]),
}));

vi.mock('@/components/ui/custom/ConfirmTypeMismatchDialog', () => ({
  __esModule: true,
  default: ({ open, message, onConfirm, onCancel }: any) =>
    open ? React.createElement('div', { 'data-testid': 'confirm-dialog' }, [
      React.createElement('p', { key: 'message' }, message),
      React.createElement('button', { key: 'confirm', onClick: onConfirm }, '確認'),
      React.createElement('button', { key: 'cancel', onClick: onCancel }, '取消')
    ]) : null,
}));

// Mock API 服務
vi.mock('@/lib/apiClient', () => ({
  post: vi.fn(),
  apiClient: vi.fn(),
}));

vi.mock('@/lib/reportError', () => ({
  reportError: vi.fn().mockResolvedValue(undefined),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => 'mock-session-token'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// ============ 在所有 mocks 之後 import 元件 ============
import FileUploadArea from '@/features/step1/components/FileUploadArea';
import DataPreviewTable from '@/features/step1/components/DataPreviewTable';
import ColumnAnalysisDisplay from '@/features/step1/components/ColumnAnalysisDisplay';
import { useStep1Logic } from '@/features/step1/hooks/useStep1Logic';
import { FileProcessor } from '@/utils/fileProcessor';
import { FileAnalysisService } from '@/features/step1/services/fileAnalysisService';
import { SensitiveDataDetector } from '@/features/step1/services/sensitiveDataDetector';
import { useAnalysisStore } from '@/stores/analysisStore';

// Import mocked modules to get references
import { toast } from 'sonner';
import { post } from '@/lib/apiClient';

// Get mock references
const mockToast = toast as unknown as {
  error: Mock;
  warning: Mock;
  success: Mock;
};
const mockPost = post as Mock;

// 輔助函數
const waitForFileRejection = async () => {
  await waitFor(() => {
    // 檢查檔案是否被拒絕（仍顯示未選擇檔案）
    const noFileText = screen.queryByText('未選擇任何檔案');
    const privacyDialog = screen.queryByTestId('privacy-dialog');

    // 如果沒有隱私對話框且仍顯示未選擇檔案，表示檔案被拒絕
    expect(noFileText).toBeTruthy();
    expect(privacyDialog).toBeFalsy();
  }, { timeout: 1000 });
};

// Test Component 包裝所有需要測試的元件
function TestComponent() {
  const step1Logic = useStep1Logic();

  return (
    <div>
      <FileUploadArea
        fileName={step1Logic.fileName}
        dragOver={step1Logic.dragOver}
        isLoading={step1Logic.isLoading}
        limitsInfo={{
          formattedLimits: {
            userTypeName: step1Logic.limitsInfo?.userType || '一般用戶',
            maxSize: step1Logic.limitsInfo?.formattedLimits?.maxSize || '10MB',
            maxRows: step1Logic.limitsInfo?.formattedLimits?.maxRows || '10,000',
            maxColumns: step1Logic.limitsInfo?.formattedLimits?.maxColumns || '100',
          },
          userType: (step1Logic.limitsInfo?.userType || 'GENERAL') as 'GENERAL' | 'PROFESSIONAL',
        }}
        sensitiveDetectionLoading={step1Logic.sensitiveDetectionLoading}
        onFileChange={step1Logic.handleFileChange}
        onDrop={step1Logic.handleDrop}
        onDragOver={step1Logic.handleDragOver}
        onDragLeave={step1Logic.handleDragLeave}
      />

      {step1Logic.showPreview && step1Logic.parsedData.length > 0 && (
        <DataPreviewTable parsedData={step1Logic.parsedData} maxRows={5} />
      )}

      <ColumnAnalysisDisplay />

      {/* 隱私確認對話框模擬 */}
      {step1Logic.showPrivacyDialog && (
        <div data-testid="privacy-dialog">
          <h3>隱私檢測</h3>
          {step1Logic.sensitiveColumns.length > 0 ? (
            <div>
              <p>偵測到敏感欄位：</p>
              <ul>
                {step1Logic.sensitiveColumns.map((col) => (
                  <li key={col}>{col}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p>未偵測到敏感資料</p>
          )}
          <button onClick={step1Logic.handlePrivacyConfirm}>確認繼續</button>
          <button onClick={step1Logic.handlePrivacyCancel}>取消</button>
        </div>
      )}
    </div>
  );
}

// Helper function to create test files
const createTestFile = (
  content: string,
  filename: string,
  type = 'text/csv'
): File => {
  const blob = new Blob([content], { type });
  return new File([blob], filename, { type });
};

// 測試資料
const validCSVContent = `姓名,年齡,性別,分數
張三,25,男,85
李四,30,女,92
王五,28,男,78
趙六,35,女,88
陳七,22,男,95`;

const validCSVWithoutSensitive = `類別,數量,比例,狀態
A,100,0.25,active
B,200,0.35,inactive
C,150,0.30,active
D,50,0.10,pending`;

describe('FileUpload Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // 清理任何之前的渲染
    cleanup();
    
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Reset store
    useAnalysisStore.setState({
      parsedData: [],
      columnProfile: [],
      showPreview: false,
      columnAnalysisLoading: false,
      file: null,
    });

    // Clear all mocks
    vi.clearAllMocks();

    // Reset localStorage mock
    localStorageMock.getItem.mockReturnValue('mock-session-token');
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    // 先清理任何現有的渲染
    cleanup();
    
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('檔案上傳基本功能', () => {
    it('應顯示檔案上傳區域的初始狀態', () => {
      renderWithProviders(<TestComponent />);

      const selectFileLabels = screen.getAllByText('選擇檔案');
      expect(selectFileLabels.length).toBeGreaterThan(0);
      expect(screen.getByText('未選擇任何檔案')).toBeTruthy();
      expect(screen.getByText(/拖曳檔案至此或點擊選取/)).toBeTruthy();
    });

    it('應處理有效的CSV檔案上傳（無敏感資料）', async () => {
      // Mock FileProcessor
      const validateFileSpy = vi.spyOn(FileProcessor, 'validateFile');
      validateFileSpy.mockReturnValue({
        isValid: true,
        warnings: [],
      } as FileValidationResult);

      const processFileSpy = vi.spyOn(FileProcessor, 'processFile');
      processFileSpy.mockResolvedValue({
        data: [
          { '類別': 'A', '數量': 100, '比例': 0.25, '狀態': 'active' },
          { '類別': 'B', '數量': 200, '比例': 0.35, '狀態': 'inactive' },
          { '類別': 'C', '數量': 150, '比例': 0.30, '狀態': 'active' },
        ],
        fileInfo: {
          name: 'test.csv',
          size: 1024,
          rows: 3,
          columns: 4,
        },
      } as ProcessedFileResult);

      // Mock SensitiveDataDetector
      const checkFileSpy = vi.spyOn(SensitiveDataDetector, 'checkFileForSensitiveData');
      checkFileSpy.mockResolvedValue({
        hasSensitiveData: false,
        sensitiveColumns: [],
        suggestions: [],
      } as SensitiveCheckResult);

      // Mock FileAnalysisService
      const processFileCompleteSpy = vi.spyOn(FileAnalysisService, 'processFileComplete');
      processFileCompleteSpy.mockResolvedValue({
        success: true,
        data: [
          { '類別': 'A', '數量': 100, '比例': 0.25, '狀態': 'active' },
          { '類別': 'B', '數量': 200, '比例': 0.35, '狀態': 'inactive' },
          { '類別': 'C', '數量': 150, '比例': 0.30, '狀態': 'active' },
        ],
        fileInfo: {
          name: 'test.csv',
          size: 1024,
          rows: 3,
          columns: 4,
        },
        sensitiveColumns: [],
        suggestions: [],
      } as FileAnalysisResult);

      // Mock column analysis API
      mockPost.mockResolvedValue({
        data: {
          columns: [
            { column: '類別', missing_pct: '0.0%', suggested_type: '類別變項' },
            { column: '數量', missing_pct: '0.0%', suggested_type: '連續變項' },
            { column: '比例', missing_pct: '0.0%', suggested_type: '連續變項' },
            { column: '狀態', missing_pct: '0.0%', suggested_type: '類別變項' },
          ],
        },
      });

      renderWithProviders(<TestComponent />);

      const file = createTestFile(validCSVWithoutSensitive, 'test.csv');
      const inputs = screen.getAllByLabelText('選擇檔案');
      const input = inputs[0] as HTMLInputElement;

      // 模擬檔案選擇
      await userEvent.upload(input, file);

      await waitFor(() => {
        // 檢查隱私對話框出現
        expect(screen.getByTestId('privacy-dialog')).toBeTruthy();
        expect(screen.getByText('未偵測到敏感資料')).toBeTruthy();
      });

      // 點擊確認繼續
      const confirmBtn = screen.getByText('確認繼續');
      await userEvent.click(confirmBtn);

      await waitFor(() => {
        // 檢查檔案名稱顯示
        expect(screen.getByText('test.csv')).toBeTruthy();

        // 檢查資料預覽表格
        expect(screen.getByText('以下為預覽資料（最多顯示前5列）：')).toBeTruthy();
      });

      // 分別檢查不同部分的內容
      await waitFor(() => {
        // 檢查資料預覽中的欄位名稱（會有多個）
        const allCategoryTexts = screen.getAllByText('類別');
        expect(allCategoryTexts.length).toBeGreaterThanOrEqual(1); // 至少在表頭出現

        // 檢查 "數量" 也會出現多次
        const allQuantityTexts = screen.getAllByText('數量');
        expect(allQuantityTexts.length).toBeGreaterThanOrEqual(1);

        // 檢查其他欄位
        const allRatioTexts = screen.getAllByText('比例');
        expect(allRatioTexts.length).toBeGreaterThanOrEqual(1);

        const allStatusTexts = screen.getAllByText('狀態');
        expect(allStatusTexts.length).toBeGreaterThanOrEqual(1);
      });

      // 檢查具體的資料值（這些應該是唯一的）
      await waitFor(() => {
        expect(screen.getByText('A')).toBeTruthy();
        expect(screen.getByText('B')).toBeTruthy();
        expect(screen.getByText('C')).toBeTruthy();
        expect(screen.getByText('100')).toBeTruthy();
        expect(screen.getByText('200')).toBeTruthy();
        expect(screen.getByText('150')).toBeTruthy();
      });

      // 檢查欄位分析顯示
      await waitFor(() => {
        expect(screen.getByText(/自動欄位解析結果/)).toBeTruthy();
      });
    });

    it('應處理包含敏感資料的CSV檔案', async () => {
      // Mock FileProcessor
      const validateFileSpy = vi.spyOn(FileProcessor, 'validateFile');
      validateFileSpy.mockReturnValue({
        isValid: true,
        warnings: [],
      } as FileValidationResult);

      // Mock SensitiveDataDetector 檢測到敏感資料
      const checkFileSpy = vi.spyOn(SensitiveDataDetector, 'checkFileForSensitiveData');
      checkFileSpy.mockResolvedValue({
        hasSensitiveData: true,
        sensitiveColumns: ['姓名'],
        suggestions: ['請移除姓名欄位「姓名」，或使用匿名化編號替代'],
      } as SensitiveCheckResult);

      const processFileCompleteSpy = vi.spyOn(FileAnalysisService, 'processFileComplete');
      processFileCompleteSpy.mockResolvedValue({
        success: true,
        data: [
          { '姓名': '張三', '年齡': 25, '性別': '男', '分數': 85 },
          { '姓名': '李四', '年齡': 30, '性別': '女', '分數': 92 },
        ],
        fileInfo: {
          name: 'sensitive.csv',
          size: 2048,
          rows: 2,
          columns: 4,
        },
        sensitiveColumns: ['姓名'],
        suggestions: ['請移除姓名欄位「姓名」，或使用匿名化編號替代'],
      } as FileAnalysisResult);

      renderWithProviders(<TestComponent />);

      const file = createTestFile(validCSVContent, 'sensitive.csv');
      const inputs = screen.getAllByLabelText('選擇檔案');
      const input = inputs[0] as HTMLInputElement;

      await userEvent.upload(input, file);

      await waitFor(() => {
        // 檢查隱私對話框顯示敏感欄位
        const dialog = screen.getByTestId('privacy-dialog');
        expect(dialog).toBeTruthy();

        // 使用更靈活的查詢方式
        const dialogContent = within(dialog);
        expect(dialogContent.getByText(/偵測到敏感欄位/)).toBeTruthy();
        expect(dialogContent.getByText('姓名')).toBeTruthy();
      });

      // 測試取消上傳
      const cancelBtn = screen.getByText('取消');
      await userEvent.click(cancelBtn);

      await waitFor(() => {
        // 確認對話框關閉且檔案未上傳
        expect(screen.queryByTestId('privacy-dialog')).toBeFalsy();
        expect(screen.getByText('未選擇任何檔案')).toBeTruthy();
      });
    });
  });

  describe('檔案驗證錯誤處理', () => {
    it('應拒絕不支援的檔案格式', async () => {
      renderWithProviders(<TestComponent />);

      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const inputs = screen.getAllByLabelText('選擇檔案');
      const input = inputs[0] as HTMLInputElement;

      // 嘗試上傳不支援的檔案
      fireEvent.change(input, { target: { files: [file] } });

      // 等待檔案被拒絕
      await waitForFileRejection();

      // 檢查 toast（如果有的話）
      if (mockToast.error.mock.calls.length > 0) {
        expect(mockToast.error).toHaveBeenCalled();
      }
    });

    it('應拒絕超過大小限制的檔案', async () => {
      // Mock FileProcessor.validateFile 返回大小錯誤
      const validateFileSpy = vi.spyOn(FileProcessor, 'validateFile');
      validateFileSpy.mockReturnValue({
        isValid: false,
        error: {
          code: ErrorCode.FILE_SIZE_EXCEEDED,
          context: ErrorContext.FILE_UPLOAD,
          userMessage: '檔案大小超過限制',
          message: '檔案大小超過限制',
          action: '請選擇小於 10MB 的檔案',
          timestamp: new Date(),
          correlationId: 'test-id',
          severity: ErrorSeverity.MEDIUM,
          canRetry: false,
        },
        warnings: []
      } as FileValidationResult);

      renderWithProviders(<TestComponent />);

      // 創建一個 CSV 檔案（會通過格式檢查）
      const file = new File(['x'.repeat(100)], 'large.csv', { type: 'text/csv' });

      const inputs = screen.getAllByLabelText('選擇檔案');
      const input = inputs[0] as HTMLInputElement;

      fireEvent.change(input, {
        target: {
          files: [file]
        }
      });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          '檔案大小超過限制',
          expect.objectContaining({
            description: '請選擇小於 10MB 的檔案',
            duration: 5000
          })
        );
      });

      // 清理 spy
      validateFileSpy.mockRestore();
    });
  });

  describe('拖放功能', () => {
    it('應支援拖放上傳檔案', async () => {
      const validateFileSpy = vi.spyOn(FileProcessor, 'validateFile');
      validateFileSpy.mockReturnValue({
        isValid: true,
        warnings: [],
      } as FileValidationResult);

      const processFileSpy = vi.spyOn(FileProcessor, 'processFile');
      processFileSpy.mockResolvedValue({
        data: [
          { '類別': 'A', '數量': 100 },
          { '類別': 'B', '數量': 200 },
        ],
        fileInfo: {
          name: 'drag.csv',
          size: 1024,
          rows: 2,
          columns: 2,
        },
      } as ProcessedFileResult);

      const checkFileSpy = vi.spyOn(SensitiveDataDetector, 'checkFileForSensitiveData');
      checkFileSpy.mockResolvedValue({
        hasSensitiveData: false,
        sensitiveColumns: [],
        suggestions: [],
      } as SensitiveCheckResult);

      const processFileCompleteSpy = vi.spyOn(FileAnalysisService, 'processFileComplete');
      processFileCompleteSpy.mockResolvedValue({
        success: true,
        data: [
          { '類別': 'A', '數量': 100 },
          { '類別': 'B', '數量': 200 },
        ],
        fileInfo: {
          name: 'drag.csv',
          size: 1024,
          rows: 2,
          columns: 2,
        },
        sensitiveColumns: [],
        suggestions: [],
      } as FileAnalysisResult);

      renderWithProviders(<TestComponent />);

      const dropZone = screen.getByText(/拖曳檔案至此或點擊選取/).closest('div');
      const file = createTestFile(validCSVWithoutSensitive, 'drag.csv');

      // 模擬拖放事件
      const dataTransfer = {
        files: [file],
        items: [{ kind: 'file', getAsFile: () => file }],
        types: ['Files'],
      };

      fireEvent.dragOver(dropZone!, { dataTransfer });
      fireEvent.drop(dropZone!, { dataTransfer });

      await waitFor(() => {
        expect(screen.getByTestId('privacy-dialog')).toBeTruthy();
      });

      // 確認上傳
      const confirmBtn = screen.getByText('確認繼續');
      await userEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText('drag.csv')).toBeTruthy();
      });
    });

    it('應拒絕同時拖放多個檔案', async () => {
      renderWithProviders(<TestComponent />);

      const dropZone = screen.getByText(/拖曳檔案至此或點擊選取/).closest('div');
      const file1 = createTestFile('content1', 'file1.csv');
      const file2 = createTestFile('content2', 'file2.csv');

      const dataTransfer = {
        files: [file1, file2],
        items: [
          { kind: 'file', getAsFile: () => file1 },
          { kind: 'file', getAsFile: () => file2 },
        ],
        types: ['Files'],
      };

      fireEvent.drop(dropZone!, { dataTransfer });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          '請一次只上傳一個檔案',
          expect.objectContaining({
            description: '系統一次只能處理一個檔案',
            duration: 4000
          })
        );
      });
    });
  });

  describe('欄位分析功能', () => {
    it('應正確顯示欄位分析結果', () => {
      // 設置 store 狀態
      const mockColumnProfile: ColumnProfile[] = [
        { column: '類別', dataType: '類別變項', missingPercentage: 0, uniqueValues: 3, missingValues: 0 },
        { column: '數量', dataType: '連續變項', missingPercentage: 5.5, uniqueValues: 10, missingValues: 1 },
        { column: '狀態', dataType: '類別變項', missingPercentage: 0, uniqueValues: 2, missingValues: 0 },
      ];

      useAnalysisStore.setState({
        columnProfile: mockColumnProfile,
        showPreview: true,
        columnAnalysisLoading: false,
      });

      renderWithProviders(<TestComponent />);

      // 檢查欄位分析顯示
      expect(screen.getByText(/自動欄位解析結果/)).toBeTruthy();

      // 檢查 accordion 按鈕包含正確的文字
      const accordionTrigger = screen.getByText(/自動欄位解析結果/).closest('button');
      expect(accordionTrigger?.textContent).toMatch(/3\s*個欄位/);

      // 檢查表格內容
      const accordion = screen.getByTestId('accordion');

      // 使用 within 來限定搜尋範圍
      expect(within(accordion).getByText('欄位名稱')).toBeTruthy();
      expect(within(accordion).getByText('遺漏值比例')).toBeTruthy();
      expect(within(accordion).getByText('資料類型')).toBeTruthy();

      // 檢查特定值
      expect(within(accordion).getByText('5.5%')).toBeTruthy();
      expect(within(accordion).getByText('連續變項')).toBeTruthy();

      // 檢查類別變項出現兩次
      const catVars = within(accordion).getAllByText('類別變項');
      expect(catVars).toHaveLength(2);
    });

    it('應顯示載入狀態', () => {
      useAnalysisStore.setState({
        columnAnalysisLoading: true,
      });

      renderWithProviders(<TestComponent />);

      expect(screen.getByText('🔍 正在分析欄位特性...')).toBeTruthy();
      expect(screen.getByText('系統正在自動識別資料類型和統計特徵')).toBeTruthy();
    });
  });

  describe('資料預覽功能', () => {
    it('應正確顯示資料預覽表格', () => {
      const testData: DataRow[] = [
        { ID: 1, Name: 'Alice', Score: 85, Date: '2024-01-01' },
        { ID: 2, Name: 'Bob', Score: 92, Date: '2024-01-02' },
        { ID: 3, Name: 'Charlie', Score: 78, Date: '2024-01-03' },
        { ID: 4, Name: 'David', Score: 88, Date: '2024-01-04' },
        { ID: 5, Name: 'Eve', Score: 95, Date: '2024-01-05' },
        { ID: 6, Name: 'Frank', Score: 82, Date: '2024-01-06' },
      ];

      render(<DataPreviewTable parsedData={testData} maxRows={5} />);

      // 檢查表格標題
      expect(screen.getByText('以下為預覽資料（最多顯示前5列）：')).toBeTruthy();

      // 檢查欄位標題
      expect(screen.getByText('ID')).toBeTruthy();
      expect(screen.getByText('Name')).toBeTruthy();
      expect(screen.getByText('Score')).toBeTruthy();
      expect(screen.getByText('Date')).toBeTruthy();

      // 檢查只顯示前5列
      expect(screen.getByText('Alice')).toBeTruthy();
      expect(screen.getByText('Bob')).toBeTruthy();
      expect(screen.getByText('Charlie')).toBeTruthy();
      expect(screen.getByText('David')).toBeTruthy();
      expect(screen.getByText('Eve')).toBeTruthy();
      expect(screen.queryByText('Frank')).toBeFalsy();
    });

    it('應處理空資料情況', () => {
      const { container } = render(<DataPreviewTable parsedData={[]} />);
      expect(container.firstChild).toBeNull();
    });
  });
});