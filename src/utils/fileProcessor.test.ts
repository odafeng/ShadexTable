// src/utils/__tests__/fileProcessor.test.ts

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  MockedFunction,
} from "vitest";
import * as XLSX from "xlsx";

import { reportError } from "@/lib/reportError";
import { ErrorCode } from "@/utils/error";

import { FileProcessor } from "./fileProcessor";

import type { DataRow } from "./fileProcessor";

// 定義 XLSX 相關型別
interface MockWorkbook {
  SheetNames: string[];
  Sheets: Record<string, MockWorksheet>;
}

interface MockWorksheet {
  "!ref"?: string;
  [key: string]: XLSX.CellObject | string | undefined;
}

interface MockCellObject {
  v: string | number | boolean | Date;
  t: XLSX.ExcelDataType;
  f?: string;
  w?: string;
}

// Mock 外部依賴
vi.mock("xlsx");
vi.mock("@/lib/reportError", () => ({
  reportError: vi.fn(),
}));

// Mock crypto.randomUUID
const mockUUID = "test-uuid-1234";
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => mockUUID),
});

// FileReader Mock 型別
interface MockFileReader {
  readAsArrayBuffer: MockedFunction<(file: Blob) => void>;
  onload: ((event: ProgressEvent<FileReader>) => void) | null;
  onerror: (() => void) | null;
  result: ArrayBuffer | string | null;
}

