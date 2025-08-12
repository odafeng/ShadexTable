// stores/analysisStore.ts
import { create } from 'zustand';
import { devtools, subscribeWithSelector, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ========== 嚴格類型定義 ==========
type ColumnType = 'categorical' | 'continuous' | 'date' | 'id' | 'unknown';

interface ColumnInfo {
    column: string;
    suggested_type: string;
    type?: ColumnType;
    nullable?: boolean;
    uniqueCount?: number;
    missingCount?: number;
}

// 定義資料行的值類型
type DataValue = string | number | boolean | null | undefined;

// 定義資料列類型
interface DataRow {
    [key: string]: DataValue;
}

// 定義統計資料類型
interface Statistics {
    mean?: number;
    median?: number;
    mode?: DataValue;
    std?: number;
    min?: number;
    max?: number;
    count?: number;
    missing?: number;
    unique?: number;
    [key: string]: DataValue; // 允許其他統計欄位
}

interface AnalysisResult {
    table: DataRow[];
    statistics?: Statistics;
    timestamp?: number;
    duration?: number;
}

// 定義欄位分析類型
interface ColumnProfile {
    column: string;
    dataType: string;
    uniqueValues: number;
    missingValues: number;
    missingPercentage: number;
    sampleValues?: DataValue[];
    statistics?: Statistics;
}

// 定義欄位預覽類型
interface ColumnPreview {
    column: string;
    values: DataValue[];
    dataType: string;
}

// 定義 AI 診斷類型
interface AiDiagnosis {
    summary: string;
    insights: string[];
    recommendations: string[];
    confidence: number;
    timestamp: number;
}

// 定義自動分析結果類型
interface AutoAnalysisResult {
    classification?: Record<string, string>;
    success?: boolean;
    message?: string;
    group_var?: string;
    cat_vars?: string[];
    cont_vars?: string[];
    analysis?: {
        summary?: string;
        details?: Record<string, unknown>;
    };
    confidence?: number;
    suggestions?: string[];
}

// ========== State 介面定義 ==========
interface FileState {
    file: File | null;
    fileName: string;
    fileSize: number;
    uploadedAt: number | null;
    parsedData: DataRow[];
    dataShape: {
        rows: number;
        columns: number;
    };
    setFile: (file: File | null) => void;
    setParsedData: (data: DataRow[]) => void;
    updateDataShape: () => void;
    clearFileData: () => void;
}

interface VariableState {
    groupVar: string;
    catVars: string[];
    contVars: string[];
    excludedVars: string[];
    fillNA: boolean;
    imputationMethod: 'mean' | 'median' | 'mode' | 'forward' | 'none';
    setGroupVar: (v: string) => void;
    setCatVars: (v: string[]) => void;
    setContVars: (v: string[]) => void;
    toggleVariable: (varName: string, type: 'cat' | 'cont' | 'excluded') => void;
    setFillNA: (v: boolean) => void;
    setImputationMethod: (method: VariableState['imputationMethod']) => void;
    resetVariables: () => void;
}

interface ColumnState {
    columnTypes: ColumnInfo[];
    columnProfile: ColumnProfile[];
    columnsPreview: ColumnPreview[];
    showPreview: boolean;
    columnAnalysisLoading: boolean;
    columnAnalysisProgress: number;
    columnErrors: Record<string, string>;
    setColumnTypes: (types: ColumnInfo[]) => void;
    setColumnProfile: (profile: ColumnProfile[]) => void;
    setColumnsPreview: (preview: ColumnPreview[]) => void;
    setShowPreview: (show: boolean) => void;
    setColumnAnalysisLoading: (loading: boolean) => void;
    setColumnAnalysisProgress: (progress: number) => void;
    setColumnError: (column: string, error: string) => void;
    clearColumnErrors: () => void;
    clearColumnData: () => void;
}

interface ResultState {
    resultTable: DataRow[];
    currentResult: AnalysisResult | null;
    resultHistory: AnalysisResult[];
    groupCounts: Record<string, number>;
    aiDiagnosis: AiDiagnosis | null;
    exportFormat: 'excel' | 'csv' | 'word' | 'pdf';
    isExporting: boolean;
    setResultTable: (table: DataRow[]) => void;
    setCurrentResult: (result: AnalysisResult) => void;
    addToHistory: (result: AnalysisResult) => void;
    setGroupCounts: (counts: Record<string, number>) => void;
    setAiDiagnosis: (diagnosis: AiDiagnosis | null) => void;
    setExportFormat: (format: ResultState['exportFormat']) => void;
    setIsExporting: (isExporting: boolean) => void;
    clearResults: () => void;
    clearHistory: () => void;
}

interface AutoAnalysisState {
    autoAnalysisResult: AutoAnalysisResult | null;
    skipManualStep: boolean;
    autoAnalysisMode: 'full' | 'semi' | 'manual';
    aiModel: 'gpt-4' | 'claude' | 'local';
    setAutoAnalysisResult: (result: AutoAnalysisResult | null) => void;
    setSkipManualStep: (skip: boolean) => void;
    setAutoAnalysisMode: (mode: AutoAnalysisState['autoAnalysisMode']) => void;
    setAiModel: (model: AutoAnalysisState['aiModel']) => void;
    clearAutoAnalysis: () => void;
}

interface UIState {
    currentStep: 1 | 2 | 3;
    isLoading: boolean;
    loadingMessage: string;
    errors: string[];
    warnings: string[];
    isDirty: boolean;
    setCurrentStep: (step: UIState['currentStep']) => void;
    setIsLoading: (loading: boolean, message?: string) => void;
    addError: (error: string) => void;
    addWarning: (warning: string) => void;
    clearErrors: () => void;
    clearWarnings: () => void;
    setIsDirty: (dirty: boolean) => void;
}

interface GlobalActions {
    resetAll: () => void;
    resetForNewAnalysis: () => void;
    exportState: () => string;
    importState: (stateJson: string) => void;
}

// 組合所有狀態
export interface AnalysisStore
    extends FileState,
    VariableState,
    ColumnState,
    ResultState,
    AutoAnalysisState,
    UIState,
    GlobalActions {}

// ========== Store 實現 ==========
export const useAnalysisStore = create<AnalysisStore>()(
    devtools(
        persist(
            immer(
                subscribeWithSelector((set, get) => ({
                    // ===== File State =====
                    file: null,
                    fileName: '',
                    fileSize: 0,
                    uploadedAt: null,
                    parsedData: [],
                    dataShape: { rows: 0, columns: 0 },

                    setFile: (file) => set((state) => {
                        state.file = file;
                        state.fileName = file?.name || '';
                        state.fileSize = file?.size || 0;
                        state.uploadedAt = file ? Date.now() : null;
                        state.isDirty = true;
                    }),

                    setParsedData: (data) => set((state) => {
                        state.parsedData = data;
                        state.dataShape = {
                            rows: data.length,
                            columns: data.length > 0 ? Object.keys(data[0]).length : 0
                        };
                        state.isDirty = true;
                    }),

                    updateDataShape: () => set((state) => {
                        const data = state.parsedData;
                        state.dataShape = {
                            rows: data.length,
                            columns: data.length > 0 ? Object.keys(data[0]).length : 0
                        };
                    }),

                    clearFileData: () => set((state) => {
                        state.file = null;
                        state.fileName = '';
                        state.fileSize = 0;
                        state.uploadedAt = null;
                        state.parsedData = [];
                        state.dataShape = { rows: 0, columns: 0 };
                    }),

                    // ===== Variable State =====
                    groupVar: '',
                    catVars: [],
                    contVars: [],
                    excludedVars: [],
                    fillNA: false,
                    imputationMethod: 'none',

                    setGroupVar: (v) => set((state) => {
                        state.groupVar = v;
                        state.isDirty = true;
                    }),

                    setCatVars: (v) => set((state) => {
                        state.catVars = v;
                        state.isDirty = true;
                    }),

                    setContVars: (v) => set((state) => {
                        state.contVars = v;
                        state.isDirty = true;
                    }),

                    toggleVariable: (varName, type) => set((state) => {
                        // 先從所有列表中移除
                        state.catVars = state.catVars.filter(v => v !== varName);
                        state.contVars = state.contVars.filter(v => v !== varName);
                        state.excludedVars = state.excludedVars.filter(v => v !== varName);
                        
                        // 添加到指定列表
                        if (type === 'cat') {
                            state.catVars.push(varName);
                        } else if (type === 'cont') {
                            state.contVars.push(varName);
                        } else if (type === 'excluded') {
                            state.excludedVars.push(varName);
                        }
                        
                        state.isDirty = true;
                    }),

                    setFillNA: (v) => set((state) => {
                        state.fillNA = v;
                        state.isDirty = true;
                    }),

                    setImputationMethod: (method) => set((state) => {
                        state.imputationMethod = method;
                        state.isDirty = true;
                    }),

                    resetVariables: () => set((state) => {
                        state.groupVar = '';
                        state.catVars = [];
                        state.contVars = [];
                        state.excludedVars = [];
                        state.fillNA = false;
                        state.imputationMethod = 'none';
                    }),

                    // ===== Column State =====
                    columnTypes: [],
                    columnProfile: [],
                    columnsPreview: [],
                    showPreview: false,
                    columnAnalysisLoading: false,
                    columnAnalysisProgress: 0,
                    columnErrors: {},

                    setColumnTypes: (types) => set((state) => {
                        state.columnTypes = types;
                    }),

                    setColumnProfile: (profile) => set((state) => {
                        state.columnProfile = profile;
                    }),

                    setColumnsPreview: (preview) => set((state) => {
                        state.columnsPreview = preview;
                    }),

                    setShowPreview: (show) => set((state) => {
                        state.showPreview = show;
                    }),

                    setColumnAnalysisLoading: (loading) => set((state) => {
                        state.columnAnalysisLoading = loading;
                        if (!loading) {
                            state.columnAnalysisProgress = 0;
                        }
                    }),

                    setColumnAnalysisProgress: (progress) => set((state) => {
                        state.columnAnalysisProgress = progress;
                    }),

                    setColumnError: (column, error) => set((state) => {
                        state.columnErrors[column] = error;
                    }),

                    clearColumnErrors: () => set((state) => {
                        state.columnErrors = {};
                    }),

                    clearColumnData: () => set((state) => {
                        state.columnTypes = [];
                        state.columnProfile = [];
                        state.columnsPreview = [];
                        state.showPreview = false;
                        state.columnAnalysisLoading = false;
                        state.columnAnalysisProgress = 0;
                        state.columnErrors = {};
                    }),

                    // ===== Result State =====
                    resultTable: [],
                    currentResult: null,
                    resultHistory: [],
                    groupCounts: {},
                    aiDiagnosis: null,
                    exportFormat: 'excel',
                    isExporting: false,

                    setResultTable: (table) => set((state) => {
                        state.resultTable = table;
                        // 同時更新 currentResult 以保持相容性
                        if (table && table.length > 0) {
                            state.currentResult = {
                                table,
                                timestamp: Date.now()
                            };
                        }
                    }),

                    setCurrentResult: (result) => set((state) => {
                        state.currentResult = result;
                        state.isDirty = false;
                    }),

                    addToHistory: (result) => set((state) => {
                        state.resultHistory.push(result);
                        // 只保留最近 10 筆
                        if (state.resultHistory.length > 10) {
                            state.resultHistory.shift();
                        }
                    }),

                    setGroupCounts: (counts) => set((state) => {
                        state.groupCounts = counts;
                    }),

                    setAiDiagnosis: (diagnosis) => set((state) => {
                        state.aiDiagnosis = diagnosis;
                    }),

                    setExportFormat: (format) => set((state) => {
                        state.exportFormat = format;
                    }),

                    setIsExporting: (isExporting) => set((state) => {
                        state.isExporting = isExporting;
                    }),

                    clearResults: () => set((state) => {
                        state.resultTable = [];
                        state.currentResult = null;
                        state.groupCounts = {};
                        state.aiDiagnosis = null;
                    }),

                    clearHistory: () => set((state) => {
                        state.resultHistory = [];
                    }),

                    // ===== Auto Analysis State =====
                    autoAnalysisResult: null,
                    skipManualStep: false,
                    autoAnalysisMode: 'semi',
                    aiModel: 'gpt-4',

                    setAutoAnalysisResult: (result) => set((state) => {
                        state.autoAnalysisResult = result;
                    }),

                    setSkipManualStep: (skip) => set((state) => {
                        state.skipManualStep = skip;
                    }),

                    setAutoAnalysisMode: (mode) => set((state) => {
                        state.autoAnalysisMode = mode;
                    }),

                    setAiModel: (model) => set((state) => {
                        state.aiModel = model;
                    }),

                    clearAutoAnalysis: () => set((state) => {
                        state.autoAnalysisResult = null;
                        state.skipManualStep = false;
                    }),

                    // ===== UI State =====
                    currentStep: 1,
                    isLoading: false,
                    loadingMessage: '',
                    errors: [],
                    warnings: [],
                    isDirty: false,

                    setCurrentStep: (step) => set((state) => {
                        state.currentStep = step;
                    }),

                    setIsLoading: (loading, message = '') => set((state) => {
                        state.isLoading = loading;
                        state.loadingMessage = message;
                    }),

                    addError: (error) => set((state) => {
                        if (!state.errors.includes(error)) {
                            state.errors.push(error);
                        }
                    }),

                    addWarning: (warning) => set((state) => {
                        if (!state.warnings.includes(warning)) {
                            state.warnings.push(warning);
                        }
                    }),

                    clearErrors: () => set((state) => {
                        state.errors = [];
                    }),

                    clearWarnings: () => set((state) => {
                        state.warnings = [];
                    }),

                    setIsDirty: (dirty) => set((state) => {
                        state.isDirty = dirty;
                    }),

                    // ===== Global Actions =====
                    resetAll: () => set((state) => {
                        // 重置所有狀態到初始值
                        Object.assign(state, {
                            // File
                            file: null,
                            fileName: '',
                            fileSize: 0,
                            uploadedAt: null,
                            parsedData: [],
                            dataShape: { rows: 0, columns: 0 },
                            // Variables
                            groupVar: '',
                            catVars: [],
                            contVars: [],
                            excludedVars: [],
                            fillNA: false,
                            imputationMethod: 'none',
                            // Columns
                            columnTypes: [],
                            columnProfile: [],
                            columnsPreview: [],
                            showPreview: false,
                            columnAnalysisLoading: false,
                            columnAnalysisProgress: 0,
                            columnErrors: {},
                            // Results
                            resultTable: [],
                            currentResult: null,
                            resultHistory: [],
                            groupCounts: {},
                            aiDiagnosis: null,
                            exportFormat: 'excel',
                            isExporting: false,
                            // Auto Analysis
                            autoAnalysisResult: null,
                            skipManualStep: false,
                            autoAnalysisMode: 'semi',
                            aiModel: 'gpt-4',
                            // UI
                            currentStep: 1,
                            isLoading: false,
                            loadingMessage: '',
                            errors: [],
                            warnings: [],
                            isDirty: false,
                        });
                    }),

                    resetForNewAnalysis: () => set((state) => {
                        // 保留檔案資料，只重置分析相關狀態
                        state.groupVar = '';
                        state.catVars = [];
                        state.contVars = [];
                        state.excludedVars = [];
                        state.resultTable = [];
                        state.currentResult = null;
                        state.groupCounts = {};
                        state.aiDiagnosis = null;
                        state.autoAnalysisResult = null;
                        state.skipManualStep = false;
                        state.errors = [];
                        state.warnings = [];
                        state.isDirty = false;
                    }),

                    exportState: () => {
                        const state = get();
                        const exportData = {
                            variables: {
                                groupVar: state.groupVar,
                                catVars: state.catVars,
                                contVars: state.contVars,
                                fillNA: state.fillNA,
                                imputationMethod: state.imputationMethod,
                            },
                            columns: state.columnTypes,
                            autoAnalysisMode: state.autoAnalysisMode,
                            aiModel: state.aiModel,
                            timestamp: Date.now(),
                        };
                        return JSON.stringify(exportData, null, 2);
                    },

                    importState: (stateJson) => {
                        try {
                            const importData = JSON.parse(stateJson);
                            set((state) => {
                                if (importData.variables) {
                                    Object.assign(state, importData.variables);
                                }
                                if (importData.columns) {
                                    state.columnTypes = importData.columns;
                                }
                                if (importData.autoAnalysisMode) {
                                    state.autoAnalysisMode = importData.autoAnalysisMode;
                                }
                                if (importData.aiModel) {
                                    state.aiModel = importData.aiModel;
                                }
                                state.isDirty = true;
                            });
                        } catch (error) {
                            console.error('Failed to import state:', error);
                            set((state) => {
                                state.errors.push('無法匯入設定檔');
                            });
                        }
                    },
                }))
            ),
            {
                name: 'analysis-storage',
                partialize: (state) => ({
                    // 只持久化部分狀態（使用者偏好設定）
                    autoAnalysisMode: state.autoAnalysisMode,
                    aiModel: state.aiModel,
                    exportFormat: state.exportFormat,
                    imputationMethod: state.imputationMethod,
                }),
            }
        ),
        {
            name: 'analysis-store',
        }
    )
);

// ========== 保留原有的選擇器 Hooks (向後相容) ==========
export const useFileData = () =>
    useAnalysisStore((state) => ({
        file: state.file,
        parsedData: state.parsedData,
        setFile: state.setFile,
        setParsedData: state.setParsedData,
        clearFileData: state.clearFileData,
    }));

export const useVariables = () =>
    useAnalysisStore((state) => ({
        groupVar: state.groupVar,
        catVars: state.catVars,
        contVars: state.contVars,
        fillNA: state.fillNA,
        setGroupVar: state.setGroupVar,
        setCatVars: state.setCatVars,
        setContVars: state.setContVars,
        setFillNA: state.setFillNA,
        resetVariables: state.resetVariables,
    }));

export const useColumnData = () =>
    useAnalysisStore((state) => ({
        columnTypes: state.columnTypes,
        columnProfile: state.columnProfile,
        columnsPreview: state.columnsPreview,
        showPreview: state.showPreview,
        columnAnalysisLoading: state.columnAnalysisLoading,
        setColumnTypes: state.setColumnTypes,
        setColumnProfile: state.setColumnProfile,
        setColumnsPreview: state.setColumnsPreview,
        setShowPreview: state.setShowPreview,
        setColumnAnalysisLoading: state.setColumnAnalysisLoading,
        clearColumnData: state.clearColumnData,
    }));

export const useResults = () =>
    useAnalysisStore((state) => ({
        resultTable: state.resultTable,
        groupCounts: state.groupCounts,
        aiDiagnosis: state.aiDiagnosis,
        setResultTable: state.setResultTable,
        setGroupCounts: state.setGroupCounts,
        setAiDiagnosis: state.setAiDiagnosis,
        clearResults: state.clearResults,
    }));

export const useAutoAnalysis = () =>
    useAnalysisStore((state) => ({
        autoAnalysisResult: state.autoAnalysisResult,
        skipManualStep: state.skipManualStep,
        setAutoAnalysisResult: state.setAutoAnalysisResult,
        setSkipManualStep: state.setSkipManualStep,
        clearAutoAnalysis: state.clearAutoAnalysis,
    }));

// ========== 新增的實用 Hooks ==========
export const useLoadingState = () =>
    useAnalysisStore((state) => ({
        isLoading: state.isLoading,
        loadingMessage: state.loadingMessage,
        setIsLoading: state.setIsLoading,
    }));

export const useErrors = () =>
    useAnalysisStore((state) => ({
        errors: state.errors,
        addError: state.addError,
        clearErrors: state.clearErrors,
    }));

export const useCurrentStep = () =>
    useAnalysisStore((state) => ({
        currentStep: state.currentStep,
        setCurrentStep: state.setCurrentStep,
    }));

export const useDataShape = () =>
    useAnalysisStore((state) => state.dataShape);

export const useAnalysisReady = () =>
    useAnalysisStore((state) => {
        const hasData = state.parsedData.length > 0;
        const hasVariables = state.groupVar || state.catVars.length > 0 || state.contVars.length > 0;
        return hasData && hasVariables;
    });

// ========== 工具函數 (保留向後相容) ==========
export const getAnalysisState = () => useAnalysisStore.getState();

export const subscribeToFileChange = (callback: (file: File | null) => void) => {
    return useAnalysisStore.subscribe(
        (state) => state.file,
        callback
    );
};

export const batchUpdateAnalysis = (updates: Partial<AnalysisStore>) => {
    useAnalysisStore.setState(updates);
};

// 匯出新增的類型定義，供其他文件使用
export type { 
    DataRow, 
    DataValue, 
    Statistics, 
    ColumnProfile, 
    ColumnPreview, 
    AiDiagnosis,
    AutoAnalysisResult 
};