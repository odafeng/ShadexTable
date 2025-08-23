// src/features/step1/hooks/useFileValidation.test.ts

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ErrorCode, ErrorContext, ErrorSeverity } from '@/types/errors';
import type { AppError } from '@/types/errors';

import { useFileValidation } from './useFileValidation';


// 模擬 useUserLimits 中的 useFileValidation
vi.mock('@/features/auth/hooks/useUserLimits', () => ({
 useFileValidation: vi.fn(() => ({
   validateFile: vi.fn(),
   getFileSizeWarning: vi.fn(),
   checkFileLimits: vi.fn(),
   limits: {
     maxSizeBytes: 10 * 1024 * 1024, // 10MB
     maxRows: 10000,
     maxColumns: 100,
     allowedExtensions: ['.csv', '.xls', '.xlsx'], // 允許的檔案副檔名
   },
 })),
}));

// 匯入模擬模組以存取 mock 函式
import { useFileValidation as useFileValidationLib } from '@/features/auth/hooks/useUserLimits';

describe('useFileValidation', () => {
 // 建立測試檔案的輔助函式
 const createMockFile = (
   name: string,
   size: number,
   type: string = 'text/csv'
 ): File => {
   const content = new Array(size).fill('a').join('');
   return new File([content], name, { type });
 };

 // 預設限制配置
 const defaultLimits = {
   maxSizeBytes: 10 * 1024 * 1024,
   maxRows: 10000,
   maxColumns: 100,
   allowedExtensions: ['.csv', '.xls', '.xlsx'],
 };

 beforeEach(() => {
   vi.clearAllMocks();
 });

 afterEach(() => {
   vi.restoreAllMocks();
 });

 describe('初始狀態', () => {
   it('應該以空警告陣列初始化', () => {
     const { result } = renderHook(() => useFileValidation());

     expect(result.current.fileValidationWarnings).toEqual([]);
     expect(result.current.validateAndPrepareFile).toBeDefined();
     expect(result.current.clearWarnings).toBeDefined();
   });
 });

 describe('validateAndPrepareFile', () => {
   it('應該成功驗證有效的檔案', async () => {
     const mockValidateFile = vi.fn().mockReturnValue({
       isValid: true,
       warnings: [],
       error: undefined,
     });
     const mockGetFileSizeWarning = vi.fn().mockReturnValue(null);

     vi.mocked(useFileValidationLib).mockReturnValue({
       validateFile: mockValidateFile,
       getFileSizeWarning: mockGetFileSizeWarning,
       checkFileLimits: vi.fn(),
       limits: defaultLimits,
     });

     const { result } = renderHook(() => useFileValidation());
     const validFile = createMockFile('測試.csv', 1024);

     let validationResult;
     await act(async () => {
       validationResult = await result.current.validateAndPrepareFile(validFile);
     });

     expect(validationResult).toEqual({
       isValid: true,
       warnings: [],
     });
     expect(mockValidateFile).toHaveBeenCalledWith(validFile);
     expect(mockGetFileSizeWarning).toHaveBeenCalledWith(validFile);
     expect(result.current.fileValidationWarnings).toEqual([]);
   });

   it('應該為無效的檔案格式回傳錯誤', async () => {
     const mockError: AppError = {
       code: ErrorCode.FILE_FORMAT_UNSUPPORTED,
       message: '不支援的檔案格式',
       userMessage: '請選擇 CSV 或 Excel 檔案',
       context: ErrorContext.FILE_UPLOAD,
       severity: ErrorSeverity.MEDIUM,
       correlation_id: '測試-關聯-id',
       timestamp: new Date(),
       action: '請上傳 .csv、.xls 或 .xlsx 格式的檔案',
       canRetry: false,
     };

     const mockValidateFile = vi.fn().mockReturnValue({
       isValid: false,
       error: mockError,
     });

     vi.mocked(useFileValidationLib).mockReturnValue({
       validateFile: mockValidateFile,
       getFileSizeWarning: vi.fn(),
       checkFileLimits: vi.fn(),
       limits: defaultLimits,
     });

     const { result } = renderHook(() => useFileValidation());
     const invalidFile = createMockFile('測試.txt', 1024, 'text/plain');

     let validationResult;
     await act(async () => {
       validationResult = await result.current.validateAndPrepareFile(invalidFile);
     });

     expect(validationResult).toEqual({
       isValid: false,
       warnings: [],
       error: mockError,
     });
     expect(mockValidateFile).toHaveBeenCalledWith(invalidFile);
   });

   it('應該為超過大小限制的檔案回傳錯誤', async () => {
     const mockError: AppError = {
       code: ErrorCode.FILE_SIZE_EXCEEDED,
       message: '檔案大小超過限制',
       userMessage: '檔案大小超過 10MB 限制',
       context: ErrorContext.FILE_UPLOAD,
       severity: ErrorSeverity.MEDIUM,
       correlation_id: '測試-關聯-id',
       timestamp: new Date(),
       action: '請選擇較小的檔案或升級到專業版',
       canRetry: false,
       details: {
         actualSize: 15 * 1024 * 1024,
         maxSize: 10 * 1024 * 1024,
       },
     };

     const mockValidateFile = vi.fn().mockReturnValue({
       isValid: false,
       error: mockError,
     });

     vi.mocked(useFileValidationLib).mockReturnValue({
       validateFile: mockValidateFile,
       getFileSizeWarning: vi.fn(),
       checkFileLimits: vi.fn(),
       limits: defaultLimits,
     });

     const { result } = renderHook(() => useFileValidation());
     const largeFile = createMockFile('大檔案.csv', 15 * 1024 * 1024);

     let validationResult;
     await act(async () => {
       validationResult = await result.current.validateAndPrepareFile(largeFile);
     });

     expect(validationResult).toEqual({
       isValid: false,
       warnings: [],
       error: mockError,
     });
   });

   it('應該為接近限制的檔案新增大小警告', async () => {
     const mockValidateFile = vi.fn().mockReturnValue({
       isValid: true,
       warnings: ['檔案包含大量資料'],
       error: undefined,
     });
     const mockGetFileSizeWarning = vi.fn().mockReturnValue(
       '檔案大小已達限制的 85%，建議檢查檔案內容或考慮升級方案'
     );

     vi.mocked(useFileValidationLib).mockReturnValue({
       validateFile: mockValidateFile,
       getFileSizeWarning: mockGetFileSizeWarning,
       checkFileLimits: vi.fn(),
       limits: defaultLimits,
     });

     const { result } = renderHook(() => useFileValidation());
     const nearLimitFile = createMockFile('接近限制.csv', 8.5 * 1024 * 1024);

     let validationResult;
     await act(async () => {
       validationResult = await result.current.validateAndPrepareFile(nearLimitFile);
     });

     expect(validationResult).toEqual({
       isValid: true,
       warnings: [
         '檔案包含大量資料',
         '檔案大小已達限制的 85%，建議檢查檔案內容或考慮升級方案',
       ],
     });
     expect(result.current.fileValidationWarnings).toEqual([
       '檔案包含大量資料',
       '檔案大小已達限制的 85%，建議檢查檔案內容或考慮升級方案',
     ]);
   });

   it('應該處理驗證警告但沒有大小警告的情況', async () => {
     const mockValidateFile = vi.fn().mockReturnValue({
       isValid: true,
       warnings: ['檔案包含空白欄位', '部分資料格式需要確認'],
       error: undefined,
     });
     const mockGetFileSizeWarning = vi.fn().mockReturnValue(null);

     vi.mocked(useFileValidationLib).mockReturnValue({
       validateFile: mockValidateFile,
       getFileSizeWarning: mockGetFileSizeWarning,
       checkFileLimits: vi.fn(),
       limits: defaultLimits,
     });

     const { result } = renderHook(() => useFileValidation());
     const fileWithWarnings = createMockFile('有警告.csv', 1024);

     let validationResult;
     await act(async () => {
       validationResult = await result.current.validateAndPrepareFile(fileWithWarnings);
     });

     expect(validationResult).toEqual({
       isValid: true,
       warnings: ['檔案包含空白欄位', '部分資料格式需要確認'],
     });
     expect(result.current.fileValidationWarnings).toEqual([
       '檔案包含空白欄位',
       '部分資料格式需要確認',
     ]);
   });

   it('應該處理空檔案錯誤', async () => {
     const mockError: AppError = {
       code: ErrorCode.FILE_EMPTY,
       message: '檔案是空的',
       userMessage: '檔案是空的或沒有有效資料',
       context: ErrorContext.FILE_UPLOAD,
       severity: ErrorSeverity.MEDIUM,
       correlation_id: '測試-關聯-id',
       timestamp: new Date(),
       action: '請檢查檔案內容並重新上傳',
       canRetry: false,
     };

     const mockValidateFile = vi.fn().mockReturnValue({
       isValid: false,
       error: mockError,
     });

     vi.mocked(useFileValidationLib).mockReturnValue({
       validateFile: mockValidateFile,
       getFileSizeWarning: vi.fn(),
       checkFileLimits: vi.fn(),
       limits: defaultLimits,
     });

     const { result } = renderHook(() => useFileValidation());
     const emptyFile = createMockFile('空檔案.csv', 0);

     let validationResult;
     await act(async () => {
       validationResult = await result.current.validateAndPrepareFile(emptyFile);
     });

     expect(validationResult).toEqual({
       isValid: false,
       warnings: [],
       error: mockError,
     });
   });
 });

 describe('clearWarnings', () => {
   it('應該清除所有警告', async () => {
     const mockValidateFile = vi.fn().mockReturnValue({
       isValid: true,
       warnings: ['警告 1', '警告 2'],
       error: undefined,
     });
     const mockGetFileSizeWarning = vi.fn().mockReturnValue('大小警告');

     vi.mocked(useFileValidationLib).mockReturnValue({
       validateFile: mockValidateFile,
       getFileSizeWarning: mockGetFileSizeWarning,
       checkFileLimits: vi.fn(),
       limits: defaultLimits,
     });

     const { result } = renderHook(() => useFileValidation());
     const file = createMockFile('測試.csv', 1024);

     // 首先，建立一些警告
     await act(async () => {
       await result.current.validateAndPrepareFile(file);
     });

     expect(result.current.fileValidationWarnings).toHaveLength(3);

     // 然後清除它們
     act(() => {
       result.current.clearWarnings();
     });

     expect(result.current.fileValidationWarnings).toEqual([]);
   });

   it('應該處理沒有警告時的清除操作', () => {
     const { result } = renderHook(() => useFileValidation());

     expect(result.current.fileValidationWarnings).toEqual([]);

     act(() => {
       result.current.clearWarnings();
     });

     expect(result.current.fileValidationWarnings).toEqual([]);
   });
 });

 describe('邊緣案例', () => {
   it('應該處理未定義的警告', async () => {
     const mockValidateFile = vi.fn().mockReturnValue({
       isValid: true,
       warnings: undefined,
       error: undefined,
     });
     const mockGetFileSizeWarning = vi.fn().mockReturnValue(null);

     vi.mocked(useFileValidationLib).mockReturnValue({
       validateFile: mockValidateFile,
       getFileSizeWarning: mockGetFileSizeWarning,
       checkFileLimits: vi.fn(),
       limits: defaultLimits,
     });

     const { result } = renderHook(() => useFileValidation());
     const file = createMockFile('測試.csv', 1024);

     let validationResult;
     await act(async () => {
       validationResult = await result.current.validateAndPrepareFile(file);
     });

     expect(validationResult).toEqual({
       isValid: true,
       warnings: [],
     });
     expect(result.current.fileValidationWarnings).toEqual([]);
   });

   it('應該循序處理多次驗證', async () => {
     const mockValidateFile = vi.fn()
       .mockReturnValueOnce({
         isValid: true,
         warnings: ['第一個檔案警告'],
         error: undefined,
       })
       .mockReturnValueOnce({
         isValid: true,
         warnings: ['第二個檔案警告'],
         error: undefined,
       });
     
     const mockGetFileSizeWarning = vi.fn()
       .mockReturnValueOnce('第一個大小警告')
       .mockReturnValueOnce(null);

     vi.mocked(useFileValidationLib).mockReturnValue({
       validateFile: mockValidateFile,
       getFileSizeWarning: mockGetFileSizeWarning,
       checkFileLimits: vi.fn(),
       limits: defaultLimits,
     });

     const { result } = renderHook(() => useFileValidation());
     const file1 = createMockFile('測試1.csv', 1024);
     const file2 = createMockFile('測試2.csv', 2048);

     // 第一次驗證
     await act(async () => {
       await result.current.validateAndPrepareFile(file1);
     });

     expect(result.current.fileValidationWarnings).toEqual([
       '第一個檔案警告',
       '第一個大小警告',
     ]);

     // 第二次驗證（應該取代先前的警告）
     await act(async () => {
       await result.current.validateAndPrepareFile(file2);
     });

     expect(result.current.fileValidationWarnings).toEqual([
       '第二個檔案警告',
     ]);
   });

   it('應該處理損壞的檔案錯誤', async () => {
     const mockError: AppError = {
       code: ErrorCode.FILE_CORRUPTED,
       message: '檔案損壞',
       userMessage: '檔案損壞或格式錯誤',
       context: ErrorContext.FILE_PROCESSING,
       severity: ErrorSeverity.MEDIUM,
       correlation_id: '測試-關聯-id',
       timestamp: new Date(),
       action: '請檢查檔案完整性並重新上傳',
       canRetry: false,
     };

     const mockValidateFile = vi.fn().mockReturnValue({
       isValid: false,
       error: mockError,
     });

     vi.mocked(useFileValidationLib).mockReturnValue({
       validateFile: mockValidateFile,
       getFileSizeWarning: vi.fn(),
       checkFileLimits: vi.fn(),
       limits: defaultLimits,
     });

     const { result } = renderHook(() => useFileValidation());
     const corruptedFile = createMockFile('損壞.csv', 1024);

     let validationResult;
     await act(async () => {
       validationResult = await result.current.validateAndPrepareFile(corruptedFile);
     });

     expect(validationResult).toEqual({
       isValid: false,
       warnings: [],
       error: mockError,
     });
     expect(result.current.fileValidationWarnings).toEqual([]);
   });

   it('應該處理缺少必要欄位的檔案', async () => {
     const mockError: AppError = {
       code: ErrorCode.COLUMN_VALIDATION_FAILED,
       message: '欄位驗證失敗',
       userMessage: '檔案缺少必要的欄位',
       context: ErrorContext.DATA_VALIDATION,
       severity: ErrorSeverity.HIGH,
       correlation_id: '測試-關聯-id',
       timestamp: new Date(),
       action: '請確認檔案包含所有必要欄位',
       canRetry: false,
       details: {
         missingColumns: ['編號', '名稱', '日期'],
       },
     };

     const mockValidateFile = vi.fn().mockReturnValue({
       isValid: false,
       error: mockError,
     });

     vi.mocked(useFileValidationLib).mockReturnValue({
       validateFile: mockValidateFile,
       getFileSizeWarning: vi.fn(),
       checkFileLimits: vi.fn(),
       limits: defaultLimits,
     });

     const { result } = renderHook(() => useFileValidation());
     const fileWithMissingColumns = createMockFile('不完整.csv', 1024);

     let validationResult;
     await act(async () => {
       validationResult = await result.current.validateAndPrepareFile(fileWithMissingColumns);
     });

     expect(validationResult).toEqual({
       isValid: false,
       warnings: [],
       error: mockError,
     });
     expect(mockValidateFile).toHaveBeenCalledWith(fileWithMissingColumns);
     expect(result.current.fileValidationWarnings).toEqual([]);
   });
 });

 describe('效能與記憶體', () => {
   it('應該有效率地處理大型警告陣列', async () => {
     const largeWarningsArray = Array.from({ length: 100 }, (_, i) => `警告 ${i + 1}`);
     
     const mockValidateFile = vi.fn().mockReturnValue({
       isValid: true,
       warnings: largeWarningsArray,
       error: undefined,
     });
     const mockGetFileSizeWarning = vi.fn().mockReturnValue('大小警告');

     vi.mocked(useFileValidationLib).mockReturnValue({
       validateFile: mockValidateFile,
       getFileSizeWarning: mockGetFileSizeWarning,
       checkFileLimits: vi.fn(),
       limits: defaultLimits,
     });

     const { result } = renderHook(() => useFileValidation());
     const file = createMockFile('測試.csv', 1024);

     const startTime = performance.now();
     
     await act(async () => {
       await result.current.validateAndPrepareFile(file);
     });

     const endTime = performance.now();
     const executionTime = endTime - startTime;

     expect(executionTime).toBeLessThan(100); // 應該在 100ms 內執行完成
     expect(result.current.fileValidationWarnings).toHaveLength(101); // 100 個警告 + 1 個大小警告
   });

   it('重複清除警告時不應造成記憶體洩漏', async () => {
     const mockValidateFile = vi.fn().mockReturnValue({
       isValid: true,
       warnings: ['警告 1', '警告 2', '警告 3'],
       error: undefined,
     });
     const mockGetFileSizeWarning = vi.fn().mockReturnValue('大小警告');

     vi.mocked(useFileValidationLib).mockReturnValue({
       validateFile: mockValidateFile,
       getFileSizeWarning: mockGetFileSizeWarning,
       checkFileLimits: vi.fn(),
       limits: defaultLimits,
     });

     const { result } = renderHook(() => useFileValidation());
     const file = createMockFile('測試.csv', 1024);

     // 執行多次驗證和清除的循環
     for (let i = 0; i < 10; i++) {
       await act(async () => {
         await result.current.validateAndPrepareFile(file);
       });

       expect(result.current.fileValidationWarnings).toHaveLength(4);

       act(() => {
         result.current.clearWarnings();
       });

       expect(result.current.fileValidationWarnings).toEqual([]);
     }

     // 最終檢查
     expect(result.current.fileValidationWarnings).toEqual([]);
   });
 });

 describe('檔案類型驗證', () => {
   it('應該接受 CSV 檔案', async () => {
     const mockValidateFile = vi.fn().mockReturnValue({
       isValid: true,
       warnings: [],
       error: undefined,
     });

     vi.mocked(useFileValidationLib).mockReturnValue({
       validateFile: mockValidateFile,
       getFileSizeWarning: vi.fn().mockReturnValue(null),
       checkFileLimits: vi.fn(),
       limits: defaultLimits,
     });

     const { result } = renderHook(() => useFileValidation());
     const csvFile = createMockFile('資料.csv', 1024, 'text/csv');

     const validationResult = await result.current.validateAndPrepareFile(csvFile);

     expect(validationResult.isValid).toBe(true);
   });

   it('應該接受 Excel 檔案 (.xlsx)', async () => {
     const mockValidateFile = vi.fn().mockReturnValue({
       isValid: true,
       warnings: [],
       error: undefined,
     });

     vi.mocked(useFileValidationLib).mockReturnValue({
       validateFile: mockValidateFile,
       getFileSizeWarning: vi.fn().mockReturnValue(null),
       checkFileLimits: vi.fn(),
       limits: defaultLimits,
     });

     const { result } = renderHook(() => useFileValidation());
     const xlsxFile = createMockFile('資料.xlsx', 1024, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

     const validationResult = await result.current.validateAndPrepareFile(xlsxFile);

     expect(validationResult.isValid).toBe(true);
   });

   it('應該接受 Excel 檔案 (.xls)', async () => {
     const mockValidateFile = vi.fn().mockReturnValue({
       isValid: true,
       warnings: [],
       error: undefined,
     });

     vi.mocked(useFileValidationLib).mockReturnValue({
       validateFile: mockValidateFile,
       getFileSizeWarning: vi.fn().mockReturnValue(null),
       checkFileLimits: vi.fn(),
       limits: defaultLimits,
     });

     const { result } = renderHook(() => useFileValidation());
     const xlsFile = createMockFile('資料.xls', 1024, 'application/vnd.ms-excel');

     const validationResult = await result.current.validateAndPrepareFile(xlsFile);

     expect(validationResult.isValid).toBe(true);
   });

   it('應該拒絕不支援的檔案類型', async () => {
     const mockError: AppError = {
       code: ErrorCode.FILE_FORMAT_UNSUPPORTED,
       message: '不支援的檔案格式',
       userMessage: '請選擇 CSV 或 Excel 檔案',
       context: ErrorContext.FILE_UPLOAD,
       severity: ErrorSeverity.MEDIUM,
       correlation_id: '測試-關聯-id',
       timestamp: new Date(),
       action: '請上傳 .csv、.xls 或 .xlsx 格式的檔案',
       canRetry: false,
     };

     const mockValidateFile = vi.fn().mockReturnValue({
       isValid: false,
       error: mockError,
     });

     vi.mocked(useFileValidationLib).mockReturnValue({
       validateFile: mockValidateFile,
       getFileSizeWarning: vi.fn(),
       checkFileLimits: vi.fn(),
       limits: defaultLimits,
     });

     const { result } = renderHook(() => useFileValidation());
     const pdfFile = createMockFile('文件.pdf', 1024, 'application/pdf');

     const validationResult = await result.current.validateAndPrepareFile(pdfFile);

     expect(validationResult.isValid).toBe(false);
     expect(validationResult.error?.code).toBe(ErrorCode.FILE_FORMAT_UNSUPPORTED);
   });
 });
});