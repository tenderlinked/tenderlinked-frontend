"use client";

import { useState, useEffect } from "react";
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
  Lock
} from "lucide-react";
import { format } from "date-fns";
import { MultiSelectPopover } from "@/components/filters/MultiSelectPopover";
import { AmountRangePopover } from "@/components/filters/AmountRangePopover";
import { useTenderDownload } from "@/hooks/use-tender-download";

interface Tender {
  id: string;
  title: string;
  district: string;
  state: string;
  organisation: string;
  tenderValue: string;
  startDate?: string;
  endDate: string;
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
  const [sidebarStats, setSidebarStats] = useState<{ states: {name:string,count:number}[], cities: {name:string,count:number}[], keywords: {keyword:string,count:number}[] }>({ states: [], cities: [], keywords: [] });

  // Sidebar collapse & show-more state
  const [sidebarCollapsed, setSidebarCollapsed] = useState<Record<string, boolean>>({});
  const [sidebarShowMore, setSidebarShowMore] = useState<Record<string, boolean>>({});
  const toggleCollapse = (key: string) => setSidebarCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleShowMore = (key: string) => setSidebarShowMore(prev => ({ ...prev, [key]: !prev[key] }));

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
  }, [status, selectedStates, selectedCities, selectedCategories, selectedAuthorities, selectedKeywords, minAmount, maxAmount, searchQuery, activeTab]);

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

  const fetchTenders = async () => {
    setLoading(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenders?limit=20`;
      
      if (selectedStates.length > 0) url += `&states=${encodeURIComponent(selectedStates.join(','))}`;
      if (selectedCities.length > 0) url += `&districts=${encodeURIComponent(selectedCities.join(','))}`;
      if (selectedCategories.length > 0) url += `&categories=${encodeURIComponent(selectedCategories.join(','))}`;
      if (selectedAuthorities.length > 0) url += `&authorities=${encodeURIComponent(selectedAuthorities.join(','))}`;
      if (selectedKeywords.length > 0) url += `&keywords=${encodeURIComponent(selectedKeywords.join(','))}`;
      if (minAmount) url += `&minAmount=${encodeURIComponent(minAmount)}`;
      if (maxAmount) url += `&maxAmount=${encodeURIComponent(maxAmount)}`;
      
      if (searchQuery) url += `&search=${searchQuery}`;
      if (activeTab === "active") {
        url += `&active=true`;
      } else if (activeTab === "archived") {
        url += `&active=false`;
      } else if (activeTab === "followed") {
        url += `&bookmarked=true`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setTenders(data.data);
        setTotal(data.meta?.total || 0);
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

  const displayStateName = selectedStates.length === 1 ? selectedStates[0] : selectedStates.length > 1 ? "Multiple States" : "All";

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      
      {/* Top Navigation & Filter Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-20 shadow-sm px-4 md:px-8 py-3">
        <div className="w-full mx-auto flex flex-col gap-3">
          
          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="bg-slate-50 text-slate-600 border-slate-200 h-9">
              <Filter className="w-4 h-4 mr-2" />
              Saved Filters
            </Button>

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

            <Button size="sm" className="h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm ml-auto rounded-full px-5">
              Save Filter
            </Button>
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
      <div className="w-full mx-auto grid grid-cols-1 xl:grid-cols-5 gap-6 px-4 md:px-8 pt-6">
        
        {/* Left Column - Tenders List */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          
          <div className="mb-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">{displayStateName} Tenders</h1>
            <p className="text-sm text-slate-500 mt-1">{total}+ {displayStateName} {selectedStates.length > 0 && "State"} Tenders</p>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-3xl">
              {displayStateName} tenders offer business opportunities across construction, manufacturing, infrastructure, and public services. Our platform simplifies access to the latest e-tender listings, helping businesses discover relevant government contracts, receive real-time alerts, and download documents.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-transparent border-b border-slate-200 rounded-none w-full justify-start h-10 p-0 gap-6">
              <TabsTrigger value="active" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-2 data-[state=active]:text-blue-600 font-bold text-sm text-slate-600">
                Active ({activeTab === 'active' ? total : '...'})
              </TabsTrigger>
              <TabsTrigger value="archived" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-2 data-[state=active]:text-blue-600 font-bold text-sm text-slate-600">
                Archived
              </TabsTrigger>
              <TabsTrigger value="followed" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-2 data-[state=active]:text-blue-600 font-bold text-sm text-slate-600">
                Followed
              </TabsTrigger>
            </TabsList>
          </Tabs>

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
            ) : (
              tenders.map((tender) => (
                <Card key={tender.id} className="border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-300 bg-white overflow-hidden rounded-xl">
                  <CardContent className="p-0">
                    <div className="p-5 flex flex-col gap-3">
                      
                      {/* Tender Title */}
                      <Link href={`/tenders/${tender.id}`} className="text-[15px] font-medium text-blue-800 hover:text-blue-600 leading-relaxed line-clamp-2 transition-colors" title={tender.title}>
                        {tender.title.replace(/^\[|\]$/g, '').replace(/\]\s*\[/g, ' - ')}
                      </Link>

                      {/* Tags & Location */}
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium px-2 py-0.5 text-xs flex items-center gap-1 capitalize">
                          <Briefcase className="w-3.5 h-3.5" />
                          Works
                        </Badge>
                        {tender.tags && tender.tags.filter(t => !t.includes('PREMIUM_LOCKED')).slice(0, 2).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-slate-600 border-slate-200 font-medium px-2 py-0.5 text-xs capitalize">
                            {tag}
                          </Badge>
                        ))}
                        
                        <div className="flex items-center gap-1 text-slate-500 text-xs ml-2 font-medium">
                          <MapPin className="w-3.5 h-3.5" />
                          {tender.district || tender.organisation || tender.state}
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
                        ) : (
                          <span className="italic text-slate-400">No summary available.</span>
                        )}
                      </div>

                    </div>

                    {/* Footer - Details & Actions */}
                    <div className="bg-white border-t border-slate-100 px-5 py-3 flex flex-wrap items-center justify-between gap-4">
                      
                      <div className="flex items-center gap-8">
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-0.5 capitalize">Start Date</p>
                          <p className="font-semibold text-slate-800 text-sm">
                            {tender.startDate ? format(new Date(tender.startDate), 'dd MMM yyyy') : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-0.5 capitalize">Closing Date</p>
                          <p className="font-semibold text-slate-800 text-sm">
                            {tender.endDate ? format(new Date(tender.endDate), 'dd MMM yyyy') : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-0.5 capitalize">Tender Amount</p>
                          {tender.tenderValue === '__PREMIUM_LOCKED__' ? (
                            <div className="flex items-center gap-1.5 group cursor-pointer" title="Unlock Premium to view amount">
                              <span className="font-bold text-emerald-600/50 text-sm blur-[4px] select-none">₹ 25,00,000</span>
                              <Lock className="w-3.5 h-3.5 text-blue-500 opacity-80 group-hover:opacity-100 transition-opacity" />
                            </div>
                          ) : (
                            <p className="font-bold text-emerald-600 text-sm">
                              {tender.tenderValue || 'Refer Documents'}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50 font-semibold px-4">
                          <Heart className="w-3.5 h-3.5 mr-1.5" />
                          Follow
                        </Button>
                        {tender.noticePdfUrl === '__CREDIT_LOCKED__' || tender.tenderPdfUrl === '__CREDIT_LOCKED__' ? (
                          <Button size="sm" variant="outline" className="h-8 border-slate-200 text-slate-500 bg-slate-50 shadow-sm px-4 relative overflow-hidden group cursor-pointer" title="Upgrade to plan to download">
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
                            className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm px-4"
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
        </div>

        {/* Right Column - Sidebars */}
        <div className="xl:col-span-1 flex flex-col gap-3">

          {/* Ad Banner */}
          <div className="bg-blue-600 text-white overflow-hidden rounded-lg relative group cursor-pointer p-4 min-h-[110px] flex flex-col justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-700 opacity-90"></div>
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-20 h-20 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <p className="font-bold text-sm leading-tight mb-1">Don't miss any tender opportunities</p>
              <p className="text-xs text-blue-100 uppercase font-bold tracking-wider mb-3">HURRY UP!</p>
              <Button size="sm" className="bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs h-7 px-3">BUY NOW</Button>
            </div>
          </div>

          {/* Tenders By Keywords */}
          {(() => {
            const isOpen = !sidebarCollapsed['keywords'];
            const showAll = sidebarShowMore['keywords'];
            const visible = showAll ? sidebarStats.keywords : sidebarStats.keywords.slice(0, 6);
            return (
            <div className="bg-white border border-slate-100 rounded-lg shadow-sm">
              <button onClick={() => toggleCollapse('keywords')} className="w-full flex items-center justify-between px-4 py-2.5 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Tenders By Keywords</span>
                <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : '-rotate-90'}`} />
              </button>
              {isOpen && (
                <div className="px-4 py-1">
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
                  {sidebarStats.keywords.length > 6 && (
                    <button onClick={() => toggleShowMore('keywords')} className="text-xs text-blue-600 hover:underline font-medium py-1.5">
                      {showAll ? 'Show Less' : 'Show More'}
                    </button>
                  )}
                </div>
              )}
            </div>
            );
          })()}

          {/* Tenders By States */}
          {(() => {
            const isOpen = !sidebarCollapsed['states'];
            const showAll = sidebarShowMore['states'];
            const visible = showAll ? sidebarStats.states : sidebarStats.states.slice(0, 8);
            return (
            <div className="bg-white border border-slate-100 rounded-lg shadow-sm">
              <button onClick={() => toggleCollapse('states')} className="w-full flex items-center justify-between px-4 py-2.5 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Tenders By States</span>
                <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : '-rotate-90'}`} />
              </button>
              {isOpen && (
                <div className="px-4 py-1">
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
                  {sidebarStats.states.length > 8 && (
                    <button onClick={() => toggleShowMore('states')} className="text-xs text-blue-600 hover:underline font-medium py-1.5">
                      {showAll ? 'Show Less' : 'Show More'}
                    </button>
                  )}
                </div>
              )}
            </div>
            );
          })()}

          {/* Tenders By Cities */}
          {sidebarStats.cities.length > 0 && (() => {
            const isOpen = !sidebarCollapsed['cities'];
            const showAll = sidebarShowMore['cities'];
            const citiesToShow = selectedStates.length > 0 ? currentCities : sidebarStats.cities.map(c => c.name);
            const cityCountMap = Object.fromEntries(sidebarStats.cities.map(c => [c.name, c.count]));
            const visible = showAll ? citiesToShow : citiesToShow.slice(0, 8);
            return (
            <div className="bg-white border border-slate-100 rounded-lg shadow-sm">
              <button onClick={() => toggleCollapse('cities')} className="w-full flex items-center justify-between px-4 py-2.5 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Tenders By Cities</span>
                <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : '-rotate-90'}`} />
              </button>
              {isOpen && (
                <div className="px-4 py-1">
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
                  {citiesToShow.length > 8 && (
                    <button onClick={() => toggleShowMore('cities')} className="text-xs text-blue-600 hover:underline font-medium py-1.5">
                      {showAll ? 'Show Less' : 'Show More'}
                    </button>
                  )}
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
                <div className="px-4 py-1">
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
      </div>
      <DownloadModal />
    </div>
  );
}
