import { useState, useEffect, useMemo } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { FileProcessor, FileLimits } from '@/utils/fileProcessor';

export type UserType = 'GENERAL' | 'PROFESSIONAL';
export type SubscriptionPlan = 'free' | 'basic' | 'professional' | 'enterprise';

interface UserLimitsInfo {
    userType: UserType;
    plan: SubscriptionPlan;
    limits: FileLimits;
    formattedLimits: {
        maxSize: string;
        maxRows: string;
        maxColumns: string;
        userTypeName: string;
        planName: string;
    };
    isLoading: boolean;
    canUpgradeFile: boolean;
    upgradeMessage?: string;
}

interface UserMetadata {
    subscription_plan?: SubscriptionPlan;
    user_type?: UserType;
}

export function useUserLimits(): UserLimitsInfo {
    // 使用 useUser 來獲取用戶資料
    const { isLoaded: authLoaded } = useAuth();
    const { user, isLoaded: userLoaded } = useUser();
    const [userType, setUserType] = useState<UserType>('GENERAL');
    const [plan, setPlan] = useState<SubscriptionPlan>('free');
    const [isLoading, setIsLoading] = useState(true);

    // 檢查是否完全載入
    const isFullyLoaded = authLoaded && userLoaded;

    // 根據訂閱計畫決定用戶類型
    const getUserTypeFromPlan = (subscriptionPlan: SubscriptionPlan): UserType => {
        switch (subscriptionPlan) {
            case 'professional':
            case 'enterprise':
                return 'PROFESSIONAL';
            case 'basic':
            case 'free':
            default:
                return 'GENERAL';
        }
    };

    // 從 Clerk 用戶資料中提取訂閱資訊
    useEffect(() => {
        if (isFullyLoaded) {
            if (user) {
                // 安全的類型斷言
                const metadata = (user.publicMetadata || {}) as UserMetadata;
                
                // 從用戶 metadata 取得訂閱計畫
                const userPlan = metadata.subscription_plan || 'free';
                const userTypeFromPlan = metadata.user_type || getUserTypeFromPlan(userPlan);
                
                setPlan(userPlan);
                setUserType(userTypeFromPlan);
            } else {
                // 未登入用戶使用預設值
                setPlan('free');
                setUserType('GENERAL');
            }
            setIsLoading(false);
        }
    }, [isFullyLoaded, user]);

    // 計算限制資訊
    const limitsInfo = useMemo((): UserLimitsInfo => {
        const limits = FileProcessor.getUserLimits(userType);
        
        const formattedLimits = {
            maxSize: FileProcessor.formatFileSize(limits.maxSizeBytes),
            maxRows: limits.maxRows.toLocaleString(),
            maxColumns: limits.maxColumns.toLocaleString(),
            userTypeName: userType === 'PROFESSIONAL' ? '專業版' : '一般版',
            planName: getPlanDisplayName(plan)
        };

        const canUpgradeFile = userType === 'GENERAL';
        const upgradeMessage = canUpgradeFile 
            ? `升級到專業版可享有更大的檔案限制 (${FileProcessor.formatFileSize(FileProcessor.USER_LIMITS.PROFESSIONAL.maxSizeBytes)}、${FileProcessor.USER_LIMITS.PROFESSIONAL.maxRows.toLocaleString()} 筆資料)`
            : undefined;

        return {
            userType,
            plan,
            limits,
            formattedLimits,
            isLoading,
            canUpgradeFile,
            upgradeMessage
        };
    }, [userType, plan, isLoading]);

    return limitsInfo;
}

// 訂閱計畫顯示名稱
function getPlanDisplayName(plan: SubscriptionPlan): string {
    switch (plan) {
        case 'free':
            return '免費版';
        case 'basic':
            return '基礎版';
        case 'professional':
            return '專業版';
        case 'enterprise':
            return '企業版';
        default:
            return '未知版本';
    }
}

// 檢查檔案是否超出用戶限制
export function useFileValidation() {
    const { limits, userType } = useUserLimits();

    const validateFile = (file: File) => {
        return FileProcessor.validateFile(file, userType);
    };

    const checkFileLimits = (file: File) => {
        return FileProcessor.checkFileLimits(file, undefined, userType);
    };

    const getFileSizeWarning = (file: File): string | null => {
        const fileSize = file.size;
        const maxSize = limits.maxSizeBytes;
        const warningThreshold = maxSize * 0.8; // 80% 警告閾值

        if (fileSize > warningThreshold && fileSize <= maxSize) {
            const percentage = Math.round((fileSize / maxSize) * 100);
            return `檔案大小已達限制的 ${percentage}%，建議檢查檔案內容或考慮升級方案`;
        }

        return null;
    };

    return {
        validateFile,
        checkFileLimits,
        getFileSizeWarning,
        limits
    };
}