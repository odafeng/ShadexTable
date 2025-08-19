export const typeColorClass: Record<string, string> = {
  "類別變項": "text-sky-700",        // 深藍灰藍，帶有結構感
  "連續變項": "text-emerald-700",    // 深綠偏灰，數學感佳
  "日期變項": "text-amber-700",      // 深金色，有時序感但不俗氣
  "不明": "text-neutral-500"         // 中性灰，安靜不突兀
};

export const plotColors = {
    continuous: "#047857",  // emerald-700 - 連續變項
    categorical: "#0369a1", // sky-700 - 類別變項
    date: "#b45309",        // amber-700 - 日期變項
    unknown: "#737373",     // neutral-500 - 不明
    
    // 主要顏色
    primary: "#0F2844",
    primaryLight: "#1e3a5f",
    primaryDark: "#0a1929",
    
    // 圖表調色盤
    palette: {
        blue: ["#dbeafe", "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a"],
        emerald: ["#d1fae5", "#a7f3d0", "#6ee7b7", "#34d399", "#10b981", "#059669", "#047857", "#065f46"],
        amber: ["#fef3c7", "#fde68a", "#fcd34d", "#fbbf24", "#f59e0b", "#d97706", "#b45309", "#92400e"],
        sky: ["#e0f2fe", "#bae6fd", "#7dd3fc", "#38bdf8", "#0ea5e9", "#0284c7", "#0369a1", "#075985"],
    },
    
    // 多類別漸層（用於長條圖有多個類別時）
    gradientPalette: [
        "#0369a1",  // sky-700
        "#047857",  // emerald-700
        "#b45309",  // amber-700
        "#7c3aed",  // violet-600
        "#dc2626",  // red-600
        "#0891b2",  // cyan-600
        "#059669",  // emerald-600
        "#ca8a04",  // yellow-600
    ]
};

// analysisSteps
export interface LoadingStep {
    id: number;
    title: string;
    subtitle: string;
    duration: number;
}

export const DEFAULT_ANALYSIS_STEPS: LoadingStep[] = [
    {
        id: 1,
        title: "正在引入變項參數",
        subtitle: "解析您選擇的變項配置...",
        duration: 1000
    },
    {
        id: 2,
        title: "正在處理遺漏值",
        subtitle: "智能填補與清理資料...",
        duration: 1200
    },
    {
        id: 3,
        title: "智能檢定決策中",
        subtitle: "選擇最適合的統計方法...",
        duration: 1500
    },
    {
        id: 4,
        title: "正在生成結果表格",
        subtitle: "計算統計結果與效應量...",
        duration: 1000
    },
    {
        id: 5,
        title: "分析完成！",
        subtitle: "準備展示分析結果",
        duration: 800
    }
];

export const FILE_UPLOAD_STEPS: LoadingStep[] = [
    {
        id: 1,
        title: "正在上傳檔案",
        subtitle: "將檔案傳送到伺服器...",
        duration: 2000
    },
    {
        id: 2,
        title: "檔案驗證中",
        subtitle: "檢查檔案格式與完整性...",
        duration: 1000
    },
    {
        id: 3,
        title: "解析檔案內容",
        subtitle: "讀取並分析資料結構...",
        duration: 1500
    },
    {
        id: 4,
        title: "資料預處理",
        subtitle: "進行資料清理與型別判定...",
        duration: 2000
    }
];

export const REPORT_GENERATION_STEPS: LoadingStep[] = [
    {
        id: 1,
        title: "收集分析結果",
        subtitle: "整理統計數據與圖表...",
        duration: 800
    },
    {
        id: 2,
        title: "生成報告內容",
        subtitle: "撰寫統計解釋與建議...",
        duration: 2000
    },
    {
        id: 3,
        title: "格式化報告",
        subtitle: "美化排版與圖表樣式...",
        duration: 1200
    },
    {
        id: 4,
        title: "報告生成完成",
        subtitle: "準備下載報告檔案...",
        duration: 500
    }
];