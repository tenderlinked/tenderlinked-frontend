"use client";

import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AmountRangePopoverProps {
  minAmount?: string;
  maxAmount?: string;
  onChange: (min: string, max: string) => void;
  className?: string;
}

const PREDEFINED_RANGES = [
  { label: "Under ₹10 Lakhs", min: "", max: "1000000" },
  { label: "₹10L - ₹50L", min: "1000000", max: "5000000" },
  { label: "₹50L - ₹1Cr", min: "5000000", max: "10000000" },
  { label: "₹1Cr - ₹5Cr", min: "10000000", max: "50000000" },
  { label: "Above ₹5Cr", min: "50000000", max: "" },
];

export function AmountRangePopover({
  minAmount = "",
  maxAmount = "",
  onChange,
  className,
}: AmountRangePopoverProps) {
  const [open, setOpen] = useState(false);
  const [localMin, setLocalMin] = useState(minAmount);
  const [localMax, setLocalMax] = useState(maxAmount);
  const [includeNA, setIncludeNA] = useState(true); // Always true for now unless we add backend logic to exclude NAs

  // Sync state
  React.useEffect(() => {
    if (open) {
      setLocalMin(minAmount);
      setLocalMax(maxAmount);
    }
  }, [open, minAmount, maxAmount]);

  const handleApply = () => {
    onChange(localMin, localMax);
    setOpen(false);
  };

  const handleReset = () => {
    setLocalMin("");
    setLocalMax("");
    onChange("", "");
    setOpen(false);
  };

  const isActive = Boolean(minAmount || maxAmount);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between border-blue-100 bg-white hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-full",
            isActive && "border-blue-300 bg-blue-50 text-blue-700 font-semibold",
            className
          )}
        >
          Tender Amount
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[450px] p-0" align="start">
        <div className="p-4 bg-white rounded-t-md">
          <div className="mb-4">
            <label className="text-xs font-semibold text-slate-600 mb-2 block">Quick Ranges</label>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_RANGES.map((range, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setLocalMin(range.min);
                    setLocalMax(range.max);
                  }}
                  className={cn(
                    "px-3 py-1.5 text-[11px] font-semibold rounded-full border transition-colors",
                    localMin === range.min && localMax === range.max
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-semibold text-slate-600">Minimum</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-medium">₹</span>
                <input
                  type="number"
                  className="w-full pl-8 pr-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Enter Amount"
                  value={localMin}
                  onChange={(e) => setLocalMin(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex-1 space-y-1">
              <label className="text-xs font-semibold text-slate-600">Maximum</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-medium">₹</span>
                <input
                  type="number"
                  className="w-full pl-8 pr-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Enter Amount"
                  value={localMax}
                  onChange={(e) => setLocalMax(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-2">
            <Checkbox id="include-na" checked={includeNA} onCheckedChange={(c) => setIncludeNA(!!c)} />
            <label htmlFor="include-na" className="text-sm text-slate-600 font-medium cursor-pointer">
              Add Tenders with NA amount
            </label>
          </div>
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
