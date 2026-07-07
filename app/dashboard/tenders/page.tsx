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

interface Tender {
  id: string;
  title: string;
  district: string;
  state: string;
  organisation: string;
  tenderValue: string;
  endDate: string;
  aiProcessed: boolean;
  aiSummary: string | null;
  tags: string[];
}

// States and cities will be loaded dynamically from the API

export default function UnifiedTendersPage() {
  const { data: session, status } = useSession();
  
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const searchParams = useSearchParams();
  const globalQuery = searchParams.get('q') || "";

  // Filters
  const [selectedState, setSelectedState] = useState<string>("All States");
  const [selectedCity, setSelectedCity] = useState<string>("All Cities");
  const [statesList, setStatesList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(globalQuery);
  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    setSearchQuery(globalQuery);
  }, [globalQuery]);

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
    if (status === "authenticated") {
      fetchTenders();
    }
  }, [status, selectedState, selectedCity, searchQuery, activeTab]);

  const fetchTenders = async () => {
    setLoading(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenders?limit=20`;
      
      if (selectedState && selectedState !== "All States") {
        url += `&state=${selectedState}`;
      }
      if (selectedCity && selectedCity !== "All Cities") {
        url += `&district=${selectedCity}`;
      }
      if (searchQuery) {
        url += `&search=${searchQuery}`;
      }
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

  const currentCities = selectedState !== "All States" 
    ? statesList.find(s => s.name === selectedState)?.districts?.map((d: any) => d.name) || []
    : [];

  const displayStateName = selectedState === "All States" ? "All" : selectedState;

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

            <Select value={selectedState} onValueChange={(val) => { setSelectedState(val); setSelectedCity("All Cities"); }}>
              <SelectTrigger className="w-[140px] h-9 border-blue-200 bg-blue-50 text-blue-700 font-medium focus:ring-blue-500">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All States">All States</SelectItem>
                {statesList.map(state => (
                  <SelectItem key={state.id} value={state.name}>{state.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {currentCities.length > 0 && (
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-[140px] h-9 border-slate-200 text-slate-700 focus:ring-blue-500">
                  <SelectValue placeholder="City / District" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Cities">All Cities</SelectItem>
                  {currentCities.map((city: string) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select>
              <SelectTrigger className="w-[140px] h-9 border-slate-200 bg-white focus:ring-blue-500">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="works">Works</SelectItem>
                <SelectItem value="services">Services</SelectItem>
                <SelectItem value="goods">Goods</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="w-[140px] h-9 border-slate-200 bg-white focus:ring-blue-500">
                <SelectValue placeholder="Authority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Authorities</SelectItem>
              </SelectContent>
            </Select>

            <Button size="sm" className="h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm ml-auto">
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
          <span>Indian Tenders</span>
          <ChevronRight className="w-3 h-3" />
          <span className="font-semibold text-slate-700">{displayStateName} Tenders</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-6 text-[11px] text-blue-600 hover:bg-blue-50 px-2 font-semibold" onClick={() => { setSelectedState("All States"); setSelectedCity("All Cities"); setSearchQuery(""); }}>
            Reset All
          </Button>
          {selectedState !== "All States" && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 px-2 py-0.5 rounded text-[11px] flex items-center gap-1 cursor-pointer">
              {selectedState}
              <X className="w-3 h-3 hover:text-red-500" onClick={() => setSelectedState("All States")} />
            </Badge>
          )}
          {selectedCity !== "All Cities" && (
             <Badge variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 px-2 py-0.5 rounded text-[11px] flex items-center gap-1 cursor-pointer">
              {selectedCity}
              <X className="w-3 h-3 hover:text-red-500" onClick={() => setSelectedCity("All Cities")} />
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full mx-auto grid grid-cols-1 xl:grid-cols-4 gap-6 px-4 md:px-8 pt-6">
        
        {/* Left Column - Tenders List */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{displayStateName} Tenders</h1>
            <p className="text-sm text-slate-500 mt-1">{total}+ {displayStateName} {selectedState !== "All States" && "State"} Tenders</p>
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
                      <Link href={`/dashboard/tenders/${tender.id}`} className="text-[15px] font-medium text-blue-800 hover:text-blue-600 leading-relaxed line-clamp-2 transition-colors" title={tender.title}>
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
                          {tender.district || tender.organisation || selectedState}
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
                          <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm px-4">
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
        <div className="xl:col-span-1 flex flex-col gap-6">
          
          {/* Ad Banner */}
          <Card className="border-0 shadow-md bg-blue-600 text-white overflow-hidden rounded-xl relative group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-90"></div>
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
            <CardContent className="p-6 relative z-10 flex flex-col items-start h-full justify-center min-h-[160px]">
              <h3 className="font-bold text-lg leading-tight mb-2">Don't miss any tender opportunities</h3>
              <p className="text-xs text-blue-100 uppercase font-bold tracking-wider mb-4">HURRY UP !</p>
              <Button size="sm" className="bg-white text-blue-700 hover:bg-blue-50 font-bold">BUY NOW</Button>
            </CardContent>
          </Card>

          {/* Tenders By Cities Sidebar */}
          <Card className="border-slate-200 shadow-sm rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-800">Tenders By Cities</h3>
                <ChevronRight className="w-4 h-4 text-slate-400 -rotate-90" />
              </div>
              <ul className="flex flex-col gap-2">
                {currentCities.map(city => (
                  <li key={city}>
                    <button 
                      onClick={() => setSelectedCity(city)}
                      className={`text-sm text-left w-full hover:text-blue-600 transition-colors ${selectedCity === city ? 'font-semibold text-blue-600' : 'text-slate-500'}`}
                    >
                      {city} Tenders
                    </button>
                  </li>
                ))}
                {!currentCities.length && (
                  <li className="text-sm text-slate-400 italic">Select a state first</li>
                )}
              </ul>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
