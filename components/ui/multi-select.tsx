"use client";

import * as React from "react";
import { X, Check, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type OptionType = {
  value: string;
  label: string;
  count?: number;
};

interface MultiSelectProps {
  options: OptionType[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  emptyText = "No results found.",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item));
  };

  const exactMatch = options.some((opt) => opt.label.toLowerCase() === inputValue.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex min-h-[48px] w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
            className
          )}
          onClick={() => setOpen(!open)}
        >
          <div className="flex flex-wrap gap-1 w-full">
            {selected.length === 0 && <span className="text-muted-foreground">{placeholder}</span>}
            {selected.map((item) => {
              const option = options.find((o) => o.value === item) || { label: item, value: item };
              return (
                <Badge
                  key={option.value}
                  variant="secondary"
                  className="mr-1 hover:bg-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnselect(option.value);
                  }}
                >
                  {option.label}
                  <div
                    role="button"
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUnselect(option.value);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUnselect(option.value);
                    }}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </div>
                </Badge>
              );
            })}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{ width: "var(--radix-popover-trigger-width)" }}>
        <Command>
          <CommandInput placeholder="Search..." value={inputValue} onValueChange={setInputValue} />
          <CommandEmpty>{emptyText}</CommandEmpty>
          <CommandList className="max-h-60 overflow-y-auto">
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      if (isSelected) {
                        onChange(selected.filter((item) => item !== option.value));
                      } else {
                        onChange([...selected, option.value]);
                        setInputValue("");
                      }
                    }}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className={cn("h-4 w-4")} />
                    </div>
                    <span>{option.label}</span>
                    {option.count !== undefined && (
                      <span className="ml-auto text-xs text-muted-foreground">({option.count})</span>
                    )}
                  </CommandItem>
                );
              })}
              {!exactMatch && inputValue.trim().length > 0 && (
                <CommandItem
                  value={inputValue}
                  onSelect={() => {
                    onChange([...selected, inputValue]);
                    setInputValue("");
                  }}
                >
                  <div className="mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-transparent" />
                  <span>{inputValue}</span>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
