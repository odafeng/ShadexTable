// src/lib/__tests__/reportError.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { reportError } from "@/lib/reportError";
import type { AppError } from "@/types/errors";
import { ErrorCode, ErrorContext } from "@/types/errors";
import { createError, CommonErrors } from "@/utils/error";

describe("reportError", () => {
  // Mock crypto.randomUUID for createError
  beforeEach(() => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue("test-uuid-12345");
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 使用 createError 來創建模擬的 AppError，確保結構完整
  const createMockError = (): AppError => {
    return createError(
      ErrorCode.FILE_ERROR,
      ErrorContext.FILE_UPLOAD,
      undefined,
      {
        correlationId: "test-correlation-id",
        customMessage: "測試用戶錯誤",
      },
    );
  };

  describe("使用 sendBeacon", () => {
    it("應該優先使用 sendBeacon 當它可用且成功時", async () => {
      const mockSendBeacon = vi.fn().mockReturnValue(true);
      const mockFetch = vi.fn();

      // Mock navigator.sendBeacon
      Object.defineProperty(global, "navigator", {
        value: { sendBeacon: mockSendBeacon },
        writable: true,
        configurable: true,
      });
      global.fetch = mockFetch;

      const error = createMockError();
      await reportError(error);

      // 應該調用 sendBeacon
      expect(mockSendBeacon).toHaveBeenCalledTimes(1);
      expect(mockSendBeacon).toHaveBeenCalledWith(
        "/api/report-error",
        expect.any(Blob),
      );

      // 不應該調用 fetch
      expect(mockFetch).not.toHaveBeenCalled();

      // 驗證 Blob 內容
      const blobArg = mockSendBeacon.mock.calls[0][1] as Blob;
      expect(blobArg.type).toBe("application/json");

      const text = await blobArg.text();
      const parsed = JSON.parse(text);
      expect(parsed.code).toBe(error.code);
      expect(parsed.correlationId).toBe(error.correlationId);
    });

    it("應該包含額外的資料", async () => {
      const mockSendBeacon = vi.fn().mockReturnValue(true);

      Object.defineProperty(global, "navigator", {
        value: { sendBeacon: mockSendBeacon },
        writable: true,
        configurable: true,
      });

      const error = createMockError();
      const extra = { userId: "user123", component: "FileUploader" };
      await reportError(error, extra);

      const blobArg = mockSendBeacon.mock.calls[0][1] as Blob;
      const text = await blobArg.text();
      const parsed = JSON.parse(text);

      expect(parsed.extra).toEqual(extra);
    });
  });

  describe("回退到 fetch", () => {
    it("應該在 sendBeacon 返回 false 時回退到 fetch", async () => {
      const mockSendBeacon = vi.fn().mockReturnValue(false);
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });

      Object.defineProperty(global, "navigator", {
        value: { sendBeacon: mockSendBeacon },
        writable: true,
        configurable: true,
      });
      global.fetch = mockFetch;

      const error = createMockError();

      await reportError(error);

      // 兩個都應該被調用
      expect(mockSendBeacon).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // 驗證 fetch 調用
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/report-error",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        }),
      );
    });

    it("應該在沒有 sendBeacon 時使用 fetch", async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });

      // 移除 navigator.sendBeacon
      Object.defineProperty(global, "navigator", {
        value: {},
        writable: true,
        configurable: true,
      });
      global.fetch = mockFetch;

      const error = createMockError();
      await reportError(error);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/report-error",
        expect.objectContaining({
          method: "POST",
          keepalive: true,
        }),
      );
    });

    it("應該在 Node 環境中使用 fetch", async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });

      // 模擬 Node 環境（沒有 navigator）
      // @ts-expect-error - 測試目的：模擬 Node 環境
      delete global.navigator;
      global.fetch = mockFetch;

      const error = createMockError();
      await reportError(error);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("錯誤處理", () => {
    it("應該靜默處理 sendBeacon 錯誤", async () => {
      const mockSendBeacon = vi.fn().mockImplementation(() => {
        throw new Error("sendBeacon 失敗");
      });
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });

      Object.defineProperty(global, "navigator", {
        value: { sendBeacon: mockSendBeacon },
        writable: true,
        configurable: true,
      });
      global.fetch = mockFetch;

      const error = createMockError();

      // 不應該拋出錯誤
      await expect(reportError(error)).resolves.toBeUndefined();

      // 當 sendBeacon 拋出錯誤時，整個 try/catch 會捕獲，所以 fetch 不會被調用
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("應該在 sendBeacon 不存在時回退到 fetch", async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });

      // 設置 navigator 但沒有 sendBeacon
      Object.defineProperty(global, "navigator", {
        value: {},
        writable: true,
        configurable: true,
      });
      global.fetch = mockFetch;

      const error = createMockError();

      await reportError(error);

      // 應該使用 fetch
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("應該靜默處理 fetch 錯誤", async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error("fetch 失敗"));

      Object.defineProperty(global, "navigator", {
        value: {},
        writable: true,
        configurable: true,
      });
      global.fetch = mockFetch;

      const error = createMockError();

      // 不應該拋出錯誤
      await expect(reportError(error)).resolves.toBeUndefined();
    });

    it("應該處理 JSON.stringify 錯誤", async () => {
      const mockFetch = vi.fn();

      Object.defineProperty(global, "navigator", {
        value: {},
        writable: true,
        configurable: true,
      });
      global.fetch = mockFetch;

      // 創建一個包含循環引用的錯誤（會導致 JSON.stringify 失敗）
      const error = createMockError();

      // 創建循環引用物件
      const circularRef: Record<string, unknown> = { error };
      circularRef.self = circularRef;

      // 不應該拋出錯誤
      await expect(reportError(error, circularRef)).resolves.toBeUndefined();

      // fetch 不應該被調用（因為 JSON.stringify 失敗）
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("完整的端到端測試", () => {
    it("應該處理完整的錯誤報告流程", async () => {
      const mockSendBeacon = vi.fn().mockReturnValue(true);

      Object.defineProperty(global, "navigator", {
        value: { sendBeacon: mockSendBeacon },
        writable: true,
        configurable: true,
      });

      // 使用 CommonErrors 工具函數
      const error = CommonErrors.fileSizeExceeded(15728640, 10485760);

      const extra = {
        userAgent: "Mozilla/5.0",
        url: "/step1",
        sessionId: "session-123",
      };

      await reportError(error, extra);

      expect(mockSendBeacon).toHaveBeenCalledTimes(1);

      const blobArg = mockSendBeacon.mock.calls[0][1] as Blob;
      const text = await blobArg.text();
      const parsed = JSON.parse(text);

      expect(parsed.code).toBe(ErrorCode.FILE_SIZE_EXCEEDED);
      expect(parsed.extra).toEqual(extra);
    });

    it("應該處理多次連續的錯誤報告", async () => {
      const mockSendBeacon = vi.fn().mockReturnValue(true);

      Object.defineProperty(global, "navigator", {
        value: { sendBeacon: mockSendBeacon },
        writable: true,
        configurable: true,
      });

      const errors = [
        CommonErrors.fileNotSelected(),
        CommonErrors.networkError(),
        CommonErrors.authError(),
      ];

      // 同時報告多個錯誤
      await Promise.all(errors.map((error) => reportError(error)));

      expect(mockSendBeacon).toHaveBeenCalledTimes(3);
    });

    it("應該正確處理不同類型的錯誤詳情", async () => {
      const mockSendBeacon = vi.fn().mockReturnValue(true);

      Object.defineProperty(global, "navigator", {
        value: { sendBeacon: mockSendBeacon },
        writable: true,
        configurable: true,
      });

      // 使用 CommonErrors 和 createError
      const errors: AppError[] = [
        CommonErrors.authTokenMissing(),
        CommonErrors.networkError(),
        CommonErrors.analysisTimeout(),
      ];

      for (const error of errors) {
        await reportError(error);
      }

      expect(mockSendBeacon).toHaveBeenCalledTimes(errors.length);

      // 驗證每個錯誤都被正確序列化
      for (let i = 0; i < errors.length; i++) {
        const blobArg = mockSendBeacon.mock.calls[i][1] as Blob;
        const text = await blobArg.text();
        const parsed = JSON.parse(text);
        expect(parsed.code).toBe(errors[i].code);
      }
    });

    it("應該處理帶有複雜 metadata 的錯誤", async () => {
      const mockSendBeacon = vi.fn().mockReturnValue(true);

      Object.defineProperty(global, "navigator", {
        value: { sendBeacon: mockSendBeacon },
        writable: true,
        configurable: true,
      });

      // 使用 createError 創建帶有複雜 metadata 的錯誤
      const error = createError(
        ErrorCode.DATA_VALIDATION_FAILED,
        ErrorContext.DATA_VALIDATION,
        undefined,
        {
          correlationId: "validation-error-999",
          customMessage: "資料格式不正確",
          details: {
            actualSize: 100,
            maxSize: 1000,
            status: 422,
            responseData: {
              errors: [
                { field: "email", message: "格式錯誤" },
                { field: "phone", message: "號碼無效" },
              ],
            },
          },
          metadata: {
            fileName: "users.xlsx",
            fileSize: 204800,
            userType: "premium",
            step: "step1",
            component: "DataValidator",
            handlerContext: "validation-pipeline",
          },
        },
      );

      const extra = {
        browserInfo: {
          name: "Chrome",
          version: "120.0.0",
          platform: "Windows",
        },
        sessionInfo: {
          duration: 3600,
          pageViews: 15,
        },
      };

      await reportError(error, extra);

      const blobArg = mockSendBeacon.mock.calls[0][1] as Blob;
      const text = await blobArg.text();
      const parsed = JSON.parse(text);

      expect(parsed.code).toBe(ErrorCode.DATA_VALIDATION_FAILED);
      expect(parsed.metadata).toBeDefined();
      expect(parsed.extra).toEqual(extra);
    });
  });

  describe("邊界情況測試", () => {
    it("應該處理空的 extra 參數", async () => {
      const mockSendBeacon = vi.fn().mockReturnValue(true);

      Object.defineProperty(global, "navigator", {
        value: { sendBeacon: mockSendBeacon },
        writable: true,
        configurable: true,
      });

      const error = CommonErrors.fileEmpty();
      await reportError(error, {});

      const blobArg = mockSendBeacon.mock.calls[0][1] as Blob;
      const text = await blobArg.text();
      const parsed = JSON.parse(text);

      expect(parsed.extra).toEqual({});
    });

    it("應該處理 undefined extra 參數", async () => {
      const mockSendBeacon = vi.fn().mockReturnValue(true);

      Object.defineProperty(global, "navigator", {
        value: { sendBeacon: mockSendBeacon },
        writable: true,
        configurable: true,
      });

      const error = CommonErrors.unknownError();
      await reportError(error, undefined);

      const blobArg = mockSendBeacon.mock.calls[0][1] as Blob;
      const text = await blobArg.text();
      const parsed = JSON.parse(text);

      expect(parsed.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(parsed.extra).toBeUndefined();
    });

    it("應該處理最小的 AppError", async () => {
      const mockSendBeacon = vi.fn().mockReturnValue(true);

      Object.defineProperty(global, "navigator", {
        value: { sendBeacon: mockSendBeacon },
        writable: true,
        configurable: true,
      });

      // 使用 createError 創建最小的錯誤
      const minimalError = createError(ErrorCode.UNKNOWN_ERROR);

      await reportError(minimalError);

      const blobArg = mockSendBeacon.mock.calls[0][1] as Blob;
      const text = await blobArg.text();
      const parsed = JSON.parse(text);

      expect(parsed.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(parsed.correlationId).toBeDefined();
      expect(parsed.severity).toBeDefined();
      expect(parsed.action).toBeDefined();
      expect(parsed.canRetry).toBeDefined();
    });

    it("應該處理沒有 details 和 metadata 的錯誤", async () => {
      const mockSendBeacon = vi.fn().mockReturnValue(true);

      Object.defineProperty(global, "navigator", {
        value: { sendBeacon: mockSendBeacon },
        writable: true,
        configurable: true,
      });

      // 使用 createError 創建沒有額外資訊的錯誤
      const simpleError = createError(
        ErrorCode.VALIDATION_ERROR,
        ErrorContext.DATA_VALIDATION,
      );

      await reportError(simpleError);

      const blobArg = mockSendBeacon.mock.calls[0][1] as Blob;
      const text = await blobArg.text();
      const parsed = JSON.parse(text);

      expect(parsed.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(parsed.context).toBe(ErrorContext.DATA_VALIDATION);
      expect(parsed.details).toBeUndefined();
      expect(parsed.metadata).toBeUndefined();
    });
  });
});
