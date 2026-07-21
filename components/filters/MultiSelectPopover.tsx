"use client";

import React, { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiSelectPopoverProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  allowCustom?: boolean;
  lockedOptions?: string[];
  onLockedClick?: (opt: string) => void;
  optionCounts?: Record<string, number>;
}

export function MultiSelectPopover({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = "Search...",
  className,
  allowCustom = false,
  lockedOptions = [],
  onLockedClick,
  optionCounts,
}: MultiSelectPopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [localSelected, setLocalSelected] = useState<string[]>(selectedValues);

  // Sync local state when popover opens/closes
  React.useEffect(() => {
    if (open) {
      setLocalSelected(selectedValues);
    }
  }, [open, selectedValues]);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const lowerSearch = search.toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(lowerSearch));
  }, [options, search]);

  const toggleOption = (opt: string) => {
    setLocalSelected((prev) =>
      prev.includes(opt) ? prev.filter((p) => p !== opt) : [...prev, opt]
    );
  };



  const handleApply = () => {
    onChange(localSelected);
    setOpen(false);
  };

  const handleReset = () => {
    setLocalSelected([]);
    onChange([]);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between border-blue-100 bg-white hover:bg-blue-50 hover:text-blue-600 text-slate-700 min-w-[120px] rounded-full",
            selectedValues.length > 0 && "border-blue-300 bg-blue-50 text-blue-700 font-semibold",
            className
          )}
        >
          {label} {selectedValues.length > 0 && `(${selectedValues.length})`}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[450px] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        {localSelected.length > 0 && (
          <div className="p-3 bg-slate-50 border-b">
            <p className="text-xs font-semibold text-slate-500 mb-2">Selected {label} ({localSelected.length})</p>
            <div className="flex flex-wrap gap-2">
              {localSelected.map((val) => (
                <div key={val} className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-md">
                  <span className="truncate max-w-[150px]">{val}</span>
                  <X className="h-3 w-3 cursor-pointer hover:text-blue-900" onClick={(e) => {
                    e.stopPropagation();
                    setLocalSelected(prev => prev.filter(p => p !== val));
                  }} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="max-h-[300px] overflow-y-auto p-1 grid grid-cols-2 gap-1">
          {allowCustom && search.trim() && !options.some(o => o.toLowerCase() === search.trim().toLowerCase()) && !localSelected.includes(search.trim()) && (
            <label className="flex items-start gap-2 rounded-sm px-2 py-2 text-sm hover:bg-slate-100 cursor-pointer col-span-2 border border-blue-100 bg-blue-50/50">
              <Checkbox
                checked={false}
                onCheckedChange={() => {
                  toggleOption(search.trim());
                  setSearch("");
                }}
                className="mt-0.5"
              />
              <span className="leading-tight text-blue-700 font-medium">Add "{search.trim()}"</span>
            </label>
          )}

          {filteredOptions.length === 0 && (!allowCustom || !search.trim()) ? (
            <p className="p-4 text-sm text-muted-foreground col-span-2 text-center">No results found.</p>
          ) : (
            filteredOptions.map((opt) => {
              const isLocked = lockedOptions.includes(opt);
              return (
              <label
                key={opt}
                className={cn("flex items-start gap-2 rounded-sm px-2 py-2 text-sm transition-all", isLocked ? "opacity-50 grayscale cursor-pointer" : "hover:bg-slate-100 cursor-pointer")}
                onClick={(e) => {
                  if (isLocked) {
                    e.preventDefault();
                    if (onLockedClick) onLockedClick(opt);
                  }
                }}
              >
                <Checkbox
                  checked={localSelected.includes(opt)}
                  onCheckedChange={() => {
                    if (!isLocked) toggleOption(opt);
                  }}
                  disabled={isLocked}
                  className="mt-0.5"
                />
                <span className="leading-tight text-slate-700 flex flex-1 items-center gap-1.5 w-full">
                  <span className="flex-1">{opt}</span>
                  {optionCounts && optionCounts[opt] !== undefined && (
                    <span className="ml-auto text-[10px] font-semibold text-slate-400 bg-slate-100 rounded px-1.5 py-0.5 tabular-nums shrink-0">
                      {optionCounts[opt].toLocaleString()}
                    </span>
                  )}
                  {isLocked && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 shrink-0"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                </span>
              </label>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t p-3 bg-slate-50">
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-blue-600 font-semibold hover:bg-blue-100">
            Reset
          </Button>
          <Button size="sm" onClick={handleApply} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold">
            Apply Now
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
