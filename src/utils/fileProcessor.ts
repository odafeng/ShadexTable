import * as XLSX from "xlsx";
import { 
  ErrorCode, 
  ErrorContext,
  createError,
  extractErrorMessage
} from "@/utils/error";
import { reportError } from "@/lib/reportError";
import { AppError } from "@/types/errors";

// 定義資料列的類型
export type DataRow = Record<string, string | number | boolean | Date | null>;

// 定義處理後的檔案結果
export interface ProcessedFileResult {
    data: DataRow[];
    error?: AppError;
    fileInfo?: {
        name: string;
        size: number;
        rows: number;
        columns: number;
        hasMultipleSheets?: boolean;
    };
}

export interface FileLimits {
    maxSizeBytes: number;
    maxRows: number;
    maxColumns: number;
    allowedExtensions: string[];
}

export interface FileValidationResult {
    isValid: boolean;
    error?: AppError;
    warnings?: string[];
}

export interface FileBasicInfo {
    columns: string[];
    hasMultipleSheets: boolean;
    error?: AppError;
}

// 定義 Excel Cell 值的類型
type CellValue = string | number | boolean | Date | null;

export class FileProcessor {
    // 使用者等級限制 - 修正專業版為25MB
    static readonly USER_LIMITS = {
        GENERAL: {
            maxSizeBytes: 10 * 1024 * 1024,    // 10MB
            maxRows: 50000,                     // 5萬筆資料
            maxColumns: 100,                    // 100個欄位
            allowedExtensions: [".csv", ".xls", ".xlsx"]
        },
        PROFESSIONAL: {
            maxSizeBytes: 25 * 1024 * 1024,    // 25MB (修正為25MB)
            maxRows: 100000,                    // 10萬筆資料
            maxColumns: 200,                    // 200個欄位
            allowedExtensions: [".csv", ".xls", ".xlsx"]
        }
    };

    // 檔案大小格式化
    static formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 增強的檔案驗證
    static validateFile(
        file: File, 
        userType: 'GENERAL' | 'PROFESSIONAL' = 'GENERAL'
    ): FileValidationResult {
        const limits = this.USER_LIMITS[userType];
        const warnings: string[] = [];
        const correlationId = crypto.randomUUID();

        try {
            // 1. 副檔名檢查
            const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
            if (!limits.allowedExtensions.includes(ext)) {
                const error = createError(
                    ErrorCode.FILE_ERROR,
                    ErrorContext.FILE_UPLOAD,
                    'file.format_unsupported',
                    { 
                        correlationId,
                        customMessage: `不支援的檔案格式：${ext}，請選擇 CSV 或 Excel 檔案`
                    }
                );
                
                reportError(error, { 
                    fileName: file.name, 
                    extension: ext, 
                    userType,
                    allowedExtensions: limits.allowedExtensions
                });
                
                return { isValid: false, error };
            }

            // 2. 檔案大小檢查
            if (file.size > limits.maxSizeBytes) {
                const error = createError(
                    ErrorCode.FILE_ERROR,
                    ErrorContext.FILE_UPLOAD,
                    'file.size_exceeded',
                    { 
                        correlationId,
                        customMessage: `檔案大小 ${this.formatFileSize(file.size)} 超過限制 ${this.formatFileSize(limits.maxSizeBytes)}`
                    }
                );
                
                reportError(error, { 
                    fileName: file.name, 
                    fileSize: file.size,
                    fileSizeFormatted: this.formatFileSize(file.size),
                    limit: limits.maxSizeBytes,
                    limitFormatted: this.formatFileSize(limits.maxSizeBytes),
                    userType 
                });
                
                return { isValid: false, error };
            }

            // 3. 檔案大小最小限制
            if (file.size < 10) {
                const error = createError(
                    ErrorCode.FILE_ERROR,
                    ErrorContext.FILE_UPLOAD,
                    'file.empty_file',
                    { 
                        correlationId,
                        customMessage: `檔案過小 (${file.size} bytes)，可能是空檔案`
                    }
                );
                
                reportError(error, { 
                    fileName: file.name, 
                    fileSize: file.size 
                });
                
                return { isValid: false, error };
            }

            // 4. Excel 檔案警告
            if (['.xls', '.xlsx'].includes(ext)) {
                warnings.push("建議 Excel 檔案僅包含一個工作表，系統將自動讀取第一個工作表的資料。");
            }

            return { 
                isValid: true, 
                warnings: warnings.length > 0 ? warnings : undefined 
            };

        } catch (err: unknown) {
            const error = createError(
                ErrorCode.UNKNOWN_ERROR,
                ErrorContext.FILE_UPLOAD,
                undefined,
                { 
                    correlationId,
                    customMessage: `檔案驗證失敗：${extractErrorMessage(err)}`,
                    cause: err instanceof Error ? err : undefined
                }
            );
            
            reportError(error, { 
                fileName: file.name, 
                originalError: extractErrorMessage(err)
            });
            
            return { isValid: false, error };
        }
    }

