// stores/analysisStore.ts
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

// ========== 類型定義 ==========
interface FileState {
    file: File | null;
    parsedData: any[];
    setFile: (file: File | null) => void;
    setParsedData: (data: any[]) => void;
    clearFileData: () => void;
}

interface VariableState {
    groupVar: string;
    catVars: string[];
    contVars: string[];
    fillNA: boolean;
    setGroupVar: (v: string) => void;
    setCatVars: (v: string[]) => void;
    setContVars: (v: string[]) => void;
    setFillNA: (v: boolean) => void;
    resetVariables: () => void;
}

interface ColumnState {
    columnTypes: { column: string; suggested_type: string }[];
    columnProfile: any[];
    // 新增這些狀態
    columnsPreview: any[];
    showPreview: boolean;
    columnAnalysisLoading: boolean;

    setColumnTypes: (types: { column: string; suggested_type: string }[]) => void;
    setColumnProfile: (profile: any[]) => void;
    // 新增這些方法
    setColumnsPreview: (preview: any[]) => void;
    setShowPreview: (show: boolean) => void;
    setColumnAnalysisLoading: (loading: boolean) => void;
    clearColumnData: () => void;
}

interface ResultState {
    resultTable: any[];
    groupCounts: Record<string, number>;
    aiDiagnosis: any;
    setResultTable: (table: any[]) => void;
    setGroupCounts: (counts: Record<string, number>) => void;
    setAiDiagnosis: (diagnosis: any) => void;
    clearResults: () => void;
}

interface AutoAnalysisState {
    autoAnalysisResult: {
        classification?: Record<string, string>;
        success?: boolean;
        message?: string;
        group_var?: string;
        cat_vars?: string[];
        cont_vars?: string[];
        analysis?: any;
    } | null;
    skipManualStep: boolean;
    setAutoAnalysisResult: (result: any) => void;
    setSkipManualStep: (skip: boolean) => void;
    clearAutoAnalysis: () => void;
}

// 組合所有狀態
export interface AnalysisStore
    extends FileState,
    VariableState,
    ColumnState,
    ResultState,
    AutoAnalysisState {
    // 全域操作
    resetAll: () => void;
    resetForNewAnalysis: () => void;
}

// ========== Store 實現 ==========
export const useAnalysisStore = create<AnalysisStore>()(
    devtools(
        subscribeWithSelector(
            (set) => ({
                // ===== File State =====
                file: null,
                parsedData: [],

                setFile: (file) => set({ file }),
                setParsedData: (data) => set({ parsedData: data }),
                clearFileData: () => set({ file: null, parsedData: [] }),

                // ===== Variable State =====
                groupVar: '',
                catVars: [],
                contVars: [],
                fillNA: false,

                setGroupVar: (v) => set({ groupVar: v }),
                setCatVars: (v) => set({ catVars: v }),
                setContVars: (v) => set({ contVars: v }),
                setFillNA: (v) => set({ fillNA: v }),
                resetVariables: () => set({
                    groupVar: '',
                    catVars: [],
                    contVars: [],
                    fillNA: false
                }),

                // ===== Column State =====
                columnTypes: [],
                columnProfile: [],
                columnsPreview: [],
                showPreview: false,
                columnAnalysisLoading: false,

                setColumnTypes: (types) => set({ columnTypes: types }),
                setColumnProfile: (profile) => set({ columnProfile: profile }),
                setColumnsPreview: (preview) => set({ columnsPreview: preview }),
                setShowPreview: (show) => set({ showPreview: show }),
                setColumnAnalysisLoading: (loading) => set({ columnAnalysisLoading: loading }),

                clearColumnData: () => set({
                    columnTypes: [],
                    columnProfile: [],
                    columnsPreview: [],
                    showPreview: false,
                    columnAnalysisLoading: false
                }),

                // ===== Result State =====
                resultTable: [],
                groupCounts: {},
                aiDiagnosis: null,

                setResultTable: (table) => set({ resultTable: table }),
                setGroupCounts: (counts) => set({ groupCounts: counts }),
                setAiDiagnosis: (diagnosis) => set({ aiDiagnosis: diagnosis }),
                clearResults: () => set({
                    resultTable: [],
                    groupCounts: {},
                    aiDiagnosis: null
                }),

                // ===== Auto Analysis State =====
                autoAnalysisResult: null,
                skipManualStep: false,

                setAutoAnalysisResult: (result) => set({ autoAnalysisResult: result }),
                setSkipManualStep: (skip) => set({ skipManualStep: skip }),
                clearAutoAnalysis: () => set({
                    autoAnalysisResult: null,
                    skipManualStep: false
                }),

                // ===== Global Actions =====
                resetAll: () => set({
                    file: null,
                    parsedData: [],
                    groupVar: '',
                    catVars: [],
                    contVars: [],
                    fillNA: false,
                    columnTypes: [],
                    columnProfile: [],
                    resultTable: [],
                    groupCounts: {},
                    aiDiagnosis: null,
                    autoAnalysisResult: null,
                    skipManualStep: false,
                }),

                resetForNewAnalysis: () => set({
                    groupVar: '',
                    catVars: [],
                    contVars: [],
                    resultTable: [],
                    groupCounts: {},
                    aiDiagnosis: null,
                    autoAnalysisResult: null,
                    skipManualStep: false,
                }),
            })
        ),
        {
            name: 'analysis-store', // DevTools 中顯示的名稱
        }
    )
);

// ========== 選擇器 Hooks ==========
// 這些 hooks 允許組件只訂閱需要的部分狀態

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
        setColumnTypes: state.setColumnTypes,
        setColumnProfile: state.setColumnProfile,
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

// ========== 工具函數 ==========
export const getAnalysisState = () => useAnalysisStore.getState();

// 訂閱特定狀態變化
export const subscribeToFileChange = (callback: (file: File | null) => void) => {
    return useAnalysisStore.subscribe(
        (state) => state.file,
        callback
    );
};

// 批量更新（用於複雜操作）
export const batchUpdateAnalysis = (updates: Partial<AnalysisStore>) => {
    useAnalysisStore.setState(updates);
};