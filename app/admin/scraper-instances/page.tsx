"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pause, Play, Square, Activity, RotateCw, Cpu, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MultiSelect } from "@/components/ui/multi-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

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
  error?: string;
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

  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [scrapeScope, setScrapeScope] = useState<'all' | 'state' | 'district'>('all');
  const [targets, setTargets] = useState<any[]>([]);
  const [selectedStateIds, setSelectedStateIds] = useState<string[]>([]);
  const [selectedDistrictIds, setSelectedDistrictIds] = useState<string[]>([]);
  const [selectedDistrictFilterStateId, setSelectedDistrictFilterStateId] = useState<string>("all");
  const [repairDocuments, setRepairDocuments] = useState<boolean>(false);

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

  const fetchTargets = useCallback(async () => {
    try {
      if (sessionStatus !== "authenticated") return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/scraper-targets`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTargets(data);
      }
    } catch (e) { console.error("Failed to fetch targets:", e); }
  }, [sessionStatus, getHeaders]);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchInstances();
      fetchTargets();
      const interval = setInterval(fetchInstances, 3000);
      return () => clearInterval(interval);
    }
  }, [sessionStatus, fetchInstances, fetchTargets]);

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
      const body: any = { aiMode: selectedAiMode, repairDocuments };
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

  const handleStartScrape = () => {
    let targetIds: string[] | undefined = undefined;
    if (scrapeScope === 'state') targetIds = selectedStateIds;
    if (scrapeScope === 'district') targetIds = selectedDistrictIds;
    
    if (scrapeScope !== 'all' && (!targetIds || targetIds.length === 0)) {
      toast.error("Please select at least one target.");
      return;
    }
    
    triggerScrape(targetIds);
    setIsRunModalOpen(false);
  };

  const getStatusBadge = (status: ScrapeStatus, error?: string) => {
    let badge;
    switch (status) {
      case 'PENDING':  badge = <Badge variant="outline" className="text-slate-500">Pending</Badge>; break;
      case 'RUNNING':  badge = <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Running</Badge>; break;
      case 'PAUSED':   badge = <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">Paused</Badge>; break;
      case 'STOPPED':  badge = <Badge variant="secondary">Stopped</Badge>; break;
      case 'SUCCESS':  badge = <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Success</Badge>; break;
      case 'FAILED':   badge = <Badge variant="destructive">Failed</Badge>; break;
      default:         badge = <Badge>{status}</Badge>; break;
    }

    if (error && (status === 'FAILED' || status === 'STOPPED')) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="cursor-help">{badge}</TooltipTrigger>
            <TooltipContent className="max-w-xs break-words bg-slate-900 text-white p-3 rounded-md shadow-lg border border-slate-700">
              <p className="text-sm font-medium mb-1">Reason:</p>
              <p className="text-xs text-slate-300">{error}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return badge;
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
        <Button onClick={() => setIsRunModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Play className="w-4 h-4" /> Run Scrape
        </Button>
      </div>

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
                    <td className="px-6 py-4">{getStatusBadge(inst.status, inst.error)}</td>
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
      
      {/* Run Scrape Modal */}
      <Dialog open={isRunModalOpen} onOpenChange={setIsRunModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Run New Scrape</DialogTitle>
            <DialogDescription>Configure scope and AI processing mode.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
             {/* Scope Selection */}
             <div className="space-y-3">
                <Label>Scrape Scope</Label>
                <RadioGroup value={scrapeScope} onValueChange={(val) => setScrapeScope(val as any)} className="flex gap-6">
                   <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="scope-all" />
                      <Label htmlFor="scope-all">Full Scrape</Label>
                   </div>
                   <div className="flex items-center space-x-2">
                      <RadioGroupItem value="state" id="scope-state" />
                      <Label htmlFor="scope-state">By State</Label>
                   </div>
                   <div className="flex items-center space-x-2">
                      <RadioGroupItem value="district" id="scope-district" />
                      <Label htmlFor="scope-district">By District</Label>
                   </div>
                </RadioGroup>
             </div>
             
             {/* State Dropdown */}
             {scrapeScope === 'state' && (
                <div className="space-y-2">
                   <Label>Select States</Label>
                   <MultiSelect 
                     options={targets.filter(t => t.type === 'STATE').map(t => ({ value: t.id, label: t.name }))}
                     selected={selectedStateIds}
                     onChange={setSelectedStateIds}
                     placeholder="Search states..."
                   />
                </div>
             )}

             {/* District Dropdown */}
             {scrapeScope === 'district' && (
                <div className="space-y-4">
                   <div className="space-y-2">
                     <Label>Filter by State</Label>
                     <Select value={selectedDistrictFilterStateId} onValueChange={setSelectedDistrictFilterStateId}>
                       <SelectTrigger>
                         <SelectValue placeholder="All States" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="all">All States</SelectItem>
                         {Array.from(new Set(targets.filter(t => t.type === 'DISTRICT' && t.regionStateId).map(t => t.regionStateId))).map((stateId: any) => {
                           const stateTarget = targets.find(t => t.regionStateId === stateId && t.type === 'DISTRICT');
                           return (
                             <SelectItem key={stateId} value={stateId}>
                               {stateTarget?.regionState?.name || stateTarget?.state || 'Unknown State'}
                             </SelectItem>
                           );
                         })}
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="space-y-2">
                     <Label>Select Districts</Label>
                     <MultiSelect 
                       options={targets
                         .filter(t => t.type === 'DISTRICT' && (selectedDistrictFilterStateId === 'all' || t.regionStateId === selectedDistrictFilterStateId))
                         .map(t => ({ value: t.id, label: t.name }))}
                       selected={selectedDistrictIds}
                       onChange={setSelectedDistrictIds}
                       placeholder="Search districts..."
                     />
                   </div>
                </div>
             )}
             
             {/* AI Processing Mode (moved from main view) */}
             <div className="space-y-3 pt-4 border-t">
                <Label>AI Processing Mode</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {AI_MODES.map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => setSelectedAiMode(mode.value)}
                      className={`text-left p-3 rounded-lg border transition-all ${mode.color} ${
                        selectedAiMode === mode.value
                          ? 'ring-2 ring-blue-500 border-blue-500 shadow-sm'
                          : 'opacity-80 hover:opacity-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-1">{mode.label}</div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 leading-tight">{mode.description}</p>
                      <Badge variant="outline" className="text-[10px] font-mono w-fit bg-background">{mode.cost}</Badge>
                    </button>
                  ))}
                </div>
             </div>

             {/* Deep Scrape (Repair Documents) */}
             <div className="space-y-3 pt-4 border-t flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Deep Scrape (Repair missing documents)</Label>
                  <p className="text-[13px] text-muted-foreground">
                    Slower. Will attempt to download missing documents for existing tenders in the database instead of instantly skipping them.
                  </p>
                </div>
                <Switch
                  checked={repairDocuments}
                  onCheckedChange={setRepairDocuments}
                />
             </div>
          </div>
          
          <DialogFooter>
             <Button variant="outline" onClick={() => setIsRunModalOpen(false)}>Cancel</Button>
             <Button onClick={handleStartScrape} className="bg-blue-600 hover:bg-blue-700 text-white">Start Scrape</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
