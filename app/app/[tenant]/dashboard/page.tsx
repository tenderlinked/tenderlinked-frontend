"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default function DashboardPage({ params }: { params: Promise<{ tenant: string }> }) {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [meta, setMeta] = useState<ApiResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);

  const unwrappedParams = use(params);
  const tenantId = unwrappedParams.tenant;

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Tenders Card */}
        <Card className="bg-blue-600 text-white shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Total Tenders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{loading ? "..." : total}</div>
          </CardContent>
        </Card>

        {/* AI Queue Card */}
        <Card className="bg-blue-300 text-blue-900 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BrainCircuit className="w-4 h-4" />
              AI Processing Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{loading ? "..." : aiQueue}</div>
          </CardContent>
        </Card>

        {/* Expiring Soon Card */}
        <Card className="bg-green-300 text-green-900 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{loading ? "..." : expiringSoon}</div>
          </CardContent>
        </Card>

        {/* High Priority Card */}
        <Card className="bg-orange-200 text-orange-900 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-600">
              <Flame className="w-4 h-4" />
              High Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{loading ? "..." : highPriority}</div>
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
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3">District</th>
                    <th className="px-4 py-3">Title & AI Summary</th>
                    <th className="px-4 py-3">Financials</th>
                    <th className="px-4 py-3">Timeline</th>
                    <th className="px-4 py-3">Action</th>
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
                        className={`border-b dark:border-gray-700 cursor-pointer ${
                          selectedTender?.id === tender.id 
                            ? 'bg-blue-50 dark:bg-blue-900/20' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <td className="px-4 py-3 font-medium capitalize">{tender.district}</td>
                        <td className="px-4 py-3 max-w-[300px] truncate">
                          <div className="flex items-center gap-2">
                            <span className="truncate" title={tender.title}>{tender.title}</span>
                            {tender.aiProcessed && (
                              <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 h-5 px-1 shrink-0">
                                <Sparkles className="w-3 h-3" />
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">{tender.tenderValue || "N/A"}</td>
                        <td className="px-4 py-3">
                          {new Date(tender.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {tender.aiProcessed ? (
                            <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">AI Ready</Badge>
                          ) : (
                            <span className="text-gray-400">Pending</span>
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
          <Card className="shadow-sm bg-blue-50/50 dark:bg-slate-800/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-blue-600" />
                  AI Insights
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground flex flex-col gap-4">
              {selectedTender ? (
                <>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {selectedTender.title}
                    </h4>
                    <p className="text-xs text-gray-500 mb-3 capitalize">
                      {selectedTender.district} • Ends {new Date(selectedTender.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {selectedTender.aiProcessed ? (
                    <div>
                      <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                        {selectedTender.aiSummary || "No summary available."}
                      </p>
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
