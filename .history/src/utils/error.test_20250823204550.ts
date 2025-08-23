// src/utils/__tests__/error.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  ErrorSeverity,
  type AppError,
  type ErrorDetails,
  type ErrorMetadata,
} from "@/types/errors";
import {
  createError,
  createErrorFromHttp,
  CommonErrors,
  createErrorHandler,
  isAppError,
  extractErrorMessage,
  formatFileSize,
  ErrorCode,
  ErrorContext,
} from "@/utils/error";

describe("Error Utilities", () => {
  // Mock crypto.randomUUID
  const mockUUID = "test-uuid-12345";

  beforeEach(() => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue(mockUUID);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createError", () => {
    it("應該創建基本的 AppError", () => {
      const error = createError(ErrorCode.FILE_ERROR);

      expect(error).toMatchObject({
        code: ErrorCode.FILE_ERROR,
        message: "檔案處理錯誤",
        userMessage: "檔案處理時發生錯誤，請重新選擇檔案",
        context: ErrorContext.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
        correlation_id: mockUUID,
        action: "請重新選擇正確的檔案",
        canRetry: true,
      });
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it("應該使用提供的 context", () => {
      const error = createError(ErrorCode.FILE_ERROR, ErrorContext.FILE_UPLOAD);

      expect(error.context).toBe(ErrorContext.FILE_UPLOAD);
    });

    it("應該使用 ERROR_MESSAGES 中的訊息", () => {
      const error = createError(
        ErrorCode.FILE_FORMAT_UNSUPPORTED,
        ErrorContext.FILE_UPLOAD,
        "file.format_unsupported",
      );

      expect(error.userMessage).toBe(
        "不支援的檔案格式，請選擇 CSV 或 Excel 檔案",
      );
      expect(error.action).toBe("請上傳 .csv、.xls 或 .xlsx 格式的檔案");
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.canRetry).toBe(false);
    });

    it("應該優先使用自定義訊息", () => {
      const customMessage = "自定義錯誤訊息";
      const error = createError(
        ErrorCode.FILE_ERROR,
        ErrorContext.FILE_UPLOAD,
        undefined,
        { customMessage },
      );

      expect(error.message).toBe(customMessage);
      expect(error.userMessage).toBe(customMessage);
    });

    it("應該包含 details 和 metadata", () => {
      const details: ErrorDetails = {
        status: 400,
        responseData: { error: "Bad Request" },
      };
      const metadata: ErrorMetadata = {
        fileName: "test.csv",
        fileSize: 1024,
      };

      const error = createError(
        ErrorCode.FILE_ERROR,
        ErrorContext.FILE_UPLOAD,
        undefined,
        { details, metadata },
      );

      expect(error.details).toEqual(details);
      expect(error.metadata).toEqual(metadata);
    });

    it("應該包含 cause 和 stack", () => {
      const cause = new Error("原始錯誤");
      const error = createError(
        ErrorCode.UNKNOWN_ERROR,
        ErrorContext.UNKNOWN,
        undefined,
        { cause },
      );

      expect(error.cause).toBe(cause);
      expect(error.stack).toBe(cause.stack);
    });

    it("應該使用自定義的 correlation_id", () => {
      const customId = "custom-correlation-id";
      const error = createError(ErrorCode.FILE_ERROR, undefined, undefined, {
        correlation_id: customId,
      });

      expect(error.correlation_id).toBe(customId);
    });
  });

  describe("createErrorFromHttp", () => {
    it("應該處理 400 Bad Request", () => {
      const error = createErrorFromHttp(400);

      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.context).toBe(ErrorContext.DATA_VALIDATION);
      expect(error.userMessage).toBe("請求格式錯誤，請檢查資料格式");
      expect(error.details?.status).toBe(400);
    });

    it("應該處理 401 Unauthorized", () => {
      const error = createErrorFromHttp(401);

      expect(error.code).toBe(ErrorCode.AUTH_ERROR);
      expect(error.context).toBe(ErrorContext.AUTHENTICATION);
      expect(error.userMessage).toBe("沒有權限執行此操作");
    });

    it("應該處理 403 Forbidden", () => {
      const error = createErrorFromHttp(403);

      expect(error.code).toBe(ErrorCode.AUTH_ERROR);
      expect(error.userMessage).toBe("權限不足，無法存取此資源");
    });

    it("應該處理 404 Not Found", () => {
      const error = createErrorFromHttp(404);

      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.userMessage).toBe("請求的資源不存在，請檢查 URL 是否正確");
    });

    it("應該處理 409 Conflict", () => {
      const error = createErrorFromHttp(409);

      expect(error.code).toBe(ErrorCode.DATA_VALIDATION_FAILED);
      expect(error.userMessage).toBe("資料衝突，可能是重複提交或資料已被修改");
    });

    it("應該處理 422 Unprocessable Entity", () => {
      const error = createErrorFromHttp(422);

      expect(error.code).toBe(ErrorCode.DATA_VALIDATION_FAILED);
      expect(error.userMessage).toBe("資料驗證失敗，請檢查輸入內容格式");
    });

    it("應該處理 429 Too Many Requests", () => {
      const error = createErrorFromHttp(429);

      expect(error.code).toBe(ErrorCode.RATE_LIMIT_ERROR);
      expect(error.userMessage).toBe("請求過於頻繁，請稍後重試");
    });

    it("應該處理 5xx 伺服器錯誤", () => {
      const error = createErrorFromHttp(500);

      expect(error.code).toBe(ErrorCode.SERVER_ERROR);
      expect(error.userMessage).toBe("伺服器錯誤 (500)，請稍後重試");
    });

    it("應該處理未知的 HTTP 狀態碼", () => {
      const error = createErrorFromHttp(418); // I'm a teapot

      expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(error.userMessage).toBe("未知的 HTTP 錯誤 (418)");
    });

    it("應該包含 responseData", () => {
      const responseData = { message: "Error details" };
      const error = createErrorFromHttp(
        400,
        undefined,
        undefined,
        responseData,
      );

      expect(error.details?.responseData).toEqual(responseData);
    });

    it("應該使用自定義的 context 和 correlation_id", () => {
      const context = ErrorContext.ANALYSIS;
      const correlation_id = "custom-id";
      const error = createErrorFromHttp(500, context, correlation_id);

      expect(error.context).toBe(context);
      expect(error.correlation_id).toBe(correlation_id);
    });
  });

  describe("CommonErrors", () => {
    describe("檔案相關錯誤", () => {
      it("fileNotSelected 應該創建正確的錯誤", () => {
        const error = CommonErrors.fileNotSelected();

        expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(error.context).toBe(ErrorContext.FILE_UPLOAD);
        expect(error.userMessage).toBe("請先選擇要上傳的檔案");
      });

      it("fileFormatUnsupported 應該創建正確的錯誤", () => {
        const error = CommonErrors.fileFormatUnsupported();

        expect(error.code).toBe(ErrorCode.FILE_FORMAT_UNSUPPORTED);
        expect(error.context).toBe(ErrorContext.FILE_UPLOAD);
        expect(error.userMessage).toBe(
          "不支援的檔案格式，請選擇 CSV 或 Excel 檔案",
        );
      });

      it("fileSizeExceeded 應該包含檔案大小資訊", () => {
        const actualSize = 10485760; // 10MB
        const maxSize = 5242880; // 5MB
        const error = CommonErrors.fileSizeExceeded(actualSize, maxSize);

        expect(error.code).toBe(ErrorCode.FILE_SIZE_EXCEEDED);
        expect(error.userMessage).toBe("檔案大小 10 MB 已超過限制");
        expect(error.details).toEqual({ actualSize, maxSize });
      });

      it("fileEmpty 應該創建正確的錯誤", () => {
        const error = CommonErrors.fileEmpty();

        expect(error.code).toBe(ErrorCode.FILE_EMPTY);
        expect(error.userMessage).toBe("檔案是空的或沒有有效資料");
      });

      it("fileCorrupted 應該創建正確的錯誤", () => {
        const error = CommonErrors.fileCorrupted();

        expect(error.code).toBe(ErrorCode.FILE_CORRUPTED);
        expect(error.context).toBe(ErrorContext.FILE_PROCESSING);
        expect(error.userMessage).toBe("檔案損壞或格式錯誤");
      });
    });

    describe("隱私相關錯誤", () => {
      it("sensitiveDataDetected 應該創建正確的錯誤", () => {
        const error = CommonErrors.sensitiveDataDetected();

        expect(error.code).toBe(ErrorCode.SENSITIVE_DATA_DETECTED);
        expect(error.context).toBe(ErrorContext.PRIVACY_CHECK);
        expect(error.userMessage).toBe("檔案包含敏感資料，無法繼續處理");
      });

      it("privacyAgreementRequired 應該創建正確的錯誤", () => {
        const error = CommonErrors.privacyAgreementRequired();

        expect(error.code).toBe(ErrorCode.PRIVACY_ERROR);
        expect(error.userMessage).toBe("請先同意隱私聲明才能繼續上傳檔案");
      });
    });

    describe("認證相關錯誤", () => {
      it("authTokenMissing 應該創建正確的錯誤", () => {
        const error = CommonErrors.authTokenMissing();

        expect(error.code).toBe(ErrorCode.AUTH_TOKEN_MISSING);
        expect(error.userMessage).toBe("認證失效，請重新登入");
      });

      it("authError 應該支援自定義 context", () => {
        const error = CommonErrors.authError(ErrorContext.ANALYSIS);

        expect(error.code).toBe(ErrorCode.AUTH_ERROR);
        expect(error.context).toBe(ErrorContext.ANALYSIS);
      });

      it("analysisAuthFailed 應該創建正確的錯誤", () => {
        const error = CommonErrors.analysisAuthFailed();

        expect(error.code).toBe(ErrorCode.ANALYSIS_AUTH_FAILED);
        expect(error.context).toBe(ErrorContext.ANALYSIS);
      });
    });

    describe("分析相關錯誤", () => {
      it("analysisTimeout 應該創建正確的錯誤", () => {
        const error = CommonErrors.analysisTimeout();

        expect(error.code).toBe(ErrorCode.ANALYSIS_TIMEOUT);
        expect(error.userMessage).toBe("分析超時，請稍後重試");
        expect(error.canRetry).toBe(true);
      });

      it("analysisFailed 應該支援自定義訊息", () => {
        const customMessage = "自定義分析錯誤";
        const error = CommonErrors.analysisFailed(customMessage);

        expect(error.code).toBe(ErrorCode.ANALYSIS_ERROR);
        expect(error.userMessage).toBe(customMessage);
      });

      it("analysisFailed 應該使用預設訊息當沒有提供自定義訊息時", () => {
        const error = CommonErrors.analysisFailed();

        expect(error.code).toBe(ErrorCode.ANALYSIS_ERROR);
        expect(error.userMessage).toBe("資料分析失敗");
      });

      it("noVariablesSelected 應該支援自定義訊息", () => {
        const error = CommonErrors.noVariablesSelected();
        expect(error.userMessage).toBe("未選擇任何變項");

        const customError = CommonErrors.noVariablesSelected("請選擇分組變項");
        expect(customError.userMessage).toBe("請選擇分組變項");
      });
    });

    describe("資料驗證錯誤", () => {
      it("insufficientData 應該創建正確的錯誤", () => {
        const error = CommonErrors.insufficientData();

        expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(error.userMessage).toBe("資料不足，無法進行分析");
      });

      it("invalidData 應該支援自定義訊息", () => {
        const error = CommonErrors.invalidData();
        expect(error.userMessage).toBe("資料格式無效");

        const customError = CommonErrors.invalidData("日期格式錯誤");
        expect(customError.userMessage).toBe("日期格式錯誤");
      });
    });

    describe("欄位相關錯誤", () => {
      it("columnDetectionFailed 應該創建正確的錯誤", () => {
        const error = CommonErrors.columnDetectionFailed();

        expect(error.code).toBe(ErrorCode.COLUMN_TYPE_DETECTION_FAILED);
        expect(error.userMessage).toBe("欄位類型識別失敗");
      });

      it("noValidColumns 應該創建正確的錯誤", () => {
        const error = CommonErrors.noValidColumns();

        expect(error.code).toBe(ErrorCode.COLUMN_VALIDATION_FAILED);
        expect(error.userMessage).toBe("沒有找到有效的資料欄位");
      });
    });

    describe("網路相關錯誤", () => {
      it("networkError 應該創建正確的錯誤", () => {
        const error = CommonErrors.networkError();

        expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
        expect(error.userMessage).toBe("網路連線失敗");
        expect(error.canRetry).toBe(true);
      });

      it("serverError 應該支援自定義 context", () => {
        const error = CommonErrors.serverError(ErrorContext.ANALYSIS);

        expect(error.code).toBe(ErrorCode.SERVER_ERROR);
        expect(error.context).toBe(ErrorContext.ANALYSIS);
      });

      it("rateLimitError 應該創建正確的錯誤", () => {
        const error = CommonErrors.rateLimitError();

        expect(error.code).toBe(ErrorCode.RATE_LIMIT_ERROR);
        expect(error.userMessage).toBe("請求過於頻繁，請稍後重試");
        expect(error.severity).toBe(ErrorSeverity.LOW);
      });
    });

    describe("通用錯誤", () => {
      it("unknownError 應該包含 cause", () => {
        const cause = new Error("原始錯誤");
        const error = CommonErrors.unknownError(cause);

        expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
        expect(error.cause).toBe(cause);
        expect(error.userMessage).toBe("發生未知錯誤");
      });

      it("unknownError 應該支援自定義訊息", () => {
        const error = CommonErrors.unknownError(undefined, "自定義未知錯誤");

        expect(error.userMessage).toBe("自定義未知錯誤");
      });
    });
  });

  describe("createErrorHandler", () => {
    it("應該處理 AppError", () => {
      const mockHandler = vi.fn();
      const handler = createErrorHandler(mockHandler);

      const appError = CommonErrors.fileNotSelected();
      handler(appError, "test-context");

      expect(mockHandler).toHaveBeenCalledWith(appError, "test-context");
      expect(appError.metadata?.handlerContext).toBe("test-context");
    });

    it("應該處理普通 Error", () => {
      const mockHandler = vi.fn();
      const handler = createErrorHandler(mockHandler);

      const error = new Error("普通錯誤");
      handler(error);

      expect(mockHandler).toHaveBeenCalled();
      const calledError = mockHandler.mock.calls[0][0] as AppError;
      expect(calledError.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(calledError.message).toBe("普通錯誤");
      expect(calledError.cause).toBe(error);
    });

    it("應該處理非 Error 物件", () => {
      const mockHandler = vi.fn();
      const handler = createErrorHandler(mockHandler);

      handler("字串錯誤");

      expect(mockHandler).toHaveBeenCalled();
      const calledError = mockHandler.mock.calls[0][0] as AppError;
      expect(calledError.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(calledError.message).toBe("字串錯誤");
    });

    it("應該根據選項決定是否記錄錯誤", () => {
      const mockHandler = vi.fn();

      // 預設應該記錄
      const handler1 = createErrorHandler(mockHandler);
      handler1(new Error("測試"));
      expect(console.error).toHaveBeenCalled();

      // 清理
      vi.clearAllMocks();

      // shouldLog: false 不應該記錄
      const handler2 = createErrorHandler(mockHandler, { shouldLog: false });
      handler2(new Error("測試"));
      expect(console.error).not.toHaveBeenCalled();
    });

    it("應該添加 context 到 metadata", () => {
      const mockHandler = vi.fn();
      const handler = createErrorHandler(mockHandler);

      const error = CommonErrors.fileNotSelected();
      handler(error, "upload-component");

      expect(error.metadata?.handlerContext).toBe("upload-component");
    });
  });

  describe("isAppError", () => {
    it("應該正確識別 AppError", () => {
      const appError = createError(ErrorCode.FILE_ERROR);
      expect(isAppError(appError)).toBe(true);
    });

    it("應該拒絕普通 Error", () => {
      const error = new Error("普通錯誤");
      expect(isAppError(error)).toBe(false);
    });

    it("應該拒絕缺少必要屬性的物件", () => {
      expect(isAppError({})).toBe(false);
      expect(isAppError({ code: "TEST" })).toBe(false);
      expect(isAppError({ message: "test" })).toBe(false);
      expect(isAppError({ code: "TEST", message: "test" })).toBe(false);
    });

    it("應該拒絕 null 和 undefined", () => {
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
    });

    it("應該拒絕原始型別", () => {
      expect(isAppError("string")).toBe(false);
      expect(isAppError(123)).toBe(false);
      expect(isAppError(true)).toBe(false);
    });
  });

  describe("extractErrorMessage", () => {
    it("應該從 AppError 提取 userMessage", () => {
      const appError = createError(ErrorCode.FILE_ERROR, undefined, undefined, {
        customMessage: "自定義訊息",
      });

      expect(extractErrorMessage(appError)).toBe("自定義訊息");
    });

    it("應該從普通 Error 提取 message", () => {
      const error = new Error("錯誤訊息");
      expect(extractErrorMessage(error)).toBe("錯誤訊息");
    });

    it("應該將其他型別轉換為字串", () => {
      expect(extractErrorMessage("字串錯誤")).toBe("字串錯誤");
      expect(extractErrorMessage(123)).toBe("123");
      expect(extractErrorMessage(true)).toBe("true");
      expect(extractErrorMessage(null)).toBe("null");
      expect(extractErrorMessage(undefined)).toBe("undefined");
    });
  });

  describe("formatFileSize", () => {
    it("應該正確格式化各種檔案大小", () => {
      expect(formatFileSize(0)).toBe("0 Bytes");
      expect(formatFileSize(512)).toBe("512 Bytes");
      expect(formatFileSize(1024)).toBe("1 KB");
      expect(formatFileSize(1536)).toBe("1.5 KB");
      expect(formatFileSize(1048576)).toBe("1 MB");
      expect(formatFileSize(1572864)).toBe("1.5 MB");
      expect(formatFileSize(1073741824)).toBe("1 GB");
      expect(formatFileSize(1610612736)).toBe("1.5 GB");
    });

    it("應該處理大數值", () => {
      expect(formatFileSize(10737418240)).toBe("10 GB");
      expect(formatFileSize(1099511627776)).toBe("1 TB"); // 修正：1024 GB = 1 TB
      expect(formatFileSize(1125899906842624)).toBe("1 PB"); // 新增：測試 PB 級別
    });

    it("應該處理超大數值", () => {
      // 測試超過 PB 的數值，應該以 PB 為單位顯示
      const hugeSizeInBytes = 1152921504606846976; // 1024 PB
      expect(formatFileSize(hugeSizeInBytes)).toBe("1024 PB");
    });
  });

  describe("錯誤嚴重程度", () => {
    it("應該為不同錯誤類型設定正確的嚴重程度", () => {
      const privacyError = createError(ErrorCode.PRIVACY_ERROR);
      expect(privacyError.severity).toBe(ErrorSeverity.HIGH);

      const authError = createError(ErrorCode.AUTH_ERROR);
      expect(authError.severity).toBe(ErrorSeverity.HIGH);

      const serverError = createError(ErrorCode.SERVER_ERROR);
      expect(serverError.severity).toBe(ErrorSeverity.HIGH);

      const fileError = createError(ErrorCode.FILE_ERROR);
      expect(fileError.severity).toBe(ErrorSeverity.MEDIUM);

      const networkError = createError(ErrorCode.NETWORK_ERROR);
      expect(networkError.severity).toBe(ErrorSeverity.LOW);
    });
  });

  describe("錯誤重試設定", () => {
    it("應該為不同錯誤類型設定正確的重試設定", () => {
      const fileFormatError = createError(ErrorCode.FILE_FORMAT_UNSUPPORTED);
      expect(fileFormatError.canRetry).toBe(false);

      const networkError = createError(ErrorCode.NETWORK_ERROR);
      expect(networkError.canRetry).toBe(true);

      const serverError = createError(ErrorCode.SERVER_ERROR);
      expect(serverError.canRetry).toBe(true);

      const analysisTimeout = createError(ErrorCode.ANALYSIS_TIMEOUT);
      expect(analysisTimeout.canRetry).toBe(true);
    });
  });
});
