"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Trash2, Loader2, Play, Edit, Server, ChevronDown, ChevronRight, X, Upload, Download, Eye, CheckCircle, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import toast from "react-hot-toast";
import { PreviewTenderDialog } from "./PreviewTenderDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RegionDistrict {
  id: string;
  name: string;
}

interface RegionState {
  id: string;
  name: string;
  districts: RegionDistrict[];
}

interface ScraperTarget {
  id: string;
  name: string;
  type: string;
  state: string;
  url: string;
  isActive: boolean;
  isVerified?: boolean;
  cronSchedule?: string;
  regionDistrictId?: string;
  scraperType?: string;
  createdAt: string;
}

const HealthBadge = ({ url, token }: { url: string; token?: string }) => {
  const [status, setStatus] = useState<'loading'|'healthy'|'unhealthy'>('loading');
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/scraper-targets/health?url=${encodeURIComponent(url)}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(r => r.json())
      .then(d => setStatus(d.healthy ? 'healthy' : 'unhealthy'))
      .catch(() => setStatus('unhealthy'));
  }, [url]);

  if (status === 'loading') return <Loader2 className="w-3 h-3 animate-spin text-muted-foreground inline ml-2" />;
  if (status === 'healthy') return <span title="Reachable" className="inline-flex items-center text-green-500 text-xs ml-2 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1 animate-pulse"/> OK</span>;
  return <span title="Unreachable" className="inline-flex items-center text-red-500 text-xs ml-2 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1"/> Error</span>;
};

