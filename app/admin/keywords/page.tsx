"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Sparkles, Check, X, Trash2, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import toast from "react-hot-toast";

interface Keyword {
  id: string;
  word: string;
  expansions?: string[];
  createdAt: string;
}

interface KeywordExpansion {
  id: string;
  baseWord: string;
  expansions: string[];
  status: string;
  createdAt: string;
}

export default function KeywordManagementPage() {
  const { data: session, status } = useSession();
  
  // State for Priority Keywords
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loadingKeywords, setLoadingKeywords] = useState(true);
  const [newKeyword, setNewKeyword] = useState("");
  const [searchKeywords, setSearchKeywords] = useState("");

  // State for Expansions
  const [expansions, setExpansions] = useState<KeywordExpansion[]>([]);
  const [loadingExpansions, setLoadingExpansions] = useState(true);
  const [searchExpansions, setSearchExpansions] = useState("");
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [expansionInput, setExpansionInput] = useState<{ [key: string]: string }>({});

  // State for new keyword generation
  const [suggestedExpansions, setSuggestedExpansions] = useState<string[] | null>(null);
  const [generatingExpansions, setGeneratingExpansions] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      fetchKeywords();
      fetchExpansions();
    }
  }, [status]);

  const fetchKeywords = async () => {
    try {
      setLoadingKeywords(true);
      // @ts-ignore
      const token = session?.accessToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/keywords`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const { data } = await res.json();
        setKeywords(data);
      }
    } catch (error) {
      toast.error("Failed to load keywords");
    } finally {
      setLoadingKeywords(false);
    }
  };

  const fetchExpansions = async () => {
    try {
      setLoadingExpansions(true);
      // @ts-ignore
      const token = session?.accessToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/keywords/expansions/pending`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const { data } = await res.json();
        setExpansions(data);
        
        // Initialize inputs for editing expansions
        const initInputs: { [key: string]: string } = {};
        data.forEach((exp: KeywordExpansion) => {
          initInputs[exp.id] = exp.expansions.join(", ");
        });
        setExpansionInput(initInputs);
      }
    } catch (error) {
      toast.error("Failed to load expansions");
    } finally {
      setLoadingExpansions(false);
    }
  };

  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    
    try {
      setGeneratingExpansions(true);
      // @ts-ignore
      const token = session?.accessToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/keywords/ai-suggest-new`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ word: newKeyword.trim() })
      });
      
      if (res.ok) {
        const { data } = await res.json();
        setSuggestedExpansions(data);
        toast.success("AI generated suggestions! Please review before saving.");
      } else {
        toast.error("Failed to generate AI expansions");
      }
    } catch (error) {
      toast.error("Error generating AI expansions");
    } finally {
      setGeneratingExpansions(false);
    }
  };

  const handleSaveToDB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    
    try {
      // @ts-ignore
      const token = session?.accessToken;
      
      // 1. Save Priority Keyword
      const resKeyword = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/keywords`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ word: newKeyword.trim() })
      });
      
      if (!resKeyword.ok) {
        toast.error("Failed to add keyword (might already exist)");
        return;
      }

      // 2. Save the Expansion Dictionary manually
      if (suggestedExpansions && suggestedExpansions.length > 0) {
        const expArray = suggestedExpansions;
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/keywords/expansions`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ baseWord: newKeyword.trim(), expansions: expArray, status: "APPROVED" })
        });
      }

      toast.success("Keyword and expansions saved!");
      setNewKeyword("");
      setSuggestedExpansions(null);
      fetchKeywords();
    } catch (error) {
      toast.error("Error saving keyword");
    }
  };

  const handleDeleteKeyword = async (id: string) => {
    if (!confirm("Remove this priority keyword?")) return;
    
    try {
      // @ts-ignore
      const token = session?.accessToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/keywords?id=${id}`, {
        method: "DELETE",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (res.ok) {
        toast.success("Keyword deleted");
        fetchKeywords();
      } else {
        toast.error("Failed to delete keyword");
      }
    } catch (error) {
      toast.error("Error deleting keyword");
    }
  };

  const handleAutoExpand = async (id: string) => {
    try {
      setAiLoading(id);
      // @ts-ignore
      const token = session?.accessToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/keywords/expansions/${id}/ai-suggest`, {
        method: "POST",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (res.ok) {
        const { data } = await res.json();
        setExpansionInput(prev => ({ ...prev, [id]: data.join(", ") }));
        toast.success("AI generated suggestions!");
      } else {
        toast.error("Failed to generate suggestions");
      }
    } catch (error) {
      toast.error("Error generating suggestions");
    } finally {
      setAiLoading(null);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const expArray = (expansionInput[id] || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
        
      if (expArray.length === 0) {
        toast.error("Expansions cannot be empty");
        return;
      }

      // @ts-ignore
      const token = session?.accessToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/keywords/expansions/${id}/approve`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ expansions: expArray })
      });
      
      if (res.ok) {
        toast.success("Expansion approved and saved");
        fetchExpansions();
      } else {
        toast.error("Failed to approve expansion");
      }
    } catch (error) {
      toast.error("Error approving expansion");
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Reject this keyword expansion request?")) return;
    
    try {
      // @ts-ignore
      const token = session?.accessToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/keywords/expansions/${id}/reject`, {
        method: "PUT",
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (res.ok) {
        toast.success("Expansion rejected");
        fetchExpansions();
      } else {
        toast.error("Failed to reject expansion");
      }
    } catch (error) {
      toast.error("Error rejecting expansion");
    }
  };

  const filteredKeywords = keywords.filter(k => k.word.toLowerCase().includes(searchKeywords.toLowerCase()));
  const filteredExpansions = expansions.filter(e => e.baseWord.toLowerCase().includes(searchExpansions.toLowerCase()));

  if (status === "loading") {
    return <div className="p-12 text-center">Loading keyword management...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Keyword Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage global priority keywords and handle AI keyword expansion dictionaries.
          </p>
        </div>
      </div>

      <Tabs defaultValue="priority" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="priority">Priority Keywords</TabsTrigger>
          <TabsTrigger value="expansions">
            Pending Expansions
            {expansions.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {expansions.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="priority" className="mt-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Add Keyword Form */}
            <Card className="shadow-sm border-gray-200 dark:border-gray-800 md:col-span-1 h-fit">
              <CardHeader className="bg-gray-50/50 dark:bg-gray-900/50 border-b rounded-t-lg">
                <CardTitle className="text-lg">Add Priority Keyword</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={suggestedExpansions === null ? handleGenerateAI : handleSaveToDB} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Keyword Phrase</label>
                    <Input 
                      placeholder="e.g. IT Services"
                      value={newKeyword}
                      onChange={(e) => {
                        setNewKeyword(e.target.value);
                        setSuggestedExpansions(null);
                      }}
                      disabled={generatingExpansions}
                    />
                  </div>
                  
                  {suggestedExpansions !== null && (
                    <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in duration-300">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-purple-700 dark:text-purple-400">
                        <Sparkles className="w-4 h-4" /> AI Generated Expansions
                      </div>
                      <p className="text-xs text-gray-500">Review and edit these expansions before saving them to the dictionary. Press Enter to add your own.</p>
                      
                      <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-gray-950 border rounded-md shadow-sm min-h-[80px] items-start">
                        {suggestedExpansions.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="pl-3 pr-1 py-1 flex items-center gap-1 text-sm bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-100 dark:border-purple-800/50">
                            {tag}
                            <button 
                              type="button" 
                              onClick={() => setSuggestedExpansions(suggestedExpansions.filter((_, i) => i !== idx))}
                              className="w-4 h-4 rounded-full hover:bg-purple-200 dark:hover:bg-purple-800 flex items-center justify-center text-purple-500 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                        <input
                          type="text"
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newTagInput.trim()) {
                                setSuggestedExpansions([...suggestedExpansions, newTagInput.trim()]);
                                setNewTagInput("");
                              }
                            }
                          }}
                          placeholder="Type and press Enter..."
                          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm border-none shadow-none focus:ring-0 px-1 py-0.5 placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                  )}

                  {suggestedExpansions === null ? (
                    <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={!newKeyword.trim() || generatingExpansions}>
                      {generatingExpansions ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      Generate AI Expansions
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" className="w-1/3" onClick={() => setSuggestedExpansions(null)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="w-2/3" disabled={!newKeyword.trim()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Save to DB
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Keyword List */}
            <Card className="shadow-sm border-gray-200 dark:border-gray-800 md:col-span-2">
              <CardHeader className="border-b bg-white dark:bg-gray-950 pb-4 pt-5 px-6 rounded-t-lg">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <CardTitle className="text-lg">Active Keywords</CardTitle>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search keywords..."
                      className="pl-9 h-9"
                      value={searchKeywords}
                      onChange={(e) => setSearchKeywords(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[600px]">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-900/50 border-b sticky top-0">
                      <tr>
                        <th className="px-6 py-4 font-semibold w-1/4">Keyword</th>
                        <th className="px-6 py-4 font-semibold w-1/2">Related Keywords (Expansions)</th>
                        <th className="px-6 py-4 font-semibold w-1/6">Added On</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {loadingKeywords ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-12 text-center text-gray-500">Loading keywords...</td>
                        </tr>
                      ) : filteredKeywords.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-12 text-center text-gray-500">No keywords found.</td>
                        </tr>
                      ) : (
                        filteredKeywords.map((k) => (
                          <tr key={k.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors bg-white dark:bg-gray-950">
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{k.word}</td>
                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                              {k.expansions && k.expansions.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {k.expansions.map((exp, i) => (
                                    <Badge key={i} variant="secondary" className="font-normal bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                      {exp}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400 italic text-xs">No expansions yet</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-gray-500">{new Date(k.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-right">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteKeyword(k.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expansions" className="mt-6">
          <Card className="shadow-sm border-gray-200 dark:border-gray-800">
            <CardHeader className="border-b bg-white dark:bg-gray-950 pb-4 pt-5 px-6 rounded-t-lg">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Pending Keyword Expansions</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Review keywords requested by users during onboarding.</p>
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search pending..."
                    className="pl-9 h-9"
                    value={searchExpansions}
                    onChange={(e) => setSearchExpansions(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-900/50 border-b">
                    <tr>
                      <th className="px-6 py-4 font-semibold w-1/4">Base Keyword</th>
                      <th className="px-6 py-4 font-semibold w-1/2">Expansions (Comma separated)</th>
                      <th className="px-6 py-4 font-semibold text-right w-1/4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {loadingExpansions ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-gray-500">Loading pending requests...</td>
                      </tr>
                    ) : filteredExpansions.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                              <Check className="w-6 h-6" />
                            </div>
                            <p className="text-gray-900 font-medium">All caught up!</p>
                            <p className="text-sm text-gray-500">No pending keyword expansion requests.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredExpansions.map((exp) => (
                        <tr key={exp.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors bg-white dark:bg-gray-950">
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                            {exp.baseWord}
                            <div className="text-xs text-gray-500 mt-1 font-normal">
                              Requested on {new Date(exp.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Input 
                              value={expansionInput[exp.id] || ""}
                              onChange={(e) => setExpansionInput(prev => ({ ...prev, [exp.id]: e.target.value }))}
                              placeholder="e.g. synonym1, synonym2..."
                              className="w-full"
                            />
                            {(!expansionInput[exp.id] || expansionInput[exp.id].trim() === "") && (
                              <div className="flex items-center text-amber-600 text-xs mt-2">
                                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                                Please generate or type expansions before approving.
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:text-purple-800"
                                onClick={() => handleAutoExpand(exp.id)}
                                disabled={aiLoading === exp.id}
                              >
                                {aiLoading === exp.id ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                                AI Suggest
                              </Button>
                              <Button 
                                variant="default" 
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleApprove(exp.id)}
                                disabled={!expansionInput[exp.id] || expansionInput[exp.id].trim() === ""}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-gray-500 hover:bg-gray-100"
                                onClick={() => handleReject(exp.id)}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
