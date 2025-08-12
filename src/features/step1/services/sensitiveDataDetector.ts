import { FileProcessor } from "@/utils/fileProcessor";
import { 
  // isAppError,  // 移除未使用的 import
  ErrorCode, 
  ErrorContext,
  createError,
  CommonErrors 
} from "@/utils/error";

import { AppError } from "@/types/errors"
import { reportError } from "@/lib/reportError";

export interface SensitiveCheckResult {
    hasSensitiveData: boolean;
    sensitiveColumns: string[];
    suggestions: string[];
}

export class SensitiveDataDetector {
    // 敏感欄位關鍵字（使用更精確的匹配模式）
    private static readonly SENSITIVE_PATTERNS = [
        // 姓名相關 - 使用完整單詞匹配
        { 
            keywords: ['姓名', '^name$', 'patient_name', 'patientname', 'full_name', 'fullname',
                      '病人姓名', '患者姓名', 'first_name', 'last_name', 'firstname', 'lastname'],
            type: 'name',
            exactMatch: true // 需要完整匹配
        },
        
        // 病歷號相關
        { 
            keywords: ['病歷號', '病歷', 'chart_no', 'chartno', 'chart_number', 'chartnumber',
                      'medical_record', 'medicalrecord', 'mr_no', 'mrno', '^patient_id$', '^patientid$',
                      'hospital_no', 'hospitalno', 'registration_no', 'registrationno'],
            type: 'medical_id',
            exactMatch: true
        },
        
        // 身分證相關
        { 
            keywords: ['身分證', '身份證', 'id_number', 'idnumber', 'national_id', 'nationalid',
                      'id_card', 'idcard', 'citizen_id', 'citizenid'],
            type: 'id',
            exactMatch: true
        },
        
        // 聯絡資訊
        { 
            keywords: ['電話', '^phone$', 'telephone', 'mobile', 'cellphone', '^tel$',
                      '手機', '聯絡電話', 'contact_phone', 'contactphone',
                      '地址', 'address', 'home_address', 'homeaddress',
                      '^email$', 'e_mail', '^mail$', '電子郵件', '信箱'],
            type: 'contact',
            exactMatch: true
        },
        
        // 出生日期相關
        { 
            keywords: ['出生日期', 'birth_date', 'birthdate', 'date_of_birth', 'dateofbirth', '^dob$',
                      'birthday', '生日', 'born_date', 'borndate'],
            type: 'birth',
            exactMatch: true
        },
    ];

    // 醫學檢驗項目白名單（不應被視為敏感資料）
    private static readonly MEDICAL_TEST_WHITELIST = [
        // 血液檢查
        'platelets', 'platelet', 'plt', 'wbc', 'rbc', 'hemoglobin', 'hematocrit',
        'glucose', 'cholesterol', 'triglyceride', 'hdl', 'ldl',
        
        // 生化檢查
        'creatinine', 'urea', 'bun', 'alt', 'ast', 'bilirubin',
        'albumin', 'protein', 'calcium', 'phosphorus',
        
        // 其他常見醫學術語
        'systolic', 'diastolic', 'pulse', 'temperature', 'weight', 'height',
        'bmi', 'bsa', 'diagnosis', 'medication', 'dose', 'dosage'
    ];

    // 檢測敏感欄位
    static detectSensitiveColumns(columns: string[]): SensitiveCheckResult {
        const sensitiveColumns: string[] = [];
        const suggestions: string[] = [];
        const correlationId = `sensitive-detection-${Date.now()}`;

        try {
            if (!Array.isArray(columns) || columns.length === 0) {
                return {
                    hasSensitiveData: false,
                    sensitiveColumns: [],
                    suggestions: []
                };
            }

            columns.forEach(column => {
                if (!column || typeof column !== 'string') return;
                
                const normalizedColumn = column.toLowerCase().trim();
                
                // 首先檢查是否為醫學檢驗項目白名單
                const isWhitelisted = this.MEDICAL_TEST_WHITELIST.some(whitelistItem => 
                    normalizedColumn.includes(whitelistItem.toLowerCase())
                );

                if (isWhitelisted) {
                    return; // 跳過白名單項目
                }

                // 檢查是否包含敏感關鍵字
                const sensitivePattern = this.SENSITIVE_PATTERNS.find(pattern => 
                    pattern.keywords.some(keyword => this.matchKeyword(normalizedColumn, keyword, pattern.exactMatch))
                );

                if (sensitivePattern) {
                    sensitiveColumns.push(column);
                    
                    // 根據不同類型給予建議
                    switch (sensitivePattern.type) {
                        case 'name':
                            suggestions.push(`請移除姓名欄位「${column}」，或使用匿名化編號替代`);
                            break;
                        case 'medical_id':
                            suggestions.push(`請移除病歷號欄位「${column}」，或使用研究編號替代`);
                            break;
                        case 'id':
                            suggestions.push(`請移除身分識別欄位「${column}」，或使用去識別化編號`);
                            break;
                        case 'contact':
                            suggestions.push(`請移除聯絡資訊欄位「${column}」`);
                            break;
                        case 'birth':
                            suggestions.push(`請移除出生日期欄位「${column}」，或僅保留年份/年齡組別`);
                            break;
                        default:
                            suggestions.push(`請檢視欄位「${column}」是否包含敏感資料`);
                    }
                }
            });

            // 記錄檢測結果（如果有敏感資料才報告）
            if (sensitiveColumns.length > 0) {
                const privacyError = CommonErrors.sensitiveDataDetected();
                reportError(privacyError, { 
                    action: "sensitive_detection",
                    sensitiveColumns,
                    totalColumns: columns.length,
                    correlationId
                });
            }

            return {
                hasSensitiveData: sensitiveColumns.length > 0,
                sensitiveColumns,
                suggestions: [...new Set(suggestions)] // 去除重複建議
            };

        } catch (error: unknown) {
            console.error("❌ 敏感資料檢測過程中發生錯誤:", error);
            
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            const appError = createError(
                ErrorCode.PRIVACY_ERROR,
                undefined,
                undefined,
                { 
                    correlationId,
                    customMessage: `敏感資料檢測失敗: ${errorMessage}`,
                    cause: error instanceof Error ? error : undefined
                }
            );
            
            reportError(appError, { 
                action: "sensitive_detection",
                columns: columns.length,
                originalError: error
            });

            // 返回安全的預設值
            return {
                hasSensitiveData: false,
                sensitiveColumns: [],
                suggestions: []
            };
        }
    }

