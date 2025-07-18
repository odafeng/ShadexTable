"use client";

import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { typeColorClass } from "@/lib/constants";

type OptionType = {
  label: string;
  value: string;
  type?: string; // "類別變項", "連續變項", etc.
};

type GroupSelectProps = {
  options: OptionType[];
  selected: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function GroupSelect({
  options,
  selected,
  onChange,
  placeholder,
}: GroupSelectProps) {
  // 加入「不分組」的選項在最上方
  const enhancedOptions: OptionType[] = [
    { label: "不分組", value: "", type: "不明" },
    ...options,
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "w-[442px] h-[50px] justify-between px-4 border border-[#C4C8D0] rounded-md",
            "text-[#0F2844] text-[20px] tracking-[2px] leading-[30px] font-normal font-[Noto_Sans_TC]",
            selected === "" && "text-[#0F2844]"
          )}
        >
          {selected !== null
            ? enhancedOptions.find((opt) => opt.value === selected)?.label || "選擇變項"
            : placeholder || "選擇變項"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[442px] p-0">
        <ScrollArea className="max-h-60 overflow-y-auto">
          <Command>
            <CommandGroup>
              {enhancedOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => onChange(option.value)}
                  className="cursor-pointer hover:bg-[#C4C8D0]"
                >
                  <div className="mr-2 flex h-4 w-4 items-center justify-center">
                    {selected === option.value && (
                      <Check className="h-4 w-4 text-[#0F2844]" />
                    )}
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
