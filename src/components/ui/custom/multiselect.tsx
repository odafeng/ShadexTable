"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";

// ✅ [修改 #1]：定義 options 為含 label、value、type 的物件陣列
type MultiSelectOption = {
  label: string;
  value: string;
  type?: string; // e.g. "類別變項", "連續變項", "日期變項"
};

type MultiSelectProps = {
  options: MultiSelectOption[]; // ✅ 修改這裡
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
};

// ✅ [修改 #2]：引入顏色對應表
import { typeColorClass } from "@/lib/constants";

export function MultiSelect({ options, selected, onChange, placeholder }: MultiSelectProps) {
  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn("w-full justify-between", !selected.length && "text-muted-foreground")}
        >
          {selected.length ? selected.join(", ") : placeholder || "請選擇..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <ScrollArea className="max-h-60 overflow-y-auto">
          <Command>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem key={option.value} onSelect={() => handleSelect(option.value)}>
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                      selected.includes(option.value) ? "bg-primary text-primary-foreground" : ""
                    )}
                  >
                    {selected.includes(option.value) && <Check className="h-4 w-4" />}
                  </div>

                  {/* ✅ [修改 #3]：變項名稱根據型別加上顏色 class */}
                  <span className={typeColorClass[option.type ?? "不明"]}>
                    {option.label}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
