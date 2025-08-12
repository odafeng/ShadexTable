// stores/analysisStore.hooks.ts
// 更細粒度的 Selector Hooks，提供更好的效能

import { useAnalysisStore } from './analysisStore';
import { useShallow } from 'zustand/shallow';
import { useMemo } from 'react';

// 定義欄位配置類型（根據您的資料結構調整）
interface ColumnProfile {
  column: string;
  suggested_type?: string;
  missing_pct?: string | number;
  unique_count?: number;
  sample_values?: (string | number | null)[];
}

// 定義結果類型（根據您的資料結構調整）
interface AnalysisResult {
  id: string;
  timestamp: Date;
  data: unknown;
  // 添加其他必要的屬性
}

// ========== 檔案相關 Hooks ==========
export const useFile = () => 
  useAnalysisStore(useShallow((state) => ({
    file: state.file,
    fileName: state.fileName,
    fileSize: state.fileSize,
    uploadedAt: state.uploadedAt,
    setFile: state.setFile,
  })));

export const useParsedData = () =>
  useAnalysisStore(useShallow((state) => ({
    parsedData: state.parsedData,
    setParsedData: state.setParsedData,
  })));

export const useDataShape = () =>
  useAnalysisStore((state) => state.dataShape);

export const useHasData = () =>
  useAnalysisStore((state) => state.parsedData.length > 0);

// ========== 變數相關 Hooks ==========
export const useGroupVariable = () =>
  useAnalysisStore(useShallow((state) => ({
    groupVar: state.groupVar,
    setGroupVar: state.setGroupVar,
  })));

export const useCategoricalVariables = () =>
  useAnalysisStore(useShallow((state) => ({
    catVars: state.catVars,
    setCatVars: state.setCatVars,
  })));

export const useContinuousVariables = () =>
  useAnalysisStore(useShallow((state) => ({
    contVars: state.contVars,
    setContVars: state.setContVars,
  })));

export const useExcludedVariables = () =>
  useAnalysisStore(useShallow((state) => ({
    excludedVars: state.excludedVars,
    toggleVariable: state.toggleVariable,
  })));

export const useSelectedVariables = () =>
  useAnalysisStore(useShallow((state) => ({
    groupVar: state.groupVar,
    catVars: state.catVars,
    contVars: state.contVars,
    total: state.catVars.length + state.contVars.length + (state.groupVar ? 1 : 0),
  })));

export const useImputationSettings = () =>
  useAnalysisStore(useShallow((state) => ({
    fillNA: state.fillNA,
    imputationMethod: state.imputationMethod,
    setFillNA: state.setFillNA,
    setImputationMethod: state.setImputationMethod,
  })));

// ========== 欄位相關 Hooks ==========
export const useColumns = () =>
  useAnalysisStore(useShallow((state) => ({
    columnTypes: state.columnTypes,
    setColumnTypes: state.setColumnTypes,
  })));

export const useColumnByName = (columnName: string) =>
  useAnalysisStore((state) => 
    state.columnTypes.find(c => c.column === columnName)
  );

export const useColumnProfiles = () =>
  useAnalysisStore((state) => state.columnProfile);

export const useColumnProfile = (columnName: string) =>
  useAnalysisStore((state) => {
    const profiles = state.columnProfile as ColumnProfile[];
    return profiles.find((p: ColumnProfile) => p.column === columnName);
  });

export const useColumnAnalysisStatus = () =>
  useAnalysisStore(useShallow((state) => ({
    loading: state.columnAnalysisLoading,
    progress: state.columnAnalysisProgress,
    setLoading: state.setColumnAnalysisLoading,
    setProgress: state.setColumnAnalysisProgress,
  })));

export const useColumnErrors = () =>
  useAnalysisStore(useShallow((state) => ({
    errors: state.columnErrors,
    setError: state.setColumnError,
    clearErrors: state.clearColumnErrors,
  })));

export const useColumnsPreview = () =>
  useAnalysisStore(useShallow((state) => ({
    columnsPreview: state.columnsPreview,
    showPreview: state.showPreview,
    setColumnsPreview: state.setColumnsPreview,
    setShowPreview: state.setShowPreview,
  })));

// ========== 結果相關 Hooks ==========
export const useCurrentResult = () =>
  useAnalysisStore((state) => state.currentResult);

export const useResultTable = () =>
  useAnalysisStore((state) => state.resultTable);

export const useResultHistory = () =>
  useAnalysisStore(useShallow((state) => ({
    history: state.resultHistory,
    addToHistory: state.addToHistory,
    clearHistory: state.clearHistory,
  })));

export const useGroupCounts = () =>
  useAnalysisStore((state) => state.groupCounts);

export const useAiDiagnosis = () =>
  useAnalysisStore(useShallow((state) => ({
    diagnosis: state.aiDiagnosis,
    setDiagnosis: state.setAiDiagnosis,
  })));

export const useExportSettings = () =>
  useAnalysisStore(useShallow((state) => ({
    format: state.exportFormat,
    isExporting: state.isExporting,
    setFormat: state.setExportFormat,
    setIsExporting: state.setIsExporting,
  })));

// ========== 自動分析相關 Hooks ==========
export const useAutoAnalysisResult = () =>
  useAnalysisStore((state) => state.autoAnalysisResult);

export const useAutoAnalysisMode = () =>
  useAnalysisStore(useShallow((state) => ({
    mode: state.autoAnalysisMode,
    setMode: state.setAutoAnalysisMode,
  })));

export const useAiModel = () =>
  useAnalysisStore(useShallow((state) => ({
    model: state.aiModel,
    setModel: state.setAiModel,
  })));

