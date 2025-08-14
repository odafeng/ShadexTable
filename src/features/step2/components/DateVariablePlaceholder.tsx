// step2/components/DateVariablePlaceholder.tsx
"use client";

import { useState } from 'react';
import { Calendar, Clock, Bell, CheckCircle } from 'lucide-react';

export default function DateVariablePlaceholder() {
    const [showNotification, setShowNotification] = useState(false);

    return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-6 border border-amber-200 animate-fadeIn">
            <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-amber-600" />
                    </div>
                </div>
                <div className="flex-1">
                    <h3 className="text-base font-semibold text-amber-900 mb-2">
                        日期變項視覺化即將推出
                    </h3>
                    <p className="text-sm text-amber-700 mb-3">
                        我們正在開發時間序列圖表功能，讓您能夠更好地分析時間趨勢。
                    </p>
                    <div className="flex items-center space-x-4">
                        <span className="inline-flex items-center text-xs text-amber-600">
                            <Clock className="w-3 h-3 mr-1" />
                            預計上線時間：2025 Q1
                        </span>
                        <button
                            onClick={() => setShowNotification(true)}
                            className="text-xs text-amber-700 font-medium hover:text-amber-800 transition-colors"
                        >
                            <Bell className="w-3 h-3 inline mr-1" />
                            通知我
                        </button>
                    </div>
                    {showNotification && (
                        <div className="mt-3 p-2 bg-amber-100 rounded text-xs text-amber-800">
                            <CheckCircle className="w-3 h-3 inline mr-1" />
                            感謝您的關注！功能上線時我們會通知您。
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}