"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import toast from "react-hot-toast";
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
  PanelRight,
  Copy,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit3
} from "lucide-react";
import { format, differenceInCalendarDays, isToday } from "date-fns";
import { MultiSelectPopover } from "@/components/filters/MultiSelectPopover";
import { AmountRangePopover } from "@/components/filters/AmountRangePopover";
import { useTenderDownload } from "@/hooks/use-tender-download";
import { SaveFilterModal } from "@/components/filters/SaveFilterModal";
import { SavedFiltersDropdown } from "@/components/filters/SavedFiltersDropdown";
import { ConfirmUnlockModal } from "@/components/filters/ConfirmUnlockModal";
import { PreferencesSetupModal } from "@/components/filters/PreferencesSetupModal";
import { PlanChangeModal } from "@/components/filters/PlanChangeModal";
import { EditTenderModal } from "@/components/tenders/edit-tender-modal";

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
  tenderCode?: string | null;
  tenderId?: string | null;
  tenderCategory?: string | null;
  hasDocuments?: boolean;
  authority?: string;
  city?: string;
}

const getPlatformName = (tender: Partial<Tender>) => {
  if (tender.tenderCode?.toUpperCase().startsWith('GEM') || tender.tenderId?.toUpperCase().startsWith('GEM') || tender.sourceUrl?.includes('gem.gov.in')) return 'GeM';
  return 'NICGEP';
};

// States and cities will be loaded dynamically from the API

