"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";

interface SavedFilter {
  id: string;
  name: string;
}

interface SaveFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  onSaved: () => void;
}

export function SaveFilterModal({ isOpen, onClose, filters, onSaved }: SaveFilterModalProps) {
  const [activeTab, setActiveTab] = useState<"new" | "existing">("new");
  const [name, setName] = useState("");
  const [selectedFilterId, setSelectedFilterId] = useState("");
  const [existingFilters, setExistingFilters] = useState<SavedFilter[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (isOpen && status === "authenticated") {
      fetchExistingFilters();
      setName("");
      setSelectedFilterId("");
      setActiveTab("new");
    }
  }, [isOpen, status]);

  const fetchExistingFilters = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/saved-filters`, {
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setExistingFilters(data);
      }
    } catch (err) {
      console.error("Failed to fetch saved filters", err);
    }
  };

  const handleSave = async () => {
    if (activeTab === "new" && !name.trim()) {
      toast.error("Please enter a filter name");
      return;
    }
    if (activeTab === "existing" && !selectedFilterId) {
      toast.error("Please select a filter to update");
      return;
    }

    setLoading(true);
    try {
      let res;
      if (activeTab === "new") {
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/saved-filters`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(session as any)?.accessToken}`,
          },
          body: JSON.stringify({ name, filters }),
        });
      } else {
        const filterName = existingFilters.find(f => f.id === selectedFilterId)?.name || "Updated Filter";
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/saved-filters/${selectedFilterId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(session as any)?.accessToken}`,
          },
          body: JSON.stringify({ name: filterName, filters }),
        });
      }

      if (res.ok) {
        toast.success(activeTab === "new" ? "Filter saved successfully!" : "Filter updated successfully!");
        onSaved();
        onClose();
      } else {
        toast.error(activeTab === "new" ? "Failed to save filter" : "Failed to update filter");
      }
    } catch (err) {
      toast.error("An error occurred while saving the filter");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Current Filter</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "new" | "existing")} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new">Save as New</TabsTrigger>
            <TabsTrigger value="existing">Update Existing</TabsTrigger>
          </TabsList>
          
          <TabsContent value="new" className="pt-4 pb-2">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">Filter Name</label>
              <Input
                id="name"
                placeholder="e.g. High Value Odisha Tenders"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="existing" className="pt-4 pb-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Select Filter to Overwrite</label>
              {existingFilters.length > 0 ? (
                <Select value={selectedFilterId} onValueChange={setSelectedFilterId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a saved filter" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingFilters.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-slate-500 italic p-2 border rounded bg-slate-50">
                  No existing filters found.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || (activeTab === "new" && !name.trim()) || (activeTab === "existing" && !selectedFilterId)}
          >
            {loading ? "Saving..." : (activeTab === "new" ? "Save Filter" : "Update Filter")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
