import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { AppError } from '@/types/errors';
import { ErrorCode, ErrorContext } from '@/utils/error';

interface ErrorDisplayProps {
    error: AppError | null;
    onClearError: () => void;
    onRetry?: () => void;
}

export default function ErrorDisplay({ 
    error, 
    onClearError, 
    onRetry 
}: ErrorDisplayProps) {
    if (!error) return null;

    const getSeverityColor = () => {
        switch (error.code) {
            case ErrorCode.PRIVACY_ERROR:
                return "bg-red-50 border-red-200 text-red-800";
            case ErrorCode.AUTH_ERROR:
                return "bg-blue-50 border-blue-200 text-blue-800";
            case ErrorCode.NETWORK_ERROR:
            case ErrorCode.RATE_LIMIT_ERROR:
                return "bg-yellow-50 border-yellow-200 text-yellow-800";
            default:
                return "bg-red-50 border-red-200 text-red-800";
        }
    };

    const getIcon = () => {
        switch (error.code) {
            case ErrorCode.PRIVACY_ERROR:
            case ErrorCode.AUTH_ERROR:
                return <Shield className="w-5 h-5" />;
            case ErrorCode.NETWORK_ERROR:
            case ErrorCode.RATE_LIMIT_ERROR:
                return <AlertTriangle className="w-5 h-5" />;
            default:
                return <AlertTriangle className="w-5 h-5" />;
        }
    };

    return (
        <div className={`mb-4 p-4 rounded-lg border ${getSeverityColor()}`}>
            <div className="flex items-center gap-2 mb-2">
                {getIcon()}
                <span className="font-medium">發生錯誤</span>
                {error.correlationId && (
                    <span className="text-xs opacity-60">#{error.correlationId.slice(-8)}</span>
                )}
            </div>
            <p className="text-sm mb-3">{error.userMessage}</p>
            <p className="text-xs mb-3 opacity-80">建議動作：{error.action}</p>
            <div className="flex gap-2">
                <button
                    onClick={onClearError}
                    className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm transition-colors"
                >
                    關閉
                </button>
                {error.context === ErrorContext.ANALYSIS && onRetry && (
                    <button
                        onClick={onRetry}
                        className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm transition-colors"
                    >
                        重試
                    </button>
                )}
            </div>
        </div>
    );
}