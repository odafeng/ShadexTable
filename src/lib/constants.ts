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