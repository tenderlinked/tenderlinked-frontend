"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit, Loader2, Save, X, ChevronDown, ChevronRight, Map } from "lucide-react";
import toast from "react-hot-toast";

interface RegionDistrict {
  id: string;
  name: string;
}

interface RegionState {
  id: string;
  name: string;
  districts: RegionDistrict[];
}

export default function RegionsPage() {
  const { data: session, status } = useSession();
  const [states, setStates] = useState<RegionState[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for toggling accordions
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());
  
  // State for Add/Edit
  const [editingStateId, setEditingStateId] = useState<string | null>(null);
  const [editingStateName, setEditingStateName] = useState("");
  const [addingState, setAddingState] = useState(false);
  const [newStateName, setNewStateName] = useState("");
  
  const [editingDistrictId, setEditingDistrictId] = useState<string | null>(null);
  const [editingDistrictName, setEditingDistrictName] = useState("");
  const [addingDistrictToStateId, setAddingDistrictToStateId] = useState<string | null>(null);
  const [newDistrictName, setNewDistrictName] = useState("");

  useEffect(() => {
    if (status === "authenticated") fetchStates();
  }, [status]);

  const getHeaders = (): Record<string, string> => {
    // @ts-ignore
    const token = session?.accessToken;
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  };

  const fetchStates = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/regions/states`, { headers: getHeaders() });
      if (res.ok) {
        setStates(await res.json());
      }
    } catch (e) {
      toast.error("Failed to load regions");
    } finally {
      setLoading(false);
    }
  };

  const toggleStateExpanded = (id: string) => {
    const next = new Set(expandedStates);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedStates(next);
  };

  // State CRUD
  const handleAddState = async () => {
    if (!newStateName.trim()) return toast.error("State name is required");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/regions/states`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify({ name: newStateName })
    });
    if (res.ok) {
      toast.success("State added");
      setAddingState(false);
      setNewStateName("");
      fetchStates();
    } else {
      toast.error("Failed to add state");
    }
  };

  const handleUpdateState = async (id: string) => {
    if (!editingStateName.trim()) return toast.error("Name required");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/regions/states/${id}`, {
      method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ name: editingStateName })
    });
    if (res.ok) {
      toast.success("State updated");
      setEditingStateId(null);
      fetchStates();
    } else {
      toast.error("Failed to update state");
    }
  };

  const handleDeleteState = async (id: string) => {
    if (!confirm("Are you sure? This will delete all districts in this state.")) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/regions/states/${id}`, {
      method: 'DELETE', headers: getHeaders()
    });
    if (res.ok) {
      toast.success("State deleted");
      fetchStates();
    } else {
      toast.error("Failed to delete state");
    }
  };

  // District CRUD
  const handleAddDistrict = async (stateId: string) => {
    if (!newDistrictName.trim()) return toast.error("District name is required");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/regions/states/${stateId}/districts`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify({ name: newDistrictName })
    });
    if (res.ok) {
      toast.success("District added");
      setAddingDistrictToStateId(null);
      setNewDistrictName("");
      fetchStates();
    } else {
      toast.error("Failed to add district");
    }
  };

  const handleUpdateDistrict = async (id: string) => {
    if (!editingDistrictName.trim()) return toast.error("Name required");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/regions/districts/${id}`, {
      method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ name: editingDistrictName })
    });
    if (res.ok) {
      toast.success("District updated");
      setEditingDistrictId(null);
      fetchStates();
    } else {
      toast.error("Failed to update district");
    }
  };

  const handleDeleteDistrict = async (id: string) => {
    if (!confirm("Delete this district?")) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/regions/districts/${id}`, {
      method: 'DELETE', headers: getHeaders()
    });
    if (res.ok) {
      toast.success("District deleted");
      fetchStates();
    } else {
      toast.error("Failed to delete district");
    }
  };

  if (status === "loading") {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Region Management</h1>
          <p className="text-muted-foreground mt-1">Manage the master list of states and districts dynamically.</p>
        </div>
        <Button onClick={() => setAddingState(true)} className="bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4 mr-2" /> Add State
        </Button>
      </div>

      {addingState && (
        <Card className="border-primary/50 shadow-md">
          <CardContent className="pt-6 flex gap-3 items-center">
            <Input value={newStateName} onChange={e => setNewStateName(e.target.value)} placeholder="e.g. Karnataka" className="max-w-md" />
            <Button onClick={handleAddState}><Save className="w-4 h-4 mr-2"/> Save</Button>
            <Button variant="ghost" onClick={() => setAddingState(false)}>Cancel</Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-4">
          {states.map(s => (
            <Card key={s.id} className="overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-muted/30 border-b">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" className="p-0 h-8 w-8" onClick={() => toggleStateExpanded(s.id)}>
                    {expandedStates.has(s.id) ? <ChevronDown className="w-5 h-5"/> : <ChevronRight className="w-5 h-5"/>}
                  </Button>
                  
                  {editingStateId === s.id ? (
                    <div className="flex items-center gap-2">
                      <Input value={editingStateName} onChange={e => setEditingStateName(e.target.value)} className="h-8 w-64" autoFocus />
                      <Button size="sm" onClick={() => handleUpdateState(s.id)} className="h-8"><Save className="w-4 h-4"/></Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingStateId(null)} className="h-8"><X className="w-4 h-4"/></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Map className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-lg">{s.name}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{s.districts.length} Districts</span>
                    </div>
                  )}
                </div>
                
                {editingStateId !== s.id && (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingStateId(s.id); setEditingStateName(s.name); }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteState(s.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {expandedStates.has(s.id) && (
                <div className="p-4 bg-background">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {s.districts.map(d => (
                      <div key={d.id} className="flex items-center justify-between border rounded-md p-2 bg-card hover:border-primary/50 transition-colors">
                        {editingDistrictId === d.id ? (
                          <div className="flex items-center gap-1 w-full">
                            <Input value={editingDistrictName} onChange={e => setEditingDistrictName(e.target.value)} className="h-7 text-sm px-2 w-full" autoFocus />
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => handleUpdateDistrict(d.id)}><Save className="w-3.5 h-3.5"/></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingDistrictId(null)}><X className="w-3.5 h-3.5"/></Button>
                          </div>
                        ) : (
                          <>
                            <span className="text-sm font-medium">{d.name}</span>
                            <div className="flex opacity-50 hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingDistrictId(d.id); setEditingDistrictName(d.name); }}>
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => handleDeleteDistrict(d.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    
                    {addingDistrictToStateId === s.id ? (
                      <div className="flex items-center gap-1 border border-primary/50 border-dashed rounded-md p-2 bg-primary/5">
                        <Input value={newDistrictName} onChange={e => setNewDistrictName(e.target.value)} className="h-7 text-sm px-2 w-full" placeholder="District name..." autoFocus />
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => handleAddDistrict(s.id)}><Save className="w-3.5 h-3.5"/></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setAddingDistrictToStateId(null)}><X className="w-3.5 h-3.5"/></Button>
                      </div>
                    ) : (
                      <Button variant="outline" className="h-auto py-2 border-dashed flex justify-start text-muted-foreground" onClick={() => setAddingDistrictToStateId(s.id)}>
                        <Plus className="w-4 h-4 mr-2" /> Add District
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