describe("FileProcessor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("formatFileSize", () => {
    it("應該正確格式化檔案大小", () => {
      expect(FileProcessor.formatFileSize(0)).toBe("0 Bytes");
      expect(FileProcessor.formatFileSize(500)).toBe("500 Bytes");
      expect(FileProcessor.formatFileSize(1024)).toBe("1 KB");
      expect(FileProcessor.formatFileSize(1536)).toBe("1.5 KB");
      expect(FileProcessor.formatFileSize(1048576)).toBe("1 MB");
      expect(FileProcessor.formatFileSize(10485760)).toBe("10 MB");
      expect(FileProcessor.formatFileSize(1073741824)).toBe("1 GB");
    });
  });

  describe("validateFile", () => {
    it("應該驗證有效的 CSV 檔案", () => {
      const file = new File(["test"], "test.csv", { type: "text/csv" });
      Object.defineProperty(file, "size", { value: 1024 });

      const result = FileProcessor.validateFile(file, "GENERAL");

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.warnings).toBeUndefined();
    });

    it("應該驗證有效的 Excel 檔案並返回警告", () => {
      const file = new File(["test"], "test.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      Object.defineProperty(file, "size", { value: 1024 });

      const result = FileProcessor.validateFile(file, "GENERAL");

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.warnings).toContain(
        "建議 Excel 檔案僅包含一個工作表，系統將自動讀取第一個工作表的資料。",
      );
    });

    it("應該拒絕不支援的檔案格式", () => {
      const file = new File(["test"], "test.txt", { type: "text/plain" });
      Object.defineProperty(file, "size", { value: 1024 });

      const result = FileProcessor.validateFile(file, "GENERAL");

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe(ErrorCode.FILE_ERROR);
      expect(result.error?.message).toContain("不支援的檔案格式");
      expect(reportError).toHaveBeenCalled();
    });

    it("應該拒絕超過大小限制的檔案 (一般用戶)", () => {
      const file = new File(["test"], "test.csv", { type: "text/csv" });
      Object.defineProperty(file, "size", { value: 11 * 1024 * 1024 }); // 11MB

      const result = FileProcessor.validateFile(file, "GENERAL");

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("檔案大小");
    });

    it("應該接受專業版用戶的大檔案", () => {
      const file = new File(["test"], "test.csv", { type: "text/csv" });
      Object.defineProperty(file, "size", { value: 20 * 1024 * 1024 }); // 20MB

      const result = FileProcessor.validateFile(file, "PROFESSIONAL");

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("應該拒絕專業版用戶超過25MB的檔案", () => {
      const file = new File(["test"], "test.csv", { type: "text/csv" });
      Object.defineProperty(file, "size", { value: 26 * 1024 * 1024 }); // 26MB

      const result = FileProcessor.validateFile(file, "PROFESSIONAL");

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("應該拒絕空檔案", () => {
      const file = new File([""], "test.csv", { type: "text/csv" });
      Object.defineProperty(file, "size", { value: 5 }); // 小於10 bytes

      const result = FileProcessor.validateFile(file, "GENERAL");

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("檔案過小");
    });

    it("應該處理無效的檔案輸入", () => {
      // 測試 undefined/null 輸入
      const result1 = FileProcessor.validateFile(
        undefined as unknown as File,
        "GENERAL",
      );
      expect(result1.isValid).toBe(false);
      expect(result1.error).toBeDefined();

      const result2 = FileProcessor.validateFile(
        null as unknown as File,
        "GENERAL",
      );
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBeDefined();

      // 測試非 File 物件
      const result3 = FileProcessor.validateFile({} as File, "GENERAL");
      expect(result3.isValid).toBe(false);
      expect(result3.error).toBeDefined();
    });
  });

  describe("excelDateToJSDate", () => {
    it("應該正確轉換 Excel 日期", () => {
      // Excel 日期 44927 = 2023-01-01
      const date = FileProcessor.excelDateToJSDate(44927);
      expect(date.getFullYear()).toBe(2023);
      expect(date.getMonth()).toBe(0); // January
      expect(date.getDate()).toBe(1);
    });

    it("應該正確轉換另一個 Excel 日期", () => {
      // Excel 日期 45292 = 2024-01-01
      const date = FileProcessor.excelDateToJSDate(45292);
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(1);
    });
  });

  describe("getFileBasicInfo", () => {
    it("應該正確讀取檔案基本資訊", async () => {
      const mockFile = new File(["test"], "test.xlsx");
      const mockWorkbook: MockWorkbook = {
        SheetNames: ["Sheet1"],
        Sheets: {
          Sheet1: {
            "!ref": "A1:C2",
            A1: { v: "Column1", t: "s" } as MockCellObject,
            B1: { v: "Column2", t: "s" } as MockCellObject,
            C1: { v: "Column3", t: "s" } as MockCellObject,
          },
        },
      };

      vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as XLSX.WorkBook);
      vi.mocked(XLSX.utils.decode_range).mockReturnValue({
        s: { r: 0, c: 0 },
        e: { r: 1, c: 2 },
      } as XLSX.Range);
      vi.mocked(XLSX.utils.encode_cell).mockImplementation(
        ({ c }: { r: number; c: number }) => {
          const cols = ["A1", "B1", "C1"];
          return cols[c];
        },
      );

      // Mock FileReader
      const mockFileReader: MockFileReader = {
        readAsArrayBuffer: vi.fn(),
        onload: null,
        onerror: null,
        result: new ArrayBuffer(8),
      };

      vi.spyOn(window, "FileReader").mockImplementation(
        () => mockFileReader as unknown as FileReader,
      );

      const promise = FileProcessor.getFileBasicInfo(mockFile);

      // 觸發 onload
      setTimeout(() => {
        if (mockFileReader.onload) {
          const event = {
            target: { result: new ArrayBuffer(8) },
          } as ProgressEvent<FileReader>;
          mockFileReader.onload(event);
        }
      }, 0);

      const result = await promise;

      expect(result.columns).toEqual(["Column1", "Column2", "Column3"]);
      expect(result.hasMultipleSheets).toBe(false);
      expect(result.error).toBeUndefined();
    });

    it("應該處理多個工作表", async () => {
      const mockFile = new File(["test"], "test.xlsx");
      const mockWorkbook: MockWorkbook = {
        SheetNames: ["Sheet1", "Sheet2"],
        Sheets: {
          Sheet1: {
            "!ref": "A1:B1",
            A1: { v: "Column1", t: "s" } as MockCellObject,
            B1: { v: "Column2", t: "s" } as MockCellObject,
          },
          Sheet2: {},
        },
      };

      vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as XLSX.WorkBook);
      vi.mocked(XLSX.utils.decode_range).mockReturnValue({
        s: { r: 0, c: 0 },
        e: { r: 0, c: 1 },
      } as XLSX.Range);
      vi.mocked(XLSX.utils.encode_cell).mockImplementation(
        ({ c }: { r: number; c: number }) => {
          const cols = ["A1", "B1"];
          return cols[c];
        },
      );

      const mockFileReader: MockFileReader = {
        readAsArrayBuffer: vi.fn(),
        onload: null,
        onerror: null,
        result: new ArrayBuffer(8),
      };

      vi.spyOn(window, "FileReader").mockImplementation(
        () => mockFileReader as unknown as FileReader,
      );

      const promise = FileProcessor.getFileBasicInfo(mockFile);

      setTimeout(() => {
        if (mockFileReader.onload) {
          const event = {
            target: { result: new ArrayBuffer(8) },
          } as ProgressEvent<FileReader>;
          mockFileReader.onload(event);
        }
      }, 0);

      const result = await promise;

      expect(result.hasMultipleSheets).toBe(true);
    });

    it("應該處理空檔案", async () => {
      const mockFile = new File([""], "test.xlsx");
      const mockWorkbook: MockWorkbook = {
        SheetNames: [],
        Sheets: {},
      };

      vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as XLSX.WorkBook);

      const mockFileReader: MockFileReader = {
        readAsArrayBuffer: vi.fn(),
        onload: null,
        onerror: null,
        result: new ArrayBuffer(0),
      };

      vi.spyOn(window, "FileReader").mockImplementation(
        () => mockFileReader as unknown as FileReader,
      );

      const promise = FileProcessor.getFileBasicInfo(mockFile);

      setTimeout(() => {
        if (mockFileReader.onload) {
          const event = {
            target: { result: new ArrayBuffer(0) },
          } as ProgressEvent<FileReader>;
          mockFileReader.onload(event);
        }
      }, 0);

      const result = await promise;

      expect(result.columns).toEqual([]);
      expect(result.error).toBeDefined();
    });

    it("應該處理讀取錯誤", async () => {
      const mockFile = new File(["test"], "test.xlsx");

      const mockFileReader: MockFileReader = {
        readAsArrayBuffer: vi.fn(),
        onload: null,
        onerror: null,
        result: null,
      };

      vi.spyOn(window, "FileReader").mockImplementation(
        () => mockFileReader as unknown as FileReader,
      );

      const promise = FileProcessor.getFileBasicInfo(mockFile);

      setTimeout(() => {
        if (mockFileReader.onerror) {
          mockFileReader.onerror();
        }
      }, 0);

      const result = await promise;

      expect(result.columns).toEqual([]);
      expect(result.error).toBeDefined();
    });
  });

  describe("processFile", () => {
    it("應該正確處理有效的檔案", async () => {
      const mockFile = new File(["test"], "test.xlsx");
      Object.defineProperty(mockFile, "size", { value: 4 });

      const mockWorkbook: MockWorkbook = {
        SheetNames: ["Sheet1"],
        Sheets: {
          Sheet1: {},
        },
      };
      const mockData: DataRow[] = [
        { Name: "John", Age: 30, City: "Taipei" },
        { Name: "Jane", Age: 25, City: "Kaohsiung" },
      ];

      vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as XLSX.WorkBook);
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockData);

      const mockFileReader: MockFileReader = {
        readAsArrayBuffer: vi.fn(),
        onload: null,
        onerror: null,
        result: new ArrayBuffer(8),
      };

      vi.spyOn(window, "FileReader").mockImplementation(
        () => mockFileReader as unknown as FileReader,
      );

      const promise = FileProcessor.processFile(mockFile, "GENERAL");

      setTimeout(() => {
        if (mockFileReader.onload) {
          const event = {
            target: { result: new ArrayBuffer(8) },
          } as ProgressEvent<FileReader>;
          mockFileReader.onload(event);
        }
      }, 0);

      const result = await promise;

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({ Name: "John", Age: 30, City: "Taipei" });
      expect(result.fileInfo).toEqual({
        name: "test.xlsx",
        size: 4,
        rows: 2,
        columns: 3,
        hasMultipleSheets: false,
      });
      expect(result.error).toBeUndefined();
    });

    it("應該拒絕超過行數限制的檔案", async () => {
      const mockFile = new File(["test"], "test.xlsx");
      const mockWorkbook: MockWorkbook = {
        SheetNames: ["Sheet1"],
        Sheets: {
          Sheet1: {},
        },
      };

      // 創建超過限制的資料
      const mockData: DataRow[] = Array(50001)
        .fill(null)
        .map((_, i) => ({
          ID: i,
          Name: `User${i}`,
        }));

      vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as XLSX.WorkBook);
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockData);

      const mockFileReader: MockFileReader = {
        readAsArrayBuffer: vi.fn(),
        onload: null,
        onerror: null,
        result: new ArrayBuffer(8),
      };

      vi.spyOn(window, "FileReader").mockImplementation(
        () => mockFileReader as unknown as FileReader,
      );

      const promise = FileProcessor.processFile(mockFile, "GENERAL");

      setTimeout(() => {
        if (mockFileReader.onload) {
          const event = {
            target: { result: new ArrayBuffer(8) },
          } as ProgressEvent<FileReader>;
          mockFileReader.onload(event);
        }
      }, 0);

      const result = await promise;

      expect(result.data).toEqual([]);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("資料列數");
    });

    it("應該拒絕超過欄位限制的檔案", async () => {
      const mockFile = new File(["test"], "test.xlsx");
      const mockWorkbook: MockWorkbook = {
        SheetNames: ["Sheet1"],
        Sheets: {
          Sheet1: {},
        },
      };

      // 創建超過欄位限制的資料
      const mockData: DataRow[] = [{}];
      for (let i = 0; i < 101; i++) {
        mockData[0][`Column${i}`] = `Value${i}`;
      }

      vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as XLSX.WorkBook);
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockData);

      const mockFileReader: MockFileReader = {
        readAsArrayBuffer: vi.fn(),
        onload: null,
        onerror: null,
        result: new ArrayBuffer(8),
      };

      vi.spyOn(window, "FileReader").mockImplementation(
        () => mockFileReader as unknown as FileReader,
      );

      const promise = FileProcessor.processFile(mockFile, "GENERAL");

      setTimeout(() => {
        if (mockFileReader.onload) {
          const event = {
            target: { result: new ArrayBuffer(8) },
          } as ProgressEvent<FileReader>;
          mockFileReader.onload(event);
        }
      }, 0);

      const result = await promise;

      expect(result.data).toEqual([]);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("欄位數量");
    });

    it("應該處理專業版用戶的大檔案", async () => {
      const mockFile = new File(["test"], "test.xlsx");
      Object.defineProperty(mockFile, "size", { value: 4 });

      const mockWorkbook: MockWorkbook = {
        SheetNames: ["Sheet1"],
        Sheets: {
          Sheet1: {},
        },
      };

      // 創建符合專業版限制的資料
      const mockData: DataRow[] = Array(80000)
        .fill(null)
        .map((_, i) => ({
          ID: i,
          Name: `User${i}`,
        }));

      vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as XLSX.WorkBook);
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockData);

      const mockFileReader: MockFileReader = {
        readAsArrayBuffer: vi.fn(),
        onload: null,
        onerror: null,
        result: new ArrayBuffer(8),
      };

      vi.spyOn(window, "FileReader").mockImplementation(
        () => mockFileReader as unknown as FileReader,
      );

      const promise = FileProcessor.processFile(mockFile, "PROFESSIONAL");

      setTimeout(() => {
        if (mockFileReader.onload) {
          const event = {
            target: { result: new ArrayBuffer(8) },
          } as ProgressEvent<FileReader>;
          mockFileReader.onload(event);
        }
      }, 0);

      const result = await promise;

      expect(result.data).toHaveLength(80000);
      expect(result.error).toBeUndefined();
    });
  });

  describe("normalizeData", () => {
    it("應該標準化不一致的資料列", () => {
      const input: DataRow[] = [
        { Name: "John", Age: 30, City: "Taipei" },
        { Name: "Jane", Age: 25 }, // 缺少 City
        { Name: "Bob", City: "Taichung" }, // 缺少 Age
      ];

      const result = FileProcessor.normalizeData(input);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ Name: "John", Age: 30, City: "Taipei" });
      expect(result[1]).toEqual({ Name: "Jane", Age: 25, City: "" });
      expect(result[2]).toEqual({ Name: "Bob", Age: "", City: "Taichung" });
    });

    it("應該處理空陣列", () => {
      const result = FileProcessor.normalizeData([]);
      expect(result).toEqual([]);
    });

    it("應該處理所有列都有相同欄位的情況", () => {
      const input: DataRow[] = [
        { A: 1, B: 2, C: 3 },
        { A: 4, B: 5, C: 6 },
      ];

      const result = FileProcessor.normalizeData(input);

      expect(result).toEqual(input);
    });
  });

  describe("formatDisplayValue", () => {
    it("應該格式化 Excel 日期數值", () => {
      const result = FileProcessor.formatDisplayValue(44927); // 2023-01-01
      expect(result).toMatch(/1\/1\/2023|2023\/1\/1/); // 依據 locale 可能有不同格式
    });

    it("應該格式化 Date 物件", () => {
      const date = new Date(2023, 0, 1);
      const result = FileProcessor.formatDisplayValue(date);
      expect(result).toMatch(/1\/1\/2023|2023\/1\/1/);
    });

    it("應該保留一般數值", () => {
      expect(FileProcessor.formatDisplayValue(100)).toBe(100);
      expect(FileProcessor.formatDisplayValue(19999)).toBe(19999);
      expect(FileProcessor.formatDisplayValue(60001)).toBe(60001);
    });

    it("應該處理字串", () => {
      expect(FileProcessor.formatDisplayValue("test")).toBe("test");
    });

    it("應該處理布林值", () => {
      expect(FileProcessor.formatDisplayValue(true)).toBe(true);
      expect(FileProcessor.formatDisplayValue(false)).toBe(false);
    });

    it("應該處理 null 和 undefined", () => {
      expect(FileProcessor.formatDisplayValue(null)).toBe("");
      expect(
        FileProcessor.formatDisplayValue(undefined as unknown as null),
      ).toBe("");
    });
  });

  describe("validateAndProcess", () => {
    it("應該先驗證再處理檔案", async () => {
      const mockFile = new File(["test"], "test.xlsx");
      Object.defineProperty(mockFile, "size", { value: 1024 });

      const mockWorkbook: MockWorkbook = {
        SheetNames: ["Sheet1"],
        Sheets: {
          Sheet1: {},
        },
      };
      const mockData: DataRow[] = [{ Name: "John", Age: 30 }];

      vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as XLSX.WorkBook);
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockData);

      const mockFileReader: MockFileReader = {
        readAsArrayBuffer: vi.fn(),
        onload: null,
        onerror: null,
        result: new ArrayBuffer(8),
      };

      vi.spyOn(window, "FileReader").mockImplementation(
        () => mockFileReader as unknown as FileReader,
      );

      const promise = FileProcessor.validateAndProcess(mockFile);

      setTimeout(() => {
        if (mockFileReader.onload) {
          const event = {
            target: { result: new ArrayBuffer(8) },
          } as ProgressEvent<FileReader>;
          mockFileReader.onload(event);
        }
      }, 0);

      const result = await promise;

      expect(result.data).toHaveLength(1);
      expect(result.warnings).toContain(
        "建議 Excel 檔案僅包含一個工作表，系統將自動讀取第一個工作表的資料。",
      );
      expect(result.error).toBeUndefined();
    });

    it("應該在驗證失敗時返回錯誤", async () => {
      const mockFile = new File(["test"], "test.txt");
      Object.defineProperty(mockFile, "size", { value: 1024 });

      const result = await FileProcessor.validateAndProcess(mockFile);

      expect(result.data).toEqual([]);
      expect(result.error).toBeDefined();
    });
  });

  describe("getUserLimits", () => {
    it("應該返回一般用戶限制", () => {
      const limits = FileProcessor.getUserLimits("GENERAL");

      expect(limits.maxSizeBytes).toBe(10 * 1024 * 1024);
      expect(limits.maxRows).toBe(50000);
      expect(limits.maxColumns).toBe(100);
      expect(limits.allowedExtensions).toEqual([".csv", ".xls", ".xlsx"]);
    });

    it("應該返回專業版用戶限制", () => {
      const limits = FileProcessor.getUserLimits("PROFESSIONAL");

      expect(limits.maxSizeBytes).toBe(25 * 1024 * 1024);
      expect(limits.maxRows).toBe(100000);
      expect(limits.maxColumns).toBe(200);
      expect(limits.allowedExtensions).toEqual([".csv", ".xls", ".xlsx"]);
    });
  });

  describe("checkFileLimits", () => {
    it("應該檢查檔案是否符合限制", () => {
      const file = new File(["test"], "test.csv");
      Object.defineProperty(file, "size", { value: 1024 });

      const result = FileProcessor.checkFileLimits(file, undefined, "GENERAL");

      expect(result.valid).toBe(true);
      expect(result.violations).toEqual([]);
    });

    it("應該檢測多個違規項目", () => {
      const file = new File(["test"], "test.txt");
      Object.defineProperty(file, "size", { value: 11 * 1024 * 1024 });

      const result = FileProcessor.checkFileLimits(file, undefined, "GENERAL");

      expect(result.valid).toBe(false);
      expect(result.violations).toHaveLength(2);
      expect(result.violations[0]).toContain("不支援的檔案格式");
      expect(result.violations[1]).toContain("檔案大小");
    });

    it("應該使用自訂限制", () => {
      const file = new File(["test"], "test.csv");
      Object.defineProperty(file, "size", { value: 5 * 1024 * 1024 });

      const customLimits = {
        maxSizeBytes: 1 * 1024 * 1024, // 1MB
      };

      const result = FileProcessor.checkFileLimits(
        file,
        customLimits,
        "GENERAL",
      );

      expect(result.valid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toContain("檔案大小");
    });

    it("應該檢測空檔案", () => {
      const file = new File([""], "test.csv");
      Object.defineProperty(file, "size", { value: 5 });

      const result = FileProcessor.checkFileLimits(file, undefined, "GENERAL");

      expect(result.valid).toBe(false);
      expect(result.violations).toContain("檔案過小，可能是空檔案");
    });
  });
});
