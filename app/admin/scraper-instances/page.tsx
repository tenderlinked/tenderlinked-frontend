"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pause, Play, Square, Activity, RotateCw, Cpu, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

type ScrapeStatus = 'PENDING' | 'RUNNING' | 'PAUSED' | 'STOPPED' | 'FAILED' | 'SUCCESS';
type AiMode = 'local-nlp' | 'openai-mini' | 'openai-4o';

interface ScrapeInstance {
  id: string;
  targetId: string;
  targetName: string;
  targetType: string;
  sourceUrl: string;
  status: ScrapeStatus;
  source: string;
  progress: { page: number; tendersFound: number; totalTenders: number; newTendersAdded: number };
  startTime: string;
  endTime?: string;
  error?: string;
}

const AI_MODES: { value: AiMode; label: string; description: string; cost: string; color: string }[] = [
  {
    value: 'local-nlp',
    label: '🖥️ Local NLP',
    description: 'Free local categorization only. No AI summary generated.',
    cost: 'Free',
    color: 'border-slate-300 bg-slate-50 dark:bg-slate-900 dark:border-slate-700',
  },
  {
    value: 'openai-mini',
    label: '⚡ GPT-4o Mini',
    description: 'Structured AI insights — EMD, dates, scope, qualifications.',
    cost: '~₹0.08 / tender',
    color: 'border-blue-400 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-700',
  },
  {
    value: 'openai-4o',
    label: '✨ GPT-4o',
    description: 'Best quality AI insights for complex tender documents.',
    cost: '~₹0.42 / tender',
    color: 'border-purple-400 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-700',
  },
];

export default function ScraperInstancesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [instances, setInstances] = useState<ScrapeInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAiMode, setSelectedAiMode] = useState<AiMode>('openai-mini');

  const getHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${(session as any)?.accessToken || ''}`
  }), [session]);

  const fetchInstances = useCallback(async () => {
    try {
      if (sessionStatus !== "authenticated") return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/scrape/instances`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setInstances(data.sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [sessionStatus, getHeaders]);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchInstances();
      const interval = setInterval(fetchInstances, 3000);
      return () => clearInterval(interval);
    }
  }, [sessionStatus, fetchInstances]);

  const updateStatus = async (id: string, status: ScrapeStatus) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/scrape/instances/${id}/status`, {
        method: "POST", headers: getHeaders(), body: JSON.stringify({ status })
      });
      if (res.ok) { toast.success(`Instance marked as ${status}`); fetchInstances(); }
      else toast.error("Failed to update status");
    } catch { toast.error("Network error"); }
  };

  const triggerScrape = async (targetIds?: string[]) => {
    try {
      const body: any = { aiMode: selectedAiMode };
      if (targetIds) body.targetIds = targetIds;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/scrape`, {
        method: "POST", headers: getHeaders(), body: JSON.stringify(body)
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Scrape started — AI: ${data.aiMode ?? selectedAiMode}`);
        fetchInstances();
      } else toast.error("Failed to start scrape");
    } catch { toast.error("Network error"); }
  };

  const getStatusBadge = (status: ScrapeStatus) => {
    switch (status) {
      case 'PENDING':  return <Badge variant="outline" className="text-slate-500">Pending</Badge>;
      case 'RUNNING':  return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Running</Badge>;
      case 'PAUSED':   return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">Paused</Badge>;
      case 'STOPPED':  return <Badge variant="secondary">Stopped</Badge>;
      case 'SUCCESS':  return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Success</Badge>;
      case 'FAILED':   return <Badge variant="destructive">Failed</Badge>;
      default:         return <Badge>{status}</Badge>;
    }
  };

  if (loading) return <div className="p-8 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" /> Active Scrapes
          </h1>
          <p className="text-slate-500 mt-1">Monitor and manage running scraper instances in real-time.</p>
        </div>
        <Button onClick={() => triggerScrape()} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Play className="w-4 h-4" /> Run Full Scrape
        </Button>
      </div>

      {/* AI Mode Selector */}
      <Card className="p-5 border-neutral-200 dark:border-slate-800">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          AI Processing Mode
          <span className="text-xs font-normal text-muted-foreground ml-1">(applied to the next scrape or re-run)</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {AI_MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => setSelectedAiMode(mode.value)}
              className={`text-left p-4 rounded-lg border-2 transition-all ${mode.color} ${
                selectedAiMode === mode.value
                  ? 'ring-2 ring-offset-1 ring-blue-500 dark:ring-offset-slate-950'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{mode.label}</span>
                <Badge variant="outline" className="text-xs font-mono">{mode.cost}</Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{mode.description}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Instances Table */}
      <Card className="shadow-sm border-neutral-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4">Target</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Pages</th>
                <th className="px-6 py-4">Found / Saved</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {instances.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">No active or recent scrapes found.</td></tr>
              ) : (
                instances.map(inst => (
                  <tr key={inst.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{inst.targetName}</div>
                      <div className="text-xs text-muted-foreground">{inst.targetType}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{inst.source}</td>
                    <td className="px-6 py-4">{getStatusBadge(inst.status)}</td>
                    <td className="px-6 py-4 text-muted-foreground">{inst.progress.page > 0 ? inst.progress.page : '-'}</td>
                    <td className="px-6 py-4">
                      <span className="font-medium">{inst.progress.tendersFound}</span>
                      {' / '}
                      <span className="font-medium text-slate-500">{inst.progress.totalTenders > 0 ? inst.progress.totalTenders : '?'}</span>
                      {' (New: '}
                      <span className="text-green-600 dark:text-green-400 font-medium">{inst.progress.newTendersAdded}</span>
                      {')'}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      <div>Start: {new Date(inst.startTime).toLocaleTimeString()}</div>
                      {inst.endTime && <div>End: {new Date(inst.endTime).toLocaleTimeString()}</div>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(inst.status === 'RUNNING' || inst.status === 'PAUSED' || inst.status === 'PENDING') && (
                        <div className="flex items-center justify-end gap-1">
                          {inst.status === 'RUNNING' ? (
                            <Button variant="ghost" size="icon" onClick={() => updateStatus(inst.id, 'PAUSED')} title="Pause">
                              <Pause className="w-4 h-4 text-orange-500" />
                            </Button>
                          ) : inst.status === 'PAUSED' ? (
                            <Button variant="ghost" size="icon" onClick={() => updateStatus(inst.id, 'RUNNING')} title="Resume">
                              <Play className="w-4 h-4 text-blue-500" />
                            </Button>
                          ) : null}
                          <Button variant="ghost" size="icon" onClick={() => updateStatus(inst.id, 'STOPPED')} title="Stop">
                            <Square className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      )}
                      {(inst.status === 'STOPPED' || inst.status === 'SUCCESS' || inst.status === 'FAILED') && inst.targetId && (
                        <Button variant="ghost" size="sm" onClick={() => triggerScrape([inst.targetId])} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          <RotateCw className="w-4 h-4 mr-1.5" /> Rerun
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
