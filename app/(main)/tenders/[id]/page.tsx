"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Lock, ArrowLeft, MapPin, Building2, Calendar, FileText, Download, Share2, Mail, Heart, Edit3, Bookmark, Bell, PhoneCall, Copy, Link as LinkIcon, Check, AlertTriangle, ArrowDown, CheckCircle, Facebook, Linkedin, Twitter, MessageCircle, Zap, ShieldCheck, Tag, Loader2, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTenderDownload } from "@/hooks/use-tender-download";
import toast from "react-hot-toast";

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
  isBookmarked?: boolean;
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
  const [limitReached, setLimitReached] = useState(false);
  const [recommendations, setRecommendations] = useState<{relatedTenders: any[], viewAlsoTenders: any[]}>({ relatedTenders: [], viewAlsoTenders: [] });
  const [isUnlockingAi, setIsUnlockingAi] = useState(false);
  const [recentlyVisited, setRecentlyVisited] = useState<any[]>([]);

  const handleUnlockAiSummary = async () => {
    if (!tender) return;
    try {
      setIsUnlockingAi(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/tenders/${tender.id}/unlock-ai`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to unlock AI Summary');
      }
      
      toast.success("AI Summary unlocked successfully!");
      // Refetch the tender to get the unlocked data
      const actualId = tender.id;
      fetchTender(actualId);
    } catch (error: any) {
      toast.error(error.message || "An error occurred while unlocking.");
      console.error(error);
    } finally {
      setIsUnlockingAi(false);
    }
  };

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
        const res = await fetch(`${apiUrl}/api/tenders/${tender?.id}/ai-status`, {
          headers: { 'Authorization': `Bearer ${session?.accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.data?.aiProcessed || data.data?.aiSummary) {
            clearInterval(pollInterval);
            clearInterval(stepInterval);
            setTender(prev => prev ? { ...prev, aiSummary: data.data.aiSummary, aiProcessed: true } : null);
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

  const copyToClipboard = async (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand('copy');
        if (!successful) throw new Error('execCommand copy failed');
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  const handleCopyId = () => {
    const id = tender?.tenderId || tender?.tenderCode;
    if (id) {
      copyToClipboard(id).then(() => {
        setCopiedId(true);
        toast.success("Tender ID copied to clipboard!");
        setTimeout(() => setCopiedId(false), 2000);
      }).catch(err => {
        toast.error("Failed to copy Tender ID.");
        console.error("Copy failed", err);
      });
    }
  };

  const handleCopyUrl = () => {
    copyToClipboard(window.location.href).then(() => {
      toast.success("Link copied to clipboard!");
    }).catch(err => {
      toast.error("Failed to copy link.");
      console.error("Copy failed", err);
    });
  };

  const handleSocialShare = (platform: string, href: string) => {
    window.open(href, '_blank');
  };

  const shareOptions = () => {
    const url = typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : '';
    const title = tender?.title ? encodeURIComponent(tender.title) : '';
    return [
      { name: "WhatsApp", icon: MessageCircle, href: `https://wa.me/?text=${title}%20${url}`, color: "bg-green-500 hover:bg-green-600 text-white" },
      { name: "LinkedIn", icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`, color: "bg-[#0a66c2] hover:bg-[#004182] text-white" },
      { name: "Facebook", icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${url}`, color: "bg-[#1877f2] hover:bg-[#0c59c2] text-white" },
      { name: "X (Twitter)", icon: Twitter, href: `https://twitter.com/intent/tweet?url=${url}&text=${title}`, color: "bg-black hover:bg-zinc-800 text-white" },
    ];
  };

  const renderShareDialogContent = () => (
    <DialogContent className="sm:max-w-md rounded-xl">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold text-slate-800">Share this Tender</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4 py-4">
        {shareOptions().map((opt) => (
          <Button
            key={opt.name}
            onClick={() => handleSocialShare(opt.name, opt.href)}
            className={`w-full h-14 rounded-lg flex flex-col items-center justify-center gap-1 shadow-sm transition-transform hover:scale-[1.02] ${opt.color}`}
          >
            <opt.icon className="w-5 h-5" />
            <span className="text-xs font-semibold">{opt.name}</span>
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2 w-full overflow-hidden">
        <div className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-md p-2.5 text-xs text-slate-500 truncate select-all">
          {typeof window !== 'undefined' ? window.location.href : ''}
        </div>
        <Button variant="outline" className="shrink-0 text-slate-600 hover:text-blue-600 bg-white shadow-sm border-slate-200" onClick={handleCopyUrl}>
          <Copy className="w-4 h-4 mr-2" /> Copy
        </Button>
      </div>
    </DialogContent>
  );

  const handleToggleBookmark = async () => {
    if (!tender) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const isBookmarked = !tender.isBookmarked;
      
      const res = await fetch(`${apiUrl}/api/tenders/${tender.id}/bookmark`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
        body: JSON.stringify({ isBookmarked }),
      });
      
      if (res.ok) {
        setTender(prev => prev ? { ...prev, isBookmarked } : prev);
        toast.success(isBookmarked ? "Tender saved to bookmarks!" : "Tender removed from bookmarks.");
      } else {
        toast.error("Failed to update bookmark.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred.");
    }
  };

  useEffect(() => {
    if (status === "authenticated" && params.id) {
      const fullId = params.id as string;
      let actualId;
      if (fullId.includes('--')) {
        actualId = fullId.split('--').pop();
      } else {
        actualId = fullId.length > 36 ? fullId.slice(-36) : fullId;
      }
      fetchTender(actualId as string);
    }
  }, [status, params.id]);

  const [activeTab, setActiveTab] = useState('Overview');
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (!tender) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            const tabName = id === 'overview' ? 'Overview' 
              : id === 'project-description' ? 'Project Description'
              : id === 'ai-tender-summary' ? 'AI Tender Summary'
              : id === 'timeline' ? 'Timeline'
              : id === 'documents' ? 'Documents'
              : null;
            if (tabName) {
              setActiveTab(tabName);
            }
          }
        });
      },
      { rootMargin: '-150px 0px -60% 0px' }
    );

    // Wait a tick for React to paint the DOM before attaching observers
    const timeout = setTimeout(() => {
      sectionRefs.current.forEach((ref) => {
        if (ref) observer.observe(ref);
      });
    }, 100);

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [tender]);

  const scrollToSection = (tabName: string) => {
    setActiveTab(tabName);
    const id = tabName === 'Overview' ? 'overview' 
      : tabName === 'Project Description' ? 'project-description'
      : tabName === 'AI Tender Summary' ? 'ai-tender-summary'
      : tabName === 'Timeline' ? 'timeline'
      : tabName === 'Documents' ? 'documents'
      : '';
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 140; // Offset for sticky header and tabs
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

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
      const [response, recResponse, recentResponse] = await Promise.all([
        fetch(`${apiUrl}/api/tenders/${id}`, {
          headers: { Authorization: `Bearer ${(session as any)?.accessToken}` },
        }),
        fetch(`${apiUrl}/api/tenders/${id}/recommendations`, {
          headers: { Authorization: `Bearer ${(session as any)?.accessToken}` },
        }).catch(() => null),
        fetch(`${apiUrl}/api/tenders/recently-viewed`, {
          headers: { Authorization: `Bearer ${(session as any)?.accessToken}` },
        }).catch(() => null)
      ]);
      
      if (response.status === 403) {
        setLimitReached(true);
        return;
      }
      const data = await response.json();
      if (data.success) {
        setTender(data.data);
        if (data.data.documentsDownloaded) {
           fetchDocs(id);
        }
      }

      if (recResponse?.ok) {
        const recData = await recResponse.json();
        if (recData.success) {
           setRecommendations(recData.data);
        }
      }

      if (recentResponse?.ok) {
        const recentData = await recentResponse.json();
        if (recentData.success && recentData.data) {
           const filteredForDisplay = recentData.data.filter((t: any) => t.id !== id);
           setRecentlyVisited(filteredForDisplay);
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

  if (limitReached) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 mt-8">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-100 flex flex-col items-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">View Limit Reached</h2>
          <p className="text-slate-600 mb-8">
            You have reached the maximum number of tender views allowed by your current subscription plan for this month. 
          </p>
          <div className="flex gap-4 w-full">
            <Button variant="outline" className="flex-1" onClick={() => router.push('/tenders')}>
              Back to Tenders
            </Button>
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => router.push('/settings/billing')}>
              Upgrade Plan
            </Button>
          </div>
        </div>
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

  const isAiSummaryLocked = tender.aiSummary === '__PREMIUM_LOCKED__';
  const isDocsLocked = tender.noticePdfUrl === '__CREDIT_LOCKED__' || tender.tenderPdfUrl === '__CREDIT_LOCKED__' || tender.noticePdfUrl === '__PREMIUM_LOCKED__' || tender.tenderPdfUrl === '__PREMIUM_LOCKED__';

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

  let parsedAiSummary: any = null;
  if (tender?.aiSummary) {
    try {
      parsedAiSummary = JSON.parse(tender.aiSummary);
    } catch(e) {}
  }

  const renderTable = (items: any[]) => (
    <div className="border border-t-0 border-slate-200 rounded-b-md overflow-hidden bg-white text-[13px]">
      <table className="w-full text-left border-collapse">
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className={`border-b border-slate-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
              <td className="w-1/3 py-3 px-5 font-semibold text-slate-700 border-r border-slate-200 align-top">{item.label}</td>
              <td className="py-3 px-5 text-slate-900 align-top leading-relaxed">{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderBulletList = (items: string[], bulletColorClass: string) => (
    <div className="border border-t-0 border-slate-200 rounded-b-md overflow-hidden bg-white text-[13px]">
      <ul className="list-none m-0 p-0">
        {items.map((item, i) => (
          <li key={i} className={`relative py-3.5 px-5 pl-12 border-b border-slate-100 last:border-0 leading-relaxed ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
            <div className={`absolute left-5 top-5 w-2.5 h-2.5 rounded-full ${bulletColorClass}`}></div>
            <span className="text-slate-800">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderNumberedList = (items: string[]) => (
    <div className="border border-t-0 border-slate-200 rounded-b-md overflow-hidden bg-white text-[13px]">
      <ul className="list-none m-0 p-0">
        {items.map((item, i) => (
          <li key={i} className={`flex gap-3.5 py-3.5 px-5 border-b border-slate-100 last:border-0 items-start ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-[11px] mt-0.5">{i + 1}</div>
            <span className="text-slate-800 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );

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
            <Button 
              onClick={() => scrollToSection('AI Tender Summary')}
              className="bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-sm font-semibold rounded-md h-9"
            >
              <Sparkles className="w-4 h-4 mr-2" /> AI Tender Summary
            </Button>
            <Button 
              variant="outline" 
              className={`h-9 font-medium shadow-sm border-slate-200 transition-colors ${tender.isBookmarked ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-600'}`}
              onClick={handleToggleBookmark}
            >
              <Bookmark className={`w-4 h-4 mr-2 ${tender.isBookmarked ? 'fill-current' : ''}`} /> 
              {tender.isBookmarked ? 'Saved' : 'Save Tender'}
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-9 font-medium text-slate-600 bg-white shadow-sm border-slate-200">
                  <Share2 className="w-4 h-4 mr-2" /> Share
                </Button>
              </DialogTrigger>
              {renderShareDialogContent()}
            </Dialog>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="p-4 md:p-5 border-r border-b md:border-b-0 border-slate-100 flex flex-col justify-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Tender Value</p>
            <p className="font-bold text-blue-600 text-base">{tender.tenderValue || parsedAiSummary?.tenderValue || "Ref. Documents"}</p>
            <p className="text-xs text-slate-400 mt-1">Estimated cost</p>
          </div>
          <div className="p-4 md:p-5 border-r border-b md:border-b-0 border-slate-100 flex flex-col justify-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Bid Submission</p>
            <p className="font-bold text-[#c2410c] text-base">{tender.endDate ? new Date(tender.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (parsedAiSummary?.submissionDate || "N/A")}</p>
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
            <p className="font-bold text-slate-800 text-base">{tender.emd || parsedAiSummary?.emd || "Ref. Documents"}</p>
            <p className="text-xs text-slate-400 mt-1">Bank guarantee accepted</p>
          </div>
          <div className="p-4 md:p-5 border-r border-slate-100 flex flex-col justify-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Document Fee</p>
            <p className="font-bold text-slate-800 text-base">{tender.applicationCost || parsedAiSummary?.tenderFee || "Ref. Documents"}</p>
            <p className="text-xs text-slate-400 mt-1">Non-refundable</p>
          </div>
          <div className="p-4 md:p-5 flex flex-col justify-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Tender Type</p>
            <p className="font-bold text-base text-slate-800">
              {tender.tenderType || "N/A"}
            </p>
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column - Tabs & Content */}
          <div className="md:col-span-8 lg:col-span-9 flex flex-col gap-6">
            
            {/* Sticky Tabs Navigation */}
            <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-[72px] z-40 mb-6">
              <div className="flex flex-nowrap overflow-x-auto hide-scrollbar">
                {['Overview', 'Project Description', 'AI Tender Summary', 'Timeline', 'Documents'].map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => scrollToSection(tab)}
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
            </div>

            <div className="flex flex-col gap-6">
                 
                 {/* OVERVIEW SECTION */}
                 <section id="overview" ref={el => { sectionRefs.current[0] = el; }} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8 scroll-mt-[150px] animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center"><Sparkles className="w-3 h-3 mr-1"/> Payment Mode</p>
                        <p className="text-sm font-semibold text-slate-800">{tender.paymentMode || "N/A"}</p>
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
                  </section>

                 {/* PROJECT DESCRIPTION SECTION */}
                 <section id="project-description" ref={el => { sectionRefs.current[1] = el; }} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8 scroll-mt-[150px] animate-in fade-in slide-in-from-bottom-2 duration-300">
                     <h3 className="text-lg font-bold text-slate-800 mb-4">Project Description</h3>
                     <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-5 rounded-lg border border-slate-100 min-h-[150px]">
                       {parsedAiSummary?.workDescription || tender.title}
                     </p>
                 </section>

                 {/* AI TENDER SUMMARY SECTION */}
                 <section id="ai-tender-summary" ref={el => { sectionRefs.current[2] = el; }} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8 scroll-mt-[150px] animate-in fade-in slide-in-from-bottom-2 duration-300 relative">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-2">
                           <Sparkles className="w-5 h-5 text-purple-600" />
                           <h3 className="text-lg font-bold text-slate-800">AI Tender Summary</h3>
                        </div>
                        {tender.aiSummary && !isAiSummaryLocked && (
                          <div className="flex gap-2">
                             <Button onClick={handleDownloadAiPdf} variant="outline" size="sm" className="bg-white hover:bg-slate-800 hover:text-white border-slate-200 text-slate-700 shadow-sm transition-colors group">
                               <Download className="w-4 h-4 mr-2 group-hover:text-white" /> Download PDF
                             </Button>
                          </div>
                        )}
                     </div>
                     {isAiSummaryLocked ? (
                       <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 p-6 rounded-xl border border-purple-100 relative overflow-hidden min-h-[300px] flex items-center justify-center">
                         <div className="blur-md select-none text-slate-400 text-sm space-y-4">
                           <p>This is a highly detailed AI generated summary of the tender document that is currently locked. It contains critical requirements, potential risks, and competitor analysis that can give you a significant edge in bidding.</p>
                           <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                         </div>
                         <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-white/40 backdrop-blur-[2px]">
                           <Lock className="w-8 h-8 text-purple-600 mb-3" />
                           <h4 className="font-bold text-slate-900 mb-1 text-lg">Unlock Full AI Tender Summary</h4>
                           <p className="text-sm text-slate-700 mb-4 text-center px-8 max-w-md">Get instant access to the complete AI-generated analysis — scope, eligibility, timeline & more.</p>
                           <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 mb-5">
                              <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-blue-500" /> Instant Access</span>
                              <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-blue-500" /> Secure</span>
                              <span className="flex items-center gap-1 text-blue-600"><Tag className="w-3 h-3" /> 1 Credit</span>
                           </div>
                           <Button 
                             onClick={handleUnlockAiSummary}
                             disabled={isUnlockingAi}
                             className="bg-[#2563eb] hover:bg-blue-700 rounded-lg shadow-md px-6 py-5 text-sm font-semibold flex items-center gap-2 transition-all"
                           >
                             {isUnlockingAi ? (
                               <Loader2 className="w-4 h-4 animate-spin" />
                             ) : (
                               <Lock className="w-4 h-4" />
                             )}
                             {isUnlockingAi ? "Unlocking..." : "Unlock AI Summary — 1 Credit"}
                           </Button>
                           <p className="text-[10px] text-slate-500 mt-4 flex items-center gap-1"><Lock className="w-3 h-3" /> Your details are secure and used only for document delivery.</p>
                         </div>
                       </div>
                      ) : tender.aiSummary ? (
                        <div className="relative">
                          <div className="bg-white rounded-md shadow-sm border border-slate-200 min-h-[600px] mb-8 font-sans font-['Inter']">
                            {parsedAiSummary ? (
                              <div className="animate-in fade-in duration-500">
                                {/* Hero Banner */}
                                <div className="bg-gradient-to-br from-blue-700 to-blue-600 text-white p-6 border-b-4 border-blue-400 rounded-t-md">
                                  <div className="text-[22px] font-bold mb-2">{parsedAiSummary.authorityName || tender.invitingAuthorityName || 'Tender Authority'}</div>
                                  <div className="flex flex-wrap gap-6 text-[12px] opacity-90">
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-1.5 h-1.5 bg-blue-300 rounded-full"></div> 
                                      Tender No: {parsedAiSummary.tdrNumber || tender.tenderCode || 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-1.5 h-1.5 bg-blue-300 rounded-full"></div> 
                                      Location: {parsedAiSummary.location || tender.location || tender.city || 'N/A'}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* KPI Strip */}
                                <div className="grid grid-cols-2 md:grid-cols-5 border-b border-slate-200">
                                  <div className="p-4 text-center border-r border-slate-200 flex flex-col justify-center">
                                    <div className="text-[9px] text-slate-500 uppercase tracking-[1px] mb-2 font-medium">Tender Value</div>
                                    <div className="text-[14px] font-bold text-slate-900 leading-tight">{parsedAiSummary.tenderValue || '-'}</div>
                                  </div>
                                  <div className="p-4 text-center border-r border-slate-200 flex flex-col justify-center">
                                    <div className="text-[9px] text-slate-500 uppercase tracking-[1px] mb-2 font-medium">EMD Amount</div>
                                    <div className="text-[14px] font-bold text-slate-900 leading-tight">{parsedAiSummary.emd || '-'}</div>
                                  </div>
                                  <div className="p-4 text-center border-r border-slate-200 flex flex-col justify-center">
                                    <div className="text-[9px] text-slate-500 uppercase tracking-[1px] mb-2 font-medium">Tender Fee</div>
                                    <div className="text-[14px] font-bold text-slate-900 leading-tight">{parsedAiSummary.tenderFee || '-'}</div>
                                  </div>
                                  <div className="p-4 text-center border-r border-slate-200 flex flex-col justify-center">
                                    <div className="text-[9px] text-slate-500 uppercase tracking-[1px] mb-2 font-medium">Submission Deadline</div>
                                    <div className="text-[14px] font-bold text-amber-600 leading-tight">{parsedAiSummary.submissionDate || '-'}</div>
                                  </div>
                                  <div className="p-4 text-center flex flex-col justify-center">
                                    <div className="text-[9px] text-slate-500 uppercase tracking-[1px] mb-2 font-medium">Contract Period</div>
                                    <div className="text-[14px] font-bold text-slate-900 leading-tight">{parsedAiSummary.contractPeriod || '-'}</div>
                                  </div>
                                </div>

                                {/* Content Sections */}
                                <div className="p-8 pb-16 space-y-6">
                                  
                                  {/* Work Description */}
                                  <div className="break-inside-avoid">
                                    <div className="bg-white text-slate-800 border border-slate-200 border-b-0 border-l-4 border-l-blue-500 text-[12px] font-bold uppercase tracking-[1px] px-4 py-3 rounded-t-sm flex items-center gap-2.5">
                                      <FileText className="w-4 h-4 text-blue-500" /> Work Description
                                    </div>
                                    <div className="bg-white border border-t-0 border-slate-200 rounded-b-sm p-5 text-[13.5px] leading-[1.9] text-slate-800">
                                      {parsedAiSummary.workDescription || 'No description provided.'}
                                    </div>
                                  </div>

                                  {/* Scope of Work */}
                                  {parsedAiSummary.scopeOfWork?.length > 0 && (
                                    <div className="break-inside-avoid">
                                      <div className="bg-white text-slate-800 border border-slate-200 border-b-0 border-l-4 border-l-emerald-500 text-[12px] font-bold uppercase tracking-[1px] px-4 py-3 rounded-t-sm flex items-center gap-2.5">
                                        <CheckCircle className="w-4 h-4 text-emerald-500" /> Scope Of Work
                                      </div>
                                      {renderNumberedList(parsedAiSummary.scopeOfWork)}
                                    </div>
                                  )}

                                  {/* Basic Details */}
                                  {parsedAiSummary.basicDetail?.length > 0 && (
                                    <div className="break-inside-avoid">
                                      <div className="bg-white text-slate-800 border border-slate-200 border-b-0 border-l-4 border-l-blue-500 text-[12px] font-bold uppercase tracking-[1px] px-4 py-3 rounded-t-sm flex items-center gap-2.5">
                                        <FileText className="w-4 h-4 text-blue-500" /> Basic Details
                                      </div>
                                      {renderTable(parsedAiSummary.basicDetail)}
                                    </div>
                                  )}

                                  {/* Key Dates & Timeline */}
                                  {parsedAiSummary.keyDates?.length > 0 && (
                                    <div className="break-inside-avoid">
                                      <div className="bg-white text-slate-800 border border-slate-200 border-b-0 border-l-4 border-l-amber-500 text-[12px] font-bold uppercase tracking-[1px] px-4 py-3 rounded-t-sm flex items-center gap-2.5">
                                        <Calendar className="w-4 h-4 text-amber-500" /> Key Dates & Timeline
                                      </div>
                                      {renderTable(parsedAiSummary.keyDates)}
                                    </div>
                                  )}

                                  {/* Location & Contact */}
                                  {parsedAiSummary.locationAndContact?.length > 0 && (
                                    <div className="break-inside-avoid">
                                      <div className="bg-white text-slate-800 border border-slate-200 border-b-0 border-l-4 border-l-teal-500 text-[12px] font-bold uppercase tracking-[1px] px-4 py-3 rounded-t-sm flex items-center gap-2.5">
                                        <MapPin className="w-4 h-4 text-teal-500" /> Location & Contact
                                      </div>
                                      {renderTable(parsedAiSummary.locationAndContact)}
                                    </div>
                                  )}

                                  {/* Finance & Payment Terms */}
                                  {parsedAiSummary.finance?.length > 0 && (
                                    <div className="break-inside-avoid">
                                      <div className="bg-white text-slate-800 border border-slate-200 border-b-0 border-l-4 border-l-rose-500 text-[12px] font-bold uppercase tracking-[1px] px-4 py-3 rounded-t-sm flex items-center gap-2.5">
                                        <Building2 className="w-4 h-4 text-rose-500" /> Finance & Payment Terms
                                      </div>
                                      {renderTable(parsedAiSummary.finance)}
                                    </div>
                                  )}

                                  {/* Technical Eligibility */}
                                  {parsedAiSummary.technicalQualification?.length > 0 && (
                                    <div className="break-inside-avoid">
                                      <div className="bg-white text-slate-800 border border-slate-200 border-b-0 border-l-4 border-l-indigo-500 text-[12px] font-bold uppercase tracking-[1px] px-4 py-3 rounded-t-sm flex items-center gap-2.5">
                                        <AlertTriangle className="w-4 h-4 text-indigo-500" /> Technical Eligibility & Qualification
                                      </div>
                                      {renderBulletList(parsedAiSummary.technicalQualification, 'bg-indigo-500')}
                                    </div>
                                  )}

                                  {/* Exemptions */}
                                  {parsedAiSummary.exemptions?.length > 0 && (
                                    <div className="break-inside-avoid">
                                      <div className="bg-white text-slate-800 border border-slate-200 border-b-0 border-l-4 border-l-orange-500 text-[12px] font-bold uppercase tracking-[1px] px-4 py-3 rounded-t-sm flex items-center gap-2.5">
                                        <AlertTriangle className="w-4 h-4 text-orange-500" /> Exemptions & Special Clauses
                                      </div>
                                      {renderBulletList(parsedAiSummary.exemptions, 'bg-orange-500')}
                                    </div>
                                  )}

                                  {/* Required Documents */}
                                  {parsedAiSummary.documentList?.length > 0 && (
                                    <div className="break-inside-avoid">
                                      <div className="bg-white text-slate-800 border border-slate-200 border-b-0 border-l-4 border-l-purple-500 text-[12px] font-bold uppercase tracking-[1px] px-4 py-3 rounded-t-sm flex items-center gap-2.5">
                                        <FileText className="w-4 h-4 text-purple-500" /> Required Documents
                                      </div>
                                      {renderBulletList(parsedAiSummary.documentList, 'bg-purple-500')}
                                    </div>
                                  )}

                                </div>
                              </div>
                            ) : (
                               <div className="flex flex-col items-center justify-center py-32">
                                 <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                                 <p className="text-slate-500 font-semibold mt-4">Parsing Executive Summary...</p>
                               </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-100 rounded-xl">
                          {isGeneratingAi ? (
                            <div className="flex flex-col items-center">
                              <Sparkles className="w-8 h-8 text-blue-400 mb-4 animate-pulse" />
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-4 h-4 rounded-full border-2 border-[#0284c7] border-t-transparent animate-spin"></div>
                                <span className="text-sm font-bold text-[#0369a1] animate-pulse">{aiGenerationStep || 'Initializing...'}</span>
                              </div>
                              <div className="w-48 h-1.5 bg-blue-100 rounded-full overflow-hidden mt-3">
                                <div className="h-full bg-[#0284c7] rounded-full w-full origin-left animate-[shimmer_2s_infinite]"></div>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Sparkles className="w-8 h-8 text-blue-400 mb-3" />
                              <p className="text-sm font-semibold text-slate-700 mb-2">AI Summary Not Available</p>
                              <p className="text-xs text-slate-500 text-center max-w-md mb-6">Generate a comprehensive AI summary for this tender to quickly understand key requirements and scope.</p>
                              <Button 
                                className="bg-[#0284c7] hover:bg-[#0369a1] text-white"
                                onClick={handleGenerateAiSummary}
                              >
                                <Sparkles className="w-4 h-4 mr-2" /> Generate AI Summary
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                  </section>

                 {/* TIMELINE SECTION */}
                 <section id="timeline" ref={el => { sectionRefs.current[3] = el; }} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8 scroll-mt-[150px] animate-in fade-in slide-in-from-bottom-2 duration-300">
                     <div className="flex items-center gap-2 mb-8">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        <h3 className="text-lg font-bold text-slate-800">Tender Timeline</h3>
                     </div>
                     
                       <div className="relative pl-[9.5rem] max-w-2xl">
                         {/* Vertical Line */}
                         <div className="absolute left-[7.5rem] top-2 bottom-8 w-[2px] bg-slate-200"></div>

                         {(() => {
                           const events = [];
                           if (tender.publishedDate || tender.startDate) {
                               events.push({ key: 'publishedDate', title: 'Tender Published', desc: 'Tender notice published.', color: 'bg-green-500', date: tender.publishedDate || tender.startDate });
                           }
                           if (tender.docDownloadStartDate) {
                               events.push({ key: 'docDownloadStartDate', title: 'Document Download Starts', desc: 'Documents available for download.', color: 'bg-blue-500', date: tender.docDownloadStartDate });
                           }
                           if (tender.clarificationStartDate) {
                               events.push({ key: 'clarificationStartDate', title: 'Clarification Starts', desc: 'Query period begins.', color: 'bg-orange-500', date: tender.clarificationStartDate });
                           }
                           if (tender.preBidMeetingDate) {
                               events.push({ key: 'preBidMeetingDate', title: 'Pre-Bid Meeting', desc: tender.preBidMeetingPlace ? `Meeting at ${tender.preBidMeetingPlace}` : 'Meeting for clarification and queries.', color: 'bg-purple-500', date: tender.preBidMeetingDate });
                           }
                           if (tender.clarificationEndDate) {
                               events.push({ key: 'clarificationEndDate', title: 'Clarification Ends', desc: 'Query period ends.', color: 'bg-orange-500', date: tender.clarificationEndDate });
                           }
                           if (tender.startDate && tender.startDate !== tender.publishedDate) {
                               events.push({ key: 'startDate', title: 'Bid Submission Starts', desc: 'Bid submission opens.', color: 'bg-indigo-500', date: tender.startDate });
                           }
                           if (tender.docDownloadEndDate) {
                               events.push({ key: 'docDownloadEndDate', title: 'Document Download Ends', desc: 'Last day to download documents.', color: 'bg-slate-500', date: tender.docDownloadEndDate });
                           }
                           if (tender.endDate) {
                               events.push({ key: 'endDate', title: 'Bid Submission Deadline', desc: 'Final date for bid submission.', color: 'bg-white border-[2.5px] border-slate-300 ring-[0px]', isDeadline: true, date: tender.endDate });
                           }
                           if (tender.bidOpeningDate) {
                               events.push({ key: 'bidOpeningDate', title: 'Bid Opening', desc: 'Bids will be opened and evaluated.', color: 'bg-teal-500', date: tender.bidOpeningDate });
                           }

                           events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                           if (events.length === 0) {
                             return <div className="text-slate-500 italic py-4">No timeline dates available.</div>;
                           }

                           return events.map((event, index) => {
                             const isLast = index === events.length - 1;
                             const isPast = new Date(event.date).getTime() < new Date().getTime();
                             
                             let statusBadge = null;
                             if (isPast) {
                               statusBadge = <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-0 shadow-none font-semibold text-[10px] px-2 py-0.5 rounded">Completed</Badge>;
                             } else if (event.isDeadline) {
                               const diffTime = new Date(event.date).getTime() - new Date().getTime();
                               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                               statusBadge = <Badge variant="secondary" className="bg-slate-100 text-slate-500 hover:bg-slate-200 border-0 shadow-none font-semibold text-[10px] px-2 py-0.5 rounded">{diffDays > 0 ? `Upcoming · ${diffDays} days` : 'Expired'}</Badge>;
                             } else {
                               statusBadge = <Badge variant="secondary" className="bg-slate-100 text-slate-500 hover:bg-slate-200 border-0 shadow-none font-semibold text-[10px] px-2 py-0.5 rounded">Upcoming</Badge>;
                             }

                             return (
                               <div key={event.key} className={`relative ${isLast ? '' : 'mb-10'}`}>
                                 <div className="absolute -left-[9.5rem] top-0 w-[6.5rem] text-right">
                                    <p className="font-bold text-sm text-slate-800">{new Date(event.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{new Date(event.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} IST</p>
                                 </div>
                                 <div className={`absolute -left-[2rem] ${event.isDeadline ? '-ml-[6px] w-[14px] h-[14px]' : '-ml-[5px] w-3 h-3 ring-[3px] ring-white'} rounded-full ${event.color} top-1`}></div>
                                 <div>
                                   <h4 className="font-bold text-slate-800 text-sm">{event.title}</h4>
                                   <p className="text-sm text-slate-500 mb-3 mt-1">{event.desc}</p>
                                   {statusBadge}
                                 </div>
                               </div>
                             );
                           });
                         })()}
                       </div>
                  </section>

                 {/* DOCUMENTS SECTION */}
                 <section id="documents" ref={el => { sectionRefs.current[4] = el; }} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8 scroll-mt-[150px] animate-in fade-in slide-in-from-bottom-2 duration-300 relative">
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                           <FileText className="w-5 h-5 text-blue-400" />
                           <h3 className="text-lg font-bold text-slate-800">Tender Documents</h3>
                        </div>
                        {tender?.hasDocuments === false ? (
                          <button 
                            disabled
                            className="text-sm font-semibold text-slate-400 cursor-not-allowed flex items-center transition-colors"
                            title="No documents available"
                          >
                            No Documents
                          </button>
                        ) : (
                          <button 
                            className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center transition-colors"
                            onClick={(e) => initiateDownload(tender, e)}
                          >
                            Download All (ZIP) <ArrowDown className="w-3 h-3 ml-1" />
                          </button>
                        )}
                     </div>
                     
                     {isDocsLocked && (
                      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-lg">
                         <div className="bg-white px-6 py-4 rounded-xl shadow-lg border border-slate-100 flex items-center gap-4">
                            <Lock className="w-5 h-5 text-slate-600" />
                            <p className="text-sm font-bold text-slate-900">Subscribe to download documents</p>
                         </div>
                      </div>
                     )}
                     
                     <div className={`space-y-4 mb-8 ${isDocsLocked ? 'blur-sm select-none opacity-50' : ''}`}>
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

                   </section>

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
                  {tender?.hasDocuments === false ? (
                    <Button disabled className="w-full bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed">
                      <Download className="w-4 h-4 mr-2 opacity-50" /> No Documents Available
                    </Button>
                  ) : (
                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white" onClick={(e) => initiateDownload(tender, e)}>
                      <Download className="w-4 h-4 mr-2" /> Download All Docs (ZIP)
                    </Button>
                  )}
                </div>
             </div>

             {/* Share Tender */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Share this tender</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-10 w-10 text-slate-600" onClick={handleCopyUrl} title="Copy Link"><Copy className="w-4 h-4"/></Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" className="h-10 w-10 text-blue-600"><Share2 className="w-4 h-4"/></Button>
                    </DialogTrigger>
                    {renderShareDialogContent()}
                  </Dialog>
                  <Button variant="outline" size="icon" className="h-10 w-10 text-sky-500"><Mail className="w-4 h-4"/></Button>
                </div>
             </div>

             {/* Related Tender Results */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                   <Sparkles className="w-4 h-4 text-blue-600" />
                   <h4 className="font-bold text-slate-800 text-sm">Related Tenders</h4>
                </div>
                <div className="flex flex-col">
                   {recommendations?.relatedTenders?.length > 0 ? (
                      recommendations.relatedTenders.map(rt => (
                         <Link href={`/tenders/${rt.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}--${rt.tenderId || rt.tenderCode || rt.id}`} key={rt.id} className="block p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-0 relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <h5 className="text-[13px] font-medium text-slate-700 mb-1.5 line-clamp-2 leading-relaxed group-hover:text-blue-700 transition-colors">{rt.title}</h5>
                            <div className="flex flex-wrap items-center text-[11px] text-slate-400 gap-3">
                               <span>ID: <span className="font-medium text-slate-500">{rt.tenderId || rt.tenderCode}</span></span>
                               {rt.endDate && (
                                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> <span className="font-medium text-slate-500">{new Date(rt.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></span>
                               )}
                               {(rt.location || rt.city || rt.state) && (
                                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> <span className="font-medium text-slate-500 truncate max-w-[120px]">{[rt.location, rt.city, rt.state].filter(Boolean).filter((val, i, arr) => arr.indexOf(val) === i).join(', ')}</span></span>
                               )}
                            </div>
                         </Link>
                      ))
                   ) : (
                      <div className="p-4 text-sm text-slate-500 text-center">
                         No related tenders found.
                      </div>
                   )}
                </div>
             </div>

             {/* View Also */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                   <Building2 className="w-4 h-4 text-emerald-600" />
                   <h4 className="font-bold text-slate-800 text-sm">View Also</h4>
                </div>
                <div className="flex flex-col">
                   {recommendations?.viewAlsoTenders?.length > 0 ? (
                      recommendations.viewAlsoTenders.map(vt => (
                         <Link href={`/tenders/${vt.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}--${vt.tenderId || vt.tenderCode || vt.id}`} key={vt.id} className="block p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-0 relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <h5 className="text-[13px] font-medium text-slate-700 mb-1.5 line-clamp-2 leading-relaxed group-hover:text-emerald-700 transition-colors">{vt.title}</h5>
                            <div className="flex flex-wrap items-center text-[11px] text-slate-400 gap-3">
                               <span>ID: <span className="font-medium text-slate-500">{vt.tenderId || vt.tenderCode}</span></span>
                               {vt.endDate && (
                                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> <span className="font-medium text-slate-500">{new Date(vt.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></span>
                               )}
                               {(vt.location || vt.city || vt.state) && (
                                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> <span className="font-medium text-slate-500 truncate max-w-[120px]">{[vt.location, vt.city, vt.state].filter(Boolean).filter((val, i, arr) => arr.indexOf(val) === i).join(', ')}</span></span>
                               )}
                            </div>
                         </Link>
                      ))
                   ) : (
                      <div className="p-4 text-sm text-slate-500 text-center">
                         No suggestions at this time.
                      </div>
                   )}
                </div>
             </div>

             {/* Recently Visited */}
             {recentlyVisited.length > 0 && (
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
                  <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                     <Clock className="w-4 h-4 text-purple-600" />
                     <h4 className="font-bold text-slate-800 text-sm">Recently Visited</h4>
                  </div>
                  <div className="flex flex-col">
                     {recentlyVisited.map(vt => (
                        <Link href={`/tenders/${vt.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}--${vt.tenderId || vt.id}`} key={vt.id} className="block p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-0 relative overflow-hidden group">
                           <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 rounded-r opacity-0 group-hover:opacity-100 transition-opacity"></div>
                           <h5 className="text-[13px] font-medium text-slate-700 mb-1.5 line-clamp-2 leading-relaxed group-hover:text-purple-700 transition-colors">{vt.title}</h5>
                           <div className="flex flex-wrap items-center text-[11px] text-slate-400 gap-3">
                              <span>ID: <span className="font-medium text-slate-500">{vt.tenderId}</span></span>
                              {vt.endDate && (
                                 <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> <span className="font-medium text-slate-500">{new Date(vt.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></span>
                              )}
                              {(vt.location || vt.city || vt.state) && (
                                 <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> <span className="font-medium text-slate-500 truncate max-w-[120px]">{[vt.location, vt.city, vt.state].filter(Boolean).filter((val, i, arr) => arr.indexOf(val) === i).join(', ')}</span></span>
                              )}
                           </div>
                        </Link>
                     ))}
                  </div>
               </div>
             )}

          </div>

        </div>
      </div>
      <DownloadModal />
    </div>
  );
}
