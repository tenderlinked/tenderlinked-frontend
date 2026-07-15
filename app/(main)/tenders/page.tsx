"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  MapPin, 
  X, 
  Download, 
  Heart, 
  Briefcase, 
  ChevronRight,
  Filter,
  Sparkles,
  Lock,
  Calendar,
  Clock,
  LayoutGrid,
  List,
  PanelRight
} from "lucide-react";
import { format } from "date-fns";
import { MultiSelectPopover } from "@/components/filters/MultiSelectPopover";
import { AmountRangePopover } from "@/components/filters/AmountRangePopover";
import { useTenderDownload } from "@/hooks/use-tender-download";

interface Tender {
  id: string;
  title: string;
  location?: string | null;
  district: string;
  state: string;
  organisation: string;
  tenderValue: string;
  startDate?: string;
  endDate: string;
  description?: string | null;
  isBookmarked?: boolean;
  aiProcessed: boolean;
  aiSummary: string | null;
  tags: string[];
  noticePdfUrl?: string | null;
  tenderPdfUrl?: string | null;
  sourceUrl?: string | null;
}

// States and cities will be loaded dynamically from the API

export default function UnifiedTendersPage() {
  const { data: session, status } = useSession();
  const { initiateDownload, DownloadModal } = useTenderDownload();
  
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [tabCounts, setTabCounts] = useState({ active: 0, archived: 0, followed: 0 });
  
  const tendersCache = useRef<Record<string, { tenders: any[], total: number }>>({});

  const searchParams = useSearchParams();
  const globalQuery = searchParams.get('q') || "";
  
  // Helper to parse comma-separated array strings from URL
  const parseArrayParam = (key: string): string[] => {
    const val = searchParams.get(key);
    return val ? val.split(',').filter(Boolean) : [];
  };

  // Filters (now arrays)
  const [selectedStates, setSelectedStates] = useState<string[]>(parseArrayParam('states'));
  const [selectedCities, setSelectedCities] = useState<string[]>(parseArrayParam('districts'));
  const [selectedCategories, setSelectedCategories] = useState<string[]>(parseArrayParam('categories'));
  const [selectedAuthorities, setSelectedAuthorities] = useState<string[]>(parseArrayParam('authorities'));
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(parseArrayParam('keywords'));
  const [minAmount, setMinAmount] = useState<string>(searchParams.get('minAmount') || "");
  const [maxAmount, setMaxAmount] = useState<string>(searchParams.get('maxAmount') || "");

  const [statesList, setStatesList] = useState<any[]>([]);
  const [authoritiesList, setAuthoritiesList] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState(globalQuery);
  const [activeTab, setActiveTab] = useState("active");
  const [sortOption, setSortOption] = useState("newest");
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [sidebarStats, setSidebarStats] = useState<{ states: {name:string,count:number}[], cities: {name:string,count:number}[], keywords: {keyword:string,count:number}[] }>({ states: [], cities: [], keywords: [] });

  // Sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState<Record<string, boolean>>({});
  const toggleCollapse = (key: string) => setSidebarCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  // Removed single queryState sync, handled by parseArrayParam initially

  useEffect(() => {
    setSearchQuery(globalQuery);
  }, [globalQuery]);

  // Sync URL params to state when they change (e.g. from Autocomplete routing)
  useEffect(() => {
    setSelectedStates(parseArrayParam('states'));
    setSelectedCities(parseArrayParam('districts'));
    setSelectedCategories(parseArrayParam('categories'));
    setSelectedAuthorities(parseArrayParam('authorities'));
    setSelectedKeywords(parseArrayParam('keywords'));
    setMinAmount(searchParams.get('minAmount') || "");
    setMaxAmount(searchParams.get('maxAmount') || "");
  }, [searchParams]);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/regions/states`);
        if (res.ok) {
          const data = await res.json();
          setStatesList(data);
        }
      } catch (err) {
        console.error("Failed to fetch states", err);
      }
    };
    fetchStates();
  }, []);

  useEffect(() => {
    const fetchSidebarStats = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenders/sidebar-stats`, {
          headers: { Authorization: `Bearer ${(session as any)?.accessToken}` },
        });
        if (res.ok) setSidebarStats(await res.json());
      } catch {}
    };
    if (status === 'authenticated') fetchSidebarStats();
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchTenders();
    }
  }, [status, selectedStates, selectedCities, selectedCategories, selectedAuthorities, selectedKeywords, minAmount, maxAmount, searchQuery, activeTab, sortOption, page, pageSize]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchTabCounts();
    }
  }, [status, selectedStates, selectedCities, selectedCategories, selectedAuthorities, selectedKeywords, minAmount, maxAmount, searchQuery]);

  useEffect(() => {
    const fetchAuthorities = async () => {
      try {
        let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenders/authorities`;
        if (selectedStates.length > 0) {
          url += `?state=${encodeURIComponent(selectedStates[0])}`; // Legacy endpoint only accepts one state for now
        }
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${(session as any)?.accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAuthoritiesList(data);
        }
      } catch (err) {
        console.error("Failed to fetch authorities", err);
      }
    };
    if (status === "authenticated") {
      fetchAuthorities();
    }
  }, [selectedStates, status]);

  const buildBaseUrl = () => {
    let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenders?`;
    if (selectedStates.length > 0) url += `&states=${encodeURIComponent(selectedStates.join(','))}`;
    if (selectedCities.length > 0) url += `&districts=${encodeURIComponent(selectedCities.join(','))}`;
    if (selectedCategories.length > 0) url += `&categories=${encodeURIComponent(selectedCategories.join(','))}`;
    if (selectedAuthorities.length > 0) url += `&authorities=${encodeURIComponent(selectedAuthorities.join(','))}`;
    if (selectedKeywords.length > 0) url += `&keywords=${encodeURIComponent(selectedKeywords.join(','))}`;
    if (minAmount) url += `&minAmount=${encodeURIComponent(minAmount)}`;
    if (maxAmount) url += `&maxAmount=${encodeURIComponent(maxAmount)}`;
    if (searchQuery) url += `&search=${searchQuery}`;
    return url;
  };

  const fetchTabCounts = async () => {
    try {
      const baseUrl = buildBaseUrl();
      const headers = { Authorization: `Bearer ${(session as any)?.accessToken}` };
      const [activeRes, archivedRes, followedRes] = await Promise.all([
        fetch(`${baseUrl}&active=true&limit=1`, { headers }).then(r => r.json()),
        fetch(`${baseUrl}&active=false&limit=1`, { headers }).then(r => r.json()),
        fetch(`${baseUrl}&bookmarked=true&limit=1`, { headers }).then(r => r.json()),
      ]);
      setTabCounts({
        active: activeRes.meta?.total || 0,
        archived: archivedRes.meta?.total || 0,
        followed: followedRes.meta?.total || 0,
      });
    } catch (e) {
      console.error("Failed to fetch tab counts", e);
    }
  };

  const fetchTenders = async () => {
    let url = `${buildBaseUrl()}&page=${page}&pageSize=${pageSize}`;
    if (activeTab === "active") {
      url += `&active=true`;
    } else if (activeTab === "archived") {
      url += `&active=false`;
    } else if (activeTab === "followed") {
      url += `&bookmarked=true`;
    }
    if (sortOption) {
      url += `&sort=${sortOption}`;
    }

    if (tendersCache.current[url]) {
      setTenders(tendersCache.current[url].tenders);
      setTotal(tendersCache.current[url].total);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setTenders(data.data);
        setTotal(data.meta?.total || 0);
        tendersCache.current[url] = { tenders: data.data, total: data.meta?.total || 0 };
      }
    } catch (error) {
      console.error("Failed to fetch tenders:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentCities = selectedStates.length > 0 
    ? statesList.filter(s => selectedStates.includes(s.name)).flatMap(s => s.districts?.map((d: any) => d.name) || [])
    : [];

  const handleSaveFilter = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenants/${(session?.user as any)?.tenantId || 'dummy'}/alert-preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify({
          keywords: selectedKeywords,
          preferredStates: selectedStates,
          tenderValueRange: minAmount || maxAmount ? `${minAmount || 0}-${maxAmount || 'Max'}` : undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to save filter limits. Check your plan restrictions.');
      } else {
        alert('Filters saved successfully as Alert Preferences!');
      }
    } catch (err) {
      alert('An error occurred while saving filters.');
    }
  };

  const handleToggleBookmark = async (id: string, currentStatus?: boolean) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenders/${id}/bookmark`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify({ isBookmarked: !currentStatus })
      });
      if (res.ok) {
        setTenders(prev => prev.map(t => t.id === id ? { ...t, isBookmarked: !currentStatus } : t));
        fetchTabCounts();
        tendersCache.current = {}; // Invalidate cache so followed tab refreshes
      }
    } catch (err) {
      console.error('Failed to toggle bookmark', err);
    }
  };

  const displayStateName = selectedStates.length === 1 ? selectedStates[0] : selectedStates.length > 1 ? "Multiple States" : "All";
  
  const hasActivePlan = (session?.user as any)?.hasActivePlan === true;
  const userPlan = ((session?.user as any)?.planType || '').toLowerCase();
  
  // Hide if they have an active plan (Starter and above)
  const showAdBanner = !hasActivePlan && userPlan !== 'starter' && userPlan !== 'standard' && userPlan !== 'premium';

  return (
    <div className="flex flex-col gap-6 w-full pb-24">
      
      {/* Top Navigation & Filter Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-20 shadow-sm px-4 md:px-8 pt-3 pb-0">
        <div className="w-full mx-auto flex flex-col gap-3">
          
          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2 pb-2">
            <Button variant="outline" size="sm" className="bg-slate-50 text-slate-600 border-slate-200 h-9">
              <Filter className="w-4 h-4 mr-2" />
              Saved Filters
            </Button>

            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-[150px] h-9 text-xs font-semibold bg-white border-slate-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active" className="text-xs font-medium">Active <span className="text-slate-400 ml-1">({tabCounts.active})</span></SelectItem>
                <SelectItem value="archived" className="text-xs font-medium">Archived <span className="text-slate-400 ml-1">({tabCounts.archived})</span></SelectItem>
                <SelectItem value="followed" className="text-xs font-medium">Followed <span className="text-slate-400 ml-1">({tabCounts.followed})</span></SelectItem>
              </SelectContent>
            </Select>

            <MultiSelectPopover
              label="Keyword"
              options={sidebarStats.keywords.map(k => k.keyword)}
              selectedValues={selectedKeywords}
              onChange={setSelectedKeywords}
              placeholder="Search Keywords"
              allowCustom={true}
            />

            <MultiSelectPopover
              label="State"
              options={statesList.map(s => s.name)}
              selectedValues={selectedStates}
              onChange={(vals) => {
                setSelectedStates(vals);
                setSelectedCities([]); // Reset cities when states change
              }}
              placeholder="Search States"
            />

            {(currentCities.length > 0 || selectedCities.length > 0) && (
              <MultiSelectPopover
                label="City"
                options={currentCities}
                selectedValues={selectedCities}
                onChange={setSelectedCities}
                placeholder="Search Cities"
              />
            )}

            <MultiSelectPopover
              label="Category"
              options={["Works", "Services", "Goods", "Consultancy Services"]}
              selectedValues={selectedCategories}
              onChange={setSelectedCategories}
              placeholder="Search Categories"
            />

            <MultiSelectPopover
              label="Authority"
              options={authoritiesList}
              selectedValues={selectedAuthorities}
              onChange={setSelectedAuthorities}
              placeholder="Search Authorities"
            />
            
            <AmountRangePopover
              minAmount={minAmount}
              maxAmount={maxAmount}
              onChange={(min, max) => {
                setMinAmount(min);
                setMaxAmount(max);
              }}
            />

            <div className="ml-auto flex items-center gap-3">
              <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
                <button 
                  onClick={() => { setViewMode('card'); setIsSidebarVisible(true); }}
                  className={`p-1.5 rounded ${viewMode === 'card' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Card View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => { setViewMode('table'); setIsSidebarVisible(false); }}
                  className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-slate-300/50 mx-1"></div>
                <button 
                  onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                  className={`p-1.5 rounded ${isSidebarVisible ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Toggle Sidebar"
                >
                  <PanelRight className="w-4 h-4" />
                </button>
              </div>

              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest" className="text-xs">Newest</SelectItem>
                  <SelectItem value="closing_soon" className="text-xs">Closing Soon</SelectItem>
                  <SelectItem value="high_value" className="text-xs">High Value</SelectItem>
                </SelectContent>
              </Select>
              
              <Button size="sm" onClick={handleSaveFilter} className="h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm rounded-full px-5">
                Save Filter
              </Button>
            </div>
          </div>
          
        </div>
      </div>

      {/* Breadcrumbs & Active Filters (Not sticky) */}
      <div className="w-full mx-auto px-4 md:px-8 mt-2 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/dashboard" className="hover:text-blue-600">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/tenders" className="hover:text-blue-600">Indian Tenders</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="font-semibold text-slate-700">{displayStateName} Tenders</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(selectedStates.length > 0 || selectedCities.length > 0 || selectedCategories.length > 0 || selectedAuthorities.length > 0 || selectedKeywords.length > 0 || minAmount || maxAmount || searchQuery) && (
            <Button variant="ghost" size="sm" className="h-6 text-[11px] text-blue-600 hover:bg-blue-50 px-2 font-semibold" onClick={() => { setSelectedStates([]); setSelectedCities([]); setSelectedCategories([]); setSelectedAuthorities([]); setSelectedKeywords([]); setMinAmount(""); setMaxAmount(""); setSearchQuery(""); }}>
              Reset All
            </Button>
          )}

          {searchQuery && (
            <Badge onClick={() => setSearchQuery("")} variant="secondary" className="bg-white text-slate-700 border border-blue-200 hover:bg-blue-50 px-2 py-0.5 rounded flex items-center gap-2 cursor-pointer font-medium shadow-sm transition-colors">
              <div className="flex flex-col items-start leading-none gap-1 py-0.5">
                <span className="text-[11px] font-semibold leading-none">{searchQuery}</span>
                <span className="text-[9px] text-blue-500 font-bold leading-none">Keyword</span>
              </div>
              <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500 ml-1" />
            </Badge>
          )}
          
          {selectedStates.map(state => (
            <Badge key={`state-${state}`} onClick={() => setSelectedStates(prev => prev.filter(s => s !== state))} variant="secondary" className="bg-white text-slate-700 border border-blue-200 hover:bg-blue-50 px-2 py-0.5 rounded flex items-center gap-2 cursor-pointer font-medium shadow-sm transition-colors">
              <div className="flex flex-col items-start leading-none gap-1 py-0.5">
                <span className="text-[11px] font-semibold leading-none">{state}</span>
                <span className="text-[9px] text-blue-500 font-bold leading-none">State</span>
              </div>
              <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500 ml-1" />
            </Badge>
          ))}
          
          {selectedCities.map(city => (
            <Badge key={`city-${city}`} onClick={() => setSelectedCities(prev => prev.filter(c => c !== city))} variant="secondary" className="bg-white text-slate-700 border border-blue-200 hover:bg-blue-50 px-2 py-0.5 rounded flex items-center gap-2 cursor-pointer font-medium shadow-sm transition-colors">
              <div className="flex flex-col items-start leading-none gap-1 py-0.5">
                <span className="text-[11px] font-semibold leading-none">{city}</span>
                <span className="text-[9px] text-blue-500 font-bold leading-none">City</span>
              </div>
              <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500 ml-1" />
            </Badge>
          ))}
          
          {selectedCategories.map(cat => (
            <Badge key={`cat-${cat}`} onClick={() => setSelectedCategories(prev => prev.filter(c => c !== cat))} variant="secondary" className="bg-white text-slate-700 border border-blue-200 hover:bg-blue-50 px-2 py-0.5 rounded flex items-center gap-2 cursor-pointer font-medium shadow-sm transition-colors">
              <div className="flex flex-col items-start leading-none gap-1 py-0.5">
                <span className="text-[11px] font-semibold leading-none">{cat}</span>
                <span className="text-[9px] text-blue-500 font-bold leading-none">Category</span>
              </div>
              <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500 ml-1" />
            </Badge>
          ))}
          
          {selectedKeywords.map(kw => (
            <Badge key={`kw-${kw}`} onClick={() => setSelectedKeywords(prev => prev.filter(k => k !== kw))} variant="secondary" className="bg-white text-slate-700 border border-blue-200 hover:bg-blue-50 px-2 py-0.5 rounded flex items-center gap-2 cursor-pointer font-medium shadow-sm transition-colors">
              <div className="flex flex-col items-start leading-none gap-1 py-0.5">
                <span className="text-[11px] font-semibold leading-none">{kw}</span>
                <span className="text-[9px] text-blue-500 font-bold leading-none">Keyword</span>
              </div>
              <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500 ml-1" />
            </Badge>
          ))}
          
          {selectedAuthorities.map(auth => (
            <Badge key={`auth-${auth}`} onClick={() => setSelectedAuthorities(prev => prev.filter(a => a !== auth))} variant="secondary" className="bg-white text-slate-700 border border-blue-200 hover:bg-blue-50 px-2 py-0.5 rounded flex items-center gap-2 cursor-pointer font-medium shadow-sm transition-colors max-w-[250px]">
              <div className="flex flex-col items-start leading-none gap-1 py-0.5 w-full overflow-hidden">
                <span className="text-[11px] font-semibold leading-none truncate w-full">{auth}</span>
                <span className="text-[9px] text-blue-500 font-bold leading-none">Authority</span>
              </div>
              <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500 ml-1 shrink-0" />
            </Badge>
          ))}
          
          {(minAmount || maxAmount) && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 px-2 py-0.5 rounded text-[11px] flex items-center gap-1 cursor-pointer">
              ₹ {minAmount || "0"} - ₹ {maxAmount || "Max"}
              <X className="w-3 h-3 hover:text-red-500 shrink-0" onClick={() => { setMinAmount(""); setMaxAmount(""); }} />
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`w-full mx-auto grid grid-cols-1 ${isSidebarVisible ? 'xl:grid-cols-5' : 'xl:grid-cols-1'} gap-6 px-4 md:px-8 pt-6 transition-all duration-300`}>
        
        {/* Left Column - Tenders List */}
        <div className={`${isSidebarVisible ? 'xl:col-span-4' : 'xl:col-span-1'} flex flex-col gap-4 transition-all duration-300`}>
          
          <div className="mb-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">{displayStateName} Tenders</h1>
            <p className="text-sm text-slate-500 mt-1">{total}+ {displayStateName} {selectedStates.length > 0 && "State"} Tenders</p>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-3xl">
              {displayStateName} tenders offer business opportunities across construction, manufacturing, infrastructure, and public services. Our platform simplifies access to the latest e-tender listings, helping businesses discover relevant government contracts, receive real-time alerts, and download documents.
            </p>
          </div>

          <div className="flex flex-col gap-4 mt-2">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : tenders.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700">No tenders found</h3>
                <p className="text-sm text-slate-500 mt-1">Try adjusting your filters to find more opportunities.</p>
              </div>
            ) : viewMode === 'table' ? (
              <div className="overflow-x-auto xl:overflow-visible rounded-xl border border-slate-200 shadow-sm bg-white mt-2">
                <table className="w-full text-sm text-left relative">
                  <thead className="sticky top-[114px] z-10 text-[11px] text-slate-600 uppercase tracking-wider bg-slate-100 shadow-sm ring-1 ring-slate-200">
                    <tr>
                      <th className="px-5 py-4 font-bold">Tender Details</th>
                      <th className="px-5 py-4 font-bold w-48">Value</th>
                      <th className="px-5 py-4 font-bold w-40">Dates</th>
                      <th className="px-5 py-4 font-bold text-right w-36">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tenders.map((tender) => (
                      <tr key={tender.id} className="hover:bg-blue-50/30 even:bg-slate-50/60 transition-colors group">
                        <td className="px-5 py-4">
                          <Link href={`/tenders/${tender.id}`} className="text-[15px] font-semibold text-slate-900 hover:text-blue-600 line-clamp-2 leading-snug mb-1.5 transition-colors" title={tender.title}>
                            {tender.title.replace(/^\[|\]$/g, '').replace(/\]\s*\[/g, ' - ')}
                          </Link>
                          
                          <div className="text-xs text-slate-500 line-clamp-1 mb-2.5 pr-4">
                            {tender.aiSummary === '__PREMIUM_LOCKED__' || tender.tags?.some(t => t.includes('PREMIUM_LOCKED')) ? (
                              <span className="blur-[3px] select-none opacity-60">This premium AI summary contains detailed analysis of the tender scope.</span>
                            ) : tender.aiSummary ? (
                              tender.aiSummary
                            ) : tender.description ? (
                              tender.description
                            ) : (
                              <span className="italic text-slate-400">No summary available.</span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-sm font-medium px-2 py-0.5 text-[10px] flex items-center gap-1 capitalize rounded">
                              <Briefcase className="w-3 h-3 text-white/90" />
                              {tender.tenderCategory || 'Miscellaneous'}
                            </Badge>
                            {tender.tags && tender.tags
                              .filter(t => !t.includes('PREMIUM_LOCKED') && t.toLowerCase() !== (tender.tenderCategory || '').toLowerCase())
                              .slice(0, 1).map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-medium px-2 py-0.5 text-[10px] capitalize rounded">
                                {tag}
                              </Badge>
                            ))}
                            
                            <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium ml-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[150px]" title={tender.location || tender.district || tender.state || tender.organisation}>
                                {tender.location || tender.district || tender.state || tender.organisation}
                              </span>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-5 py-4 align-top pt-5">
                          {tender.tenderValue === '__PREMIUM_LOCKED__' ? (
                            <div className="flex items-center gap-1.5 group/premium cursor-pointer bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 w-fit" title="Unlock Premium to view amount">
                              <span className="font-bold text-emerald-600/50 text-xs blur-[4px] select-none">₹ 25,00,000</span>
                              <Lock className="w-3 h-3 text-blue-500 opacity-80 group-hover/premium:opacity-100 transition-opacity" />
                            </div>
                          ) : (
                            <div className="inline-flex items-center bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100/80">
                              <span className="font-bold text-xs">
                                {tender.tenderValue 
                                  ? (tender.tenderValue.toLowerCase().includes('rs') || tender.tenderValue.includes('₹') 
                                      ? tender.tenderValue 
                                      : `₹ ${tender.tenderValue}`)
                                  : 'Refer Documents'}
                              </span>
                            </div>
                          )}
                        </td>
                        
                        <td className="px-5 py-4 align-top pt-5">
                          <div className="flex flex-col gap-2.5">
                            <div className="flex items-center gap-2">
                              <div className="bg-blue-50/80 border border-blue-100 p-1 rounded-md shadow-sm shrink-0">
                                <Calendar className="w-3 h-3 text-blue-600" />
                              </div>
                              <div className="flex flex-col leading-none">
                                <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400 mb-0.5">Start</span>
                                <span className="font-semibold text-slate-800 text-[11px]">
                                  {tender.startDate ? format(new Date(tender.startDate), 'dd MMM yyyy') : 'N/A'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="bg-rose-50/80 border border-rose-100 p-1 rounded-md shadow-sm shrink-0">
                                <Clock className="w-3 h-3 text-rose-600" />
                              </div>
                              <div className="flex flex-col leading-none">
                                <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400 mb-0.5">Close</span>
                                <span className="font-semibold text-slate-800 text-[11px]">
                                  {tender.endDate ? format(new Date(tender.endDate), 'dd MMM yyyy') : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-5 py-4 align-top text-right pt-5">
                          <div className="flex flex-col items-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className={`h-7 text-xs rounded-full font-semibold px-3 w-24 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${tender.isBookmarked ? 'bg-red-50 border-red-200 text-red-600 hover:bg-blue-600 hover:text-white hover:border-blue-600' : 'text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white'}`}
                              onClick={() => handleToggleBookmark(tender.id, tender.isBookmarked)}
                            >
                              <Heart className={`w-3 h-3 mr-1.5 ${tender.isBookmarked ? 'fill-current' : ''}`} />
                              {tender.isBookmarked ? 'Following' : 'Follow'}
                            </Button>
                            
                            {tender.hasDocuments === false ? (
                              <Button 
                                size="sm" 
                                disabled
                                className="h-7 text-xs rounded-full bg-slate-100 text-slate-400 font-semibold shadow-sm px-3 w-24 cursor-not-allowed border-slate-200"
                                title="No documents available"
                              >
                                <Download className="w-3 h-3 mr-1.5 opacity-50" />
                                No Docs
                              </Button>
                            ) : tender.noticePdfUrl === '__CREDIT_LOCKED__' || tender.tenderPdfUrl === '__CREDIT_LOCKED__' ? (
                              <Button size="sm" variant="outline" className="h-7 text-xs rounded-full border-slate-200 text-slate-500 bg-slate-50 shadow-sm px-3 w-24 relative overflow-hidden group cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95" title="Upgrade to plan to download">
                                <div className="flex items-center opacity-40 select-none">
                                  <Download className="w-3 h-3 mr-1" />
                                  <span className="font-semibold">Download</span>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-100/30 backdrop-blur-[0.5px]">
                                  <Lock className="w-3.5 h-3.5 text-blue-500 drop-shadow-sm group-hover:scale-110 transition-transform" />
                                </div>
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                className="h-7 text-xs rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm px-3 w-24 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 hover:shadow-md"
                                onClick={(e) => initiateDownload(tender, e)}
                              >
                                <Download className="w-3 h-3 mr-1.5" />
                                Download
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              tenders.map((tender) => (
                <Card key={tender.id} className="group relative border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1.5 hover:border-blue-300/60 transition-all duration-500 bg-white overflow-hidden rounded-xl">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="p-0">
                    <div className="p-5 flex flex-col gap-3 relative z-10">
                      
                      {/* Tender Title */}
                      <Link href={`/tenders/${tender.id}`} className="text-[16px] font-semibold text-slate-900 hover:text-blue-600 leading-snug tracking-tight line-clamp-2 transition-colors" title={tender.title}>
                        {tender.title.replace(/^\[|\]$/g, '').replace(/\]\s*\[/g, ' - ')}
                      </Link>

                      {/* Tags & Location */}
                      <div className="flex flex-col gap-2 mt-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-sm font-medium px-2.5 py-0.5 text-xs flex items-center gap-1.5 capitalize rounded-md">
                            <Briefcase className="w-3.5 h-3.5 text-white/90" />
                            {tender.tenderCategory || 'Miscellaneous'}
                          </Badge>
                          {tender.tags && tender.tags
                            .filter(t => !t.includes('PREMIUM_LOCKED') && t.toLowerCase() !== (tender.tenderCategory || '').toLowerCase())
                            .slice(0, 2).map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-medium px-2.5 py-0.5 text-xs capitalize rounded-md">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-1 text-slate-500 text-xs font-medium ml-2">
                          <MapPin className="w-3.5 h-3.5 mr-0.5" />
                          {(() => {
                            const parts = [tender.location, tender.district, tender.state].filter(Boolean) as string[];
                            if (parts.length === 0) return <span>{tender.organisation}</span>;
                            return parts.map((part, index) => (
                              <span key={index}>
                                <a 
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(part)}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="hover:text-blue-600 hover:underline"
                                >
                                  {part}
                                </a>
                                {index < parts.length - 1 && ', '}
                              </span>
                            ));
                          })()}
                        </div>
                      </div>

                      {/* Description / Summary */}
                      <div className="mt-2 text-sm text-slate-600 leading-relaxed">
                        {tender.aiSummary === '__PREMIUM_LOCKED__' || tender.tags?.some(t => t.includes('PREMIUM_LOCKED')) ? (
                           <div className="relative w-full rounded-md overflow-hidden bg-slate-50">
                             {/* Blurred Dummy Text */}
                             <div className="text-sm text-slate-600 leading-relaxed blur-[5px] select-none opacity-60 p-2 line-clamp-2">
                               This premium AI summary contains detailed analysis of the tender scope, eligibility criteria, required documents, and key technical specifications extracted directly from the official notices.
                             </div>
                             
                             {/* Premium Overlay Button */}
                             <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
                               <div className="flex items-center gap-2 text-blue-700 bg-blue-50/95 shadow-sm px-4 py-1.5 rounded-full border border-blue-200 font-medium text-xs cursor-pointer hover:bg-blue-100 transition-colors">
                                 <Lock className="w-3.5 h-3.5" />
                                 <span>Unlock Premium Feature</span>
                                 <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                               </div>
                             </div>
                           </div>
                        ) : tender.aiSummary ? (
                          <div className="line-clamp-2">
                            {tender.aiSummary}
                          </div>
                        ) : tender.description ? (
                          <div className="line-clamp-2">
                            {tender.description}
                          </div>
                        ) : (
                          <span className="italic text-slate-400">No summary available.</span>
                        )}
                      </div>

                    </div>

                    {/* Footer - Details & Actions */}
                    <div className="bg-slate-50/70 border-t border-slate-100 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
                      
                      <div className="flex items-center gap-8">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <div className="bg-blue-50/80 border border-blue-100 p-1 rounded-md shadow-sm">
                              <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Start Date</p>
                          </div>
                          <p className="font-semibold text-slate-800 text-[13px] pl-7">
                            {tender.startDate ? format(new Date(tender.startDate), 'dd MMM yyyy') : 'N/A'}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <div className="bg-rose-50/80 border border-rose-100 p-1 rounded-md shadow-sm">
                              <Clock className="w-3.5 h-3.5 text-rose-600" />
                            </div>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Closing Date</p>
                          </div>
                          <p className="font-semibold text-slate-800 text-[13px] pl-7">
                            {tender.endDate ? format(new Date(tender.endDate), 'dd MMM yyyy') : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-0.5">Tender Amount</p>
                          {tender.tenderValue === '__PREMIUM_LOCKED__' ? (
                            <div className="flex items-center gap-1.5 group/premium cursor-pointer bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 w-fit" title="Unlock Premium to view amount">
                              <span className="font-bold text-emerald-600/50 text-sm blur-[4px] select-none">₹ 25,00,000</span>
                              <Lock className="w-3.5 h-3.5 text-blue-500 opacity-80 group-hover/premium:opacity-100 transition-opacity" />
                            </div>
                          ) : (
                            <div className="inline-flex items-center bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-100/80">
                              <span className="font-bold text-sm">
                                {tender.tenderValue 
                                  ? (tender.tenderValue.toLowerCase().includes('rs') || tender.tenderValue.includes('₹') 
                                      ? tender.tenderValue 
                                      : `₹ ${tender.tenderValue}`)
                                  : 'Refer Documents'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className={`h-8 rounded-full font-semibold px-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${tender.isBookmarked ? 'bg-red-50 border-red-200 text-red-600 hover:bg-blue-600 hover:text-white hover:border-blue-600' : 'text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white'}`}
                          onClick={() => handleToggleBookmark(tender.id, tender.isBookmarked)}
                        >
                          <Heart className={`w-3.5 h-3.5 mr-1.5 ${tender.isBookmarked ? 'fill-current' : ''}`} />
                          {tender.isBookmarked ? 'Following' : 'Follow'}
                        </Button>
                        {tender.hasDocuments === false ? (
                          <Button 
                            size="sm" 
                            disabled
                            className="h-8 rounded-full bg-slate-100 text-slate-400 font-semibold shadow-sm px-4 cursor-not-allowed border-slate-200"
                            title="No documents available"
                          >
                            <Download className="w-3.5 h-3.5 mr-1.5 opacity-50" />
                            No Docs
                          </Button>
                        ) : tender.noticePdfUrl === '__CREDIT_LOCKED__' || tender.tenderPdfUrl === '__CREDIT_LOCKED__' ? (
                          <Button size="sm" variant="outline" className="h-8 rounded-full border-slate-200 text-slate-500 bg-slate-50 shadow-sm px-4 relative overflow-hidden group cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95" title="Upgrade to plan to download">
                            <div className="flex items-center opacity-40 select-none">
                              <Download className="w-3.5 h-3.5 mr-1.5" />
                              <span className="font-semibold">Download</span>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-100/30 backdrop-blur-[0.5px]">
                              <Lock className="w-4 h-4 text-blue-500 drop-shadow-sm group-hover:scale-110 transition-transform" />
                            </div>
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            className="h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm px-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 hover:shadow-md"
                            onClick={(e) => initiateDownload(tender, e)}
                          >
                            <Download className="w-3.5 h-3.5 mr-1.5" />
                            Download
                          </Button>
                        )}
                      </div>
                      
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          
          {/* Pagination Controls */}
          {tenders.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] px-4 md:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-1/3 justify-center sm:justify-start">
                <span className="text-xs text-slate-500 font-medium">Show</span>
                <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                  <SelectTrigger className="w-16 h-8 text-xs bg-slate-50 border-slate-200">
                    <SelectValue placeholder="20" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10" className="text-xs">10</SelectItem>
                    <SelectItem value="20" className="text-xs">20</SelectItem>
                    <SelectItem value="25" className="text-xs">25</SelectItem>
                    <SelectItem value="50" className="text-xs">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-slate-500 font-medium">per page</span>
              </div>
              
              <div className="flex items-center justify-center gap-1 w-full sm:w-1/3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2 text-xs border-slate-200"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                {(() => {
                  const totalPages = Math.max(1, Math.ceil(total / pageSize));
                  const pages = [];
                  for (let i = 1; i <= totalPages; i++) {
                    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
                      pages.push(i);
                    } else if (i === page - 2 || i === page + 2) {
                      pages.push('...');
                    }
                  }
                  return pages.filter((p, idx, arr) => p !== '...' || arr[idx - 1] !== '...').map((p, idx) => (
                    p === '...' ? (
                      <span key={`dots-${idx}`} className="px-1 text-slate-400 text-xs">...</span>
                    ) : (
                      <Button
                        key={`page-${p}`}
                        variant={p === page ? "default" : "outline"}
                        size="sm"
                        className={`h-8 w-8 p-0 text-xs ${p === page ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        onClick={() => setPage(p as number)}
                      >
                        {p}
                      </Button>
                    )
                  ));
                })()}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2 text-xs border-slate-200"
                  disabled={page >= Math.ceil(total / pageSize)}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>

              <div className="flex items-center justify-center sm:justify-end w-full sm:w-1/3">
                <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
                  Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sidebars */}
        {isSidebarVisible && (
          <div className="xl:col-span-1 flex flex-col gap-3 sticky top-36 h-fit max-h-[calc(100vh-160px)] overflow-y-auto pb-4 no-scrollbar animate-in slide-in-from-right-8 duration-300 fade-in">

          {/* Ad Banner */}
          {showAdBanner && (
            <div className="bg-blue-600 text-white overflow-hidden rounded-lg relative group cursor-pointer p-4 min-h-[110px] flex flex-col justify-center shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-700 opacity-90"></div>
              <div className="absolute top-0 right-0 -mt-6 -mr-6 w-20 h-20 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <p className="font-bold text-sm leading-tight mb-1">Don't miss any tender opportunities</p>
                <p className="text-xs text-blue-100 uppercase font-bold tracking-wider mb-3">HURRY UP!</p>
                <Link href="/pricing">
                  <Button size="sm" className="bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs h-7 px-3">BUY NOW</Button>
                </Link>
              </div>
            </div>
          )}

          {/* Tenders By Keywords */}
          {(() => {
            const isOpen = !sidebarCollapsed['keywords'];
            const visible = sidebarStats.keywords;
            return (
            <div className="bg-white border border-slate-100 rounded-lg shadow-sm">
              <button onClick={() => toggleCollapse('keywords')} className="w-full flex items-center justify-between px-4 py-2.5 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Tenders By Keywords</span>
                <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : '-rotate-90'}`} />
              </button>
              {isOpen && (
                <div className="px-4 py-1 max-h-56 overflow-y-auto no-scrollbar">
                  <ul>
                    {visible.map(({ keyword, count }) => (
                      <li key={keyword}>
                        <button onClick={() => setSelectedKeywords(prev => prev.includes(keyword) ? prev.filter(k => k !== keyword) : [...prev, keyword])} className={`text-xs py-1.5 w-full text-left hover:text-blue-600 transition-colors flex items-center justify-between ${selectedKeywords.includes(keyword) ? 'text-blue-600 font-semibold' : 'text-slate-500'}`}>
                          <span>{keyword} Tenders</span>
                          <span className="text-slate-400 text-[10px]">({count})</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            );
          })()}

          {/* Tenders By States */}
          {(() => {
            const isOpen = !sidebarCollapsed['states'];
            const visible = sidebarStats.states;
            return (
            <div className="bg-white border border-slate-100 rounded-lg shadow-sm">
              <button onClick={() => toggleCollapse('states')} className="w-full flex items-center justify-between px-4 py-2.5 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Tenders By States</span>
                <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : '-rotate-90'}`} />
              </button>
              {isOpen && (
                <div className="px-4 py-1 max-h-56 overflow-y-auto no-scrollbar">
                  <ul>
                    {visible.map(({ name, count }) => (
                      <li key={name}>
                        <button onClick={() => setSelectedStates(prev => prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name])} className={`text-xs py-1.5 w-full text-left hover:text-blue-600 transition-colors flex items-center justify-between ${selectedStates.includes(name) ? 'text-blue-600 font-semibold' : 'text-slate-500'}`}>
                          <span>{name} Tenders</span>
                          <span className="text-slate-400 text-[10px]">({count})</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            );
          })()}

          {/* Tenders By Cities */}
          {sidebarStats.cities.length > 0 && (() => {
            const isOpen = !sidebarCollapsed['cities'];
            const citiesToShow = selectedStates.length > 0 ? currentCities : sidebarStats.cities.map(c => c.name);
            const cityCountMap = Object.fromEntries(sidebarStats.cities.map(c => [c.name, c.count]));
            const visible = citiesToShow;
            return (
            <div className="bg-white border border-slate-100 rounded-lg shadow-sm">
              <button onClick={() => toggleCollapse('cities')} className="w-full flex items-center justify-between px-4 py-2.5 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Tenders By Cities</span>
                <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : '-rotate-90'}`} />
              </button>
              {isOpen && (
                <div className="px-4 py-1 max-h-56 overflow-y-auto no-scrollbar">
                  <ul>
                    {visible.map(city => (
                      <li key={city}>
                        <button onClick={() => setSelectedCities(prev => prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city])} className={`text-xs py-1.5 w-full text-left hover:text-blue-600 transition-colors flex items-center justify-between ${selectedCities.includes(city) ? 'text-blue-600 font-semibold' : 'text-slate-500'}`}>
                          <span>{city} Tenders</span>
                          {cityCountMap[city] && <span className="text-slate-400 text-[10px]">({cityCountMap[city]})</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            );
          })()}

          {/* Tenders By Category */}
          {(() => {
            const cats = ["Works", "Services", "Goods", "Consultancy Services"];
            const isOpen = !sidebarCollapsed['categories'];
            return (
            <div className="bg-white border border-slate-100 rounded-lg shadow-sm">
              <button onClick={() => toggleCollapse('categories')} className="w-full flex items-center justify-between px-4 py-2.5 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Tenders By Category</span>
                <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : '-rotate-90'}`} />
              </button>
              {isOpen && (
                <div className="px-4 py-1 max-h-56 overflow-y-auto no-scrollbar">
                  <ul>
                    {cats.map(cat => (
                      <li key={cat}>
                        <button onClick={() => setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])} className={`text-xs py-1.5 w-full text-left hover:text-blue-600 transition-colors ${selectedCategories.includes(cat) ? 'text-blue-600 font-semibold' : 'text-slate-500'}`}>
                          {cat} Tenders
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            );
          })()}

          </div>
        )}
      </div>
      <DownloadModal />
    </div>
  );
}
