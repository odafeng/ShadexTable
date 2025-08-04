import React, { useState } from 'react';

type ToggleSwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  labelClassName?: string;
};

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ 
  checked, 
  onCheckedChange, 
  label = "啟用資料編輯功能",
  size = "md",
  className = "",
  labelClassName = ""
}) => {
  const sizeClasses = {
    sm: {
      switch: "w-10 h-5",
      thumb: "w-4 h-4",
      translate: "translate-x-5"
    },
    md: {
      switch: "w-12 h-6",
      thumb: "w-5 h-5",
      translate: "translate-x-6"
    },
    lg: {
      switch: "w-14 h-7",
      thumb: "w-6 h-6", 
      translate: "translate-x-7"
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center gap-3 group ${className}`}>
      {/* 開關按鈕 */}
      <button
        type="button"
        onClick={() => onCheckedChange(!checked)}
        className={`
          relative inline-flex ${currentSize.switch} items-center rounded-full 
          transition-all duration-300 ease-in-out transform hover:scale-105
          focus:outline-none focus:ring-4 focus:ring-blue-300/50 cursor-pointer
          ${checked 
            ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 shadow-lg shadow-blue-500/30' 
            : 'bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 shadow-md shadow-gray-400/20'
          }
        `}
        aria-checked={checked}
        role="switch"
      >
        {/* 背景光暈效果 */}
        <div className={`
          absolute inset-0 rounded-full transition-all duration-300
          ${checked 
            ? 'bg-gradient-to-r from-blue-400/20 via-blue-500/30 to-blue-600/20 animate-pulse' 
            : 'bg-gradient-to-r from-gray-200/10 via-gray-300/20 to-gray-400/10'
          }
        `} />
        
        {/* 滑動的圓形按鈕 */}
        <span className={`
          ${currentSize.thumb} bg-white rounded-full shadow-lg 
          transform transition-all duration-300 ease-in-out
          flex items-center justify-center relative z-10
          ${checked ? currentSize.translate : 'translate-x-0.5'}
          ${checked ? 'shadow-blue-200' : 'shadow-gray-300'}
        `}>
          {/* 內部圖示 */}
          <div className={`
            w-3 h-3 rounded-full transition-all duration-300
            ${checked 
              ? 'bg-gradient-to-br from-blue-400 to-blue-600' 
              : 'bg-gradient-to-br from-gray-300 to-gray-500'
            }
          `} />
          
          {/* 閃爍效果 */}
          {checked && (
            <div className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
          )}
        </span>

        {/* 狀態指示器 */}
        <div className={`
          absolute left-1.5 top-1/2 transform -translate-y-1/2
          transition-all duration-300 opacity-0
          ${checked ? 'opacity-100' : 'opacity-0'}
        `}>
          <div className="w-1 h-1 bg-white/60 rounded-full animate-pulse" />
        </div>
        
        <div className={`
          absolute right-1.5 top-1/2 transform -translate-y-1/2
          transition-all duration-300
          ${!checked ? 'opacity-100' : 'opacity-0'}
        `}>
          <div className="w-1 h-1 bg-white/40 rounded-full" />
        </div>
      </button>

      {/* 標籤 */}
      <label 
        onClick={() => onCheckedChange(!checked)}
        className={`text-[#1B3455] font-medium cursor-pointer select-none
                   transition-all duration-200 hover:text-[#0F2844]
                   ${labelClassName}`}
      >
        {label}
      </label>

      {/* 狀態文字 */}
      <span className={`
        text-xs font-bold transition-all duration-300 transform
        ${checked 
          ? 'text-blue-600 scale-105' 
          : 'text-gray-500 scale-95'
        }
      `}>
        {checked ? 'ON' : 'OFF'}
      </span>
    </div>
  );
};

export default ToggleSwitch;