import { FileProcessor } from "@/utils/fileProcessor";
import {
  ErrorCode,
  ErrorContext,
  createError,
  CommonErrors,
} from "@/utils/error";

import { AppError } from "@/types/errors";
import { reportError } from "@/lib/reportError";

export interface SensitiveCheckResult {
  hasSensitiveData: boolean;
  sensitiveColumns: string[];
  suggestions: string[];
}

export class SensitiveDataDetector {
  // 敏感欄位關鍵字（改為更寬鬆的匹配）
  private static readonly SENSITIVE_PATTERNS = [
    // 姓名相關 - 改為包含匹配
    {
      keywords: [
        "姓名",
        "name",
        "名字",
        "病人",
        "患者",
        "個案",
        "patient",
        "person",
        "病患",
      ],
      type: "name",
      exactMatch: false, // 改為 false
    },

    // 病歷號相關
    {
      keywords: [
        "病歷號",
        "病歷",
        "chart",
        "medical",
        "mr",
        "就醫",
        "就診",
        "record",
        "patient_id",
        "patientid",
      ],
      type: "medical_id",
      exactMatch: false,
    },

    // 身分證相關
    {
      keywords: [
        "身分證",
        "身份證",
        "id_number",
        "idnumber",
        "national_id",
        "nationalid",
        "id_card",
        "idcard",
        "citizen_id",
        "citizenid",
        "身分證字號",
        "身份證字號",
      ],
      type: "id",
      exactMatch: false,
    },

    // 聯絡資訊
    {
      keywords: [
        "電話",
        "phone",
        "telephone",
        "mobile",
        "cellphone",
        "tel",
        "手機",
        "聯絡電話",
        "contact_phone",
        "contactphone",
        "地址",
        "address",
        "home_address",
        "homeaddress",
        "addr",
        "email",
        "e_mail",
        "mail",
        "電子郵件",
        "信箱",
        "電郵",
      ],
      type: "contact",
      exactMatch: false,
    },

    // 出生日期相關
    {
      keywords: [
        "出生日期",
        "birth",
        "birthday",
        "date_of_birth",
        "dateofbirth",
        "dob",
        "生日",
        "born_date",
        "borndate",
        "出生年月日",
        "生年月日",
      ],
      type: "birth",
      exactMatch: false,
    },
  ];

  // 醫學檢驗項目白名單（不應被視為敏感資料）
  private static readonly MEDICAL_TEST_WHITELIST = [
    // 血液檢查
    "platelets",
    "platelet",
    "plt",
    "wbc",
    "rbc",
    "hemoglobin",
    "hematocrit",
    "glucose",
    "cholesterol",
    "triglyceride",
    "hdl",
    "ldl",

    // 生化檢查
    "creatinine",
    "urea",
    "bun",
    "alt",
    "ast",
    "bilirubin",
    "albumin",
    "protein",
    "calcium",
    "phosphorus",

    // 其他常見醫學術語
    "systolic",
    "diastolic",
    "pulse",
    "temperature",
    "weight",
    "height",
    "bmi",
    "bsa",
    "diagnosis",
    "medication",
    "dose",
    "dosage",
  ];

