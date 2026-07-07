"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pause, Play, Square, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

type ScrapeStatus = 'PENDING' | 'RUNNING' | 'PAUSED' | 'STOPPED' | 'FAILED' | 'SUCCESS';

interface ScrapeInstance {
  id: string;
  targetId: string;
  targetName: string;
  targetType: string;
  sourceUrl: string;
  status: ScrapeStatus;
  source: string;
  progress: {
    page: number;
    tendersFound: number;
    newTendersAdded: number;
  };
  startTime: string;
  endTime?: string;
  error?: string;
}

export default function ScraperInstancesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [instances, setInstances] = useState<ScrapeInstance[]>([]);
  const [loading, setLoading] = useState(true);

  const getHeaders = useCallback((): Record<string, string> => {
    // @ts-ignore
    const token = session?.accessToken;
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  }, [session]);

  const fetchInstances = useCallback(async () => {
    if (sessionStatus === "loading") return;
    if (sessionStatus === "unauthenticated") {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/scrape/instances`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        // sort by newest
        const sorted = data.sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        setInstances(sorted);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(`Instance marked as ${status}`);
        fetchInstances();
      } else {
        toast.error("Failed to update status");
      }
    } catch (e) {
      toast.error("Network error");
    }
  };

  const getStatusBadge = (status: ScrapeStatus) => {
    switch (status) {
      case 'PENDING': return <Badge variant="outline" className="text-slate-500">Pending</Badge>;
      case 'RUNNING': return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200">Running</Badge>;
      case 'PAUSED': return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200">Paused</Badge>;
      case 'STOPPED': return <Badge variant="outline">Stopped</Badge>;
      case 'SUCCESS': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200">Success</Badge>;
      case 'FAILED': return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary" />
            Active Scrapes
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage running scraper instances in real-time.
          </p>
        </div>
      </div>

      <Card className="shadow-sm border-neutral-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4">Target</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Progress (Pages)</th>
                <th className="px-6 py-4">Found / Saved</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {instances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No active or recent scrapes found.
                  </td>
                </tr>
              ) : (
                instances.map(inst => (
                  <tr key={inst.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{inst.targetName}</div>
                      <div className="text-xs text-muted-foreground">{inst.targetType}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {inst.source}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(inst.status)}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {inst.progress.page > 0 ? inst.progress.page : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">{inst.progress.tendersFound}</span> / <span className="text-green-600 dark:text-green-400 font-medium">{inst.progress.newTendersAdded}</span>
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
