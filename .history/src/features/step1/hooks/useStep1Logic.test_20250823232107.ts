// src/features/step1/hooks/useStep1Logic.test.ts

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, type MockedFunction } from 'vitest';


import type { DataRow, ColumnProfile } from '@/stores/analysisStore';

// ===== 型別定義 =====

interface MockRouterType {
  push: MockedFunction<(href: string) => void>;
  replace: MockedFunction<(href: string) => void>;
  refresh: MockedFunction<() => void>;
  prefetch: MockedFunction<(href: string) => void>;
  back: MockedFunction<() => void>;
  forward: MockedFunction<() => void>;
}

interface MockAuthType {
  getToken: MockedFunction<() => Promise<string | null>>;
  isSignedIn: boolean;
  isLoaded: boolean;
  userId: string | null;
  sessionId: string | null;
  user: null;
  session: null;
  signOut: MockedFunction<() => void>;
  organization: null;
  orgId: null;
  orgRole: null;
  orgSlug: null;
  has: MockedFunction<(permission: string) => boolean>;
}

interface StoreState {
  parsedData: DataRow[];
  setParsedData: (data: DataRow[]) => void;
  fill_na: boolean;
  setfill_na: (value: boolean) => void;
  setColumnTypes: (types: Array<{ column: string; suggested_type: string }>) => void;
  setFile: (file: File | null) => void;
  file: File | null;
}

interface FileValidationHookReturn {
  fileValidationWarnings: string[];
  validateAndPrepareFile: (file: File) => Promise<{
    isValid: boolean;
    warnings: string[];
    error?: AppError;
  }>;
  clearWarnings: () => void;
}

interface PrivacyDetectionHookReturn {
  showPrivacyDialog: boolean;
  sensitiveColumns: string[];
  privacySuggestions: string[];
  fileBasicInfo: {
    name: string;
    size: number;
    rows?: number;
    columns?: number;
    hasMultipleSheets: boolean;
  } | null;
  sensitiveDetectionLoading: boolean;
  pendingFile: File | null;
  detectSensitiveData: (file: File) => Promise<{
    success: boolean;
    sensitiveColumns: string[];
    suggestions: string[];
    fileInfo: {
      name: string;
      size: number;
      rows?: number;
      columns?: number;
      hasMultipleSheets: boolean;
    } | null;
    data?: DataRow[];
    error?: AppError;
  }>;
  confirmPrivacy: () => void;
  cancelPrivacy: () => void;
  resetPrivacyState: () => void;
}

interface ColumnAnalysisHookReturn {
  columnProfile: ColumnProfile[];
  columnsPreview: Array<{
    column: string;
    values: Array<string | number | boolean | null>;
    dataType: string;
  }>;
  showPreview: boolean;
  columnAnalysisLoading: boolean;
  analyzeColumns: (
    data: DataRow[],
    token?: string,
    setColumnTypes?: (types: Array<{ column: string; suggested_type: string }>) => void
  ) => Promise<void>;
  retryAnalysis: (
    data: DataRow[],
    setColumnTypes?: (types: Array<{ column: string; suggested_type: string }>) => void
  ) => Promise<void>;
  resetColumnAnalysis: () => void;
  setColumnProfile: (profile: ColumnProfile[]) => void;
  setColumnsPreview: (preview: Array<{
    column: string;
    values: Array<string | number | boolean | null>;
    dataType: string;
  }>) => void;
  setShowPreview: (show: boolean) => void;
}

interface AnalysisTriggerHookReturn {
  loading: boolean;
  autoMode: boolean;
  setAutoMode: (mode: boolean) => void;
  triggerAnalysis: (file: File | null) => Promise<void>;
}

interface UserLimitsHookReturn {
  userType: 'GENERAL' | 'PROFESSIONAL';
  canUpload: boolean;
  canAnalyze: boolean;
  remainingAnalyses: number;
  maxFileSize: number;
  isLoading: boolean;
  validateFile: (file: File) => { isValid: boolean; error?: AppError };
  getFileSizeWarning: (file: File) => string | null;
  refreshLimits: () => Promise<void>;
}

// ===== Mock 模組 =====

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn()
  } as MockRouterType))
}));

vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(() => ({
    getToken: vi.fn().mockResolvedValue('mock-token'),
    isSignedIn: true,
    isLoaded: true,
    userId: 'test-user-id',
    sessionId: 'test-session-id',
    user: null,
    session: null,
    signOut: vi.fn(),
    organization: null,
    orgId: null,
    orgRole: null,
    orgSlug: null,
    has: vi.fn().mockReturnValue(false)
  } as MockAuthType))
}));

vi.mock('@/stores/analysisStore', () => ({
  useAnalysisStore: vi.fn((selector: (state: StoreState) => unknown) => {
    const state: StoreState = {
      parsedData: [],
      setParsedData: vi.fn(),
      fill_na: false,
      setfill_na: vi.fn(),
      setColumnTypes: vi.fn(),
      setFile: vi.fn(),
      file: null
    };
    return selector(state);
  })
}));

vi.mock('@/features/auth/hooks/useUserLimits', () => ({
  useUserLimits: vi.fn(() => ({
    userType: 'GENERAL',
    canUpload: true,
    canAnalyze: true,
    remainingAnalyses: 10,
    maxFileSize: 10 * 1024 * 1024,
    isLoading: false,
    validateFile: vi.fn(),
    getFileSizeWarning: vi.fn(),
    refreshLimits: vi.fn()
  } as UserLimitsHookReturn))
}));

