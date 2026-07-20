"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface SavedFilter {
  id: string;
  name: string;
  filters: any;
}

interface SavedFiltersDropdownProps {
  onApplyFilter: (filters: any) => void;
  refreshTrigger: number;
}

export function SavedFiltersDropdown({ onApplyFilter, refreshTrigger }: SavedFiltersDropdownProps) {
  const { data: session, status } = useSession();
  const [filters, setFilters] = useState<SavedFilter[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFilters = async () => {
    if (status !== "authenticated") return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/saved-filters`, {
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setFilters(data);
      }
    } catch (err) {
      console.error("Failed to fetch saved filters", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, [status, refreshTrigger]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // prevent select from closing
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/saved-filters/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
      });
      if (res.ok) {
        toast.success("Filter deleted");
        fetchFilters();
      }
    } catch (err) {
      toast.error("Failed to delete filter");
    }
  };

  if (filters.length === 0 && !loading) {
    return (
      <Button variant="outline" size="sm" className="h-9 gap-2 text-slate-500 cursor-not-allowed">
        <Filter className="w-4 h-4" />
        Saved Filters (0)
      </Button>
    );
  }

  return (
    <Select onValueChange={(val) => {
      const selected = filters.find(f => f.id === val);
      if (selected) {
        onApplyFilter(selected.filters);
        toast.success(`Applied filter: ${selected.name}`);
      }
    }}>
      <SelectTrigger className="w-[180px] h-9 text-xs gap-2 font-medium bg-white">
        <Filter className="w-4 h-4 text-slate-500" />
        <SelectValue placeholder="Saved Filters" />
      </SelectTrigger>
      <SelectContent>
        {filters.map((f) => (
          <SelectItem key={f.id} value={f.id} className="group w-full cursor-pointer">
            <div className="flex items-center justify-between w-full gap-2">
              <span className="text-xs font-medium truncate flex-1 pr-4">{f.name}</span>
              <Trash2 
                className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity shrink-0" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete(e, f.id);
                }}
              />
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
