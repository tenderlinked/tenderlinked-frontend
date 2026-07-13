"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Lock, ArrowLeft, MapPin, Building2, Calendar, FileText, Download, Share2, Mail, Heart, Edit3, Bookmark, Bell, PhoneCall, Copy, Link as LinkIcon, Check, AlertTriangle, ArrowDown } from "lucide-react";
import { useTenderDownload } from "@/hooks/use-tender-download";

interface TenderDetail {
  id: string;
  title: string;
  tenderId?: string;
  tenderCode?: string;
  district?: string;
  city?: string;
  location?: string;
  state?: string;
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
  tenderType?: string;
  formOfContract?: string;
  emdExemptionAllowed?: string;
  productCategory?: string;
  invitingAuthorityName?: string;
  invitingAuthorityAddress?: string;
  paymentMode?: string;
}

export default function TenderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { initiateDownload, DownloadModal } = useTenderDownload();
  
  const [tender, setTender] = useState<TenderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadedDocs, setDownloadedDocs] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState('overview');
  const [copiedId, setCopiedId] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiGenerationStep, setAiGenerationStep] = useState('');
  const [aiSummaryHtml, setAiSummaryHtml] = useState<string | null>(null);
  const [isLoadingHtml, setIsLoadingHtml] = useState(false);

  const handleGenerateAiSummary = async () => {
    try {
      setIsGeneratingAi(true);
      setAiSummaryHtml(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      // Call backend to trigger processing
      await fetch(`${apiUrl}/api/tenders/${tender?.id}/retry-ai`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      // Simulated UI Steps
      const steps = [
        "Fetching Tender Documents...",
        "Analyzing Document 1...",
        "Extracting BOQ Data...",
        "Finalizing AI Summary..."
      ];
      let stepIndex = 0;
      setAiGenerationStep(steps[0]);
      
      const stepInterval = setInterval(() => {
        stepIndex++;
        if (stepIndex < steps.length) {
          setAiGenerationStep(steps[stepIndex]);
        }
      }, 3000);

      // Poll for completion
      const pollInterval = setInterval(async () => {
        const res = await fetch(`${apiUrl}/api/tenders/${tender?.id}`, {
          headers: { 'Authorization': `Bearer ${session?.accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.data?.aiSummary) {
            clearInterval(pollInterval);
            clearInterval(stepInterval);
            setTender(data.data);
            setIsGeneratingAi(false);
          }
        }
      }, 5000);

    } catch (error) {
      console.error(error);
      alert('Error triggering AI summary.');
      setIsGeneratingAi(false);
    }
  };

  const handleDownloadAiPdf = async () => {
    if (!tender?.id) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/tenders/${tender.id}/ai-summary-pdf`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AI_Summary_${tender.tenderId || 'Tender'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to download PDF.');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('An error occurred while downloading.');
    }
  };

  const handleCopyId = () => {
    const id = tender?.tenderId || tender?.tenderCode;
    if (id) {
      navigator.clipboard.writeText(id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && params.id) {
      fetchTender(params.id as string);
    }
  }, [status, params.id]);

  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    if (tender?.id && tender?.aiSummary && activeTab === 'AI Tender Summary' && !aiSummaryHtml && !isLoadingHtml) {
      const fetchHtml = async () => {
        setIsLoadingHtml(true);
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
          const response = await fetch(`${apiUrl}/api/tenders/${tender.id}/ai-summary-html`, {
            headers: { Authorization: `Bearer ${(session as any)?.accessToken}` },
          });
          if (response.ok) {
            const html = await response.text();
            setAiSummaryHtml(html);
          }
        } catch (err) {
          console.error("Failed to fetch HTML summary:", err);
        } finally {
          setIsLoadingHtml(false);
        }
      };
      fetchHtml();
    }
  }, [tender?.id, tender?.aiSummary, activeTab, session, aiSummaryHtml]);

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
       const headers: HeadersInit = {};
       if (session && (session as any).accessToken) {
         headers['Authorization'] = `Bearer ${(session as any).accessToken}`;
       }
       const res = await fetch(`${apiUrl}/api/tenders/${id}/documents`, { headers });
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const docList: { title: string; url?: string; type: string; size: string }[] = [];
  if (downloadedDocs.length > 0) {
    downloadedDocs.forEach((doc: any, idx) => {
       const docUrl = typeof doc === 'string' ? doc : doc.url;
       const docSize = typeof doc === 'object' && doc.size ? formatBytes(doc.size) : 'Unknown Size';
       const filenameWithParams = docUrl.split('/').pop() || '';
       const filename = decodeURIComponent(filenameWithParams.split('?')[0]) || `Document-${idx+1}`;
       const isExternal = docUrl.startsWith('http');
       docList.push({
         title: filename,
         url: isExternal ? docUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${docUrl}`,
         type: filename.toLowerCase().includes('.zip') ? 'ZIP Archive' : 'PDF Document',
         size: docSize
       });
    });
  } else {
    if (tender.noticePdfUrl && tender.noticePdfUrl !== '__CREDIT_LOCKED__') {
       const isExternal = tender.noticePdfUrl.startsWith('http');
       docList.push({ title: 'Tender Notice', url: isExternal ? tender.noticePdfUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${tender.noticePdfUrl}`, type: 'PDF Document', size: 'Unknown Size' });
    }
    if (tender.tenderPdfUrl && tender.tenderPdfUrl !== '__CREDIT_LOCKED__') {
       const isExternal = tender.tenderPdfUrl.startsWith('http');
       docList.push({ title: 'Tender Document', url: isExternal ? tender.tenderPdfUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${tender.tenderPdfUrl}`, type: 'PDF Document', size: 'Unknown Size' });
    }
  }

  if (docList.length === 0) {
    docList.push({ title: 'No documents available offline', type: 'System', size: '-' });
  }

  return (
    <div className="flex flex-col w-full bg-[#f3f4f6] min-h-screen pb-12 mt-0 px-4 md:px-8 lg:px-12 pt-2">
      
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

      {/* Main Content Area */}
      <div className="w-full">
        
        {/* Title & Actions */}
        <div className="flex flex-col gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2 leading-snug">
              {tender.title}
            </h1>
            <p className="text-slate-500 text-sm">
              Issued by <span className="font-semibold text-slate-700">{tender.organisation || "Government Departments"}</span>, {tender.state || "India"}
            </p>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap gap-3">
            <Button className="bg-[#f97316] hover:bg-[#ea580c] text-white shadow-sm font-semibold rounded-md h-9">
              <Sparkles className="w-4 h-4 mr-2" /> AI Tender Summary
            </Button>
            <Button variant="outline" className="h-9 font-medium text-slate-600 bg-white shadow-sm border-slate-200">
              <Bookmark className="w-4 h-4 mr-2" /> Save Tender
            </Button>
            <Button variant="outline" className="h-9 font-medium text-slate-600 bg-white shadow-sm border-slate-200">
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
            <Button variant="outline" className="h-9 font-medium text-slate-600 bg-white shadow-sm border-slate-200">
              <Bell className="w-4 h-4 mr-2" /> Set Alert
            </Button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="p-4 md:p-5 border-r border-b md:border-b-0 border-slate-100 flex flex-col justify-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Tender Value</p>
            <p className="font-bold text-blue-600 text-base">{tender.tenderValue || "Ref. Documents"}</p>
            <p className="text-xs text-slate-400 mt-1">Estimated cost</p>
          </div>
          <div className="p-4 md:p-5 border-r border-b md:border-b-0 border-slate-100 flex flex-col justify-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Bid Submission</p>
            <p className="font-bold text-[#c2410c] text-base">{tender.endDate ? new Date(tender.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"}</p>
            <p className="text-xs text-slate-400 mt-1">
              {tender.endDate ? (() => {
                const diffTime = new Date(tender.endDate).getTime() - new Date().getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays > 0 ? `${diffDays} days left` : 'Expired';
              })() : "N/A"}
            </p>
          </div>
          <div className="p-4 md:p-5 border-r border-b md:border-b-0 border-slate-100 flex flex-col justify-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">EMD</p>
            <p className="font-bold text-slate-800 text-base">{tender.emd || "Ref. Documents"}</p>
            <p className="text-xs text-slate-400 mt-1">Bank guarantee accepted</p>
          </div>
          <div className="p-4 md:p-5 border-r border-slate-100 flex flex-col justify-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Document Fee</p>
            <p className="font-bold text-slate-800 text-base">{tender.applicationCost || "Ref. Documents"}</p>
            <p className="text-xs text-slate-400 mt-1">Non-refundable</p>
          </div>
          <div className="p-4 md:p-5 flex flex-col justify-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Tender Type</p>
            <p className={`font-bold text-base ${tender.paymentMode?.toLowerCase().includes('online') ? 'text-emerald-600' : 'text-slate-800'}`}>
              {tender.paymentMode || "Offline"}
            </p>
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column - Tabs & Content */}
          <div className="md:col-span-8 lg:col-span-9 flex flex-col gap-6">
            
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="flex flex-nowrap overflow-x-auto hide-scrollbar border-b border-slate-100">
                {['Overview', 'Project Description', 'AI Tender Summary', 'Timeline', 'Documents'].map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                  >
                    {tab}
                    {tab === 'Documents' && docList.length > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center bg-slate-100 text-slate-500 rounded-full h-5 w-5 text-xs font-bold">
                        {docList.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="p-6">
                
                {/* OVERVIEW TAB */}
                {activeTab === 'Overview' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">Tender Overview</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-slate-200 rounded-xl overflow-hidden">
                      {/* Row 1 */}
                      <div className="p-4 border-b border-r border-slate-100 bg-slate-50/50">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center"><Building2 className="w-3 h-3 mr-1"/> Organization</p>
                        <p className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer">{tender.organisation || "N/A"}</p>
                      </div>
                      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center"><LinkIcon className="w-3 h-3 mr-1"/> Tender ID</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-800">{tender.tenderId || tender.tenderCode || "N/A"}</p>
                          <button 
                            onClick={handleCopyId}
                            className="text-slate-400 hover:text-blue-600 transition-colors"
                            title="Copy Tender ID"
                          >
                            {copiedId ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      
                      {/* Row 2 */}
                      <div className="p-4 border-b border-r border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center"><Sparkles className="w-3 h-3 mr-1"/> Competition Type</p>
                        <p className="text-sm font-semibold text-slate-800">{tender.tenderType || "N/A"}</p>
                      </div>
                      <div className="p-4 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center"><Sparkles className="w-3 h-3 mr-1"/> Bidding Type</p>
                        <p className="text-sm font-semibold text-slate-800">{tender.formOfContract || "N/A"}</p>
                      </div>

                      {/* Row 3 */}
                      <div className="p-4 border-b border-r border-slate-100 bg-slate-50/50">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center"><MapPin className="w-3 h-3 mr-1"/> Location / State</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {[tender.location, tender.city, tender.district, tender.state]
                            .filter(Boolean)
                            .filter((val, i, arr) => arr.indexOf(val) === i)
                            .join(', ') || "N/A"}
                        </p>
                      </div>
                      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center"><Sparkles className="w-3 h-3 mr-1"/> EMD Exemption</p>
                        <p className="text-sm font-semibold text-slate-800">{tender.emdExemptionAllowed || "Not Available"}</p>
                      </div>

                      {/* Row 4 */}
                      <div className="p-4 border-b border-r border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center"><Sparkles className="w-3 h-3 mr-1"/> Product Category</p>
                        <p className="text-sm font-semibold text-slate-800">{tender.productCategory || "Not Available"}</p>
                      </div>
                      <div className="p-4 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center"><LinkIcon className="w-3 h-3 mr-1"/> Website</p>
                        <p className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer" onClick={() => tender.sourceUrl && window.open(tender.sourceUrl, '_blank')}>{tender.sourceUrl ? "View Original Tender" : "N/A"}</p>
                      </div>

                      {/* Row 5 */}
                      <div className="p-4 border-r border-slate-100 bg-slate-50/50">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center"><PhoneCall className="w-3 h-3 mr-1"/> Contact Person</p>
                        <p className="text-sm font-semibold text-slate-800">{tender.invitingAuthorityName || "Not Available"}</p>
                      </div>
                      <div className="p-4 border-slate-100 bg-slate-50/50">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center"><MapPin className="w-3 h-3 mr-1"/> Bid Opening Place</p>
                        <p className="text-sm font-semibold text-slate-800">{tender.invitingAuthorityAddress || "Not Available"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* PROJECT DESCRIPTION TAB */}
                {activeTab === 'Project Description' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                     <h3 className="text-lg font-bold text-slate-800 mb-4">Project Description</h3>
                     <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-5 rounded-lg border border-slate-100">
                       {tender.title}
                     </p>
                  </div>
                )}

                {/* AI TENDER SUMMARY TAB */}
                {activeTab === 'AI Tender Summary' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 relative">
                     <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <h3 className="text-lg font-bold text-slate-800">AI Tender Summary</h3>
                     </div>
                     {isLocked ? (
                       <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 p-6 rounded-xl border border-purple-100 relative overflow-hidden">
                         <div className="blur-md select-none text-slate-400 text-sm space-y-4">
                           <p>This is a highly detailed AI generated summary of the tender document that is currently locked. It contains critical requirements, potential risks, and competitor analysis that can give you a significant edge in bidding.</p>
                           <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                         </div>
                         <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-white/40 backdrop-blur-[2px]">
                           <Lock className="w-8 h-8 text-purple-600 mb-3" />
                           <h4 className="font-bold text-slate-900 mb-1">Premium Feature</h4>
                           <p className="text-sm text-slate-700 mb-4 text-center px-8">Upgrade your plan to unlock AI-powered insights, key requirements, and risk analysis for this tender.</p>
                           <Button className="bg-purple-600 hover:bg-purple-700 rounded-full shadow-lg px-6">
                             Upgrade to Unlock
                           </Button>
                         </div>
                       </div>
                      ) : tender.aiSummary ? (
                        <div className="relative">
                          <div className="absolute right-4 top-4 flex gap-2 z-10">
                            <Button 
                              onClick={handleGenerateAiSummary} 
                              variant="outline" 
                              className="group bg-white hover:bg-slate-800 hover:text-white border-slate-200 text-slate-700 shadow-sm transition-colors"
                              size="sm"
                            >
                              <Sparkles className="w-4 h-4 mr-2 text-purple-500 group-hover:text-white" /> Regenerate
                            </Button>
                            <Button 
                              onClick={handleDownloadAiPdf} 
                              variant="outline" 
                              className="group bg-white hover:bg-slate-800 hover:text-white border-slate-200 text-slate-700 shadow-sm transition-colors"
                              size="sm"
                            >
                              <Download className="w-4 h-4 mr-2 group-hover:text-white" /> Download PDF
                            </Button>
                          </div>
                          <div className="bg-white p-5 pt-16 rounded-xl border border-blue-100 shadow-[inset_0_1px_1px_rgba(255,255,255,1)] min-h-[600px]">
                            {isLoadingHtml || !aiSummaryHtml ? (
                              <div className="flex flex-col items-center justify-center py-20">
                                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                                <p className="text-sm text-slate-500 font-medium">Loading designed summary...</p>
                              </div>
                            ) : (
                              <iframe 
                                srcDoc={aiSummaryHtml}
                                className="w-full h-[800px] border-0 rounded-lg shadow-sm"
                                title="AI Summary"
                              />
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-100 rounded-xl">
                          {isGeneratingAi ? (
                            <div className="flex flex-col items-center">
                              <Sparkles className="w-8 h-8 text-purple-400 mb-4 animate-pulse" />
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-4 h-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
                                <span className="text-sm font-bold text-purple-700 animate-pulse">{aiGenerationStep || 'Initializing...'}</span>
                              </div>
                              <div className="w-48 h-1.5 bg-purple-100 rounded-full overflow-hidden mt-3">
                                <div className="h-full bg-purple-500 rounded-full w-full origin-left animate-[shimmer_2s_infinite]"></div>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Sparkles className="w-8 h-8 text-purple-400 mb-3" />
                              <p className="text-sm font-semibold text-slate-700 mb-2">AI Summary Not Available</p>
                              <p className="text-xs text-slate-500 text-center max-w-md mb-6">Generate a comprehensive AI summary for this tender to quickly understand key requirements and scope.</p>
                              <Button 
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={handleGenerateAiSummary}
                              >
                                <Sparkles className="w-4 h-4 mr-2" /> Generate AI Summary
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                  </div>
                )}

                {/* TIMELINE TAB */}
                {activeTab === 'Timeline' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                     <div className="flex items-center gap-2 mb-8">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        <h3 className="text-lg font-bold text-slate-800">Tender Timeline</h3>
                     </div>
                     
                     <div className="relative pl-[9.5rem] max-w-2xl">
                       {/* Vertical Line */}
                       <div className="absolute left-[7.5rem] top-2 bottom-8 w-[2px] bg-slate-200"></div>

                       {/* Published Item */}
                       <div className="relative mb-10">
                         <div className="absolute -left-[9.5rem] top-0 w-[6.5rem] text-right">
                            <p className="font-bold text-sm text-slate-800">{tender.startDate ? new Date(tender.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{tender.startDate ? new Date(tender.startDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' IST' : ""}</p>
                         </div>
                         <div className="absolute -left-[2rem] -ml-[5px] w-3 h-3 rounded-full bg-green-500 ring-[3px] ring-white top-1"></div>
                         <div>
                           <h4 className="font-bold text-slate-800 text-sm">Tender Published</h4>
                           <p className="text-sm text-slate-500 mb-3 mt-1">Tender notice published.</p>
                           <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-0 shadow-none font-semibold text-[10px] px-2 py-0.5 rounded">Completed</Badge>
                         </div>
                       </div>

                       {/* Deadline Item */}
                       <div className="relative">
                         <div className="absolute -left-[9.5rem] top-0 w-[6.5rem] text-right">
                            <p className="font-bold text-sm text-slate-800">{tender.endDate ? new Date(tender.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{tender.endDate ? new Date(tender.endDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' IST' : ""}</p>
                         </div>
                         <div className="absolute -left-[2rem] -ml-[6px] w-[14px] h-[14px] rounded-full bg-white border-[2.5px] border-slate-300 top-1"></div>
                         <div>
                           <h4 className="font-bold text-slate-800 text-sm">Bid Submission Deadline</h4>
                           <p className="text-sm text-slate-500 mb-3 mt-1">Offline submission at the designated office.</p>
                           <Badge variant="secondary" className="bg-slate-100 text-slate-500 hover:bg-slate-200 border-0 shadow-none font-semibold text-[10px] px-2 py-0.5 rounded">
                              {tender.endDate ? (() => {
                                const diffTime = new Date(tender.endDate).getTime() - new Date().getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                return diffDays > 0 ? `Upcoming · ${diffDays} days` : 'Expired';
                              })() : "Upcoming"}
                           </Badge>
                         </div>
                       </div>
                     </div>
                  </div>
                )}

                {/* DOCUMENTS TAB */}
                {activeTab === 'Documents' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 relative">
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                           <FileText className="w-5 h-5 text-blue-400" />
                           <h3 className="text-lg font-bold text-slate-800">Tender Documents</h3>
                        </div>
                        <button 
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center transition-colors"
                          onClick={(e) => initiateDownload(tender, e)}
                        >
                          Download All (ZIP) <ArrowDown className="w-3 h-3 ml-1" />
                        </button>
                     </div>
                     
                     {isLocked && (
                      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-lg">
                         <div className="bg-white px-6 py-4 rounded-xl shadow-lg border border-slate-100 flex items-center gap-4">
                            <Lock className="w-5 h-5 text-slate-600" />
                            <p className="text-sm font-bold text-slate-900">Subscribe to download documents</p>
                         </div>
                      </div>
                     )}
                     
                     <div className={`space-y-4 mb-8 ${isLocked ? 'blur-sm select-none opacity-50' : ''}`}>
                       {docList.length > 0 ? docList.map((doc, i) => {
                         const docExt = doc.type.toLowerCase().includes('pdf') ? 'pdf' : doc.type.toLowerCase().includes('zip') || doc.type.toLowerCase().includes('rar') ? 'rar' : 'doc';
                         return (
                           <div key={i} className="flex items-center justify-between px-5 py-4 bg-[#f8fafc] rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                             <div className="flex items-center gap-4">
                               <div className="w-12 h-8 rounded-md bg-blue-50/50 border border-blue-100 flex items-center justify-center">
                                 <span className="text-[10px] font-bold uppercase text-blue-500 tracking-wider">{docExt}</span>
                               </div>
                               <p className="text-sm font-medium text-slate-700">{doc.title}</p>
                             </div>
                             {doc.url && (
                               <button 
                                 className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                                 onClick={() => window.open(doc.url, '_blank')}
                                 title="Download Document"
                               >
                                 <Download className="w-3.5 h-3.5" />
                               </button>
                             )}
                           </div>
                         );
                       }) : (
                         <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                           No documents available for this tender.
                         </div>
                       )}
                     </div>

                     {/* Disclaimer */}
                     <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-lg p-5">
                       <div className="flex items-center gap-2 mb-2.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <h4 className="font-bold text-amber-800 text-sm">Disclaimer</h4>
                       </div>
                       <p className="text-xs text-amber-700/80 leading-relaxed max-w-4xl">
                         We takes all possible care for accurate & authentic tender information. However users are requested to refer Original source of Tender Notice / Tender Document published by Tender Issuing Agency before taking any call regarding this tender
                       </p>
                     </div>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-6">
             
             {/* Bidding Support Card */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                  <PhoneCall className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">Need Bidding Support?</h3>
                <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                  Get end-to-end help with documentation, EMD, JV structuring & portal submission from our expert team.
                </p>
                <div className="w-full flex flex-col gap-3">
                  <Button className="w-full bg-[#0284c7] hover:bg-[#0369a1] text-white">
                    <PhoneCall className="w-4 h-4 mr-2" /> Talk to a Bid Expert
                  </Button>
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white" onClick={(e) => initiateDownload(tender, e)}>
                    <Download className="w-4 h-4 mr-2" /> Download All Docs (ZIP)
                  </Button>
                </div>
             </div>

             {/* Share Tender */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Share this tender</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-10 w-10 text-slate-600"><Copy className="w-4 h-4"/></Button>
                  <Button variant="outline" size="icon" className="h-10 w-10 text-blue-600"><Share2 className="w-4 h-4"/></Button>
                  <Button variant="outline" size="icon" className="h-10 w-10 text-sky-500"><Mail className="w-4 h-4"/></Button>
                </div>
             </div>

             {/* Related Tender Results */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                   <Sparkles className="w-4 h-4 text-blue-600" />
                   <h4 className="font-bold text-slate-800 text-sm">Related Tender Results</h4>
                </div>
                <div className="p-4 text-sm text-slate-500 text-center">
                   No related tenders found.
                </div>
             </div>

             {/* View Also */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                   <Sparkles className="w-4 h-4 text-blue-600" />
                   <h4 className="font-bold text-slate-800 text-sm">View Also</h4>
                </div>
                <div className="p-4 text-sm text-slate-500 text-center">
                   No suggestions at this time.
                </div>
             </div>

          </div>

        </div>
      </div>
      <DownloadModal />
    </div>
  );
}
