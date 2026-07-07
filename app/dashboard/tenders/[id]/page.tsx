"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sparkles, Lock, ArrowLeft, MapPin, Building2, Calendar, FileText } from "lucide-react";

interface TenderDetail {
  id: string;
  title: string;
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
}

export default function TenderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [tender, setTender] = useState<TenderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && params.id) {
      fetchTender(params.id as string);
    }
  }, [status, params.id]);

  const fetchTender = async (id: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenders/${id}`, {
        headers: {
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setTender(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch tender details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-800">Tender Not Found</h2>
        <Button variant="link" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const isLocked = tender.aiSummary === '__PREMIUM_LOCKED__';

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Header Navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer hover:text-slate-800 transition-colors w-fit" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column - Main Details */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Header Card */}
          <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
            <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500 w-full"></div>
            <CardContent className="p-6">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 leading-tight">
                {tender.title}
              </h1>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {tender.tags?.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-slate-100 text-slate-600 font-medium rounded-md px-3">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-2 text-slate-500 text-sm mb-6 pb-6 border-b border-slate-100">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{tender.district || tender.organisation || "Location N/A"}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Opening Date</p>
                  <p className="font-semibold text-slate-800 text-sm">
                    {tender.startDate ? new Date(tender.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Closing Date</p>
                  <p className="font-semibold text-slate-800 text-sm">
                    {tender.endDate ? new Date(tender.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Tender Amount</p>
                  <p className="font-semibold text-emerald-600 text-sm">{tender.tenderValue || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs Section */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start border-b border-slate-200 rounded-none bg-transparent h-12 p-0 space-x-8">
              <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-3 data-[state=active]:text-blue-600 font-semibold text-slate-500">
                Overview
              </TabsTrigger>
              <TabsTrigger value="documents" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-3 data-[state=active]:text-blue-600 font-semibold text-slate-500">
                Documents
              </TabsTrigger>
              <TabsTrigger value="boq" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-3 data-[state=active]:text-blue-600 font-semibold text-slate-500">
                BOQ
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              
              {/* Costs Block */}
              <Card className="shadow-sm border-slate-200">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-slate-700 text-sm">
                  Costs
                </div>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    <div className="flex justify-between px-4 py-3 text-sm">
                      <span className="text-slate-500">EMD</span>
                      <span className="font-medium text-slate-900">{isLocked ? <span className="blur-sm select-none">₹ 1,50,000</span> : (tender.emd || "N/A")}</span>
                    </div>
                    <div className="flex justify-between px-4 py-3 text-sm">
                      <span className="text-slate-500">Document Cost</span>
                      <span className="font-medium text-slate-900">{isLocked ? <span className="blur-sm select-none">₹ 5,000</span> : (tender.applicationCost || "N/A")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary Block */}
              <Card className="shadow-sm border-slate-200">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-slate-700 text-sm">
                  Summary
                </div>
                <CardContent className="p-4 relative min-h-[150px]">
                  {isLocked ? (
                    <>
                      <div className="blur-md select-none text-slate-400 text-sm space-y-2">
                        <p>This is a highly detailed AI generated summary of the tender document that is currently locked.</p>
                        <p>It contains critical requirements, potential risks, and competitor analysis that can give you a significant edge in bidding.</p>
                        <p>Subscribe to our premium plan to unlock these insights instantly and start winning more bids.</p>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[2px] rounded-b-xl z-10">
                        <div className="bg-white px-6 py-4 rounded-xl shadow-lg border border-purple-100 flex flex-col items-center gap-3 max-w-sm w-full text-center">
                          <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 mb-1">
                            <Lock className="w-5 h-5" />
                          </div>
                          <h4 className="font-bold text-slate-900">Unlock AI Insights</h4>
                          <p className="text-xs text-slate-500 mb-2">Subscribe to our plans to view full AI analysis and insights for this tender.</p>
                          <Button className="w-full bg-blue-600 hover:bg-blue-700">Subscribe Now</Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{tender.aiSummary || "No summary available."}</p>
                  )}
                </CardContent>
              </Card>

              {/* Description Block */}
              <Card className="shadow-sm border-slate-200">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-slate-700 text-sm">
                  Description
                </div>
                <CardContent className="p-4 text-sm text-slate-700 leading-relaxed">
                  {tender.title}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <Card className="shadow-sm border-slate-200">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-slate-700 text-sm">Documents</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs">View Pricing</Button>
                    <Button size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700">Download All</Button>
                  </div>
                </div>
                <CardContent className="p-0 relative min-h-[250px]">
                  {isLocked && (
                    <div className="absolute inset-x-4 inset-y-8 flex items-center justify-center z-10">
                       <div className="bg-white/95 backdrop-blur-sm border border-red-100 shadow-md py-3 px-6 rounded-lg flex items-center gap-4 w-full max-w-xl">
                          <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 flex-shrink-0">
                            <Lock className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-900">Subscribe to our plans to view Tender Details</p>
                          </div>
                          <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm text-xs h-8">Subscribe Now</Button>
                       </div>
                    </div>
                  )}
                  
                  <div className={`divide-y divide-slate-100 ${isLocked ? 'blur-md select-none opacity-40 pointer-events-none' : ''}`}>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded flex items-center justify-center ${i % 2 === 0 ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'}`}>
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-700 text-blue-600 cursor-pointer">Tender Notice {i}.pdf</p>
                            <p className="text-xs text-slate-400">PDF Document • 1.2 MB</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600">
                          <ArrowLeft className="w-4 h-4 transform -rotate-90" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="boq" className="mt-6">
              <Card className="shadow-sm border-slate-200">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-slate-700 text-sm">
                  BOQ Items
                </div>
                <CardContent className="p-0 relative min-h-[300px]">
                   {isLocked && (
                    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex items-center justify-center z-10">
                       <div className="bg-white/95 backdrop-blur-sm border border-red-100 shadow-md py-3 px-6 rounded-lg flex items-center gap-4 w-full max-w-xl">
                          <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 flex-shrink-0">
                            <Lock className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-900">Subscribe to our plans to view BOQ Details</p>
                          </div>
                          <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm text-xs h-8">Subscribe Now</Button>
                       </div>
                    </div>
                  )}

                  <div className="w-full overflow-x-auto">
                    <table className={`w-full text-sm text-left ${isLocked ? 'blur-md select-none opacity-40 pointer-events-none' : ''}`}>
                      <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Item</th>
                          <th className="px-4 py-3 font-semibold text-right">Quantity</th>
                          <th className="px-4 py-3 font-semibold text-right">Units</th>
                          <th className="px-4 py-3 font-semibold text-right">Rate</th>
                          <th className="px-4 py-3 font-semibold text-right">Amount ₹</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[1, 2, 3].map((i) => (
                          <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-4 text-slate-700 font-medium max-w-[200px] truncate">Civil construction of main building phase {i}</td>
                            <td className="px-4 py-4 text-slate-600 text-right">1.00</td>
                            <td className="px-4 py-4 text-slate-500 text-right">Lump Sum</td>
                            <td className="px-4 py-4 text-slate-600 text-right">15,00,000</td>
                            <td className="px-4 py-4 text-slate-900 font-medium text-right">15,00,000</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Ads & Subscriptions */}
        <div className="lg:col-span-1 flex flex-col gap-6">
           <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-b from-blue-600 to-indigo-700 text-white rounded-xl">
            <CardContent className="p-6 flex flex-col items-center text-center relative z-10">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
              
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 mb-4 shadow-inner">
                <Building2 className="w-8 h-8 text-white drop-shadow-md" />
              </div>
              
              <h3 className="text-xl font-bold mb-2 tracking-tight">Source Construction Materials</h3>
              <p className="text-blue-100 text-sm mb-6 leading-relaxed">
                at <strong className="text-white">Best Prices</strong> offered in India!
              </p>
              
              <Button className="w-full bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800 font-bold shadow-lg transition-transform hover:-translate-y-0.5">
                Get Quotes!
              </Button>
            </CardContent>
          </Card>
          
          {isLocked && (
            <Card className="border border-purple-200 shadow-md overflow-hidden bg-gradient-to-br from-purple-50 to-white rounded-xl">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-full flex items-center justify-center text-white mb-3 shadow-md">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Unlock Full Potential</h3>
                <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                  Get instant access to BOQ, tender documents, and AI insights.
                </p>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-md">
                  Subscribe Now
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
