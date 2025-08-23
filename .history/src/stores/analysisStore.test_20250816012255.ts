// stores/__tests__/analysisStore.test.ts
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

import { useAnalysisStore } from "./analysisStore";

import type { DataRow, AnalysisResult } from "./analysisStore";

// Mock zustand persist with proper typing
vi.mock("zustand/middleware", async () => {
  const actual = await vi.importActual("zustand/middleware");
  return {
    ...(actual as typeof actual),
    persist:
      <T, U>(config: (set: U, get: U, api: U) => T) =>
      (set: U, get: U, api: U) =>
        config(set, get, api),
  };
});

describe("AnalysisStore", () => {
  // 在每個測試前重置 store
  beforeEach(() => {
    const { result } = renderHook(() => useAnalysisStore());
    act(() => {
      result.current.resetAll();
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("檔案狀態", () => {
    it("應該正確設定檔案", () => {
      const { result } = renderHook(() => useAnalysisStore());
      const mockFile = new File(["test content"], "test.csv", {
        type: "text/csv",
      });

      act(() => {
        result.current.setFile(mockFile);
      });

      expect(result.current.file).toBe(mockFile);
      expect(result.current.fileName).toBe("test.csv");
      expect(result.current.fileSize).toBe(mockFile.size);
      expect(result.current.uploadedAt).toBeTruthy();
      expect(result.current.isDirty).toBe(true);
    });

    it("設定 null 時應該清除檔案", () => {
      const { result } = renderHook(() => useAnalysisStore());
      const mockFile = new File(["test"], "test.csv");

      act(() => {
        result.current.setFile(mockFile);
        result.current.setFile(null);
      });

      expect(result.current.file).toBeNull();
      expect(result.current.fileName).toBe("");
      expect(result.current.fileSize).toBe(0);
      expect(result.current.uploadedAt).toBeNull();
    });

    it("應該設定解析資料並更新資料形狀", () => {
      const { result } = renderHook(() => useAnalysisStore());
      const mockData: DataRow[] = [
        { id: 1, name: "Alice", age: 30 },
        { id: 2, name: "Bob", age: 25 },
      ];

      act(() => {
        result.current.setParsedData(mockData);
      });

      expect(result.current.parsedData).toEqual(mockData);
      expect(result.current.dataShape).toEqual({ rows: 2, columns: 3 });
      expect(result.current.isDirty).toBe(true);
    });

    it("應該正確處理空資料", () => {
      const { result } = renderHook(() => useAnalysisStore());

      act(() => {
        result.current.setParsedData([]);
      });

      expect(result.current.dataShape).toEqual({ rows: 0, columns: 0 });
    });

    it("應該清除所有檔案資料", () => {
      const { result } = renderHook(() => useAnalysisStore());
      const mockFile = new File(["test"], "test.csv");
      const mockData: DataRow[] = [{ id: 1, value: "test" }];

      act(() => {
        result.current.setFile(mockFile);
        result.current.setParsedData(mockData);
        result.current.clearFileData();
      });

      expect(result.current.file).toBeNull();
      expect(result.current.parsedData).toEqual([]);
      expect(result.current.dataShape).toEqual({ rows: 0, columns: 0 });
    });
  });

  describe("變數狀態", () => {
    it("應該設定群組變數", () => {
      const { result } = renderHook(() => useAnalysisStore());

      act(() => {
        result.current.setGroupVar("gender");
      });

      expect(result.current.groupVar).toBe("gender");
      expect(result.current.isDirty).toBe(true);
    });

    it("應該設定類別變數", () => {
      const { result } = renderHook(() => useAnalysisStore());
      const catVars = ["category1", "category2"];

      act(() => {
        result.current.setCatVars(catVars);
      });

      expect(result.current.catVars).toEqual(catVars);
      expect(result.current.isDirty).toBe(true);
    });

    it("應該設定連續變數", () => {
      const { result } = renderHook(() => useAnalysisStore());
      const contVars = ["age", "salary"];

      act(() => {
        result.current.setContVars(contVars);
      });

      expect(result.current.contVars).toEqual(contVars);
      expect(result.current.isDirty).toBe(true);
    });

    it("應該在類別之間切換變數", () => {
      const { result } = renderHook(() => useAnalysisStore());

      act(() => {
        result.current.setCatVars(["var1", "var2"]);
        result.current.setContVars(["var3"]);
      });

      // 將 var1 從 categorical 移到 continuous
      act(() => {
        result.current.toggleVariable("var1", "cont");
      });

      expect(result.current.catVars).toEqual(["var2"]);
      expect(result.current.contVars).toEqual(["var3", "var1"]);

      // 將 var1 移到 excluded
      act(() => {
        result.current.toggleVariable("var1", "excluded");
      });

      expect(result.current.contVars).toEqual(["var3"]);
      expect(result.current.excludedVars).toEqual(["var1"]);
    });

    it("應該設定填補缺失值和插補方法", () => {
      const { result } = renderHook(() => useAnalysisStore());

      act(() => {
        result.current.setFillNA(true);
        result.current.setImputationMethod("mean");
      });

      expect(result.current.fillNA).toBe(true);
      expect(result.current.imputationMethod).toBe("mean");
    });

    it("應該重置所有變數", () => {
      const { result } = renderHook(() => useAnalysisStore());

      act(() => {
        result.current.setGroupVar("group");
        result.current.setCatVars(["cat1"]);
        result.current.setContVars(["cont1"]);
        result.current.setFillNA(true);
        result.current.resetVariables();
      });

      expect(result.current.groupVar).toBe("");
      expect(result.current.catVars).toEqual([]);
      expect(result.current.contVars).toEqual([]);
      expect(result.current.fillNA).toBe(false);
      expect(result.current.imputationMethod).toBe("none");
    });
  });

  describe("欄位狀態", () => {
    it("應該設定欄位類型", () => {
      const { result } = renderHook(() => useAnalysisStore());
      const columnTypes = [
        { column: "id", suggested_type: "id", uniqueCount: 10 },
        { column: "name", suggested_type: "categorical", uniqueCount: 8 },
      ];

      act(() => {
        result.current.setColumnTypes(columnTypes);
      });

      expect(result.current.columnTypes).toEqual(columnTypes);
    });

    it("應該管理欄位分析載入狀態", () => {
      const { result } = renderHook(() => useAnalysisStore());

      act(() => {
        result.current.setColumnAnalysisLoading(true);
        result.current.setColumnAnalysisProgress(50);
      });

      expect(result.current.columnAnalysisLoading).toBe(true);
      expect(result.current.columnAnalysisProgress).toBe(50);

      act(() => {
        result.current.setColumnAnalysisLoading(false);
      });

      expect(result.current.columnAnalysisLoading).toBe(false);
      expect(result.current.columnAnalysisProgress).toBe(0);
    });

    it("應該管理欄位錯誤", () => {
      const { result } = renderHook(() => useAnalysisStore());

      act(() => {
        result.current.setColumnError("column1", "錯誤 1");
        result.current.setColumnError("column2", "錯誤 2");
      });

      expect(result.current.columnErrors).toEqual({
        column1: "錯誤 1",
        column2: "錯誤 2",
      });

      act(() => {
        result.current.clearColumnErrors();
      });

      expect(result.current.columnErrors).toEqual({});
    });

    it("應該清除所有欄位資料", () => {
      const { result } = renderHook(() => useAnalysisStore());

      act(() => {
        result.current.setColumnTypes([
          { column: "test", suggested_type: "categorical" },
        ]);
        result.current.setShowPreview(true);
        result.current.setColumnAnalysisProgress(50);
        result.current.clearColumnData();
      });

      expect(result.current.columnTypes).toEqual([]);
      expect(result.current.showPreview).toBe(false);
      expect(result.current.columnAnalysisProgress).toBe(0);
    });
  });

  describe("結果狀態", () => {
    it("應該設定結果表格並更新當前結果", () => {
      const { result } = renderHook(() => useAnalysisStore());
      const mockTable: DataRow[] = [
        { group: "A", count: 10 },
        { group: "B", count: 20 },
      ];

      act(() => {
        result.current.setResultTable(mockTable);
      });

      expect(result.current.resultTable).toEqual(mockTable);
      expect(result.current.currentResult).toBeTruthy();
      expect(result.current.currentResult?.table).toEqual(mockTable);
      expect(result.current.currentResult?.timestamp).toBeTruthy();
    });

    it("應該將結果加入歷史紀錄並限制數量", () => {
      const { result } = renderHook(() => useAnalysisStore());
      const mockResults: AnalysisResult[] = Array.from(
        { length: 12 },
        (_, i) => ({
          table: [{ id: i }],
          timestamp: Date.now() + i,
        }),
      );

      act(() => {
        mockResults.forEach((r) => result.current.addToHistory(r));
      });

      // 應該只保留最近 10 筆
      expect(result.current.resultHistory.length).toBe(10);
      expect(result.current.resultHistory[0]).toEqual(mockResults[2]);
      expect(result.current.resultHistory[9]).toEqual(mockResults[11]);
    });

    it("應該設定群組計數", () => {
      const { result } = renderHook(() => useAnalysisStore());
      const counts = { groupA: 10, groupB: 20, groupC: 15 };

      act(() => {
        result.current.setGroupCounts(counts);
      });

      expect(result.current.groupCounts).toEqual(counts);
    });

    it("應該管理匯出設定", () => {
      const { result } = renderHook(() => useAnalysisStore());

      act(() => {
        result.current.setExportFormat("pdf");
        result.current.setIsExporting(true);
      });

      expect(result.current.exportFormat).toBe("pdf");
      expect(result.current.isExporting).toBe(true);
    });

    it("應該清除結果", () => {
      const { result } = renderHook(() => useAnalysisStore());

      act(() => {
        result.current.setResultTable([{ id: 1 }]);
        result.current.setGroupCounts({ A: 10 });
        result.current.clearResults();
      });

      expect(result.current.resultTable).toEqual([]);
      expect(result.current.currentResult).toBeNull();
      expect(result.current.groupCounts).toEqual({});
    });
  });

  describe("自動分析狀態", () => {
    it("應該設定自動分析結果", () => {
      const { result } = renderHook(() => useAnalysisStore());
      const mockResult = {
        success: true,
        group_var: "gender",
        cat_vars: ["category"],
        cont_vars: ["age"],
        confidence: 0.95,
      };

      act(() => {
        result.current.setAutoAnalysisResult(mockResult);
      });

      expect(result.current.autoAnalysisResult).toEqual(mockResult);
    });

    it("應該管理自動分析設定", () => {
      const { result } = renderHook(() => useAnalysisStore());

      act(() => {
        result.current.setSkipManualStep(true);
        result.current.setAutoAnalysisMode("full");
        result.current.setAiModel("claude");
      });

      expect(result.current.skipManualStep).toBe(true);
      expect(result.current.autoAnalysisMode).toBe("full");
      expect(result.current.aiModel).toBe("claude");
    });

    it("應該清除自動分析", () => {
      const { result } = renderHook(() => useAnalysisStore());

      act(() => {
        result.current.setAutoAnalysisResult({ success: true });
        result.current.setSkipManualStep(true);
        result.current.clearAutoAnalysis();
      });

      expect(result.current.autoAnalysisResult).toBeNull();
      expect(result.current.skipManualStep).toBe(false);
    });
  });

  describe("UI 狀態", () => {
    it("應該管理當前步驟", () => {
      const { result } = renderHook(() => useAnalysisStore());

      act(() => {
        result.current.setCurrentStep(2);
      });

      expect(result.current.currentStep).toBe(2);

      act(() => {
        result.current.setCurrentStep(3);
      });

      expect(result.current.currentStep).toBe(3);
    });

    it("應該管理載入狀態", () => {
      const { result } = renderHook(() => useAnalysisStore());

      act(() => {
        result.current.setIsLoading(true, "處理中...");
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.loadingMessage).toBe("處理中...");

      act(() => {
        result.current.setIsLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.loadingMessage).toBe("");
    });

    it("應該管理錯誤", () => {
      const { result } = renderHook(() => useAnalysisStore());

      act(() => {
        result.current.addError("錯誤 1");
        result.current.addError("錯誤 2");
        result.current.addError("錯誤 1"); // 重複的不應該被加入
      });

      expect(result.current.errors).toEqual(["錯誤 1", "錯誤 2"]);

      act(() => {
        result.current.clearErrors();
      });

      expect(result.current.errors).toEqual([]);
    });

    it("應該管理警告", () => {
      const { result } = renderHook(() => useAnalysisStore());

      act(() => {
        result.current.addWarning("警告 1");
        result.current.addWarning("警告 2");
      });

      expect(result.current.warnings).toEqual(["警告 1", "警告 2"]);

      act(() => {
        result.current.clearWarnings();
      });

      expect(result.current.warnings).toEqual([]);
    });

    it("應該管理 dirty 狀態", () => {
      const { result } = renderHook(() => useAnalysisStore());

      act(() => {
        result.current.setIsDirty(true);
      });

      expect(result.current.isDirty).toBe(true);

      act(() => {
        result.current.setCurrentResult({ table: [], timestamp: Date.now() });
      });

      expect(result.current.isDirty).toBe(false);
    });
  });

  describe("全域操作", () => {
    it("應該重置所有狀態", () => {
      const { result } = renderHook(() => useAnalysisStore());

      // 設置一些狀態
      act(() => {
        result.current.setFile(new File(["test"], "test.csv"));
        result.current.setGroupVar("group");
        result.current.setCatVars(["cat1"]);
        result.current.setCurrentStep(2);
        result.current.addError("測試錯誤");
      });

      // 重置所有
      act(() => {
        result.current.resetAll();
      });

      expect(result.current.file).toBeNull();
      expect(result.current.groupVar).toBe("");
      expect(result.current.catVars).toEqual([]);
      expect(result.current.currentStep).toBe(1);
      expect(result.current.errors).toEqual([]);
    });

    it("應該重置分析但保留檔案", () => {
      const { result } = renderHook(() => useAnalysisStore());
      const mockFile = new File(["test"], "test.csv");

      act(() => {
        result.current.setFile(mockFile);
        result.current.setGroupVar("group");
        result.current.setCatVars(["cat1"]);
        result.current.setResultTable([{ id: 1 }]);
        result.current.addError("測試錯誤");
      });

      act(() => {
        result.current.resetForNewAnalysis();
      });

      // 檔案應該保留
      expect(result.current.file).toBe(mockFile);
      // 分析相關狀態應該被重置
      expect(result.current.groupVar).toBe("");
      expect(result.current.catVars).toEqual([]);
      expect(result.current.resultTable).toEqual([]);
      expect(result.current.errors).toEqual([]);
    });

    it("應該匯出狀態為 JSON", () => {
      const { result } = renderHook(() => useAnalysisStore());

      act(() => {
        result.current.setGroupVar("group");
        result.current.setCatVars(["cat1", "cat2"]);
        result.current.setContVars(["cont1"]);
        result.current.setFillNA(true);
        result.current.setAutoAnalysisMode("full");
      });

      let exportedJson: string = "";
      act(() => {
        exportedJson = result.current.exportState();
      });

      const exported = JSON.parse(exportedJson);
      expect(exported.variables.groupVar).toBe("group");
      expect(exported.variables.catVars).toEqual(["cat1", "cat2"]);
      expect(exported.variables.contVars).toEqual(["cont1"]);
      expect(exported.variables.fillNA).toBe(true);
      expect(exported.autoAnalysisMode).toBe("full");
      expect(exported.timestamp).toBeTruthy();
    });

    it("應該從 JSON 匯入狀態", () => {
      const { result } = renderHook(() => useAnalysisStore());

      const importData = {
        variables: {
          groupVar: "imported_group",
          catVars: ["imported_cat1"],
          contVars: ["imported_cont1"],
          fillNA: true,
          imputationMethod: "median",
        },
        autoAnalysisMode: "semi",
        aiModel: "claude",
      };

      act(() => {
        result.current.importState(JSON.stringify(importData));
      });

      expect(result.current.groupVar).toBe("imported_group");
      expect(result.current.catVars).toEqual(["imported_cat1"]);
      expect(result.current.contVars).toEqual(["imported_cont1"]);
      expect(result.current.fillNA).toBe(true);
      expect(result.current.imputationMethod).toBe("median");
      expect(result.current.autoAnalysisMode).toBe("semi");
      expect(result.current.aiModel).toBe("claude");
      expect(result.current.isDirty).toBe(true);
    });

    it("應該處理無效的 JSON 匯入", () => {
      const { result } = renderHook(() => useAnalysisStore());
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      act(() => {
        result.current.importState("invalid json");
      });

      expect(consoleSpy).toHaveBeenCalled();
      expect(result.current.errors).toContain("無法匯入設定檔");

      consoleSpy.mockRestore();
    });
  });

  describe("計算值", () => {
    it("應該檢查分析是否準備就緒", () => {
      const { result } = renderHook(() => useAnalysisStore());

      // 初始狀態，沒有數據
      let isReady =
        result.current.parsedData.length > 0 &&
        !!(
          result.current.groupVar ||
          result.current.catVars.length > 0 ||
          result.current.contVars.length > 0
        );
      expect(isReady).toBe(false);

      // 有數據但沒有變數
      act(() => {
        result.current.setParsedData([{ id: 1 }]);
      });

      isReady =
        result.current.parsedData.length > 0 &&
        !!(
          result.current.groupVar ||
          result.current.catVars.length > 0 ||
          result.current.contVars.length > 0
        );
      expect(isReady).toBe(false);

      // 有數據和變數
      act(() => {
        result.current.setGroupVar("group");
      });

      isReady =
        result.current.parsedData.length > 0 &&
        !!(
          result.current.groupVar ||
          result.current.catVars.length > 0 ||
          result.current.contVars.length > 0
        );
      expect(isReady).toBe(true);
    });
  });

  describe("訂閱", () => {
    it("應該訂閱檔案變更", async () => {
      const callback = vi.fn();
      const unsubscribe = useAnalysisStore.subscribe(
        (state) => state.file,
        callback,
      );

      const mockFile = new File(["test"], "test.csv");

      act(() => {
        useAnalysisStore.getState().setFile(mockFile);
      });

      await waitFor(() => {
        expect(callback).toHaveBeenCalled();
        // 檢查第一個參數是否為 mockFile
        expect(callback.mock.calls[0][0]).toBe(mockFile);
      });

      unsubscribe();
    });
  });
});