vi.mock('@/features/step1/services/fileAnalysisService', () => ({
  FileAnalysisService: {
    processFileComplete: vi.fn(),
    createFallbackColumnData: vi.fn()
  }
}));

vi.mock('@/lib/reportError', () => ({
  reportError: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('./useFileValidation', () => ({
  useFileValidation: vi.fn(() => ({
    fileValidationWarnings: [],
    validateAndPrepareFile: vi.fn().mockResolvedValue({
      isValid: true,
      warnings: []
    }),
    clearWarnings: vi.fn()
  } as FileValidationHookReturn))
}));

vi.mock('./usePrivacyDetection', () => ({
  usePrivacyDetection: vi.fn(() => ({
    showPrivacyDialog: false,
    sensitiveColumns: [],
    privacySuggestions: [],
    fileBasicInfo: null,
    sensitiveDetectionLoading: false,
    pendingFile: null,
    detectSensitiveData: vi.fn().mockResolvedValue({
      success: true,
      sensitiveColumns: [],
      suggestions: [],
      fileInfo: null,
      data: []
    }),
    confirmPrivacy: vi.fn(),
    cancelPrivacy: vi.fn(),
    resetPrivacyState: vi.fn()
  } as PrivacyDetectionHookReturn))
}));

vi.mock('./useColumnAnalysis', () => ({
  useColumnAnalysis: vi.fn(() => ({
    columnProfile: [],
    columnsPreview: [],
    showPreview: false,
    columnAnalysisLoading: false,
    analyzeColumns: vi.fn().mockResolvedValue(undefined),
    retryAnalysis: vi.fn().mockResolvedValue(undefined),
    resetColumnAnalysis: vi.fn(),
    setColumnProfile: vi.fn(),
    setColumnsPreview: vi.fn(),
    setShowPreview: vi.fn()
  } as ColumnAnalysisHookReturn))
}));

vi.mock('./useAnalysisTrigger', () => ({
  useAnalysisTrigger: vi.fn(() => ({
    loading: false,
    autoMode: false,
    setAutoMode: vi.fn(),
    triggerAnalysis: vi.fn().mockResolvedValue(undefined)
  } as AnalysisTriggerHookReturn))
}));

// ===== Import Hooks (必須在 mock 之後) =====

import { useAnalysisStore } from '@/stores/analysisStore';
import type { AppError } from '@/types/errors';

import { usePrivacyDetection } from './usePrivacyDetection';
import { useStep1Logic } from './useStep1Logic';

// ===== 測試資料 =====
const mockParsedData: DataRow[] = [
  { id: 1, name: 'Test User 1', age: 30, category: 'A' },
  { id: 2, name: 'Test User 2', age: 25, category: 'B' },
  { id: 3, name: 'Test User 3', age: 35, category: 'A' }
];

const mockFile = new File(['test content'], 'test.csv', { type: 'text/csv' });

// ===== 測試 =====
describe('useStep1Logic', () => {
  beforeEach(() => {
    // 設置 localStorage mock
    const localStorageMock: Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'clear'> = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true
    });

    // 設置 analysisStore getState
    const storeWithGetState = useAnalysisStore as unknown as {
      getState: () => { file: File | null };
    };
    storeWithGetState.getState = vi.fn(() => ({ file: mockFile }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('初始化', () => {
    it('應該正確初始化所有狀態', () => {
      const { result } = renderHook(() => useStep1Logic());

      expect(result.current.fileName).toBeNull();
      expect(result.current.file).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.dragOver).toBe(false);
      expect(result.current.parsedData).toEqual([]);
      expect(result.current.fill_na).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('檔案處理', () => {
    it('應該處理有效的 CSV 檔案', async () => {
      // 設置 mock 返回值
      const mockUsePrivacyDetection = vi.mocked(usePrivacyDetection);
      mockUsePrivacyDetection.mockReturnValueOnce({
        showPrivacyDialog: false,
        sensitiveColumns: [],
        privacySuggestions: [],
        fileBasicInfo: null,
        sensitiveDetectionLoading: false,
        pendingFile: null,
        detectSensitiveData: vi.fn().mockResolvedValue({
          success: true,
          sensitiveColumns: [],
          suggestions: [],
          fileInfo: null,
          data: mockParsedData
        }),
        confirmPrivacy: vi.fn(),
        cancelPrivacy: vi.fn(),
        resetPrivacyState: vi.fn()
      });

      const { result } = renderHook(() => useStep1Logic());

      // 建立符合型別的事件物件
      const inputElement = document.createElement('input');
      inputElement.type = 'file';
      Object.defineProperty(inputElement, 'files', {
        value: [mockFile],
        writable: false
      });
      
      const event = new Event('change', { bubbles: true }) as unknown as React.ChangeEvent<HTMLInputElement>;
      Object.defineProperty(event, 'target', {
        value: inputElement,
        writable: false
      });

      await act(async () => {
        result.current.handleFileChange(event);
      });

      await waitFor(() => {
        expect(result.current.fileName).toBe('test.csv');
      });
    });
  });
});