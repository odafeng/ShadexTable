"use client";

import { useState, useRef, useCallback } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { typeColorClass } from "@/lib/constants"; // 顏色對應表

type MultiSelectOption = {
  label: string;
  value: string;
  type?: string; // "類別變項", "連續變項", etc.
  disabled?: boolean;
};

type MultiSelectProps = {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  popoverClassName?: string;
  enableDragSelect?: boolean; // 是否啟用拖曳多選，預設為 true
  showDragRect?: boolean; // 是否顯示拖曳長方形，預設為 false
};

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  disabled,
  className,
  popoverClassName,
  enableDragSelect = true,
  showDragRect = false, // 預設不顯示拖曳長方形
}: MultiSelectProps) {
  // 拖曳多選相關狀態
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragSelection, setDragSelection] = useState<string[]>([]);
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null);
  const [dragThreshold] = useState(5); // 拖曳閾值（像素）
  const [dragMode, setDragMode] = useState<'select' | 'deselect' | null>(null); // 拖曳模式
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  // 處理單一選項選取
  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  // 處理滑鼠按下事件
  const handleMouseDown = useCallback((e: React.MouseEvent, startOnItem?: string) => {
    if (!enableDragSelect || e.button !== 0) return; // 只處理左鍵點擊
    
    
    
    const rect = scrollAreaRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mousePos = { x: e.clientX, y: e.clientY };
    setMouseDownPos(mousePos);
    setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDragSelection([]);
    
    // 根據開始拖曳的項目狀態決定拖曳模式
    if (startOnItem) {
      const isCurrentlySelected = selected.includes(startOnItem);
      const mode = isCurrentlySelected ? 'deselect' : 'select';
      
      setDragMode(mode);
    } else {
      setDragMode('select'); // 預設為選取模式
    }
    
    // 防止文字選取
    e.preventDefault();
    e.stopPropagation();
  }, [enableDragSelect, selected]);

  // 處理滑鼠移動事件
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!enableDragSelect || !mouseDownPos || !dragStart || !dragMode) return;

    const currentMousePos = { x: e.clientX, y: e.clientY };
    const distance = Math.sqrt(
      Math.pow(currentMousePos.x - mouseDownPos.x, 2) + 
      Math.pow(currentMousePos.y - mouseDownPos.y, 2)
    );

    // 超過閾值才開始拖曳
    if (distance > dragThreshold && !isDragging) {
      setIsDragging(true);
      e.preventDefault();
    }

    if (!isDragging) return;

    const rect = scrollAreaRef.current?.getBoundingClientRect();
    if (!rect) return;

    // 更新當前滑鼠位置
    setMouseDownPos(currentMousePos);

    const currentPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const selectionRect = {
      left: Math.min(dragStart.x, currentPos.x),
      top: Math.min(dragStart.y, currentPos.y),
      right: Math.max(dragStart.x, currentPos.x),
      bottom: Math.max(dragStart.y, currentPos.y)
    };

    // 找出拖曳範圍內的選項，根據拖曳模式過濾
    const newSelection: string[] = [];
    const container = scrollAreaRef.current;
    if (container) {
      const items = container.querySelectorAll('[data-option-value]:not([data-disabled="true"])');
      items.forEach((item) => {
        const itemRect = item.getBoundingClientRect();
        const relativeRect = {
          left: itemRect.left - rect.left,
          top: itemRect.top - rect.top,
          right: itemRect.right - rect.left,
          bottom: itemRect.bottom - rect.top
        };

        // 檢查是否在選取範圍內
        if (relativeRect.left < selectionRect.right &&
            relativeRect.right > selectionRect.left &&
            relativeRect.top < selectionRect.bottom &&
            relativeRect.bottom > selectionRect.top) {
          const optionValue = item.getAttribute('data-option-value');
          if (optionValue) {
            // 根據拖曳模式決定要包含哪些項目
            if (dragMode === 'select') {
              // 選取模式：只包含尚未選中的項目
              if (!selected.includes(optionValue)) {
                newSelection.push(optionValue);
              }
            } else if (dragMode === 'deselect') {
              // 取消選取模式：只包含已選中的項目
              if (selected.includes(optionValue)) {
                newSelection.push(optionValue);
              }
            }
          }
        }
      });
    }

    
    setDragSelection(newSelection);
  }, [enableDragSelect, mouseDownPos, dragStart, isDragging, dragThreshold, dragMode, selected]);

  // 處理滑鼠放開事件
  const handleMouseUp = useCallback((clickedValue?: string) => {
    if (!enableDragSelect) return;

    if (isDragging && dragSelection.length > 0) {
      // 處理拖曳選取/取消選取
      let newSelected = [...selected];
      
      if (dragMode === 'select') {
        // 選取模式：添加未選中的項目
        dragSelection.forEach(value => {
          if (!newSelected.includes(value)) {
            newSelected.push(value);
          }
        });
      } else if (dragMode === 'deselect') {
        // 取消選取模式：移除已選中的項目
        newSelected = newSelected.filter(value => !dragSelection.includes(value));
      }
      
      onChange(newSelected);
    } else if (clickedValue && !isDragging) {
      // 處理單擊選取
      handleSelect(clickedValue);
    }

    // 重置拖曳狀態
    setIsDragging(false);
    setDragStart(null);
    setDragSelection([]);
    setMouseDownPos(null);
    setDragMode(null);
  }, [enableDragSelect, isDragging, dragSelection, dragMode, selected, onChange]);

  // 處理滑鼠離開事件
  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      handleMouseUp();
    }
  }, [isDragging, handleMouseUp]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn(
            "w-full h-[50px] justify-between px-4 border border-[#C4C8D0] rounded-md cursor-pointer",
            "text-[#0F2844] text-[20px] tracking-[2px] leading-[30px] font-normal font-[Noto_Sans_TC]",
            !selected.length && "text-[#0F2844]/50",
            className
          )}
        >
          {selected.length
            ? `${selected.length} 個變項已選`
            : placeholder || "請選擇..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className={cn("w-full p-0", popoverClassName)}>
        <ScrollArea 
          className="max-h-60 overflow-y-auto relative"
          ref={scrollAreaRef}
        >
          <div
            className="relative"
            onMouseDown={(e) => handleMouseDown(e)}
            onMouseMove={handleMouseMove}
            onMouseUp={() => handleMouseUp()}
            onMouseLeave={handleMouseLeave}
            style={{ 
              userSelect: isDragging ? 'none' : 'auto',
              WebkitUserSelect: isDragging ? 'none' : 'auto'
            }}
          >
            {/* 拖曳選取範圍視覺指示器 - 只有在 showDragRect 為 true 時才顯示 */}
            {showDragRect && isDragging && dragStart && mouseDownPos && scrollAreaRef.current && (
              <div
                className={cn(
                  "absolute border pointer-events-none z-10 opacity-60",
                  dragMode === 'select' 
                    ? "bg-blue-200 border-blue-400" 
                    : "bg-red-200 border-red-400"
                )}
                style={{
                  left: Math.min(dragStart.x, mouseDownPos.x - scrollAreaRef.current.getBoundingClientRect().left),
                  top: Math.min(dragStart.y, mouseDownPos.y - scrollAreaRef.current.getBoundingClientRect().top),
                  width: Math.abs(mouseDownPos.x - scrollAreaRef.current.getBoundingClientRect().left - dragStart.x),
                  height: Math.abs(mouseDownPos.y - scrollAreaRef.current.getBoundingClientRect().top - dragStart.y)
                }}
              />
            )}

            <div className="p-1">
                {options.map((option) => {
                  const isSelected = selected.includes(option.value);
                  const isDragSelected = enableDragSelect && dragSelection.includes(option.value);
                  
                  // 計算最終顯示狀態
                  let finalSelected = isSelected;
                  if (isDragSelected) {
                    if (dragMode === 'select') {
                      finalSelected = true; // 選取模式：會被選中
                    } else if (dragMode === 'deselect') {
                      finalSelected = false; // 取消選取模式：會被取消
                    }
                  }
                  
                  return (
                    <div
                      key={option.value}
                      data-option-value={option.value}
                      data-disabled={option.disabled}
                      onMouseDown={(e) => {
                        if (!option.disabled && enableDragSelect) {
                          
                          handleMouseDown(e, option.value);
                        }
                      }}
                      className={cn(
                        "flex items-center space-x-2 px-3 py-2 cursor-pointer transition-colors rounded-sm text-[20px]",
                        !option.disabled && "hover:bg-[#C4C8D0]",
                        option.disabled && "cursor-not-allowed opacity-50 pointer-events-none",
                        finalSelected && "bg-blue-50",
                        isDragSelected && dragMode === 'select' && "bg-blue-100 border border-blue-300",
                        isDragSelected && dragMode === 'deselect' && "bg-red-100 border border-red-300"
                      )}
                      onClick={(e) => {
                        if (!option.disabled && !isDragging) {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSelect(option.value);
                        }
                      }}
                    >
                      <div
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-md border border-[#0F2844]",
                          finalSelected ? "bg-[#0F2844] text-white" : "bg-white"
                        )}
                      >
                        {finalSelected && <Check className="h-4 w-4" />}
                      </div>
                      <span className={typeColorClass[option.type ?? "不明"]}>
                        {option.label}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </ScrollArea>

        {/* 使用說明 */}
        {enableDragSelect && (
          <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-600 space-y-1">
              <div>💡 <strong>拖曳多選</strong>：在未選項目上開始拖曳來批量選取</div>
              <div>💡 <strong>拖曳取消</strong>：在已選項目上開始拖曳來批量取消選取</div>
              <div>💡 <strong>單擊切換</strong>：直接點擊選項來切換選取狀態</div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
} 