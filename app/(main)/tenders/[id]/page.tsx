"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sparkles, Lock, ArrowLeft, MapPin, Building2, Calendar, FileText, Download, Share2, Mail, Heart, Edit3 } from "lucide-react";
import { handleTenderDownload } from "@/lib/download";

interface TenderDetail {
  id: string;
  title: string;
  tenderCode?: string;
  district?: string;
  organisation?: string;
  tenderValue?: string;
  emd?: string;
  applicationCost?: string;
  startDate?: string;
  endDate?: string;
  bidOpeningDate?: string;
  aiProcessed: boolean;
  aiSummary: string | null;
  tags: string[];
  noticePdfUrl?: string | null;
  tenderPdfUrl?: string | null;
  sourceUrl?: string | null;
  documentsDownloaded?: boolean;
}

export default function TenderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [tender, setTender] = useState<TenderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadedDocs, setDownloadedDocs] = useState<string[]>([]);

  useEffect(() => {
    if (status === "authenticated" && params.id) {
      fetchTender(params.id as string);
    }
  }, [status, params.id]);

  const fetchTender = async (id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/tenders/${id}`, {
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setTender(data.data);
        if (data.data.documentsDownloaded) {
           fetchDocs(id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch tender details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocs = async (id: string) => {
    try {
       const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
       const res = await fetch(`${apiUrl}/api/tenders/${id}/documents`);
       if (res.ok) {
         const data = await res.json();
         if (data.success && data.data) {
           setDownloadedDocs(data.data);
         }
       }
    } catch (err) {
       console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="text-center py-12 w-full">
        <h2 className="text-2xl font-bold text-slate-800">Tender Not Found</h2>
        <Button variant="link" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const isLocked = tender.aiSummary === '__PREMIUM_LOCKED__';

  const docList: { title: string; url?: string; type: string; size: string }[] = [];
  if (downloadedDocs.length > 0) {
    downloadedDocs.forEach((doc, idx) => {
       const filename = decodeURIComponent(doc.split('/').pop() || `Document-${idx+1}`);
       docList.push({
         title: filename,
         url: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${doc}`,
         type: filename.toLowerCase().includes('.zip') ? 'ZIP Archive' : 'PDF Document',
         size: 'Unknown Size'
       });
    });
  } else {
    if (tender.noticePdfUrl && tender.noticePdfUrl !== '__CREDIT_LOCKED__') {
       docList.push({ title: 'Tender Notice', url: tender.noticePdfUrl, type: 'PDF Document', size: 'Unknown Size' });
    }
    if (tender.tenderPdfUrl && tender.tenderPdfUrl !== '__CREDIT_LOCKED__') {
       docList.push({ title: 'Tender Document', url: tender.tenderPdfUrl, type: 'PDF Document', size: 'Unknown Size' });
    }
  }

  if (docList.length === 0) {
    docList.push({ title: 'No documents available offline', type: 'System', size: '-' });
  }

  return (
    <div className="flex flex-col w-full bg-[#f3f4f6] min-h-screen pb-12 -mt-6 -mx-6 px-6 pt-6 overflow-x-hidden">
      
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-slate-500 mb-4 px-2">
        <button onClick={() => router.back()} className="flex items-center hover:text-blue-600 transition-colors mr-3 font-medium">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </button>
        <div className="flex items-center truncate">
           <span className="cursor-pointer hover:text-blue-600">Home</span>
           <span className="mx-2">/</span>
           <span className="cursor-pointer hover:text-blue-600">Indian Tenders</span>
           <span className="mx-2">/</span>
           <span className="cursor-pointer hover:text-blue-600 truncate">{tender.organisation || 'State Tenders'}</span>
           <span className="mx-2">/</span>
           <span className="font-semibold text-slate-700">Overview</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full bg-white shadow-sm border border-slate-200 rounded-md overflow-hidden">
        
        {/* Header Section */}
        <div className="p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-800 mb-3 leading-snug">
            {tender.title}
          </h1>
          
          <p className="text-slate-500 text-sm mb-4 line-clamp-2">
             {tender.aiSummary !== '__PREMIUM_LOCKED__' && tender.aiSummary ? tender.aiSummary : tender.title}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
             {tender.tags && tender.tags.length > 0 ? (
                tender.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-slate-100 text-slate-600 font-normal rounded px-3 py-0.5 shadow-none border border-slate-200 hover:bg-slate-200">
                    {tag}
                  </Badge>
                ))
             ) : (
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-normal rounded px-3 py-0.5 shadow-none border border-slate-200">
                  General
                </Badge>
             )}
          </div>

          <div className="flex items-center text-blue-600 text-sm mb-6 font-medium">
             <MapPin className="w-4 h-4 mr-1" />
             {tender.district || tender.organisation || "Location N/A"}
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between border-t border-slate-100 pt-6 gap-4">
             <div className="flex flex-wrap gap-8 md:gap-16">
                <div>
                  <p className="text-xs text-slate-500 mb-1 font-medium">Opening Date</p>
                  <p className="font-semibold text-slate-800">
                     {tender.startDate ? new Date(tender.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1 font-medium">Closing Date</p>
                  <p className="font-semibold text-slate-800">
                     {tender.endDate ? new Date(tender.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1 font-medium">Tender Amount</p>
                  <p className="font-semibold text-slate-800">
                     {tender.tenderValue || "N/A"}
                  </p>
                </div>
             </div>

             <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-9 w-9 text-blue-600 border-blue-200 hover:bg-blue-50">
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9 text-blue-600 border-blue-200 hover:bg-blue-50">
                  <Mail className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9 text-blue-600 border-blue-200 hover:bg-blue-50">
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9 text-blue-600 border-blue-200 hover:bg-blue-50">
                  <Heart className="w-4 h-4" />
                </Button>
                <Button 
                   className="h-9 bg-blue-600 hover:bg-blue-700 text-white px-4 shadow-sm"
                   onClick={(e) => handleTenderDownload(tender as any, e)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
             </div>
          </div>
        </div>

        {/* Tabs & Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start border-y border-slate-200 rounded-none bg-slate-50/50 h-14 px-6 space-x-6 overflow-x-auto overflow-y-hidden flex-nowrap hide-scrollbar">
            {['Overview', 'Documents', 'BOQ', 'Notes', 'Potential Partner', 'Related Tenders'].map((tab) => (
               <TabsTrigger 
                 key={tab} 
                 value={tab.toLowerCase()} 
                 className="rounded-full border border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white px-5 py-1.5 font-medium text-slate-500 transition-all hover:text-slate-800 whitespace-nowrap data-[state=active]:shadow-md"
               >
                 {tab}
               </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="p-0 m-0 bg-[#f3f4f6]">
            <div className="flex flex-col gap-4 p-4 md:p-6 w-full">
               
               {/* Costs */}
               <Card className="border-0 shadow-sm rounded-md overflow-hidden">
                 <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 font-bold text-slate-700">
                   Costs
                 </div>
                 <CardContent className="p-0">
                   <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                     <div className="px-6 py-4 flex items-center justify-between">
                       <span className="text-slate-500 text-sm">EMD</span>
                       <span className="font-semibold text-slate-800">{isLocked ? <span className="blur-sm select-none">₹ 1,50,000</span> : (tender.emd || "N/A")}</span>
                     </div>
                     <div className="px-6 py-4 flex items-center justify-between">
                       <span className="text-slate-500 text-sm">Document Cost</span>
                       <span className="font-semibold text-slate-800">{isLocked ? <span className="blur-sm select-none">₹ 5,000</span> : (tender.applicationCost || "N/A")}</span>
                     </div>
                   </div>
                 </CardContent>
               </Card>

               {/* Description */}
               <Card className="border-0 shadow-sm rounded-md overflow-hidden mt-2">
                 <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 font-bold text-slate-700">
                   Description
                 </div>
                 <CardContent className="p-6 relative">
                    {isLocked ? (
                      <>
                        <div className="blur-md select-none text-slate-400 text-sm space-y-2">
                          <p>This is a highly detailed AI generated summary of the tender document that is currently locked.</p>
                          <p>It contains critical requirements, potential risks, and competitor analysis that can give you a significant edge in bidding.</p>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          <Button className="bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg">
                            <Lock className="w-4 h-4 mr-2" /> Unlock Insights
                          </Button>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {tender.aiSummary || tender.title}
                      </p>
                    )}
                 </CardContent>
               </Card>

               {/* Contact */}
               <Card className="border-0 shadow-sm rounded-md overflow-hidden mt-2">
                 <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 font-bold text-slate-700">
                   Contact
                 </div>
                 <CardContent className="p-0">
                   <div className="divide-y divide-slate-100">
                     <div className="grid grid-cols-1 md:grid-cols-4 px-6 py-4">
                       <span className="text-slate-500 text-sm md:col-span-1">Tender Id</span>
                       <span className="font-semibold text-slate-800 text-sm md:col-span-3">{tender.tenderId || tender.tenderCode || tender.id || "N/A"}</span>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-4 px-6 py-4">
                       <span className="text-slate-500 text-sm md:col-span-1">Tender Authority</span>
                       <span className="font-semibold text-slate-800 text-sm md:col-span-3">{tender.organisation || "N/A"}</span>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-4 px-6 py-4">
                       <span className="text-slate-500 text-sm md:col-span-1">Address</span>
                       <span className="font-semibold text-slate-800 text-sm md:col-span-3">{tender.district || "Address not available"}</span>
                     </div>
                   </div>
                 </CardContent>
               </Card>
               
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="p-0 m-0 bg-[#f3f4f6]">
            <div className="flex flex-col gap-4 p-4 md:p-6 w-full">
               <Card className="border-0 shadow-sm rounded-md overflow-hidden">
                 <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
                   <span className="font-bold text-slate-700">Documents</span>
                   <Button 
                      className="h-8 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                      onClick={(e) => handleTenderDownload(tender as any, e)}
                   >
                     Download All
                   </Button>
                 </div>
                 <CardContent className="p-0 relative">
                   {isLocked && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                       <div className="bg-white px-6 py-4 rounded-xl shadow-lg border border-slate-100 flex items-center gap-4">
                          <Lock className="w-5 h-5 text-slate-600" />
                          <p className="text-sm font-bold text-slate-900">Subscribe to download documents</p>
                       </div>
                    </div>
                   )}
                   <div className={`divide-y divide-slate-100 ${isLocked ? 'blur-sm select-none opacity-50' : ''}`}>
                     {docList.map((doc, i) => (
                       <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                         <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded flex items-center justify-center ${doc.type.includes('ZIP') ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-500'}`}>
                             <FileText className="w-5 h-5" />
                           </div>
                           <div>
                             <p className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer" onClick={() => doc.url && window.open(doc.url, '_blank')}>{doc.title}</p>
                             <p className="text-xs text-slate-400 mt-0.5">{doc.type} • {doc.size}</p>
                           </div>
                         </div>
                         {doc.url && (
                           <Button variant="ghost" size="icon" className="text-blue-600 hover:bg-blue-50" onClick={() => window.open(doc.url, '_blank')}>
                             <Download className="w-4 h-4" />
                           </Button>
                         )}
                       </div>
                     ))}
                   </div>
                 </CardContent>
               </Card>
            </div>
          </TabsContent>

          {/* Placeholder Tabs */}
          {['boq', 'notes', 'potential partner', 'related tenders'].map(tab => (
            <TabsContent key={tab} value={tab.replace(' ', '-')} className="p-6 text-center text-slate-500 bg-[#f3f4f6]">
               Information for {tab.toUpperCase()} will be populated here.
            </TabsContent>
          ))}

        </Tabs>
      </div>

    </div>
  );
}
