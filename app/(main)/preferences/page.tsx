"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { PreferencesSetupModal } from "@/components/filters/PreferencesSetupModal";
import { Button } from "@/components/ui/button";
import { Settings, MapPin, Key, AlertCircle, Plus, Loader2 } from "lucide-react";

export default function PreferencesPage() {
  const { data: session, status } = useSession();
  const [limits, setLimits] = useState({ maxKeywords: 3, maxStates: 1, unlockedStates: [] as string[], unlockedKeywords: [] as string[] });
  const [statesList, setStatesList] = useState<{name: string, count: number}[]>([]);
  const [keywordsList, setKeywordsList] = useState<{keyword: string, count: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  const fetchLimits = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/credits/usage`, {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLimits({
          maxKeywords: data.maxKeywords || 3,
          maxStates: data.maxStates || 1,
          unlockedStates: data.unlockedStates || [],
          unlockedKeywords: data.unlockedKeywords || []
        });
      }
    } catch (err) {
      console.error("Failed to fetch limits", err);
    }
  };

  const fetchOptions = async () => {
    try {
      const [statesRes, statsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/regions/states`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenders/sidebar-stats`, {
          headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
        })
      ]);
      
      if (statesRes.ok && statsRes.ok) {
        const statesData = await statesRes.json();
        const statsData = await statsRes.json();
        
        setStatesList(statesData.map((s: any) => {
          const stat = statsData.states?.find((st: any) => st.name === s.name);
          return { name: s.name, count: stat ? stat.count : 0 };
        }));
        
        setKeywordsList(statsData.keywords?.map((k: any) => ({ keyword: k.keyword, count: k.count })) || []);
      } else {
        if (statesRes.ok) {
           const statesData = await statesRes.json();
           setStatesList(statesData.map((s: any) => ({ name: s.name, count: 0 })));
        }
      }
    } catch (err) {
      console.error("Failed to fetch options", err);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      Promise.all([fetchLimits(), fetchOptions()]).finally(() => setLoading(false));
    }
  }, [status]);

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const stateSlotsRemaining = limits.maxStates - limits.unlockedStates.length;
  const keywordSlotsRemaining = limits.maxKeywords - limits.unlockedKeywords.length;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            My Preferences
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Manage your subscribed states and keywords. These dictate the tenders you can access.
          </p>
        </div>
        
        {(stateSlotsRemaining > 0 || keywordSlotsRemaining > 0) && (
          <Button 
            onClick={() => setIsSetupModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Preferences
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* States Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-700" />
              </div>
              <h2 className="font-semibold text-slate-800 text-lg">Subscribed States</h2>
            </div>
            <div className="text-sm font-medium bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-600">
              {limits.unlockedStates.length} / {limits.maxStates} Slots
            </div>
          </div>
          
          <div className="p-5">
            {limits.unlockedStates.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-sm">You haven't subscribed to any states yet.</p>
                {stateSlotsRemaining > 0 && (
                  <Button variant="link" className="text-blue-600 mt-2" onClick={() => setIsSetupModalOpen(true)}>
                    Select States Now
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {limits.unlockedStates.map(state => (
                  <div key={state} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <span className="font-medium text-slate-700">{state}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            {stateSlotsRemaining > 0 && limits.unlockedStates.length > 0 && (
              <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>You have <strong>{stateSlotsRemaining}</strong> free state slot{stateSlotsRemaining > 1 ? 's' : ''} remaining.</p>
              </div>
            )}
          </div>
        </div>

        {/* Keywords Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <Key className="h-5 w-5 text-emerald-700" />
              </div>
              <h2 className="font-semibold text-slate-800 text-lg">Subscribed Keywords</h2>
            </div>
            <div className="text-sm font-medium bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-600">
              {limits.unlockedKeywords.length} / {limits.maxKeywords} Slots
            </div>
          </div>
          
          <div className="p-5">
            {limits.unlockedKeywords.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-sm">You haven't subscribed to any keywords yet.</p>
                {keywordSlotsRemaining > 0 && (
                  <Button variant="link" className="text-blue-600 mt-2" onClick={() => setIsSetupModalOpen(true)}>
                    Select Keywords Now
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {limits.unlockedKeywords.map(keyword => (
                  <div key={keyword} className="flex items-center gap-2 p-2 px-3 rounded-full border border-slate-200 bg-white shadow-sm">
                    <span className="font-medium text-sm text-slate-700">{keyword}</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  </div>
                ))}
              </div>
            )}
            
            {keywordSlotsRemaining > 0 && limits.unlockedKeywords.length > 0 && (
              <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>You have <strong>{keywordSlotsRemaining}</strong> free keyword slot{keywordSlotsRemaining > 1 ? 's' : ''} remaining.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <PreferencesSetupModal 
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        limits={limits}
        statesList={statesList}
        keywordsList={keywordsList}
        onSaved={fetchLimits}
      />
    </div>
  );
}
