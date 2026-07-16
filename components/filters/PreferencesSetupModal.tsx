"use client";

import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, MapPin, Key, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

interface PreferencesSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  limits: { maxStates: number; maxKeywords: number; unlockedStates: string[]; unlockedKeywords: string[] };
  statesList: { name: string; count: number }[];
  keywordsList: { keyword: string; count: number }[];
}

export function PreferencesSetupModal({
  isOpen,
  onClose,
  onSaved,
  limits,
  statesList,
  keywordsList,
}: PreferencesSetupModalProps) {
  const { data: session } = useSession();
  const [selectedStates, setSelectedStates] = useState<string[]>([...limits.unlockedStates]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([...limits.unlockedKeywords]);
  
  const [searchState, setSearchState] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedStates([...limits.unlockedStates]);
      setSelectedKeywords([...limits.unlockedKeywords]);
      setSearchState("");
      setSearchKeyword("");
    }
  }, [isOpen, limits]);

  const filteredStates = useMemo(() => {
    if (!searchState) return statesList;
    return statesList.filter(s => s.name.toLowerCase().includes(searchState.toLowerCase()));
  }, [statesList, searchState]);

  const filteredKeywords = useMemo(() => {
    if (!searchKeyword) return keywordsList;
    return keywordsList.filter(k => k.keyword.toLowerCase().includes(searchKeyword.toLowerCase()));
  }, [keywordsList, searchKeyword]);

  const toggleState = (state: string) => {
    if (limits.unlockedStates.includes(state)) return; // Can't unselect permanently locked ones
    setSelectedStates(prev => {
      if (prev.includes(state)) return prev.filter(s => s !== state);
      if (prev.length >= limits.maxStates) return prev;
      return [...prev, state];
    });
  };

  const toggleKeyword = (keyword: string) => {
    if (limits.unlockedKeywords.includes(keyword)) return; // Can't unselect permanently locked ones
    setSelectedKeywords(prev => {
      if (prev.includes(keyword)) return prev.filter(k => k !== keyword);
      if (prev.length >= limits.maxKeywords) return prev;
      return [...prev, keyword];
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = (session as any)?.accessToken;
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

      // Find which ones are newly selected
      const newStates = selectedStates.filter(s => !limits.unlockedStates.includes(s));
      const newKeywords = selectedKeywords.filter(k => !limits.unlockedKeywords.includes(k));

      // Unlock States
      const statePromises = newStates.map(state => 
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/billing/unlock/state`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ state })
        }).then(async res => {
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Failed to unlock state');
          }
          return res.json();
        })
      );

      // Unlock Keywords
      const keywordPromises = newKeywords.map(keyword => 
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/billing/unlock/keyword`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ keyword })
        }).then(async res => {
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Failed to unlock keyword');
          }
          return res.json();
        })
      );

      await Promise.all([...statePromises, ...keywordPromises]);
      
      onSaved();
      onClose();
    } catch (error) {
      console.error("Failed to save preferences", error);
    } finally {
      setLoading(false);
    }
  };

  const canSave = selectedStates.length > limits.unlockedStates.length || selectedKeywords.length > limits.unlockedKeywords.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-slate-50">
          <DialogTitle className="text-xl">Set Up Your Preferences</DialogTitle>
          <DialogDescription>
            Select the states and keywords you want to monitor. These selections will be permanently locked for the month and determine which tenders appear in your feed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2">
          {/* States Column */}
          <div className="flex flex-col border-r border-slate-100">
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  States
                </div>
                <div className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {selectedStates.length} / {limits.maxStates} Slots Used
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search states..." 
                  className="pl-9 h-9 text-sm"
                  value={searchState}
                  onChange={(e) => setSearchState(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 bg-slate-50/50" style={{ maxHeight: '400px' }}>
              <div className="grid grid-cols-1 gap-1">
                {filteredStates.map(stateObj => {
                  const state = stateObj.name;
                  const count = stateObj.count;
                  const isLocked = limits.unlockedStates.includes(state);
                  const isSelected = selectedStates.includes(state);
                  const isDisabled = isLocked || (!isSelected && selectedStates.length >= limits.maxStates);
                  return (
                    <div 
                      key={state} 
                      onClick={() => !isDisabled && toggleState(state)}
                      className={`flex items-center justify-between gap-3 p-2.5 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/80 border-blue-100' : 'hover:bg-slate-100 border-transparent'} border`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          checked={isSelected}
                          disabled={isDisabled}
                          // onCheckedChange handled by parent div
                        />
                        <span className={`text-sm ${isLocked ? 'text-slate-400' : 'text-slate-700'}`}>
                          {state}
                          {isLocked && <span className="ml-2 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-medium">Locked</span>}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">({count})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Keywords Column */}
          <div className="flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Key className="w-4 h-4 text-emerald-600" />
                  Keywords
                </div>
                <div className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {selectedKeywords.length} / {limits.maxKeywords} Slots Used
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search keywords..." 
                  className="pl-9 h-9 text-sm"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 bg-slate-50/50" style={{ maxHeight: '400px' }}>
              <div className="grid grid-cols-1 gap-1">
                {filteredKeywords.map(kwObj => {
                  const keyword = kwObj.keyword;
                  const count = kwObj.count;
                  const isLocked = limits.unlockedKeywords.includes(keyword);
                  const isSelected = selectedKeywords.includes(keyword);
                  const isDisabled = isLocked || (!isSelected && selectedKeywords.length >= limits.maxKeywords);
                  return (
                    <div 
                      key={keyword} 
                      onClick={() => !isDisabled && toggleKeyword(keyword)}
                      className={`flex items-center justify-between gap-3 p-2.5 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50/80 border-emerald-100' : 'hover:bg-slate-100 border-transparent'} border`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          checked={isSelected}
                          disabled={isDisabled}
                          // onCheckedChange handled by parent div
                        />
                        <span className={`text-sm ${isLocked ? 'text-slate-400' : 'text-slate-700'}`}>
                          {keyword}
                          {isLocked && <span className="ml-2 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-medium">Locked</span>}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">({count})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-white">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!canSave || loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
