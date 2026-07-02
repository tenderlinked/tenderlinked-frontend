"use client";

import { useEffect, useState } from "react";
import { CalendarDays, FileText, CheckCircle2, Clock, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import { TenderFilters } from "@/components/tenders/tender-filters";
import { TenderTable, TenderData } from "@/components/tenders/tender-table";
import { Card, CardContent } from "@/components/ui/card";

interface ApiResponse {
  data: TenderData[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    pendingQueue?: number;
  };
}

export default function DistrictTendersPage() {
  const [todaysTenders, setTodaysTenders] = useState<TenderData[]>([]);
  const [allTenders, setAllTenders] = useState<TenderData[]>([]);
  const [loadingToday, setLoadingToday] = useState(true);
  const [loadingAll, setLoadingAll] = useState(true);
  
  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, active: 0, expiring: 0, orgs: 0 });
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTodaysTenders = async (showLoading = true) => {
    try {
      if (showLoading) setLoadingToday(true);
      
      const todayDate = new Date().toISOString().split('T')[0];
      let url = `${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}`}/api/tenders?tenderType=district&limit=100&date=${todayDate}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (orgFilter !== "all") url += `&district=${encodeURIComponent(orgFilter)}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch today's district tenders");
      
      const data: ApiResponse = await response.json();
      setTodaysTenders(filterByStatus(data.data));
    } catch (error) {
      console.error(error);
      if (showLoading) toast.error("Failed to load today's district tenders.");
    } finally {
      if (showLoading) setLoadingToday(false);
    }
  };

  const fetchAllTenders = async (showLoading = true) => {
    try {
      if (showLoading) setLoadingAll(true);
      
      let url = `${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}`}/api/tenders?tenderType=district&excludeToday=true&page=${page}&pageSize=10`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (orgFilter !== "all") url += `&district=${encodeURIComponent(orgFilter)}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch all district tenders");
      
      const data: ApiResponse = await response.json();
      setAllTenders(filterByStatus(data.data));
      setTotalPages(data.meta.lastPage || 1);
      
      // Calculate stats based on full payload
      const now = new Date();
      const in7Days = new Date();
      in7Days.setDate(now.getDate() + 7);
      
      const uniqueOrgs = new Set(data.data.map(t => t.district)).size;
      const activeCount = data.data.filter(t => t.endDate && new Date(t.endDate) >= now).length;
      const expiringCount = data.data.filter(t => t.endDate && new Date(t.endDate) >= now && new Date(t.endDate) <= in7Days).length;
      
      setStats({
        total: data.meta.total || data.data.length,
        active: activeCount,
        expiring: expiringCount,
        orgs: uniqueOrgs
      });
    } catch (error) {
      console.error(error);
      if (showLoading) toast.error("Failed to load past district tenders.");
    } finally {
      if (showLoading) setLoadingAll(false);
    }
  };

  const filterByStatus = (data: TenderData[]) => {
    const now = new Date();
    if (statusFilter === "active") {
      return data.filter(t => t.endDate && new Date(t.endDate) >= now);
    } else if (statusFilter === "expired") {
      return data.filter(t => t.endDate && new Date(t.endDate) < now);
    }
    return data;
  };

  useEffect(() => {
    fetchTodaysTenders();
    fetchAllTenders();
  }, [search, orgFilter, statusFilter, page]);

  return (
    <div className="flex flex-col gap-8 w-full pb-8">
      {/* Top Stats Row from Mockup */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-border shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Tenders</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-border shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Active Tenders</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.active}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-border shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Expiring Soon (7d)</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.expiring}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-border shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Districts Crawled</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.orgs}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Tenders Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-xl font-bold text-gray-800">
          <CalendarDays className="w-6 h-6 text-blue-600" />
          <h2>Today's Tenders</h2>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-border">
          <TenderFilters 
            type="district" 
            onSearchChange={setSearch} 
            onFilterChange={setOrgFilter}
            onStatusChange={setStatusFilter}
          />
          <TenderTable type="district" tenders={todaysTenders} loading={loadingToday} />
        </div>
      </div>

      {/* All Past Tenders Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-gray-800">District Tenders</h2>
          <p className="text-gray-500 text-sm">District-level tenders from Odisha state portal.</p>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-border">
          <TenderFilters 
            type="district" 
            onSearchChange={setSearch} 
            onFilterChange={setOrgFilter}
            onStatusChange={setStatusFilter}
          />
          <TenderTable type="district" tenders={allTenders} loading={loadingAll} />
          
          {/* Pagination */}
          <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur flex items-center justify-between mt-6 pt-4 px-2 pb-2 -mx-2 text-sm text-gray-600 border-t border-gray-100 shadow-[0_-20px_20px_-15px_rgba(0,0,0,0.05)] rounded-b-xl">
            <div>
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                &lt; Prev
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Next &gt;
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
