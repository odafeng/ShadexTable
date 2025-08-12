// src/lib/reportError.ts
import type { AppError } from "@/types/errors";

/**
 * 上報錯誤（客戶端優先，不阻塞主流程）
 * - 先嘗試 sendBeacon（頁面卸載也能送出）
 * - 失敗再回退 fetch
 * - 任何錯誤都吞掉，避免二次錯誤影響使用者操作
 */

export async function reportError(err: AppError, extra?: Record<string, unknown>): Promise<void> {
  try {
    const payload = JSON.stringify({ ...err, extra });

    // Browser: 優先用 sendBeacon（非同步、在 unload 時也可靠）
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const ok = navigator.sendBeacon("/api/report-error", new Blob([payload], { type: "application/json" }));
      if (ok) return;
      // 若 sendBeacon 回傳 false，再回退 fetch
    }

    // 回退：fetch（避免 throw）
    await fetch("/api/report-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true, // 允許在頁面卸載時繼續傳送
    });
  } catch {
    // 忽略：錯誤上報不應阻斷主流程
  }
}