export default function ScraperTargetsPage() {
  const { data: session, status } = useSession();
  
  const [targets, setTargets] = useState<ScraperTarget[]>([]);
  const [regions, setRegions] = useState<RegionState[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedDistrictIds, setSelectedDistrictIds] = useState<Set<string>>(new Set());
  const [selectedStateView, setSelectedStateView] = useState<string | null>(null);
  const [runningScrape, setRunningScrape] = useState(false);
  const [scrapeLoadingId, setScrapeLoadingId] = useState<string | null>(null);

  // New Target Form State
  const [isAdding, setIsAdding] = useState(false);
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [previewTarget, setPreviewTarget] = useState<ScraperTarget | null>(null);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("STATE");
  const [newScraperType, setNewScraperType] = useState("AUTO");
  const [newStateName, setNewStateName] = useState("Odisha");
  const [newUrl, setNewUrl] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCSV, setUploadingCSV] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      fetchTargets();
      fetchRegions();
    }
  }, [status]);

  const getHeaders = (): Record<string, string> => {
    // @ts-ignore
    const token = session?.accessToken;
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  };

  const fetchRegions = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/regions/states`, { headers: getHeaders() });
      if (res.ok) setRegions(await res.json());
    } catch (e) {
      toast.error("Failed to load regions");
    }
  };

  const fetchTargets = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/scraper-targets`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setTargets(data);
      }
    } catch (error) {
      toast.error("Failed to load scraper targets");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTargetId(null);
    setNewName("");
    setNewType("STATE");
    setNewStateName("Odisha");
    setNewUrl("");
    setNewScraperType("AUTO");
    setSelectedDistrictIds(new Set());
    setIsAdding(false);
  };

  const handleEditTarget = (target: ScraperTarget) => {
    setEditingTargetId(target.id);
    setNewName(target.name);
    setNewType(target.type);
    setNewStateName(target.state);
    setNewUrl(target.url);
    setNewScraperType(target.scraperType || "AUTO");
  };

  const handleAddTarget = async () => {
    const isBulk = !editingTargetId && newType === 'DISTRICT' && selectedDistrictIds.size > 1;
    
    if (!editingTargetId && newType === 'DISTRICT' && selectedDistrictIds.size === 0) {
      toast.error("Please select at least one district");
      return;
    }
    if (!newName.trim() || !newUrl.trim()) {
      toast.error("Name and URL are required");
      return;
    }
    if (isBulk && !newUrl.includes('{district}')) {
      toast.error("URL must contain {district} placeholder for bulk submission");
      return;
    }
    
    try {
      const isEditing = !!editingTargetId;
      
      // Handle Bulk District Submission
      if (!isEditing && newType === 'DISTRICT' && selectedDistrictIds.size > 1) {
        const stateObj = regions.find(s => s.name === newStateName);
        if (!stateObj) return;

        const newTargets = Array.from(selectedDistrictIds).map(districtId => {
          const districtObj = stateObj.districts.find(d => d.id === districtId);
          const formattedName = districtObj!.name.replace(/[\s-]/g, '').toLowerCase();
          
          const finalUrl = newUrl.replace('{district}', formattedName);

          return {
            name: `${districtObj!.name} District`,
            type: 'DISTRICT',
            state: newStateName,
            url: finalUrl,
            regionStateId: stateObj.id,
            regionDistrictId: districtObj!.id
          };
        });

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/scraper-targets/bulk`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ targets: newTargets })
        });

        if (res.ok) {
          toast.success(`Successfully added ${newTargets.length} targets!`);
          handleCancelEdit();
          fetchTargets(false);
        } else {
          const err = await res.json();
          toast.error(err.message || "Failed to add targets");
        }
        return;
      }

      // Single Submission
      const url = isEditing 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/scraper-targets/${editingTargetId}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/scraper-targets`;
        
      const stateObj = regions.find(s => s.name === newStateName);
      let districtObj = undefined;
      let finalName = newName;
      
      if (newType === 'DISTRICT') {
        if (selectedDistrictIds.size === 1) {
          const did = Array.from(selectedDistrictIds)[0];
          districtObj = stateObj?.districts.find(d => d.id === did);
          finalName = `${districtObj?.name} District`;
        } else {
          districtObj = stateObj?.districts.find(d => `${d.name} District` === newName || d.name === newName);
        }
      }
      
      const res = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ 
          name: finalName, 
          type: newType, 
          state: newStateName, 
          url: newUrl,
          regionStateId: stateObj?.id,
          regionDistrictId: districtObj?.id,
          scraperType: newScraperType
        })
      });
      
      if (res.ok) {
        toast.success(isEditing ? "Target updated successfully" : "Target added successfully");
        handleCancelEdit();
        fetchTargets(false);
      } else {
        const err = await res.json();
        toast.error(err.message || (isEditing ? "Failed to update target" : "Failed to add target"));
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCSV(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n').map(row => row.trim()).filter(row => row);
        if (rows.length < 2) throw new Error("CSV is empty or missing headers");

        const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
        const nameIdx = headers.indexOf('name');
        const typeIdx = headers.indexOf('type');
        const stateIdx = headers.indexOf('state');
        const urlIdx = headers.indexOf('url');

        if (nameIdx === -1 || typeIdx === -1 || stateIdx === -1 || urlIdx === -1) {
          throw new Error("Invalid CSV headers. Expected: Name,Type,State,URL");
        }

        const newTargets = [];
        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i].split(',').map(c => c.trim());
          if (cols.length < 4) continue;
          newTargets.push({
            name: cols[nameIdx],
            type: cols[typeIdx],
            state: cols[stateIdx],
            url: cols[urlIdx]
          });
        }

        if (newTargets.length === 0) throw new Error("No valid data rows found in CSV");

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/scraper-targets/bulk`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ targets: newTargets })
        });

        if (res.ok) {
          toast.success(`Successfully uploaded ${newTargets.length} targets!`);
          fetchTargets();
        } else {
          const err = await res.json();
          toast.error(err.message || "Failed to upload targets");
        }
      } catch (err: any) {
        toast.error(err.message || "Error parsing CSV");
      } finally {
        setUploadingCSV(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const downloadSample = () => {
    const content = "Name,Type,State,URL\nPune District,DISTRICT,Maharashtra,https://pune.gov.in/en/tender\nDelhi Tenders,STATE,Delhi,https://etenders.delhi.gov.in\n";
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "sample_targets.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this target?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/scraper-targets/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        toast.success("Target deleted");
        fetchTargets(false);
      } else {
        toast.error("Failed to delete target");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleToggleActive = async (target: ScraperTarget) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/scraper-targets/${target.id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ isActive: !target.isActive })
      });
      if (res.ok) {
        fetchTargets(false);
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleToggleVerified = async (target: ScraperTarget) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/scraper-targets/${target.id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ isVerified: !target.isVerified })
      });
      if (res.ok) {
        fetchTargets(false);
      } else {
        toast.error("Failed to update verified status");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  const handleSetEngine = async (engine: string) => {
    if (selectedIds.size === 0) return;
    const targetIds = Array.from(selectedIds);
    toast.promise(
      Promise.all(targetIds.map(async (id) => {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/scraper-targets/${id}`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({ scraperType: engine })
        });
      })).then(() => fetchTargets(false)),
      {
        loading: `Setting engine to ${engine === 'AP_EPROCUREMENT' ? 'AP eProc' : engine} for ${targetIds.length} targets...`,
        success: 'Engine updated successfully!',
        error: 'Failed to update engines'
      }
    );
  };

  const handleCheckFormat = (target: ScraperTarget) => {
    setPreviewTarget(target);
  };

  const handleRunScraper = async () => {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one target to scrape");
      return;
    }
    
    try {
      setRunningScrape(true);
      const targetIds = Array.from(selectedIds);
      
      toast.loading("Starting scraper sequence...", { id: "scrape" });
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/scrape`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ targetIds })
      });
      
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || `Scraper started for ${data.districtsProcessed} targets.`, { id: "scrape" });
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to run scraper", { id: "scrape" });
      }
    } catch (error) {
      toast.error("An error occurred during scraping", { id: "scrape" });
    } finally {
      setRunningScrape(false);
      setSelectedIds(new Set()); // clear selection
    }
  };

  const handleScrapeTarget = async (targetId: string, targetName: string) => {
    try {
      setScrapeLoadingId(targetId);
      toast.loading(`Starting scrape for ${targetName}...`, { id: `scrape-${targetId}` });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/scrape`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ targetIds: [targetId] })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || `Scraper started for ${targetName}.`, { id: `scrape-${targetId}` });
      } else {
        const err = await res.json();
        toast.error(err.message || `Failed to scrape ${targetName}`, { id: `scrape-${targetId}` });
      }
    } catch (error) {
      toast.error(`Error scraping ${targetName}`, { id: `scrape-${targetId}` });
    } finally {
      setScrapeLoadingId(null);
    }
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredTargets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTargets.map(t => t.id)));
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>, targetList: ScraperTarget[]) => {
    if (e.target.checked) {
      const newSelected = new Set(selectedIds);
      targetList.forEach(t => newSelected.add(t.id));
      setSelectedIds(newSelected);
    } else {
      const newSelected = new Set(selectedIds);
      targetList.forEach(t => newSelected.delete(t.id));
      setSelectedIds(newSelected);
    }
  };

  const filteredTargets = targets.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.url.toLowerCase().includes(search.toLowerCase())
  );

  const stateLevelTargets = filteredTargets.filter(t => t.type === 'STATE');
  const districtTargets = filteredTargets.filter(t => t.type === 'DISTRICT');

  const groupedTargets = districtTargets.reduce((acc, t) => {
    const s = t.state || "Unknown State";
    if (!acc[s]) acc[s] = [];
    acc[s].push(t);
    return acc;
  }, {} as Record<string, typeof districtTargets>);
  const stateGroups = Object.keys(groupedTargets).sort();
  const allStateGroups = Array.from(new Set(targets.filter(t => t.type === 'DISTRICT').map(t => t.state))).sort();

  const renderTable = (targetList: ScraperTarget[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
          <tr>
            <th className="px-4 py-3 w-10">
              <input 
                type="checkbox" 
                className="rounded border-gray-300"
                checked={targetList.every(t => selectedIds.has(t.id)) && targetList.length > 0}
                onChange={(e) => {
                  const next = new Set(selectedIds);
                  if (e.target.checked) {
                    targetList.forEach(t => next.add(t.id));
                  } else {
                    targetList.forEach(t => next.delete(t.id));
                  }
                  setSelectedIds(next);
                }}
              />
            </th>
            <th className="px-4 py-3">Target Name</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">State</th>
            <th className="px-4 py-3">URL</th>
            <th className="px-4 py-3">Engine</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {targetList.map((target) => (
            target.id === editingTargetId ? (
              <tr key={target.id} className="border-b bg-muted/20">
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3 font-medium">
                  {newType === 'DISTRICT' ? (
                    <select 
                      className="h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={newName} 
                      onChange={e => setNewName(e.target.value)}
                    >
                      {regions.find(s => s.name === newStateName)?.districts.map(d => {
                        const isAdded = targets.some(t => t.regionDistrictId === d.id && t.id !== editingTargetId);
                        return (
                          <option key={d.id} value={`${d.name} District`} disabled={isAdded}>
                            {d.name} District {isAdded ? '✓ (Added)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <Input value={newName} onChange={e => setNewName(e.target.value)} className="h-8 min-w-[150px]" />
                  )}
                </td>
                <td className="px-4 py-3">
                  <select 
                    className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full"
                    value={newType} 
                    onChange={e => {
                      setNewType(e.target.value);
                      if (e.target.value === 'DISTRICT') setNewName("");
                    }}
                  >
                    <option value="STATE">State</option>
                    <option value="DISTRICT">District</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  {newType === 'DISTRICT' ? (
                    <select 
                      className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full min-w-[120px]"
                      value={newStateName} 
                      onChange={e => {
                        setNewStateName(e.target.value);
                        setNewName("");
                      }}
                    >
                      {regions.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  ) : (
                    <span className="text-muted-foreground text-xs">{newStateName}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Input value={newUrl} onChange={e => setNewUrl(e.target.value)} className="h-8 min-w-[200px]" />
                </td>
                <td className="px-4 py-3">
                  <select 
                    className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary w-full"
                    value={newScraperType} 
                    onChange={e => setNewScraperType(e.target.value)}
                  >
                    <option value="AUTO">Auto</option>
                    <option value="NICGEP">NICGEP</option>
                    <option value="AP_EPROCUREMENT">AP eProc</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">Editing...</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Button variant="ghost" size="sm" onClick={handleAddTarget} className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30 mr-1" title="Save">
                    <CheckCircle className="w-4 h-4 mr-1" /> Save
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800" title="Cancel">
                    <X className="w-4 h-4 mr-1" /> Cancel
                  </Button>
                </td>
              </tr>
            ) : (
              <tr key={target.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300"
                    checked={selectedIds.has(target.id)}
                    onChange={() => toggleSelection(target.id)}
                  />
                </td>
                <td className="px-4 py-3 font-medium">{target.name}</td>
                <td className="px-4 py-3">
                  <Badge variant={target.type === "STATE" ? "default" : "secondary"}>
                    {target.type}
                  </Badge>
                </td>
                <td className="px-4 py-3">{target.state}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-xs" title={target.url}>
                  <a href={target.url} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary flex items-center">
                    <span className="truncate max-w-[200px]">{target.url}</span>
                    <HealthBadge url={target.url} token={(session as any)?.accessToken} />
                  </a>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-900/50">
                    {target.scraperType === 'AP_EPROCUREMENT' ? 'AP eProc' : (target.scraperType === 'NICGEP' ? 'NICGEP' : 'Auto')}
                  </Badge>
                </td>
                <td className="px-4 py-3 flex items-center gap-2 flex-wrap">
                  <button onClick={() => handleToggleActive(target)}>
                    <Badge variant={target.isActive ? "success" : "destructive"} className={`cursor-pointer ${target.isActive ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400' : ''}`}>
                      {target.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </button>
                  {target.isVerified && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50" title="URL verified via smart preview">
                      <CheckCircle className="w-3 h-3 mr-1" /> Verified
                    </Badge>
                  )}
                  {target.cronSchedule && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/50" title={`Scheduled: ${target.cronSchedule}`}>
                      <Calendar className="w-3 h-3 mr-1" /> Cron
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleScrapeTarget(target.id, target.name)} 
                    disabled={scrapeLoadingId === target.id}
                    className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30" 
                    title={`Scrape ${target.name}`}
                  >
                    {scrapeLoadingId === target.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleToggleVerified(target)} className={`hover:bg-blue-100 dark:hover:bg-blue-900/30 ${target.isVerified ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} title={target.isVerified ? "Mark unverified" : "Mark verified manually"}>
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleCheckFormat(target)} className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-indigo-900/30" title="Preview Extractor">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEditTarget(target)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(target.id)} className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            )
          ))}
        </tbody>
      </table>
    </div>
  );

  if (status === "loading") {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scraper Targets</h1>
          <p className="text-muted-foreground mt-1">
            Manage the states and districts the system scrapes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />

          <Button 
            onClick={() => {
              if (isAdding) {
                handleCancelEdit();
              } else {
                if (selectedStateView && selectedStateView !== 'GlobalState') {
                  setNewType('DISTRICT');
                  setNewStateName(selectedStateView);
                } else if (selectedStateView === 'GlobalState') {
                  setNewType('STATE');
                  setNewStateName('');
                }
                setIsAdding(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {isAdding ? "Cancel" : "Add Target"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-sm border-none rounded-md px-4">
                Actions <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1 shadow-lg border-muted">
              {selectedIds.size > 0 && (
                <>
                  <DropdownMenuItem 
                    onClick={handleRunScraper} 
                    disabled={runningScrape}
                    className="cursor-pointer py-2 px-3 focus:bg-muted"
                  >
                    Enqueue Scraper Run
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    className="cursor-pointer py-2 px-3 focus:bg-muted"
                    onClick={async () => {
                      const cronString = window.prompt("Enter Cron Expression (e.g., '0 * * * *' for every hour, '0 0 * * *' for daily):");
                      if (cronString === null) return;
                      const targetIds = Array.from(selectedIds);
                      toast.promise(
                        Promise.all(targetIds.map(async (id) => {
                          await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/scraper-targets/${id}`, {
                            method: 'PATCH',
                            headers: getHeaders(),
                            body: JSON.stringify({ cronSchedule: cronString || null })
                          });
                        })).then(() => fetchTargets(false)),
                        {
                          loading: `Setting cron schedule for ${targetIds.length} targets...`,
                          success: 'Cron schedules updated successfully!',
                          error: 'Failed to update cron schedules'
                        }
                      );
                    }}
                  >
                    Set Auto-Scrape Cron
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="my-1" />
                  
                  <DropdownMenuLabel className="px-3 text-xs text-muted-foreground uppercase tracking-wider font-semibold">Set Scraper Engine</DropdownMenuLabel>
                  <DropdownMenuItem className="cursor-pointer py-1.5 px-3 focus:bg-muted" onClick={() => handleSetEngine('AUTO')}>
                    Engine: Auto
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer py-1.5 px-3 focus:bg-muted" onClick={() => handleSetEngine('NICGEP')}>
                    Engine: NICGEP
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer py-1.5 px-3 focus:bg-muted" onClick={() => handleSetEngine('AP_EPROCUREMENT')}>
                    Engine: AP eProcurement
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="my-1" />

                  <DropdownMenuItem 
                    className="cursor-pointer py-2 px-3 focus:bg-muted"
                    onClick={async () => {
                      const targetIds = Array.from(selectedIds);
                      toast.promise(
                        Promise.all(targetIds.map(async (id) => {
                          const target = targets.find(t => t.id === id);
                          if (!target || target.type !== 'DISTRICT') return;
                          
                          let newUrl = target.url;
                          newUrl = newUrl.replace('/notice_category/tenders/', '/en/tender').replace('/past-notices/tenders/', '/en/tender');
                          if (!newUrl.includes('/en/tender')) {
                            const formattedName = target.name.replace(/ District$/i, '').replace(/[\s-]/g, '').toLowerCase();
                            newUrl = `https://${formattedName}.nic.in/en/tender`;
                          }
                          
                          if (newUrl !== target.url) {
                            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/scraper-targets/${id}`, {
                              method: 'PATCH',
                              headers: getHeaders(),
                              body: JSON.stringify({ url: newUrl })
                            });
                          }
                        })).then(() => fetchTargets(false)),
                        {
                          loading: `Applying Pattern 1 to ${targetIds.length} targets...`,
                          success: 'URL patterns updated successfully!',
                          error: 'Failed to update some targets'
                        }
                      );
                    }}
                  >
                    Apply Pattern 1 (/en/tender)
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    className="cursor-pointer py-2 px-3 focus:bg-muted"
                    onClick={async () => {
                      const targetIds = Array.from(selectedIds);
                      toast.promise(
                        Promise.all(targetIds.map(async (id) => {
                          const target = targets.find(t => t.id === id);
                          if (!target || target.type !== 'DISTRICT') return;
                          
                          let newUrl = target.url;
                          newUrl = newUrl.replace('/en/tender/tenders-archive', '/notice_category/tenders/').replace('/en/tender', '/notice_category/tenders/');
                          if (!newUrl.includes('/notice_category/tenders/')) {
                             const formattedName = target.name.replace(/ District$/i, '').replace(/[\s-]/g, '').toLowerCase();
                             newUrl = `https://${formattedName}.nic.in/notice_category/tenders/`;
                          }
                          
                          if (newUrl !== target.url) {
                            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/scraper-targets/${id}`, {
                              method: 'PATCH',
                              headers: getHeaders(),
                              body: JSON.stringify({ url: newUrl })
                            });
                          }
                        })).then(() => fetchTargets(false)),
                        {
                          loading: `Applying Pattern 2 to ${targetIds.length} targets...`,
                          success: 'URL patterns updated successfully!',
                          error: 'Failed to update some targets'
                        }
                      );
                    }}
                  >
                    Apply Pattern 2 (/notice_category/tenders/)
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="my-1" />
                </>
              )}
              
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} disabled={uploadingCSV} className="cursor-pointer py-2 px-3 focus:bg-muted">
                Bulk Upload CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadSample} className="cursor-pointer py-2 px-3 focus:bg-muted">
                Download Sample CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isAdding && (
        <Card className="border-primary/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">{editingTargetId ? "Update Target" : "Add New Target"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">State (Group)</label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newStateName} 
                  onChange={e => {
                    setNewStateName(e.target.value);
                    if (newType === 'DISTRICT') setNewName(""); // Reset district when state changes
                  }}
                >
                  <option value="">Select State...</option>
                  {regions.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              {newType !== 'DISTRICT' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input placeholder="e.g. Odisha State Level" value={newName} onChange={e => setNewName(e.target.value)} />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newType} 
                  onChange={e => setNewType(e.target.value)}
                >
                  <option value="STATE">State (NICGEP)</option>
                  <option value="DISTRICT">District (Odisha standard)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Scraper Engine</label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newScraperType} 
                  onChange={e => setNewScraperType(e.target.value)}
                >
                  <option value="AUTO">Auto-Detect (URL)</option>
                  <option value="NICGEP">NICGEP (Standard)</option>
                  <option value="AP_EPROCUREMENT">AP eProcurement</option>
                </select>
              </div>

              <div className={`space-y-2 ${newType === 'DISTRICT' ? 'md:col-span-3' : 'md:col-span-1'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
                  <label className="text-sm font-medium">
                    Base URL {selectedDistrictIds.size > 1 && <span className="text-muted-foreground font-normal ml-1">(Use {'{district}'} placeholder)</span>}
                  </label>
                  {newType === 'DISTRICT' && (
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span 
                        className="cursor-pointer hover:text-primary hover:underline transition-colors font-medium" 
                        onClick={() => {
                          const districtPlaceholder = selectedDistrictIds.size > 1 ? '{district}' : (newName ? newName.replace(/ District$/i, '').replace(/[\s-]/g, '').toLowerCase() : '{district}');
                          setNewUrl(`https://${districtPlaceholder}.nic.in/en/tender`);
                        }}
                      >
                        Pattern 1 (/en/tender)
                      </span>
                      <span>|</span>
                      <span 
                        className="cursor-pointer hover:text-primary hover:underline transition-colors font-medium" 
                        onClick={() => {
                          const districtPlaceholder = selectedDistrictIds.size > 1 ? '{district}' : (newName ? newName.replace(/ District$/i, '').replace(/[\s-]/g, '').toLowerCase() : '{district}');
                          setNewUrl(`https://${districtPlaceholder}.nic.in/notice_category/tenders/`);
                        }}
                      >
                        Pattern 2 (/notice_category/tenders/)
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder={selectedDistrictIds.size > 1 ? "e.g. https://{district}.nic.in/en/tender" : "e.g. https://tendersodisha.gov.in"} 
                    value={newUrl} 
                    onChange={e => setNewUrl(e.target.value)} 
                    className="flex-1" 
                  />
                  <Button onClick={handleAddTarget}>{editingTargetId ? "Update Target" : "Save Target"}</Button>
                </div>
              </div>
            </div>

            {newType === 'DISTRICT' && (
              <div className="mt-4 space-y-2">
                <label className="text-sm font-medium">Select Districts</label>
                <div className="max-h-60 w-full overflow-y-auto rounded-md border border-input bg-background p-3 text-sm">
                  {!newStateName && <div className="text-muted-foreground">Select a state first to view districts.</div>}
                  {newStateName && (() => {
                    const stateObj = regions.find(s => s.name === newStateName);
                    if (!stateObj) return null;
                    
                    const sortedDistricts = [...stateObj.districts].sort((a, b) => {
                      const aAdded = targets.some(t => t.regionDistrictId === a.id);
                      const bAdded = targets.some(t => t.regionDistrictId === b.id);
                      if (aAdded && !bAdded) return 1;
                      if (!aAdded && bAdded) return -1;
                      return a.name.localeCompare(b.name);
                    });

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {sortedDistricts.map(d => {
                          const isAdded = targets.some(t => t.regionDistrictId === d.id);
                          const isChecked = selectedDistrictIds.has(d.id);
                          return (
                            <div key={d.id} className="flex items-start space-x-2 p-2 hover:bg-muted/50 rounded-sm border border-transparent hover:border-border transition-colors">
                              <Checkbox 
                                id={`add-district-${d.id}`}
                                checked={isChecked}
                                disabled={isAdded}
                                className="mt-0.5"
                                onCheckedChange={(checked) => {
                                  const next = new Set(selectedDistrictIds);
                                  if (checked) next.add(d.id);
                                  else next.delete(d.id);
                                  setSelectedDistrictIds(next);
                                  
                                  if (next.size === 1) {
                                    if (!newUrl || newUrl.includes('{district}')) {
                                      const formattedName = d.name.replace(/[\s-]/g, '').toLowerCase();
                                      setNewUrl(`https://${formattedName}.nic.in/en/tender`);
                                    }
                                    setNewName(`${d.name} District`);
                                  } else if (next.size > 1) {
                                    if (!newUrl || !newUrl.includes('{district}')) {
                                      setNewUrl(`https://{district}.nic.in/en/tender`);
                                    }
                                    setNewName(`${next.size} Districts Selected`);
                                  } else {
                                    setNewUrl('');
                                    setNewName('');
                                  }
                                }}
                              />
                              <label
                                htmlFor={`add-district-${d.id}`}
                                className={`text-sm leading-tight cursor-pointer select-none flex-1 ${isAdded ? 'text-muted-foreground line-through' : 'font-medium text-foreground'}`}
                              >
                                {d.name} District {isAdded && <span className="text-green-600 dark:text-green-400 ml-1">✓</span>}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              For states, provide the homepage URL (e.g. <code>https://tendersodisha.gov.in</code>). 
              For districts, provide the tenders page URL (e.g. <code>https://cuttack.odisha.gov.in/en/tender</code>).
            </p>
          </CardContent>
        </Card>
      )}

      {/* Global Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Server className="w-5 h-5 text-primary" /> 
            <span className="font-semibold text-lg">Active Targets</span>
          </div>
          <div className="flex w-full md:max-w-2xl gap-3">
            <select 
              className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={selectedStateView || ""}
              onChange={e => setSelectedStateView(e.target.value || null)}
            >
              <option value="">All States (Grid View)</option>
              <option value="GlobalState">State Level Portals</option>
              {allStateGroups.map(sg => <option key={sg} value={sg}>{sg}</option>)}
            </select>
            <div className="relative flex-[2]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search targets..."
                className="pl-9 bg-muted/40 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Target List Area */}
      {loading ? (
        <Card>
          <CardContent className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : filteredTargets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col h-64 items-center justify-center text-muted-foreground">
            <Server className="h-12 w-12 opacity-20 mb-3" />
            <p>No scraper targets found.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {selectedStateView === null ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
              {/* Global State-level Targets Card */}
              {stateLevelTargets.length > 0 && (
                <Card 
                  className="cursor-pointer hover:shadow-md hover:border-primary transition-all border-blue-200 group"
                  onClick={() => setSelectedStateView('GlobalState')}
                >
                  <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10 h-full flex flex-col justify-center items-center text-center py-8 group-hover:bg-blue-100/50 dark:group-hover:bg-blue-900/20 transition-colors">
                    <Server className="w-10 h-10 text-blue-500 mb-3" />
                    <CardTitle className="text-xl text-blue-700 dark:text-blue-400">State Level Portals</CardTitle>
                    <Badge variant="default" className="bg-blue-600 mt-3">{stateLevelTargets.length} Targets</Badge>
                  </CardHeader>
                </Card>
              )}

              {/* District Targets Grouped by State */}
              {stateGroups.map(stateGroup => {
                const verifiedCount = groupedTargets[stateGroup].filter(t => t.isVerified).length;
                const totalCount = groupedTargets[stateGroup].length;
                const isAllVerified = verifiedCount > 0 && verifiedCount === totalCount;
                const isSomeVerified = verifiedCount > 0 && verifiedCount < totalCount;

                return (
                <Card 
                  key={stateGroup}
                  className="cursor-pointer hover:shadow-md hover:border-primary transition-all group relative overflow-hidden"
                  onClick={() => setSelectedStateView(stateGroup)}
                >
                  {isAllVerified && (
                    <div className="absolute top-0 right-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs px-2 py-1 rounded-bl-lg flex items-center shadow-sm">
                      <CheckCircle className="w-3 h-3 mr-1" /> Verified
                    </div>
                  )}
                  {isSomeVerified && (
                    <div className="absolute top-0 right-0 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs px-2 py-1 rounded-bl-lg flex items-center shadow-sm" title={`${verifiedCount}/${totalCount} verified`}>
                      <CheckCircle className="w-3 h-3 mr-1" /> Partial
                    </div>
                  )}
                  <CardHeader className="bg-muted/10 h-full flex flex-col justify-center items-center text-center py-8 group-hover:bg-muted/30 transition-colors">
                    <Server className="w-10 h-10 text-muted-foreground mb-3" />
                    <CardTitle className="text-xl text-primary">{stateGroup}</CardTitle>
                    <Badge variant="outline" className="mt-3">{totalCount} Districts</Badge>
                  </CardHeader>
                </Card>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => setSelectedStateView(null)}>
                  &larr; Back to States
                </Button>
                <h2 className="text-2xl font-semibold flex items-center gap-2 flex-1">
                  <Server className="w-6 h-6 text-primary" />
                  {selectedStateView === 'GlobalState' ? 'State Level Portals' : `${selectedStateView} District Targets`}
                </h2>
              </div>
              
              <Card className="shadow-sm border-t-4 border-t-primary">
                <CardContent className="p-0">
                  {renderTable(selectedStateView === 'GlobalState' ? stateLevelTargets : groupedTargets[selectedStateView])}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
      {previewTarget && (
        <PreviewTenderDialog 
          open={!!previewTarget} 
          onOpenChange={(open) => !open && setPreviewTarget(null)} 
          target={previewTarget} 
          token={(session as any)?.accessToken}
          onUpdateSuccess={fetchTargets}
        />
      )}
    </div>
  );
}