export const useSkipManualStep = () =>
  useAnalysisStore(useShallow((state) => ({
    skip: state.skipManualStep,
    setSkip: state.setSkipManualStep,
  })));

// ========== UI 相關 Hooks ==========
export const useCurrentStep = () =>
  useAnalysisStore(useShallow((state) => ({
    step: state.currentStep,
    setStep: state.setCurrentStep,
  })));

export const useLoadingState = () =>
  useAnalysisStore(useShallow((state) => ({
    isLoading: state.isLoading,
    message: state.loadingMessage,
    setLoading: state.setIsLoading,
  })));

export const useErrors = () =>
  useAnalysisStore(useShallow((state) => ({
    errors: state.errors,
    addError: state.addError,
    clearErrors: state.clearErrors,
  })));

export const useWarnings = () =>
  useAnalysisStore(useShallow((state) => ({
    warnings: state.warnings,
    addWarning: state.addWarning,
    clearWarnings: state.clearWarnings,
  })));

export const useIsDirty = () =>
  useAnalysisStore(useShallow((state) => ({
    isDirty: state.isDirty,
    setIsDirty: state.setIsDirty,
  })));

// ========== 計算屬性 Hooks ==========
export const useAnalysisReady = () => {
  const hasData = useHasData();
  const { groupVar, catVars, contVars } = useSelectedVariables();
  
  return useMemo(() => {
    return hasData && (groupVar || catVars.length > 0 || contVars.length > 0);
  }, [hasData, groupVar, catVars.length, contVars.length]);
};

export const useVariableCount = () => {
  const { total } = useSelectedVariables();
  const { excludedVars } = useExcludedVariables();
  
  return {
    selected: total,
    excluded: excludedVars.length,
    total: total + excludedVars.length,
  };
};

export const useDataQuality = () => {
  const columnTypes = useAnalysisStore((state) => state.columnTypes);
  
  return useMemo(() => {
    if (columnTypes.length === 0) return null;
    
    const totalMissing = columnTypes.reduce((sum, col) => 
      sum + (col.missingCount || 0), 0
    );
    const totalCells = columnTypes.reduce((sum, col) => 
      sum + (col.missingCount || 0) + (col.uniqueCount || 0), 0
    );
    const missingPercentage = totalCells > 0 ? (totalMissing / totalCells) * 100 : 0;
    
    return {
      totalMissing,
      missingPercentage,
      quality: missingPercentage < 5 ? 'excellent' : 
               missingPercentage < 15 ? 'good' : 
               missingPercentage < 30 ? 'fair' : 'poor',
    };
  }, [columnTypes]);
};

export const useAnalysisProgress = () => {
  const currentStep = useAnalysisStore((state) => state.currentStep);
  const hasFile = useAnalysisStore((state) => !!state.file);
  const hasVariables = useSelectedVariables().total > 0;
  const hasResult = useAnalysisStore((state) => !!state.currentResult);
  
  return useMemo(() => {
    let progress = 0;
    const steps = [
      { name: '上傳檔案', completed: hasFile },
      { name: '選擇變數', completed: hasVariables },
      { name: '執行分析', completed: hasResult },
    ];
    
    progress = steps.filter(s => s.completed).length / steps.length * 100;
    
    return {
      progress,
      steps,
      currentStep,
    };
  }, [currentStep, hasFile, hasVariables, hasResult]);
};

// ========== 複合操作 Hooks ==========
export const useResetAnalysis = () => {
  const resetAll = useAnalysisStore((state) => state.resetAll);
  const resetForNewAnalysis = useAnalysisStore((state) => state.resetForNewAnalysis);
  
  return {
    resetAll,
    resetForNewAnalysis,
  };
};

export const useStateManagement = () => {
  const exportState = useAnalysisStore((state) => state.exportState);
  const importState = useAnalysisStore((state) => state.importState);
  
  return {
    exportState,
    importState,
  };
};

// ========== 訂閱特定變化 ==========
export const useSubscribeToFileChange = (callback: (file: File | null) => void) => {
  return useAnalysisStore.subscribe(
    (state) => state.file,
    callback
  );
};

export const useSubscribeToStepChange = (callback: (step: 1 | 2 | 3) => void) => {
  return useAnalysisStore.subscribe(
    (state) => state.currentStep,
    callback
  );
};

export const useSubscribeToResultChange = (callback: (result: AnalysisResult | null) => void) => {
  return useAnalysisStore.subscribe(
    (state) => state.currentResult,
    callback
  );
};

// ========== 批次操作 ==========
export const useBatchVariableUpdate = () => {
  return (updates: {
    groupVar?: string;
    catVars?: string[];
    contVars?: string[];
    fillNA?: boolean;
  }) => {
    const state = useAnalysisStore.getState();
    
    if (updates.groupVar !== undefined) {
      state.setGroupVar(updates.groupVar);
    }
    if (updates.catVars !== undefined) {
      state.setCatVars(updates.catVars);
    }
    if (updates.contVars !== undefined) {
      state.setContVars(updates.contVars);
    }
    if (updates.fillNA !== undefined) {
      state.setFillNA(updates.fillNA);
    }
  };
};

// ========== Debug Hooks (僅開發環境) ==========
export const useDebugStore = () => {
  const state = useAnalysisStore();
  
  if (process.env.NODE_ENV === 'development') {
    return state;
  }
  return null;
};

export const useStoreSnapshot = () => {
  const getState = useAnalysisStore.getState;
  
  if (process.env.NODE_ENV === 'development') {
    return () => {
      const state = getState();
      console.log('Store Snapshot:', state);
      return state;
    };
  }
  return null;
};