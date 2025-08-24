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

interface DataProcessingLog {
    missingFilled: boolean;
    fillMethod: string;
    fillTimestamp: number | null;
    affectedColumns: string[];
    originalMissingCount?: number;
    filledMissingCount?: number;
    fillSummary?: Array<{
        column: string;
        before_pct: string;
        after_pct: string;
        fill_method: string;
    }>;
}

interface FileState {
    file: File | null;
    fileName: string;
    fileSize: number;
    uploadedAt: number | null;
    parsedData: DataRow[];
    processedData: DataRow[] | null;  // 新增：處理後的資料
    dataProcessingLog: DataProcessingLog;  // 新增：處理記錄
    dataShape: {
        rows: number;
        columns: number;
    };
    setFile: (file: File | null) => void;
    setParsedData: (data: DataRow[]) => void;
    setProcessedData: (data: DataRow[] | null) => void;  // 新增
    updateProcessingLog: (log: Partial<DataProcessingLog>) => void;  // 新增
    getActiveData: () => DataRow[];  // 新增：智能返回資料
    clearProcessedData: () => void;  // 新增：清除處理資料
    updateDataShape: () => void;
    clearFileData: () => void;
}

// 定義資料行的值類型
type DataValue = string | number | boolean | Date | null | undefined;

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
        table?: DataRow[];           // 新增
        groupCounts?: Record<string, number>;  // 新增
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
    fill_na: boolean;
    imputationMethod: 'mean' | 'median' | 'mode' | 'forward' | 'none';
    setGroupVar: (v: string) => void;
    setCatVars: (v: string[]) => void;
    setContVars: (v: string[]) => void;
    toggleVariable: (varName: string, type: 'cat' | 'cont' | 'excluded') => void;
    setfill_na: (v: boolean) => void;
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
    correlation_id: string | null;
    generateAndSetCorrelationId: () => string;
    setAutoAnalysisResult: (result: AutoAnalysisResult | null) => void;
    setSkipManualStep: (skip: boolean) => void;
    setAutoAnalysisMode: (mode: AutoAnalysisState['autoAnalysisMode']) => void;
    setAiModel: (model: AutoAnalysisState['aiModel']) => void;
    setcorrelation_id: (id: string | null) => void;  // 新增：設置 correlation ID
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
    GlobalActions { }

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
                    processedData: null,  // 新增
                    dataProcessingLog: {  // 新增
                        missingFilled: false,
                        fillMethod: '',
                        fillTimestamp: null,
                        affectedColumns: [],
                        originalMissingCount: undefined,
                        filledMissingCount: undefined,
                        fillSummary: []
                    },
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

                    setProcessedData: (data) => set((state) => {
                        state.processedData = data;
                        if (data) {
                            // 更新資料形狀為處理後的資料
                            state.dataShape = {
                                rows: data.length,
                                columns: data.length > 0 ? Object.keys(data[0]).length : 0
                            };
                        }
                        state.isDirty = true;
                    }),

                    updateProcessingLog: (log) => set((state) => {
                        state.dataProcessingLog = {
                            ...state.dataProcessingLog,
                            ...log
                        };
                    }),

                    getActiveData: () => {
                        const state = get();
                        return state.processedData || state.parsedData;
                    },

                    clearProcessedData: () => set((state) => {
                        state.processedData = null;
                        state.dataProcessingLog = {
                            missingFilled: false,
                            fillMethod: '',
                            fillTimestamp: null,
                            affectedColumns: [],
                            originalMissingCount: undefined,
                            filledMissingCount: undefined,
                            fillSummary: []
                        };
                        // 恢復資料形狀為原始資料
                        state.dataShape = {
                            rows: state.parsedData.length,
                            columns: state.parsedData.length > 0 ? Object.keys(state.parsedData[0]).length : 0
                        };
                        state.isDirty = true;
                    }),

                    updateDataShape: () => set((state) => {
                        // 優先使用處理後的資料
                        const data = state.processedData || state.parsedData;
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
                        state.processedData = null;  // 新增
                        state.dataProcessingLog = {  // 新增
                            missingFilled: false,
                            fillMethod: '',
                            fillTimestamp: null,
                            affectedColumns: [],
                            originalMissingCount: undefined,
                            filledMissingCount: undefined,
                            fillSummary: []
                        };
                        state.dataShape = { rows: 0, columns: 0 };
                    }),

                    generateAndSetCorrelationId: () => {
                        const timestamp = Date.now();
                        const randomStr = Math.random().toString(36).substr(2, 9);
                        const correlation_id = `analysis-${timestamp}-${randomStr}`;

                        set((state) => {
                            state.correlation_id = correlation_id;
                            state.isDirty = true;
                        });

                        console.log('📌 Generated new correlation_id:', correlation_id);
                        return correlation_id;  // 返回產生的 ID
                    },

                    // ===== Variable State =====
                    groupVar: '',
                    catVars: [],
                    contVars: [],
                    excludedVars: [],
                    fill_na: false,
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

                    setfill_na: (v) => set((state) => {
                        state.fill_na = v;
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
                        state.fill_na = false;
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
                    correlation_id: null,

                    setAutoAnalysisResult: (result) => set((state) => {
                        state.autoAnalysisResult = result;
                    }),

                    setcorrelation_id: (id) => set((state) => {  // 新增：設置方法
                        state.correlation_id = id;
                        state.isDirty = true;
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
                        state.correlation_id = null;
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
                            processedData: null,  // 新增
                            dataProcessingLog: {  // 新增
                                missingFilled: false,
                                fillMethod: '',
                                fillTimestamp: null,
                                affectedColumns: [],
                                originalMissingCount: undefined,
                                filledMissingCount: undefined,
                                fillSummary: []
                            },
                            // Variables
                            correlation_id: null,
                            groupVar: '',
                            catVars: [],
                            contVars: [],
                            excludedVars: [],
                            fill_na: false,
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
                        state.processedData = null;
                        state.dataProcessingLog = {
                            missingFilled: false,
                            fillMethod: '',
                            fillTimestamp: null,
                            affectedColumns: [],
                            originalMissingCount: undefined,
                            filledMissingCount: undefined,
                            fillSummary: []
                        };
                        state.correlation_id = null;
                    }),

                    exportState: () => {
                        const state = get();
                        const exportData = {
                            variables: {
                                groupVar: state.groupVar,
                                catVars: state.catVars,
                                contVars: state.contVars,
                                fill_na: state.fill_na,
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
        processedData: state.processedData,  // 新增
        getActiveData: state.getActiveData,  // 新增
        setFile: state.setFile,
        setParsedData: state.setParsedData,
        setProcessedData: state.setProcessedData,  // 新增
        clearFileData: state.clearFileData,
        clearProcessedData: state.clearProcessedData,  // 新增
    }));

export const useVariables = () =>
    useAnalysisStore((state) => ({
        groupVar: state.groupVar,
        catVars: state.catVars,
        contVars: state.contVars,
        fill_na: state.fill_na,
        setGroupVar: state.setGroupVar,
        setCatVars: state.setCatVars,
        setContVars: state.setContVars,
        setfill_na: state.setfill_na,
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

export const useProcessedData = () =>
    useAnalysisStore((state) => ({
        processedData: state.processedData,
        dataProcessingLog: state.dataProcessingLog,
        setProcessedData: state.setProcessedData,
        updateProcessingLog: state.updateProcessingLog,
        getActiveData: state.getActiveData,
        clearProcessedData: state.clearProcessedData,
        hasProcessedData: !!state.processedData,
    }));



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
// 匯出新增的類型定義，供其他文件使用
export type {
    DataRow,
    DataValue,
    Statistics,
    ColumnProfile,
    ColumnPreview,
    AiDiagnosis,
    AutoAnalysisResult,
    AnalysisResult, ColumnInfo
};