"use client";

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
};

type MultiSelectProps = {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
};

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
          className={cn("w-[442px] h-[50px] justify-between px-4 border border-[#C4C8D0] rounded-md", "w-full justify-between text-[#0F2844] text-[20px] tracking-[2px] leading-[30px] font-normal font-[Noto_Sans_TC]", !selected.length && "text-[#0F2844]/50")}
        >
          {selected.length
            ? `${selected.length} 個變項已選`
            : placeholder || "請選擇..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[442px] p-0">
        <ScrollArea className="max-h-60 overflow-y-auto">
          <Command>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className="cursor-pointer hover:bg-[#C4C8D0]"
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-md border border-[#0F2844]",
                      selected.includes(option.value) ? "bg-[#0F2844] text-white" : "bg-white"
                    )}
                  >
                    {selected.includes(option.value) && <Check className="h-4 w-4" />}
                  </div>
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
