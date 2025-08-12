import { useState } from 'react';
import { useFileValidation as useFileValidationLib } from '@/features/auth/hooks/useUserLimits';
import { AppError } from '@/types/errors';

interface UseFileValidationReturn {
    fileValidationWarnings: string[];
    validateAndPrepareFile: (file: File) => Promise<{
        isValid: boolean;
        warnings: string[];
        error?: AppError;
    }>;
    clearWarnings: () => void;
}

export function useFileValidation(): UseFileValidationReturn {
    const [fileValidationWarnings, setFileValidationWarnings] = useState<string[]>([]);
    const { validateFile, getFileSizeWarning } = useFileValidationLib();

    const validateAndPrepareFile = async (file: File) => {
        const validation = validateFile(file);
        
        if (!validation.isValid) {
            return {
                isValid: false,
                warnings: [],
                error: validation.error
            };
        }

        const warnings: string[] = [];
        const sizeWarning = getFileSizeWarning(file);
        
        if (validation.warnings) warnings.push(...validation.warnings);
        if (sizeWarning) warnings.push(sizeWarning);
        
        setFileValidationWarnings(warnings);
        
        return {
            isValid: true,
            warnings
        };
    };

    const clearWarnings = () => {
        setFileValidationWarnings([]);
    };

    return {
        fileValidationWarnings,
        validateAndPrepareFile,
        clearWarnings
    };
}