    // 改進的關鍵字匹配方法
    private static matchKeyword(columnName: string, keyword: string, exactMatch: boolean): boolean {
        try {
            if (!columnName || !keyword) return false;

            if (exactMatch) {
                // 使用正則表達式進行精確匹配
                if (keyword.startsWith('^') && keyword.endsWith('$')) {
                    // 完整單詞匹配
                    const regex = new RegExp(keyword, 'i');
                    return regex.test(columnName);
                } else {
                    // 作為單獨單詞出現（被分隔符包圍）
                    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
                    return regex.test(columnName.replace(/[_-]/g, ' '));
                }
            } else {
                // 模糊匹配（包含）
                return columnName.includes(keyword.toLowerCase());
            }
        } catch (error) {
            console.warn(`⚠️ 關鍵字匹配失敗: ${keyword}`, error);
            return false;
        }
    }

    // 快速檢測檔案是否包含敏感資料
    static async checkFileForSensitiveData(file: File): Promise<SensitiveCheckResult & { error?: AppError }> {
        const correlationId = `file-sensitive-check-${Date.now()}`;
        
        try {
            if (!file) {
                const error = CommonErrors.fileNotSelected();
                return {
                    hasSensitiveData: false,
                    sensitiveColumns: [],
                    suggestions: [],
                    error
                };
            }

            const basicInfo = await FileProcessor.getFileBasicInfo(file);
            
            if (basicInfo.error) {
                const error = createError(
                    ErrorCode.FILE_ERROR,
                    ErrorContext.FILE_UPLOAD,
                    'file.read_failed',
                    { 
                        correlationId,
                        cause: basicInfo.error instanceof Error ? basicInfo.error : undefined
                    }
                );
                await reportError(error, { 
                    fileName: file.name, 
                    originalError: basicInfo.error,
                    action: "file_sensitive_check"
                });
                return {
                    hasSensitiveData: false,
                    sensitiveColumns: [],
                    suggestions: [],
                    error
                };
            }

            if (!basicInfo.columns || basicInfo.columns.length === 0) {
                const error = createError(
                    ErrorCode.VALIDATION_ERROR,
                    ErrorContext.FILE_UPLOAD,
                    'column.no_valid_columns',
                    { correlationId }
                );
                return {
                    hasSensitiveData: false,
                    sensitiveColumns: [],
                    suggestions: [],
                    error
                };
            }

            return this.detectSensitiveColumns(basicInfo.columns);
            
        } catch (error: unknown) {
            console.error("❌ 敏感資料檢測錯誤:", error);
            
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            const appError = createError(
                ErrorCode.PRIVACY_ERROR,
                undefined,
                undefined,
                { 
                    correlationId,
                    customMessage: `檔案敏感資料檢測失敗: ${errorMessage}`,
                    cause: error instanceof Error ? error : undefined
                }
            );
            
            await reportError(appError, { 
                fileName: file.name, 
                originalError: error,
                action: "file_sensitive_check"
            });
            
            return {
                hasSensitiveData: false,
                sensitiveColumns: [],
                suggestions: [],
                error: appError
            };
        }
    }

    // 輔助方法：判斷欄位類型（保持向後兼容）
    private static isNameRelated(column: string): boolean {
        const nameKeywords = ['姓名', '^name$', 'patient_name', 'first_name', 'last_name'];
        return nameKeywords.some(keyword => this.matchKeyword(column, keyword, true));
    }

    private static isIdRelated(column: string): boolean {
        const idKeywords = ['身分證', '身份證', 'id_number', 'national_id', 'id_card'];
        return idKeywords.some(keyword => this.matchKeyword(column, keyword, true));
    }

    private static isContactRelated(column: string): boolean {
        const contactKeywords = ['電話', '^phone$', 'mobile', '地址', 'address', '^email$'];
        return contactKeywords.some(keyword => this.matchKeyword(column, keyword, true));
    }

    private static isMedicalIdRelated(column: string): boolean {
        const medicalIdKeywords = ['病歷號', 'chart_no', 'medical_record', '^patient_id$'];
        return medicalIdKeywords.some(keyword => this.matchKeyword(column, keyword, true));
    }
}