    // Excel數值轉換日期
    static excelDateToJSDate(excelDate: number): Date {
        return new Date((excelDate - 25569) * 86400 * 1000);
    }

    // 快速讀取檔案基本資訊（不完整解析）
    static async getFileBasicInfo(file: File): Promise<FileBasicInfo> {
        const correlationId = crypto.randomUUID();
        
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = (e: ProgressEvent<FileReader>) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: "array" });
                    
                    const hasMultipleSheets = workbook.SheetNames.length > 1;
                    const sheetName = workbook.SheetNames[0];
                    
                    if (!sheetName) {
                        const error = createError(
                            ErrorCode.FILE_ERROR,
                            ErrorContext.FILE_UPLOAD,
                            'file.empty_file',
                            { 
                                correlationId,
                                customMessage: "檔案中沒有找到工作表"
                            }
                        );
                        
                        reportError(error, { 
                            fileName: file.name, 
                            sheetNames: workbook.SheetNames 
                        });
                        
                        resolve({ columns: [], hasMultipleSheets: false, error });
                        return;
                    }
                    
                    const sheet = workbook.Sheets[sheetName];
                    
                    // 檢查工作表是否為空
                    if (!sheet['!ref']) {
                        const error = createError(
                            ErrorCode.FILE_ERROR,
                            ErrorContext.FILE_UPLOAD,
                            'file.empty_file',
                            { 
                                correlationId,
                                customMessage: "工作表沒有資料"
                            }
                        );
                        
                        reportError(error, { 
                            fileName: file.name, 
                            sheetName,
                            hasMultipleSheets
                        });
                        
                        resolve({ columns: [], hasMultipleSheets, error });
                        return;
                    }
                    
                    // 只讀取第一行來獲取欄位名稱
                    const range = XLSX.utils.decode_range(sheet['!ref']);
                    const columns: string[] = [];
                    
                    for (let col = range.s.c; col <= range.e.c; col++) {
                        const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
                        const cell = sheet[cellAddress];
                        if (cell && cell.v) {
                            columns.push(String(cell.v));
                        }
                    }

                    // 檢查是否有有效的欄位
                    if (columns.length === 0) {
                        const error = createError(
                            ErrorCode.VALIDATION_ERROR,
                            ErrorContext.FILE_UPLOAD,
                            'column.no_valid_columns',
                            { correlationId }
                        );
                        
                        reportError(error, { 
                            fileName: file.name, 
                            sheetName,
                            hasMultipleSheets
                        });
                        
                        resolve({ columns: [], hasMultipleSheets, error });
                        return;
                    }

                    resolve({ columns, hasMultipleSheets });

                } catch (err: unknown) {
                    console.error("❌ 檔案基本資訊讀取錯誤:", err);
                    
                    const error = createError(
                        ErrorCode.SERVER_ERROR,
                        ErrorContext.FILE_UPLOAD,
                        undefined,
                        { 
                            correlationId,
                            customMessage: `檔案基本資訊讀取失敗：${extractErrorMessage(err)}`,
                            cause: err instanceof Error ? err : undefined
                        }
                    );
                    
                    reportError(error, { 
                        fileName: file.name, 
                        originalError: extractErrorMessage(err)
                    });
                    
                    resolve({ columns: [], hasMultipleSheets: false, error });
                }
            };

            reader.onerror = () => {
                const error = createError(
                    ErrorCode.FILE_ERROR,
                    ErrorContext.FILE_UPLOAD,
                    'file.read_failed',
                    { correlationId }
                );
                
                reportError(error, { fileName: file.name });
                
                resolve({ columns: [], hasMultipleSheets: false, error });
            };

            reader.readAsArrayBuffer(file);
        });
    }

    // 增強的檔案處理
    static async processFile(
        file: File, 
        userType: 'GENERAL' | 'PROFESSIONAL' = 'GENERAL'
    ): Promise<ProcessedFileResult> {
        const limits = this.USER_LIMITS[userType];
        const correlationId = crypto.randomUUID();
        
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = (e: ProgressEvent<FileReader>) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: "array" });
                    const hasMultipleSheets = workbook.SheetNames.length > 1;
                    const sheetName = workbook.SheetNames[0];
                    
                    if (!sheetName) {
                        const error = createError(
                            ErrorCode.FILE_ERROR,
                            ErrorContext.FILE_UPLOAD,
                            'file.empty_file',
                            { 
                                correlationId,
                                customMessage: "檔案中沒有找到工作表"
                            }
                        );
                        
                        reportError(error, { 
                            fileName: file.name, 
                            sheets: workbook.SheetNames 
                        });
                        
                        resolve({ data: [], error });
                        return;
                    }
                    
                    const sheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json<DataRow>(sheet);

                    if (json.length === 0) {
                        const error = createError(
                            ErrorCode.FILE_ERROR,
                            ErrorContext.FILE_UPLOAD,
                            'file.empty_file',
                            { 
                                correlationId,
                                customMessage: "檔案中沒有資料列"
                            }
                        );
                        
                        reportError(error, { 
                            fileName: file.name, 
                            sheetName,
                            sheets: workbook.SheetNames 
                        });
                        
                        resolve({ data: [], error });
                        return;
                    }

                    // 檢查資料大小限制
                    if (json.length > limits.maxRows) {
                        const error = createError(
                            ErrorCode.VALIDATION_ERROR,
                            ErrorContext.FILE_UPLOAD,
                            'file.size_exceeded',
                            { 
                                correlationId,
                                customMessage: `資料列數 ${json.length.toLocaleString()} 超過限制 ${limits.maxRows.toLocaleString()}`
                            }
                        );
                        
                        reportError(error, { 
                            fileName: file.name, 
                            dataRows: json.length,
                            limit: limits.maxRows,
                            userType 
                        });
                        
                        resolve({ data: [], error });
                        return;
                    }

                    // 檢查欄位數量
                    const columnCount = Object.keys(json[0] || {}).length;
                    if (columnCount > limits.maxColumns) {
                        const error = createError(
                            ErrorCode.VALIDATION_ERROR,
                            ErrorContext.FILE_UPLOAD,
                            'file.size_exceeded',
                            { 
                                correlationId,
                                customMessage: `欄位數量 ${columnCount} 超過限制 ${limits.maxColumns}`
                            }
                        );
                        
                        reportError(error, { 
                            fileName: file.name, 
                            columnCount,
                            limit: limits.maxColumns,
                            userType 
                        });
                        
                        resolve({ data: [], error });
                        return;
                    }

                    // 資料標準化
                    const normalizedData = this.normalizeData(json);
                    
                    resolve({
                        data: normalizedData,
                        fileInfo: {
                            name: file.name,
                            size: file.size,
                            rows: normalizedData.length,
                            columns: columnCount,
                            hasMultipleSheets
                        }
                    });

                } catch (err: unknown) {
                    console.error("❌ 檔案處理錯誤:", err);
                    
                    // 檢查是否為特定的檔案格式錯誤
                    const errorMessage = extractErrorMessage(err);
                    let specificError: string | undefined;
                    
                    if (errorMessage.includes('Unsupported file') || 
                        errorMessage.includes('Invalid file') ||
                        errorMessage.includes('corrupted')) {
                        specificError = 'file.corrupted';
                    }
                    
                    const error = createError(
                        ErrorCode.SERVER_ERROR,
                        ErrorContext.FILE_UPLOAD,
                        specificError,
                        { 
                            correlationId,
                            customMessage: specificError 
                                ? undefined 
                                : `檔案處理失敗：${errorMessage}`,
                            cause: err instanceof Error ? err : undefined
                        }
                    );
                    
                    reportError(error, { 
                        fileName: file.name, 
                        originalError: errorMessage,
                        fileSize: file.size
                    });
                    
                    resolve({ data: [], error });
                }
            };

            reader.onerror = () => {
                console.error("❌ 檔案讀取失敗");
                
                const error = createError(
                    ErrorCode.FILE_ERROR,
                    ErrorContext.FILE_UPLOAD,
                    'file.read_failed',
                    { correlationId }
                );
                
                reportError(error, { fileName: file.name });
                
                resolve({ data: [], error });
            };

            reader.readAsArrayBuffer(file);
        });
    }

    // 資料標準化處理
    static normalizeData(json: DataRow[]): DataRow[] {
        const allKeys = Array.from(new Set(json.flatMap((row) => Object.keys(row))));

        return json.map((row) => {
            const completeRow: DataRow = {};
            allKeys.forEach((key) => {
                completeRow[key] = key in row ? row[key] : "";
            });
            return completeRow;
        });
    }

    // 日期值轉換處理
    static formatDisplayValue(value: CellValue): string | number | boolean | Date {
        if (typeof value === "number" && value > 20000 && value < 60000) {
            const date = this.excelDateToJSDate(value);
            return date.toLocaleDateString();
        } else if (value instanceof Date) {
            return value.toLocaleDateString();
        }
        return value ?? "";
    }

    // 快速驗證和處理檔案（組合方法）
    static async validateAndProcess(
        file: File,
        userType: 'GENERAL' | 'PROFESSIONAL' = 'GENERAL'
    ): Promise<ProcessedFileResult & { warnings?: string[] }> {
        // 先驗證檔案
        const validation = this.validateFile(file, userType);
        
        if (!validation.isValid) {
            return {
                data: [],
                error: validation.error,
                warnings: validation.warnings
            };
        }
        
        // 處理檔案
        const result = await this.processFile(file, userType);
        
        return {
            ...result,
            warnings: validation.warnings
        };
    }

    // 取得使用者限制資訊
    static getUserLimits(userType: 'GENERAL' | 'PROFESSIONAL' = 'GENERAL'): FileLimits {
        return { ...this.USER_LIMITS[userType] };
    }

    // 檢查檔案是否符合特定限制
    static checkFileLimits(
        file: File,
        customLimits?: Partial<FileLimits>,
        userType: 'GENERAL' | 'PROFESSIONAL' = 'GENERAL'
    ): { valid: boolean; violations: string[] } {
        const limits = { ...this.USER_LIMITS[userType], ...customLimits };
        const violations: string[] = [];

        // 檢查副檔名
        const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
        if (!limits.allowedExtensions.includes(ext)) {
            violations.push(`不支援的檔案格式：${ext}`);
        }

        // 檢查檔案大小
        if (file.size > limits.maxSizeBytes) {
            violations.push(`檔案大小 ${this.formatFileSize(file.size)} 超過限制 ${this.formatFileSize(limits.maxSizeBytes)}`);
        }

        if (file.size < 10) {
            violations.push(`檔案過小，可能是空檔案`);
        }

        return {
            valid: violations.length === 0,
            violations
        };
    }
}