  // 檢測敏感欄位
  static detectSensitiveColumns(columns: string[]): SensitiveCheckResult {
    const sensitiveColumns: string[] = [];
    const suggestions: string[] = [];
    const correlationId = `sensitive-detection-${Date.now()}`;

    console.log("🔍 開始檢測敏感欄位");
    console.log("📋 輸入欄位:", columns);

    try {
      if (!Array.isArray(columns) || columns.length === 0) {
        console.log("⚠️ 沒有欄位需要檢測");
        return {
          hasSensitiveData: false,
          sensitiveColumns: [],
          suggestions: [],
        };
      }

      columns.forEach((column) => {
        if (!column || typeof column !== "string") {
          console.log(`⚠️ 跳過無效欄位:`, column);
          return;
        }

        // 正規化欄位名稱：轉小寫、去除空白、底線、橫線
        const normalizedColumn = column
          .toLowerCase()
          .trim()
          .replace(/[\s_\-]+/g, "");
        console.log(`檢查欄位: "${column}" -> 正規化: "${normalizedColumn}"`);

        // 首先檢查是否為醫學檢驗項目白名單
        const isWhitelisted = this.MEDICAL_TEST_WHITELIST.some(
          (whitelistItem) =>
            normalizedColumn.includes(whitelistItem.toLowerCase()),
        );

        if (isWhitelisted) {
          console.log(`  ✅ 欄位 "${column}" 在白名單中，跳過`);
          return; // 跳過白名單項目
        }

        // 檢查是否包含敏感關鍵字
        let foundSensitive = false;
        for (const pattern of this.SENSITIVE_PATTERNS) {
          const matched = pattern.keywords.some((keyword) => {
            const normalizedKeyword = keyword
              .toLowerCase()
              .replace(/[\s_\-]+/g, "");
            const isMatch = this.matchKeyword(
              normalizedColumn,
              normalizedKeyword,
              pattern.exactMatch,
            );

            if (isMatch) {
              console.log(
                `  ⚠️ 欄位 "${column}" 匹配到敏感關鍵字 "${keyword}" (類型: ${pattern.type})`,
              );
            }

            return isMatch;
          });

          if (matched) {
            sensitiveColumns.push(column);
            foundSensitive = true;

            // 根據不同類型給予建議
            switch (pattern.type) {
              case "name":
                suggestions.push(
                  `請移除姓名欄位「${column}」，或使用匿名化編號替代`,
                );
                break;
              case "medical_id":
                suggestions.push(
                  `請移除病歷號欄位「${column}」，或使用研究編號替代`,
                );
                break;
              case "id":
                suggestions.push(
                  `請移除身分識別欄位「${column}」，或使用去識別化編號`,
                );
                break;
              case "contact":
                suggestions.push(`請移除聯絡資訊欄位「${column}」`);
                break;
              case "birth":
                suggestions.push(
                  `請移除出生日期欄位「${column}」，或僅保留年份/年齡組別`,
                );
                break;
              default:
                suggestions.push(`請檢視欄位「${column}」是否包含敏感資料`);
            }

            break; // 找到一個匹配就跳出，避免重複
          }
        }

        if (!foundSensitive) {
          console.log(`  ✅ 欄位 "${column}" 沒有敏感資料`);
        }
      });

      console.log("🔍 檢測完成");
      console.log("📊 敏感欄位數量:", sensitiveColumns.length);
      console.log("📊 敏感欄位列表:", sensitiveColumns);
      console.log("💡 建議:", suggestions);

      // 記錄檢測結果（如果有敏感資料才報告）
      if (sensitiveColumns.length > 0) {
        const privacyError = CommonErrors.sensitiveDataDetected();
        reportError(privacyError, {
          action: "sensitive_detection",
          sensitiveColumns,
          totalColumns: columns.length,
          correlationId,
        }).catch(console.error);
      }

      return {
        hasSensitiveData: sensitiveColumns.length > 0,
        sensitiveColumns,
        suggestions: [...new Set(suggestions)], // 去除重複建議
      };
    } catch (error: unknown) {
      console.error("❌ 敏感資料檢測過程中發生錯誤:", error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const appError = createError(
        ErrorCode.PRIVACY_ERROR,
        undefined,
        undefined,
        {
          correlationId,
          customMessage: `敏感資料檢測失敗: ${errorMessage}`,
          cause: error instanceof Error ? error : undefined,
        },
      );

      reportError(appError, {
        action: "sensitive_detection",
        columns: columns.length,
        originalError: error,
      }).catch(console.error);

      // 發生錯誤時，為了安全起見，假設有敏感資料
      return {
        hasSensitiveData: true,
        sensitiveColumns: ["檢測失敗，請手動確認所有欄位"],
        suggestions: ["系統無法自動檢測，請手動確認檔案中沒有個人敏感資料"],
      };
    }
  }

  // 改進的關鍵字匹配方法
  private static matchKeyword(
    columnName: string,
    keyword: string,
    exactMatch: boolean,
  ): boolean {
    try {
      if (!columnName || !keyword) return false;

      // 清理關鍵字中的正則表達式符號
      const cleanKeyword = keyword.replace(/[\^$]/g, "");

      if (exactMatch) {
        // 完全匹配（現在我們設定都是 false，所以這段可能不會執行）
        return columnName === cleanKeyword;
      } else {
        // 包含匹配（更寬鬆）
        return columnName.includes(cleanKeyword);
      }
    } catch (error) {
      console.warn(`⚠️ 關鍵字匹配失敗: ${keyword}`, error);
      return false;
    }
  }

  // 快速檢測檔案是否包含敏感資料
  static async checkFileForSensitiveData(
    file: File,
  ): Promise<SensitiveCheckResult & { error?: AppError }> {
    const correlationId = `file-sensitive-check-${Date.now()}`;

    try {
      if (!file) {
        const error = CommonErrors.fileNotSelected();
        return {
          hasSensitiveData: false,
          sensitiveColumns: [],
          suggestions: [],
          error,
        };
      }

      console.log("📂 開始從檔案檢測敏感資料:", file.name);

      const basicInfo = await FileProcessor.getFileBasicInfo(file);

      if (basicInfo.error) {
        const error = createError(
          ErrorCode.FILE_ERROR,
          ErrorContext.FILE_UPLOAD,
          "file.read_failed",
          {
            correlationId,
            cause:
              basicInfo.error instanceof Error ? basicInfo.error : undefined,
          },
        );
        await reportError(error, {
          fileName: file.name,
          originalError: basicInfo.error,
          action: "file_sensitive_check",
        }).catch(console.error);
        return {
          hasSensitiveData: false,
          sensitiveColumns: [],
          suggestions: [],
          error,
        };
      }

      if (!basicInfo.columns || basicInfo.columns.length === 0) {
        const error = createError(
          ErrorCode.VALIDATION_ERROR,
          ErrorContext.FILE_UPLOAD,
          "column.no_valid_columns",
          { correlationId },
        );
        return {
          hasSensitiveData: false,
          sensitiveColumns: [],
          suggestions: [],
          error,
        };
      }

      console.log("📋 從檔案取得的欄位:", basicInfo.columns);

      return this.detectSensitiveColumns(basicInfo.columns);
    } catch (error: unknown) {
      console.error("❌ 敏感資料檢測錯誤:", error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const appError = createError(
        ErrorCode.PRIVACY_ERROR,
        undefined,
        undefined,
        {
          correlationId,
          customMessage: `檔案敏感資料檢測失敗: ${errorMessage}`,
          cause: error instanceof Error ? error : undefined,
        },
      );

      await reportError(appError, {
        fileName: file.name,
        originalError: error,
        action: "file_sensitive_check",
      }).catch(console.error);

      // 發生錯誤時，為了安全起見，假設有敏感資料
      return {
        hasSensitiveData: true,
        sensitiveColumns: ["檢測失敗，請手動確認所有欄位"],
        suggestions: ["系統無法自動檢測，請手動確認檔案中沒有個人敏感資料"],
        error: appError,
      };
    }
  }

  // 輔助方法：判斷欄位類型（保持向後兼容）
  private static isNameRelated(column: string): boolean {
    const nameKeywords = [
      "姓名",
      "name",
      "patient_name",
      "first_name",
      "last_name",
      "病人",
      "患者",
    ];
    const normalized = column.toLowerCase().replace(/[\s_\-]+/g, "");
    return nameKeywords.some((keyword) =>
      normalized.includes(keyword.toLowerCase().replace(/[\s_\-]+/g, "")),
    );
  }

  private static isIdRelated(column: string): boolean {
    const idKeywords = [
      "身分證",
      "身份證",
      "id_number",
      "national_id",
      "id_card",
    ];
    const normalized = column.toLowerCase().replace(/[\s_\-]+/g, "");
    return idKeywords.some((keyword) =>
      normalized.includes(keyword.toLowerCase().replace(/[\s_\-]+/g, "")),
    );
  }

  private static isContactRelated(column: string): boolean {
    const contactKeywords = [
      "電話",
      "phone",
      "mobile",
      "地址",
      "address",
      "email",
    ];
    const normalized = column.toLowerCase().replace(/[\s_\-]+/g, "");
    return contactKeywords.some((keyword) =>
      normalized.includes(keyword.toLowerCase().replace(/[\s_\-]+/g, "")),
    );
  }

  private static isMedicalIdRelated(column: string): boolean {
    const medicalIdKeywords = [
      "病歷號",
      "chart_no",
      "medical_record",
      "patient_id",
    ];
    const normalized = column.toLowerCase().replace(/[\s_\-]+/g, "");
    return medicalIdKeywords.some((keyword) =>
      normalized.includes(keyword.toLowerCase().replace(/[\s_\-]+/g, "")),
    );
  }
}