export default function UnifiedTendersPage() {
  const { data: session, status } = useSession();
  const { initiateDownload, DownloadModal } = useTenderDownload();
  const router = useRouter();
  
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
  const [activeTab, setActiveTab] = useState(searchParams.get('bookmarked') === 'true' ? "followed" : "active");
  const [sortOption, setSortOption] = useState("newest");
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [tableFontSize, setTableFontSize] = useState(13);

  useEffect(() => {
    if (searchParams.get('bookmarked') === 'true') {
      setActiveTab("followed");
    } else {
      setActiveTab("active");
    }
  }, [searchParams]);

  useEffect(() => {
    const savedViewMode = localStorage.getItem('tender_viewMode') as 'card' | 'table';
    if (savedViewMode) setViewMode(savedViewMode);
    const savedSidebar = localStorage.getItem('tender_isSidebarVisible');
    if (savedSidebar !== null) setIsSidebarVisible(savedSidebar === 'true');
    const savedFontSize = localStorage.getItem('tender_tableFontSize');
    if (savedFontSize) setTableFontSize(parseInt(savedFontSize, 10));
  }, []);

  const handleSetViewMode = (mode: 'card' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('tender_viewMode', mode);
  };

  const handleSetSidebarVisible = (visible: boolean) => {
    setIsSidebarVisible(visible);
    localStorage.setItem('tender_isSidebarVisible', visible.toString());
  };

  const handleFontSizeChange = (delta: number) => {
    setTableFontSize(prev => {
      const next = Math.min(20, Math.max(10, prev + delta));
      localStorage.setItem('tender_tableFontSize', String(next));
      return next;
    });
  };

  const [sidebarStats, setSidebarStats] = useState<{ states: {name:string,count:number}[], cities: {name:string,count:number}[], keywords: {keyword:string,count:number}[] }>({ states: [], cities: [], keywords: [] });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [limits, setLimits] = useState({ maxKeywords: 3, maxStates: 1, unlockedStates: [] as string[], unlockedKeywords: [] as string[], planType: '' });
  const [isLoadingLimits, setIsLoadingLimits] = useState(true);
  const [unlockModal, setUnlockModal] = useState<{isOpen: boolean, type: 'state'|'keyword', value: string, title: string, description: string, loading: boolean, isLimitReached?: boolean}>({ isOpen: false, type: 'state', value: '', title: '', description: '', loading: false });
  const [isSaveFilterOpen, setIsSaveFilterOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isPlanChangeOpen, setIsPlanChangeOpen] = useState(false);
  const [refreshFiltersTrigger, setRefreshFiltersTrigger] = useState(0);

  const [editingTender, setEditingTender] = useState<Tender | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const hasActiveFilters = selectedStates.length > 0 || selectedCities.length > 0 || selectedCategories.length > 0 || selectedAuthorities.length > 0 || selectedKeywords.length > 0 || minAmount || maxAmount || searchQuery;
  const isLocked = false;

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
    const fetchUsage = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/billing/usage`, {
          headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          const fetchedLimits = { 
            maxKeywords: data.maxKeywords || 3, 
            maxStates: data.maxStates || 1,
            unlockedStates: data.unlockedStates || [],
            unlockedKeywords: data.unlockedKeywords || [],
            planType: data.planType || ''
          };
          setLimits(fetchedLimits);
          
          // Auto-selection of previously locked preferences has been disabled globally.
          // if (!searchParams.get('states') && fetchedLimits.unlockedStates.length > 0) {
          //   setSelectedStates(fetchedLimits.unlockedStates);
          // }
          // if (!searchParams.get('keywords') && fetchedLimits.unlockedKeywords.length > 0) {
          //   setSelectedKeywords(fetchedLimits.unlockedKeywords);
          // }
        }
      } catch (err) {
        console.error("Failed to fetch limits", err);
      } finally {
        setIsLoadingLimits(false);
      }
    };
    const fetchSidebarStats = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenders/sidebar-stats`, {
          headers: { Authorization: `Bearer ${(session as any)?.accessToken}` },
        });
        if (res.ok) setSidebarStats(await res.json());
      } catch {}
    };
    if (status === 'authenticated') {
      fetchSidebarStats();
      fetchUsage();
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchTenders();
    }
  }, [status, selectedStates, selectedCities, selectedCategories, selectedAuthorities, selectedKeywords, minAmount, maxAmount, searchQuery, activeTab, sortOption, page, pageSize, limits.unlockedStates, limits.unlockedKeywords]);



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

  const isKeywordLimitReached = limits.maxKeywords < 100 && limits.unlockedKeywords.length >= limits.maxKeywords;
  const lockedKeywords = isKeywordLimitReached 
    ? sidebarStats.keywords.map(k => k.keyword).filter(k => !limits.unlockedKeywords.includes(k)) 
    : [];

  const isStateLimitReached = limits.maxStates < 100 && limits.unlockedStates.length >= limits.maxStates;
  const lockedStates = isStateLimitReached 
    ? statesList.map(s => s.name).filter(s => !limits.unlockedStates.includes(s)) 
    : [];

  // Highlight matching keywords/search terms in text
  const highlightText = (text: string): React.ReactNode => {
    const terms = [
      ...selectedKeywords,
      ...(searchQuery ? [searchQuery] : []),
    ].filter(Boolean);
    if (terms.length === 0) return text;
    const pattern = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${pattern})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">{part}</mark>
        : part
    );
  };

  // Detect if a tender is a semantic-only match (search term not literally in title/description)
  const isSemanticMatch = (tender: any): boolean => {
    const terms = [
      ...selectedKeywords,
      ...(searchQuery ? [searchQuery] : []),
    ].filter(Boolean);
    if (terms.length === 0) return false;
    const haystack = `${tender.title || ''} ${tender.description || ''}`.toLowerCase();
    return !terms.some(t => haystack.includes(t.toLowerCase()));
  };

  const buildBaseUrl = () => {
    let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenders?`;
    
    let activeStates = selectedStates;
    let activeKeywords = selectedKeywords;
    if (activeStates.length > 0) url += `&states=${encodeURIComponent(activeStates.join(','))}`;
    if (activeKeywords.length > 0) url += `&keywords=${encodeURIComponent(activeKeywords.join(','))}`;
    
    if (selectedCities.length > 0) url += `&districts=${encodeURIComponent(selectedCities.join(','))}`;
    if (selectedCategories.length > 0) url += `&categories=${encodeURIComponent(selectedCategories.join(','))}`;
    if (selectedAuthorities.length > 0) url += `&authorities=${encodeURIComponent(selectedAuthorities.join(','))}`;
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
      setLoading(false);
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

  // Sidebar keyword quick-select: clear all filters and show only results for this keyword
  const handleSidebarKeywordClick = (keyword: string) => {
    setSearchQuery('');
    setSelectedKeywords([keyword]);
    setSelectedStates([]);
    setSelectedCities([]);
    setSelectedCategories([]);
    setSelectedAuthorities([]);
    setMinAmount('');
    setMaxAmount('');
    setPage(1);
    // Clear URL params so the address bar shows /tenders cleanly
    router.replace('/tenders');
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
        toast.error(data.message || 'Failed to save filter limits. Check your plan restrictions.');
      } else {
        setIsSaveFilterOpen(true);
      }
    } catch (err) {
      toast.error('An error occurred while saving filters.');
    }
  };

  const handleApplySavedFilter = (filters: any) => {
    if (filters.states) setSelectedStates(filters.states);
    if (filters.cities) setSelectedCities(filters.cities);
    if (filters.categories) setSelectedCategories(filters.categories);
    if (filters.authorities) setSelectedAuthorities(filters.authorities);
    if (filters.keywords) setSelectedKeywords(filters.keywords);
    if (filters.minAmount !== undefined) setMinAmount(filters.minAmount);
    if (filters.maxAmount !== undefined) setMaxAmount(filters.maxAmount);
    if (filters.searchQuery !== undefined) setSearchQuery(filters.searchQuery);
    setPage(1);
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

  const handleSort = (field: string) => {
    let newDir = 'desc'; // Default to descending first
    if (sortOption && sortOption.startsWith(field)) {
      const currentDir = sortOption.split('_').pop();
      if (currentDir === 'desc') newDir = 'asc';
      else if (currentDir === 'asc') {
        setSortOption('newest'); // reset to default
        return;
      }
    }
    setSortOption(`${field}_${newDir}`);
  };

  const renderSortIcon = (field: string) => {
    if (!sortOption || !sortOption.startsWith(field)) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 group-hover:text-slate-500 transition-colors transition-opacity" />;
    }
    const dir = sortOption.split('_').pop();
    return dir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />;
  };

  return (
    <div className="flex flex-col w-full pb-24">
      
      {/* Top Navigation & Filter Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-20 shadow-sm px-4 md:px-8 pt-3 pb-0">
        <div className="w-full mx-auto flex flex-col gap-3">
          
          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2 pb-2">
            <SavedFiltersDropdown 
              onApplyFilter={handleApplySavedFilter} 
              refreshTrigger={refreshFiltersTrigger} 
            />

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
              optionCounts={Object.fromEntries(sidebarStats.keywords.map(k => [k.keyword, k.count]))}
              selectedValues={selectedKeywords}
              onChange={(vals) => {
                setSelectedKeywords(vals);
              }}
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

              {/* Font size controls */}
              <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 gap-0.5">
                <button
                  onClick={() => handleFontSizeChange(-1)}
                  disabled={tableFontSize <= 10}
                  className="px-2 py-1 rounded text-xs font-bold text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Decrease font size"
                >
                  A-
                </button>
                <span className="px-1.5 text-[11px] font-mono text-slate-500 min-w-[28px] text-center select-none">{tableFontSize}px</span>
                <button
                  onClick={() => handleFontSizeChange(1)}
                  disabled={tableFontSize >= 20}
                  className="px-2 py-1 rounded text-xs font-bold text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Increase font size"
                >
                  A+
                </button>
              </div>

              {/* View mode + sidebar toggle */}
              <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
                <button 
                  onClick={() => handleSetViewMode('card')}
                  className={`p-1.5 rounded ${viewMode === 'card' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Card View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleSetViewMode('table')}
                  className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-slate-300/50 mx-1"></div>
                <button 
                  onClick={() => handleSetSidebarVisible(!isSidebarVisible)}
                  className={`p-1.5 rounded ${isSidebarVisible ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Toggle Sidebar"
                >
                  <PanelRight className="w-4 h-4" />
                </button>
              </div>

              <Button size="sm" onClick={handleSaveFilter} className="h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm rounded-full px-5">
                Save Filter
              </Button>
            </div>
          </div>
          
        </div>
      </div>


      {/* Main Content Area */}
      <div className={`w-full mx-auto grid grid-cols-1 ${isSidebarVisible ? 'xl:grid-cols-7' : 'xl:grid-cols-1'} gap-6 transition-all duration-300`}>
        
        {/* Left Column - Tenders List */}
        <div className={`${isSidebarVisible ? 'xl:col-span-6' : 'xl:col-span-1'} flex flex-col gap-4 transition-all duration-300`}>
          {isLocked ? (
            <div className="text-center py-24 bg-white rounded-xl border border-slate-200 shadow-sm mt-4 mx-4 md:mx-6 flex flex-col items-center">
              <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Unlock Your Tender Feed</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-md leading-relaxed mb-6">
                To view active tenders, you must first set up your preferences. Please use the filters above to select and lock in your preferred states or keywords.
              </p>
              <Button 
                onClick={() => setIsPreferencesOpen(true)} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-5 text-base rounded-full shadow-md transition-transform hover:scale-105"
              >
                Setup Preferences
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 mt-2 relative">
                {loading && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-20 flex items-center justify-center rounded-xl min-h-[300px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}
                {tenders.length === 0 && !loading ? (
                  <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-700">No tenders found</h3>
                    <p className="text-sm text-slate-500 mt-1">Try adjusting your filters to find more opportunities.</p>
                  </div>
                ) : viewMode === 'table' ? (
              <>
                <style>{`
                  .tender-data-table,
                  .tender-data-table td,
                  .tender-data-table th,
                  .tender-data-table a,
                  .tender-data-table span:not(.badge-exempt),
                  .tender-data-table div,
                  .tender-data-table p {
                    font-size: ${tableFontSize}px !important;
                  }
                `}</style>
              <div className="border-y border-slate-200 bg-white">
                <table className="tender-data-table w-full text-left relative">
                  <thead className="sticky top-[121px] z-10 text-[11px] text-slate-700 uppercase tracking-wider bg-blue-50 shadow-sm border-b border-slate-300">
                    <tr className="divide-x divide-slate-200">
                      <th className="px-3 py-3 font-bold text-center w-32 cursor-pointer group hover:bg-blue-100/50 transition-colors select-none" onClick={() => handleSort('organisation')}>
                        <div className="flex items-center justify-center gap-1.5">Department Name {renderSortIcon('organisation')}</div>
                      </th>
                      <th className="px-3 py-3 font-bold text-center w-28 cursor-pointer group hover:bg-blue-100/50 transition-colors select-none" onClick={() => handleSort('tenderId')}>
                        <div className="flex items-center justify-center gap-1.5">Tender ID {renderSortIcon('tenderId')}</div>
                      </th>
                      <th className="px-3 py-3 font-bold text-center w-24 cursor-pointer group hover:bg-blue-100/50 transition-colors select-none" onClick={() => handleSort('tenderCategory')}>
                        <div className="flex items-center justify-center gap-1.5">Tender Category {renderSortIcon('tenderCategory')}</div>
                      </th>
                      <th className="px-4 py-3 font-bold text-center cursor-pointer group hover:bg-blue-100/50 transition-colors select-none" onClick={() => handleSort('title')}>
                        <div className="flex items-center justify-center gap-1.5">Name of Work {renderSortIcon('title')}</div>
                      </th>
                      <th className="px-3 py-3 font-bold text-center w-36 cursor-pointer group hover:bg-blue-100/50 transition-colors select-none" onClick={() => handleSort('tenderAmount')}>
                        <div className="flex items-center justify-center gap-1.5"><span>Estimated<br/>Contract Value</span> {renderSortIcon('tenderAmount')}</div>
                      </th>
                      <th className="px-3 py-3 font-bold text-center w-32 cursor-pointer group hover:bg-blue-100/50 transition-colors select-none" onClick={() => handleSort('startDate')}>
                        <div className="flex items-center justify-center gap-1.5">Start Date & Time {renderSortIcon('startDate')}</div>
                      </th>
                      <th className="px-3 py-3 font-bold text-center w-32 cursor-pointer group hover:bg-blue-100/50 transition-colors select-none" onClick={() => handleSort('endDate')}>
                        <div className="flex items-center justify-center gap-1.5">Closing Date & Time {renderSortIcon('endDate')}</div>
                      </th>
                      <th className="px-2 py-3 font-bold text-center w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 border-b border-slate-200">
                    {tenders.map((tender) => {
                      const isClosed = tender.endDate && differenceInCalendarDays(new Date(tender.endDate), new Date()) < 0;
                      return (
                      <tr key={tender.id} className={`${isClosed ? 'bg-slate-100/80 hover:bg-slate-200/50 grayscale-[0.2] opacity-80' : 'hover:bg-blue-50/20 even:bg-slate-50/50 bg-white'} transition-colors group divide-x divide-slate-200 text-center`}>
                        <td className="px-3 py-4 text-xs font-medium text-slate-700 uppercase">
                          {tender.authority || tender.organisation || 'N/A'}
                        </td>
                        
                        <td className="px-3 py-4 text-[11px] font-semibold text-slate-800">
                          <div 
                            className="flex items-center justify-center gap-1.5 cursor-pointer group/copy"
                            onClick={async () => {
                              const idToCopy = tender.tenderId || tender.tenderCode || '';
                              if (!idToCopy) return;
                              try {
                                if (navigator?.clipboard?.writeText) {
                                  await navigator.clipboard.writeText(idToCopy);
                                } else {
                                  const textArea = document.createElement("textarea");
                                  textArea.value = idToCopy;
                                  document.body.appendChild(textArea);
                                  textArea.select();
                                  document.execCommand('copy');
                                  document.body.removeChild(textArea);
                                }
                                toast.success('Tender ID copied to clipboard!');
                              } catch (err) {
                                console.error('Failed to copy', err);
                                toast.error('Failed to copy Tender ID');
                              }
                            }}
                            title="Click to copy"
                          >
                            <span className="group-hover/copy:text-blue-600 transition-colors">
                              {tender.tenderId || tender.tenderCode || 'N/A'}
                            </span>
                            <Copy className="w-3 h-3 text-slate-400 opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                          </div>
                        </td>
                        
                        <td className="px-3 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                          {tender.tenderCategory || 'WORKS'}
                        </td>
                        
                        <td className="px-4 py-4 text-left">
                          <Link href={`/tenders/${tender.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}--${tender.tenderId || tender.tenderCode || tender.id}`} className="text-xs font-semibold text-slate-900 hover:text-blue-600 line-clamp-3 leading-relaxed transition-colors" title={tender.title}>
                            {highlightText(tender.title.replace(/^\[|\]$/g, '').replace(/\]\s*\[/g, ' - '))}
                          </Link>
                          {isSemanticMatch(tender) && (
                            <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-600 border border-purple-200 text-[9px] font-semibold px-1.5 py-0.5 rounded mt-1" title="Recommended by AI based on semantic relevance to your search">
                              <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/></svg>
                              AI Match{tender.aiMatchScore != null ? ` ${tender.aiMatchScore}%` : ''}
                            </span>
                          )}
                          {(() => {
                            const filteredTags = (tender.tags || []).filter((t: string) => !t.includes('PREMIUM_LOCKED') && t.toLowerCase() !== (tender.tenderCategory || '').toLowerCase());
                            return filteredTags.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-1.5 mt-2 mb-1">
                                {filteredTags.slice(0, 4).map((tag: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-[9px] px-1.5 py-0 bg-slate-50 text-slate-500 font-medium border-slate-200 uppercase tracking-wider">
                                    {tag}
                                  </Badge>
                                ))}
                                {filteredTags.length > 4 && (
                                  <span className="text-[9px] text-slate-400 font-medium">+{filteredTags.length - 4} more</span>
                                )}
                              </div>
                            ) : null;
                          })()}
                          {(tender.location || tender.district || tender.city || tender.state) && (
                            <div className="flex items-center gap-1 text-slate-500 text-[10px] mt-1.5 font-medium">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate" title={[tender.location, tender.district, tender.city, tender.state].filter(Boolean).join(', ')}>
                                {(() => {
                                  const parts = [tender.location, tender.district, tender.city, tender.state].filter(Boolean) as string[];
                                  return Array.from(new Set(parts)).join(', ');
                                })()}
                                <span className="font-semibold text-slate-600 ml-1">({getPlatformName(tender)})</span>
                              </span>
                            </div>
                          )}
                          {/* Description in table view */}
                          {(() => {
                            let textToShow = tender.description;
                            if (tender.aiSummary && tender.aiSummary !== '__PREMIUM_LOCKED__') {
                              try {
                                const parsed = JSON.parse(tender.aiSummary);
                                if (parsed.workDescription && parsed.workDescription !== 'Not Specified') textToShow = parsed.workDescription;
                              } catch { textToShow = tender.aiSummary; }
                            }
                            if (!textToShow || textToShow.trim() === '') return null;
                            return (
                              <div className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mt-1" title={textToShow}>
                                {highlightText(textToShow)}
                              </div>
                            );
                          })()}

                        </td>
                        
                        <td className="px-3 py-4">
                          {tender.tenderValue === '__PREMIUM_LOCKED__' ? (
                            <div className="flex justify-center items-center gap-1 group/premium cursor-pointer" title="Unlock Premium to view amount">
                              <span className="font-bold text-emerald-600/50 text-xs blur-[4px] select-none">₹ 25,00,000</span>
                              <Lock className="w-3 h-3 text-blue-500 opacity-80" />
                            </div>
                          ) : (
                            <span className="font-semibold text-xs text-slate-800">
                              {tender.tenderValue 
                                ? (tender.tenderValue.toLowerCase().includes('rs') || tender.tenderValue.includes('₹') 
                                    ? tender.tenderValue 
                                    : `₹ ${tender.tenderValue}`)
                                : '-'}
                            </span>
                          )}
                        </td>
                        
                        <td className="px-3 py-4 text-xs font-medium text-slate-600">
                          {tender.startDate ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="font-bold text-slate-800 whitespace-nowrap">{format(new Date(tender.startDate), 'dd MMM yyyy')}</span>
                              <span className="text-[10px] text-slate-500 mb-1">{format(new Date(tender.startDate), 'hh:mm a')}</span>
                              {(() => {
                                const d = new Date(tender.startDate);
                                if (isToday(d)) return <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full">Today</span>;
                                const diff = differenceInCalendarDays(d, new Date());
                                if (diff < 0) return <span className="text-[10px] text-slate-400 font-medium">{Math.abs(diff)} days ago</span>;
                                return <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full font-medium">in {diff} days</span>;
                              })()}
                            </div>
                          ) : 'N/A'}
                        </td>
                        
                        <td className="px-3 py-4 text-xs font-medium text-slate-600">
                          {tender.endDate ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="font-bold text-slate-800 whitespace-nowrap">{format(new Date(tender.endDate), 'dd MMM yyyy')}</span>
                              <span className="text-[10px] text-slate-500 mb-1">{format(new Date(tender.endDate), 'hh:mm a')}</span>
                              {(() => {
                                const d = new Date(tender.endDate);
                                if (isToday(d)) return <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded-full animate-pulse">Ends today</span>;
                                const diff = differenceInCalendarDays(d, new Date());
                                if (diff < 0) return <span className="text-[10px] text-red-600 font-semibold bg-red-50 px-1.5 py-0.5 rounded-full">Closed</span>;
                                if (diff <= 3) return <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded-full">{diff} days left</span>;
                                return <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-full">{diff} days left</span>;
                              })()}
                            </div>
                          ) : 'N/A'}
                        </td>
                        
                        <td className="px-2 py-4">
                          <div className="flex flex-col items-center gap-2.5">
                            <button 
                              onClick={() => handleToggleBookmark(tender.id, tender.isBookmarked)}
                              className={`p-1.5 rounded-md transition-colors ${tender.isBookmarked ? 'text-red-500 hover:bg-red-50' : 'text-blue-600 hover:bg-blue-50 border border-blue-200'}`}
                              title={tender.isBookmarked ? 'Following' : 'Follow'}
                            >
                              <Heart className={`w-4 h-4 ${tender.isBookmarked ? 'fill-current' : ''}`} />
                            </button>
                            
                            {tender.hasDocuments === false ? (
                              <button disabled className="p-1.5 border border-slate-200 rounded-md text-slate-300 cursor-not-allowed" title="No documents available">
                                <Download className="w-4 h-4" />
                              </button>
                            ) : tender.noticePdfUrl === '__CREDIT_LOCKED__' || tender.tenderPdfUrl === '__CREDIT_LOCKED__' ? (
                              <button className="p-1.5 border border-blue-200 text-blue-400 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors relative group" title="Upgrade to plan to download">
                                <Download className="w-4 h-4 opacity-40" />
                                <Lock className="w-3 h-3 absolute -bottom-1 -right-1 text-blue-600" />
                              </button>
                            ) : (
                              <button 
                                onClick={(e) => initiateDownload(tender, e)}
                                className="p-1.5 border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="Download Documents"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            )}
                            
                            {session?.user?.globalRole === 'SUPER_ADMIN' && (
                              <button
                                onClick={() => { setEditingTender(tender as any); setIsEditModalOpen(true); }}
                                className="p-1.5 border border-amber-200 text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                                title="Edit Tender"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              </div>
              </>
            ) : (
              <>
                <style>{`
                  .tender-data-table,
                  .tender-data-table td,
                  .tender-data-table th,
                  .tender-data-table a,
                  .tender-data-table span,
                  .tender-data-table div,
                  .tender-data-table p {
                    font-size: ${tableFontSize}px !important;
                  }
                `}</style>
              <div className="tender-data-table flex flex-col gap-4">
              {tenders.map((tender) => {
                const isClosed = tender.endDate && differenceInCalendarDays(new Date(tender.endDate), new Date()) < 0;
                return (
                <Card key={tender.id} className={`group relative shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500 overflow-hidden rounded-xl ${isClosed ? 'bg-slate-50 border-slate-200 grayscale-[0.2] opacity-80 hover:shadow-slate-900/5 hover:border-slate-300' : 'bg-white border-slate-200/60 hover:shadow-blue-900/5 hover:border-blue-300/60'}`}>
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="p-0">
                    <div className="p-5 flex flex-col gap-3 relative z-10">
                      
                      {/* Tender Title */}
                      <Link href={`/tenders/${tender.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}--${tender.tenderId || tender.tenderCode || tender.id}`} className="text-[16px] font-semibold text-slate-900 hover:text-blue-600 leading-snug tracking-tight line-clamp-2 transition-colors" title={tender.title}>
                        {highlightText(tender.title.replace(/^\[|\]$/g, '').replace(/\]\s*\[/g, ' - '))}
                      </Link>
                      {isSemanticMatch(tender) && (
                        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-600 border border-purple-200 text-[10px] font-semibold px-2 py-0.5 rounded-md -mt-1 w-fit" title="Recommended by AI based on semantic relevance to your search">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/></svg>
                          AI Match{tender.aiMatchScore != null ? ` ${tender.aiMatchScore}%` : ''}
                        </span>
                      )}

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
                          <span className="font-semibold text-slate-600 ml-1">({getPlatformName(tender)})</span>
                        </div>
                      </div>
                    </div>

                    {/* Description / AI Summary */}
                    {(() => {
                      let textToShow = tender.description;
                      if (tender.aiSummary && tender.aiSummary !== '__PREMIUM_LOCKED__') {
                        try {
                          const parsed = JSON.parse(tender.aiSummary);
                          if (parsed.workDescription && parsed.workDescription !== "Not Specified") {
                            textToShow = parsed.workDescription;
                          }
                        } catch (e) {
                          textToShow = tender.aiSummary;
                        }
                      }
                      
                      if (!textToShow || textToShow.trim() === '') return null;
                      
                      return (
                        <div className="px-5 pb-4">
                          {tender.aiSummary && tender.aiSummary !== '__PREMIUM_LOCKED__' && (
                            <div className="mb-1.5">
                              <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-purple-100">
                                <Sparkles className="w-3 h-3" />
                                AI Generated
                              </span>
                            </div>
                          )}
                          <div className="text-sm text-slate-600 line-clamp-2 leading-relaxed" title={textToShow}>
                             {highlightText(textToShow)}
                          </div>
                        </div>
                      );
                    })()}

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
                            className="h-8 rounded-full bg-blue-600 text-white shadow-sm px-4 hover:bg-blue-700 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                            onClick={(e) => initiateDownload(tender, e)}
                            title="Download Documents"
                          >
                            <Download className="w-3.5 h-3.5 mr-1.5" />
                            Download
                          </Button>
                        )}
                        {session?.user?.globalRole === 'SUPER_ADMIN' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 rounded-full border-amber-200 text-amber-600 bg-amber-50 shadow-sm px-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 hover:bg-amber-100 hover:border-amber-300"
                            title="Edit Tender"
                            onClick={() => { setEditingTender(tender as any); setIsEditModalOpen(true); }}
                          >
                            <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                            Edit
                          </Button>
                        )}
                      </div>
                      
                    </div>
                  </CardContent>
                </Card>
                );})}
              </div>
              </>
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
                    </>
          )}
        </div>

        {/* Right Column - Sidebars */}
        {isSidebarVisible && (
          <div className="xl:col-span-1 flex flex-col gap-3 sticky top-[121px] mt-2 h-fit max-h-[calc(100vh-160px)] overflow-y-auto pb-4 no-scrollbar animate-in slide-in-from-right-8 duration-300 fade-in">

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
              <button onClick={() => toggleCollapse('keywords')} className="w-full flex items-center justify-between px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Tenders By Keywords</span>
                <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : '-rotate-90'}`} />
              </button>
              {isOpen && (
                <div className="px-4 py-1 max-h-56 overflow-y-auto no-scrollbar">
                  <ul>
                    {visible.map(({ keyword, count }) => {
                      const isLocked = lockedKeywords.includes(keyword);
                      return (
                      <li key={keyword}>
                        <div className="flex items-center justify-between w-full group py-1.5 hover:bg-slate-50 px-2 -mx-2 rounded-md transition-colors">
                          <button 
                            onClick={() => {
                              if (isLocked) {
                                setUnlockModal({
                                  isOpen: true,
                                  type: 'keyword',
                                  value: keyword,
                                  title: `Keyword Limit Reached`,
                                  description: `You have reached your limit of ${limits.maxKeywords} keywords. Upgrade to a premium plan to add more keywords to your feed.`,
                                  isLimitReached: true
                                });
                                return;
                              }
                              handleSidebarKeywordClick(keyword);
                            }} 
                            className={`text-xs w-full text-left transition-colors flex items-center justify-start gap-1.5 ${isLocked ? 'opacity-50 grayscale cursor-pointer' : ''} ${selectedKeywords.includes(keyword) ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-blue-600'}`}
                          >
                            <span>{keyword} Tenders</span>
                            <span className="text-slate-400 text-[10px]">({count})</span>
                            {isLocked && <Lock className="w-3 h-3 text-slate-400 ml-1" />}
                          </button>
                          
                          {selectedKeywords.includes(keyword) && (
                            <button onClick={(e) => {
                              e.stopPropagation();
                              setSelectedKeywords(prev => prev.filter(k => k !== keyword));
                            }} className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                              <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                            </button>
                          )}
                        </div>
                      </li>
                    )})}
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
              <button onClick={() => toggleCollapse('states')} className="w-full flex items-center justify-between px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Tenders By States</span>
                <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : '-rotate-90'}`} />
              </button>
              {isOpen && (
                <div className="px-4 py-1 max-h-56 overflow-y-auto no-scrollbar">
                  <ul>
                    {visible.map(({ name, count }) => {
                      const isLocked = lockedStates.includes(name);
                      return (
                      <li key={name}>
                        <div className="flex items-center justify-between w-full group py-1.5 hover:bg-slate-50 px-2 -mx-2 rounded-md transition-colors">
                          <button 
                            onClick={() => {
                              if (isLocked) {
                                setUnlockModal({
                                  isOpen: true,
                                  type: 'state',
                                  value: name,
                                  title: `State Limit Reached`,
                                  description: `You have reached your limit of ${limits.maxStates} states. Upgrade to a premium plan to add more states to your feed.`,
                                  isLimitReached: true
                                });
                                return;
                              }
                              if (selectedStates.includes(name)) {
                                setSelectedStates(prev => prev.filter(x => x !== name));
                              } else {
                                if (!limits.unlockedStates.includes(name)) {
                                  const isFree = limits.unlockedStates.length < limits.maxStates;
                                  setUnlockModal({
                                    isOpen: true,
                                    type: 'state',
                                    value: name,
                                    title: `Unlock State: ${name}`,
                                    description: isFree 
                                      ? `You have ${limits.maxStates - limits.unlockedStates.length} free state slots remaining. Do you want to use one to unlock "${name}"? Once unlocked, it cannot be changed.`
                                      : `You have reached your limit of ${limits.maxStates} states. Upgrade to a premium plan to add more states to your feed.`,
                                    isLimitReached: !isFree
                                  });
                                  return;
                                }
                                setSelectedStates(prev => [...prev, name]);
                              }
                            }} 
                            className={`text-xs w-full text-left transition-colors flex items-center justify-start gap-1.5 ${isLocked ? 'opacity-50 grayscale cursor-pointer' : ''} ${selectedStates.includes(name) ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-blue-600'}`}
                          >
                            <span>{name} Tenders</span>
                            <span className="text-slate-400 text-[10px]">({count})</span>
                            {isLocked && <Lock className="w-3 h-3 text-slate-400 ml-1" />}
                          </button>

                          {selectedStates.includes(name) && (
                            <button onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStates(prev => prev.filter(x => x !== name));
                            }} className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                              <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                            </button>
                          )}
                        </div>
                      </li>
                    )})}
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
              <button onClick={() => toggleCollapse('cities')} className="w-full flex items-center justify-between px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Tenders By Cities</span>
                <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : '-rotate-90'}`} />
              </button>
              {isOpen && (
                <div className="px-4 py-1 max-h-56 overflow-y-auto no-scrollbar">
                  <ul>
                    {visible.map(city => (
                      <li key={city}>
                        <button onClick={() => setSelectedCities(prev => prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city])} className={`text-xs py-1.5 w-full text-left hover:text-blue-600 transition-colors flex items-center justify-start gap-1.5 ${selectedCities.includes(city) ? 'text-blue-600 font-semibold' : 'text-slate-500'}`}>
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
              <button onClick={() => toggleCollapse('categories')} className="w-full flex items-center justify-between px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors">
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
      <SaveFilterModal 
        isOpen={isSaveFilterOpen}
        onClose={() => setIsSaveFilterOpen(false)}
        onSaved={() => setRefreshFiltersTrigger(prev => prev + 1)}
        filters={{
          states: selectedStates,
          cities: selectedCities,
          categories: selectedCategories,
          authorities: selectedAuthorities,
          keywords: selectedKeywords,
          minAmount,
          maxAmount,
          searchQuery
        }}
      />
      <ConfirmUnlockModal 
        isOpen={unlockModal.isOpen}
        onClose={() => setUnlockModal(prev => ({ ...prev, isOpen: false }))}
        confirmText={unlockModal.isLimitReached ? "Change Plan" : "Confirm Unlock"}
        onConfirm={async () => {
          if (unlockModal.isLimitReached) {
            setUnlockModal(prev => ({ ...prev, isOpen: false }));
            setIsPlanChangeOpen(true);
            return;
          }
          setUnlockModal(prev => ({ ...prev, loading: true }));
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/billing/unlock/${unlockModal.type}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${(session as any)?.accessToken}`
              },
              body: JSON.stringify(unlockModal.type === 'state' ? { state: unlockModal.value } : { keyword: unlockModal.value })
            });
            const data = await res.json();
            if (res.ok && data.success) {
              if (unlockModal.type === 'state') {
                const newUnlocked = [...limits.unlockedStates, unlockModal.value];
                setLimits(prev => ({ ...prev, unlockedStates: newUnlocked }));
                setSelectedStates(prev => [...prev, unlockModal.value]);
              } else {
                const newUnlocked = [...limits.unlockedKeywords, unlockModal.value];
                setLimits(prev => ({ ...prev, unlockedKeywords: newUnlocked }));
                setSelectedKeywords(prev => [...prev, unlockModal.value]);
              }
            }
          } catch (err) {} finally {
            setUnlockModal(prev => ({ ...prev, isOpen: false, loading: false }));
          }
        }}
        title={unlockModal.title}
        description={unlockModal.description}
        loading={unlockModal.loading}
      />
      <PreferencesSetupModal 
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        limits={limits}
        statesList={statesList.map(s => {
          const stat = sidebarStats.states.find(st => st.name === s.name);
          return { name: s.name, count: stat ? stat.count : 0 };
        })}
        keywordsList={sidebarStats.keywords.map(k => ({ keyword: k.keyword, count: k.count }))}
        onSaved={() => {
          // Trigger a re-fetch of limits to update the page UI
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/billing/usage`, {
            headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
          })
          .then(res => {
            if (!res.ok) throw new Error("Failed");
            return res.json();
          })
          .then(data => {
            const fetchedLimits = { 
              maxKeywords: data.maxKeywords || 3, 
              maxStates: data.maxStates || 1,
              unlockedStates: data.unlockedStates || [],
              unlockedKeywords: data.unlockedKeywords || []
            };
            setLimits(fetchedLimits);
          
            // Auto-selection of previously locked preferences has been disabled globally.
            // if (!searchParams.get('states') && fetchedLimits.unlockedStates.length > 0) {
            //   setSelectedStates(fetchedLimits.unlockedStates);
            // }
            // if (!searchParams.get('keywords') && fetchedLimits.unlockedKeywords.length > 0) {
            //   setSelectedKeywords(fetchedLimits.unlockedKeywords);
            // }
            
            // Auto-open preferences modal if completely empty
            if (fetchedLimits.unlockedStates.length === 0 && fetchedLimits.unlockedKeywords.length === 0) {
              setIsPreferencesOpen(true);
            }
          })
          .catch(e => console.error(e));
        }}
      />
      <PlanChangeModal
        isOpen={isPlanChangeOpen}
        onClose={() => setIsPlanChangeOpen(false)}
        currentPlanType={limits.planType}
        currentKeywords={limits.unlockedKeywords}
        onPlanChanged={() => {
          setIsLoadingLimits(true);
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/billing/usage`, {
            headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
          })
          .then(res => res.json())
          .then(data => {
            const fetchedLimits = {
              maxKeywords: data.maxKeywords || 3,
              maxStates: data.maxStates || 1,
              unlockedStates: data.unlockedStates || [],
              unlockedKeywords: data.unlockedKeywords || [],
              planType: data.planType || ''
            };
            setLimits(fetchedLimits);
            // Auto-selection disabled
            // if (fetchedLimits.unlockedStates.length > 0) setSelectedStates(fetchedLimits.unlockedStates);
            // if (fetchedLimits.unlockedKeywords.length > 0) setSelectedKeywords(fetchedLimits.unlockedKeywords);
          })
          .catch(console.error)
          .finally(() => setIsLoadingLimits(false));
        }}
      />
      <DownloadModal />
      <EditTenderModal 
        tender={editingTender} 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTender(null);
        }} 
      />
    </div>
  );
}