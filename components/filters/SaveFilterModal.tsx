"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";

interface SaveFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  onSaved: () => void;
}

export function SaveFilterModal({ isOpen, onClose, filters, onSaved }: SaveFilterModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a filter name");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/saved-filters`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
        body: JSON.stringify({ name, filters }),
      });

      if (res.ok) {
        toast.success("Filter saved successfully!");
        setName("");
        onSaved();
        onClose();
      } else {
        toast.error("Failed to save filter");
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
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="name" className="text-sm font-medium">Filter Name</label>
            <Input
              id="name"
              placeholder="e.g. High Value Odisha Tenders"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading || !name.trim()}>
            {loading ? "Saving..." : "Save Filter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
