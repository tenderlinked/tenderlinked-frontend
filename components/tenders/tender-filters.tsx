"use client";

import { Search, Flame, Settings, CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TenderFiltersProps {
  type: "district" | "state";
  onSearchChange: (val: string) => void;
  onFilterChange: (val: string) => void;
  onStatusChange: (val: string) => void;
}

export function TenderFilters({ type, onSearchChange, onFilterChange, onStatusChange }: TenderFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row items-center gap-4 py-5 px-5 w-full border-b border-slate-100">
      {/* Search Bar */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search tenders..."
          className="pl-9 bg-background"
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto flex-1 md:justify-end">
        {/* District / Org Filter */}
        <Select onValueChange={onFilterChange}>
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder={type === 'district' ? 'All Districts' : 'All Organisations'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{type === 'district' ? 'All Districts' : 'All Organisations'}</SelectItem>
            {/* These would ideally be populated dynamically based on data */}
            {type === 'district' ? (
              <>
                <SelectItem value="puri">Puri</SelectItem>
                <SelectItem value="gajapati">Gajapati</SelectItem>
                <SelectItem value="jharsuguda">Jharsuguda</SelectItem>
                <SelectItem value="sambalpur">Sambalpur</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="omc">Orissa Mining Corporation</SelectItem>
                <SelectItem value="municipal">Municipal Bodies</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select onValueChange={onStatusChange}>
          <SelectTrigger className="w-[140px] bg-background">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Picker Placeholder */}
        <div className="relative">
          <Input type="date" className="w-[160px] bg-background" />
        </div>

        {/* High Priority Toggle */}
        <Button variant="outline" className="gap-2 bg-background whitespace-nowrap">
          <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
          High Priority
        </Button>

        {/* Modify Keywords Button */}
        <Button variant="outline" className="gap-2 bg-background whitespace-nowrap">
          <Settings className="w-4 h-4 text-gray-500" />
          Modify Keywords
        </Button>
      </div>
    </div>
  );
}
