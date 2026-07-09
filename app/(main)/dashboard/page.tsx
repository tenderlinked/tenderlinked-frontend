"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckSquare, AlertCircle, Clock, Flame, Sparkles, BrainCircuit } from "lucide-react";
import toast from "react-hot-toast";

interface Tender {
  id: string;
  district: string;
  title: string;
  tenderValue: string | null;
  endDate: string;
  aiProcessed: boolean;
  aiSummary: string | null;
  tags: string[];
  isHighPriority?: boolean;
}

interface ApiResponse {
  data: Tender[];
  meta: {
    total: number;
    pendingQueue: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export default function DashboardPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [meta, setMeta] = useState<ApiResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);

  const { data: session, status } = useSession();
  
  useEffect(() => {
    if (status === "authenticated") {
      fetchTenders();
      
      // Set up real-time polling every 5 seconds
      const interval = setInterval(() => {
        fetchTenders(false); // pass false to avoid triggering the main loading spinner
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [status]);

  // IMPORTANT: Do NOT redirect while status is still "loading".
  // The session is fetched asynchronously — redirecting during loading causes a race condition.
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    window.location.href = "/auth/login";
    return null;
  }

  console.log("Dashboard Session:", session);

  const fetchTenders = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}`}/api/tenders?includeStats=true`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch data");
      
      const data: ApiResponse = await response.json();
      setTenders(data.data);
      setMeta(data.meta);
      
      // Only auto-select first tender if we don't have one selected yet
      setSelectedTender(current => current || (data.data.length > 0 ? data.data[0] : null));
    } catch (error) {
      console.error(error);
      // Only show toast on initial load failure to avoid spamming
      if (showLoading) toast.error("Failed to load tenders.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Rough calculation for cards based on current data
  const total = meta?.total || 0;
  const aiQueue = meta?.pendingQueue || 0;
  
  const oneWeekFromNow = new Date();
  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
  const expiringSoon = tenders.filter(t => new Date(t.endDate) <= oneWeekFromNow && new Date(t.endDate) >= new Date()).length;
  
  const highPriority = tenders.filter(t => t.isHighPriority).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Tenders Card */}
        <Card className="bg-white border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-blue-100 group">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-50 to-blue-100/50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium tracking-wide">Total Tenders</p>
              <h3 className="text-2xl font-bold text-slate-900">{loading ? "..." : total}</h3>
            </div>
          </CardContent>
        </Card>

        {/* AI Queue Card */}
        <Card className="bg-white border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-indigo-100 group">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100/50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium tracking-wide">AI Processing Queue</p>
              <h3 className="text-2xl font-bold text-slate-900">{loading ? "..." : aiQueue}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Expiring Soon Card */}
        <Card className="bg-white border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-emerald-100 group">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100/50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium tracking-wide">Expiring Soon (7d)</p>
              <h3 className="text-2xl font-bold text-slate-900">{loading ? "..." : expiringSoon}</h3>
            </div>
          </CardContent>
        </Card>

        {/* High Priority Card */}
        <Card className="bg-white border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-orange-100 group">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-50 to-orange-100/50 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium tracking-wide">High Priority</p>
              <h3 className="text-2xl font-bold text-slate-900">{loading ? "..." : highPriority}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Main Tenders List */}
        <Card className="md:col-span-8 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Recent Tenders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200 tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-4">District</th>
                    <th className="px-5 py-4">Title & AI Summary</th>
                    <th className="px-5 py-4">Financials</th>
                    <th className="px-5 py-4">Timeline</th>
                    <th className="px-5 py-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        Loading tenders...
                      </td>
                    </tr>
                  ) : tenders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No tenders found.
                      </td>
                    </tr>
                  ) : (
                    tenders.map((tender) => (
                      <tr 
                        key={tender.id} 
                        onClick={() => setSelectedTender(tender)}
                        className={`border-b border-slate-100 last:border-0 cursor-pointer transition-colors duration-200 group ${
                          selectedTender?.id === tender.id 
                            ? 'bg-blue-50/50 dark:bg-blue-900/20' 
                            : 'bg-white hover:bg-slate-50/80 dark:hover:bg-gray-800'
                        }`}
                      >
                        <td className="px-5 py-4 font-medium capitalize text-slate-900">{tender.district}</td>
                        <td className="px-5 py-4 max-w-[300px] truncate">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium text-slate-900 group-hover:text-blue-700 transition-colors" title={tender.title}>{tender.title}</span>
                            {tender.aiProcessed && (
                              <Badge variant="default" className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 h-5 px-1.5 shrink-0 shadow-sm border-0">
                                <Sparkles className="w-3 h-3 text-white" />
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-[13px] font-semibold text-emerald-700">{tender.tenderValue || "N/A"}</td>
                        <td className="px-5 py-4 text-[13px] text-slate-700 font-medium">
                          {new Date(tender.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4">
                          {tender.aiProcessed ? (
                            <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 font-semibold shadow-sm">AI Ready</Badge>
                          ) : (
                            <span className="text-slate-400 text-xs font-medium bg-slate-100 px-2 py-1 rounded-md border border-slate-200">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Right Sidebar (Insights) */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <Card className="shadow-sm bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-slate-800/80 dark:to-slate-900/80 border-blue-100/60 dark:border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-400 rounded-full blur-[60px] opacity-20"></div>
            <CardHeader className="pb-3 border-b border-blue-100/50 dark:border-slate-700">
              <CardTitle className="flex items-center justify-between text-lg text-slate-800 dark:text-slate-100">
                <div className="flex items-center gap-2 font-bold tracking-tight">
                  <BrainCircuit className="w-5 h-5 text-blue-600" />
                  AI Insights
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400 flex flex-col gap-4 pt-4 relative">
              {selectedTender ? (
                <>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {selectedTender.title}
                      </h4>
                      <p className="text-xs text-gray-500 mb-3 capitalize">
                        {selectedTender.district} • Ends {new Date(selectedTender.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="shrink-0 text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => window.location.href = `/dashboard/tenders/${selectedTender.id}`}
                    >
                      View Full Details
                    </Button>
                  </div>
                  
                  {selectedTender.aiProcessed ? (
                    <div>
                      {selectedTender.aiSummary === '__PREMIUM_LOCKED__' ? (
                        <div className="relative overflow-hidden rounded-xl border border-purple-200/60 bg-gradient-to-br from-purple-50/80 to-fuchsia-50/80 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
                          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-purple-400 to-fuchsia-400 rounded-full blur-2xl opacity-20"></div>
                          <div className="relative flex flex-col gap-3">
                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-purple-100">
                              <Sparkles className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-purple-900 mb-1">Premium Feature</h4>
                              <p className="text-xs text-purple-800/80 mb-4 leading-relaxed">
                                Upgrade your plan to unlock AI-powered insights, key requirements, and risk analysis for this tender.
                              </p>
                              <button className="w-full h-8 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-semibold shadow-sm transition-colors">
                                Upgrade to Unlock
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-4 rounded-xl border border-blue-100/50 dark:border-slate-700 shadow-[inset_0_1px_1px_rgba(255,255,255,1)] leading-relaxed font-medium">
                          {selectedTender.aiSummary || "No summary available."}
                        </p>
                      )}
                      {selectedTender.tags && selectedTender.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {selectedTender.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed rounded-md text-center bg-gray-50 dark:bg-gray-800">
                      <p>This tender hasn't been processed by AI yet.</p>
                      <p className="text-xs mt-1">Check the scraper queue or retry processing.</p>
                    </div>
                  )}
                </>
              ) : (
                <p>Select a tender from the table to view its AI insights and summary.</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {selectedTender ? (
                selectedTender.isHighPriority ? (
                  <p className="text-orange-600 font-medium">This is a high priority tender matching your keywords. Immediate attention recommended.</p>
                ) : (
                  <p>Standard priority. Review the documentation to assess applicability.</p>
                )
              ) : (
                <p>No tender selected.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
