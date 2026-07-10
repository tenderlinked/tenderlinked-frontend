"use client";

import { CheckCircle2, Download, ExternalLink, Sparkles, Star, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, differenceInDays } from "date-fns";
import Link from "next/link";
import { handleTenderDownload } from "@/lib/download";

export interface TenderData {
  id: string;
  district?: string;
  organisation?: string;
  title: string;
  aiSummary?: string;
  tags?: string[];
  tenderValue?: string;
  emd?: string;
  applicationCost?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  bidOpeningDate?: string | Date;
  noticePdfUrl?: string;
  tenderPdfUrl?: string;
  sourceUrl?: string;
}

interface TenderTableProps {
  type: "district" | "state";
  tenders: TenderData[];
  loading?: boolean;
}

export function TenderTable({ type, tenders, loading }: TenderTableProps) {
  const getDaysDiff = (date: string | Date | undefined) => {
    if (!date) return null;
    return differenceInDays(new Date(date), new Date());
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading tenders...</div>;
  }

  if (!tenders.length) {
    return <div className="p-8 text-center text-muted-foreground">No tenders found.</div>;
  }

  return (
    <div className="w-full overflow-x-auto bg-white">
      <table className="w-full text-sm text-left">
        <thead className="text-[11px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200 tracking-wider font-semibold">
          <tr>
            <th scope="col" className="px-5 py-4 w-[12%]">
              {type === "district" ? "District" : "Organisation"}
            </th>
            <th scope="col" className="px-5 py-4 w-[38%]">
              Title & AI Summary
            </th>
            <th scope="col" className="px-5 py-4 w-[15%]">
              Financials
            </th>
            <th scope="col" className="px-5 py-4 w-[15%]">
              Timeline
            </th>
            <th scope="col" className="px-5 py-4 w-[10%] text-center">
              Documents
            </th>
            <th scope="col" className="px-5 py-4 w-[10%] text-center">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tenders.map((tender, index) => {
            const orgName = type === "district" ? tender.district : tender.organisation;
            const subStartDays = getDaysDiff(tender.startDate);
            const subEndDays = getDaysDiff(tender.endDate);

            return (
              <tr key={tender.id} className="group hover:bg-slate-50/80 transition-colors duration-200 border-b border-slate-100 last:border-0 bg-white">
                {/* District / Organisation */}
                <td className="px-5 py-5 font-medium text-slate-900 align-top">
                  {orgName || "N/A"}
                </td>

                {/* Title & AI Summary */}
                <td className="px-5 py-5 align-top space-y-4">
                  <Link href={`/dashboard/tenders/${tender.id}`} className="block font-semibold text-slate-900 leading-snug group-hover:text-blue-700 transition-colors">
                    {tender.title}
                  </Link>
                  
                  {tender.tags && tender.tags.filter(t => !t.includes('PREMIUM_LOCKED')).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tender.tags.filter(t => !t.includes('PREMIUM_LOCKED')).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium border border-blue-100/50">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {tender.aiSummary === '__PREMIUM_LOCKED__' || tender.tags?.some(t => t.includes('PREMIUM_LOCKED')) ? (
                    <div className="relative overflow-hidden rounded-xl border border-purple-200/60 bg-gradient-to-br from-purple-50/80 to-fuchsia-50/80 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
                      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-purple-400 to-fuchsia-400 rounded-full blur-2xl opacity-10"></div>
                      <div className="relative flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 border border-purple-100 mt-0.5">
                          <Lock className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h4 className="text-sm font-bold text-purple-900 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-fuchsia-500" />
                              AI Summary Locked
                            </h4>
                            <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 font-bold text-[9px] uppercase px-1.5 py-0 h-4">Premium</Badge>
                          </div>
                          <p className="text-xs text-purple-800/80 mb-3 leading-relaxed max-w-[90%]">
                            Upgrade your plan to unlock AI-powered insights, key requirements, and risk analysis for this tender.
                          </p>
                          <Button size="sm" variant="outline" className="h-7 px-3 text-xs font-semibold bg-white text-purple-700 border-purple-200 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all shadow-sm">
                            Upgrade to Unlock
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : tender.aiSummary ? (
                    <div className="flex items-start gap-3 bg-amber-50/50 p-4 rounded-xl border border-amber-100/60 text-amber-900 text-sm leading-relaxed shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="font-medium">{tender.aiSummary}</p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 border-dashed text-slate-500 text-xs">
                      <p>AI Summary not available yet.</p>
                    </div>
                  )}
                </td>

                {/* Financials */}
                <td className="px-5 py-5 align-top">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-md px-2.5 py-1.5 shadow-sm">
                      <span className="text-slate-500 uppercase text-[9px] font-bold tracking-wider">Value</span>
                      <span className="text-emerald-600 font-bold text-[11px]">{tender.tenderValue || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-md px-2.5 py-1.5 shadow-sm">
                      <span className="text-slate-500 uppercase text-[9px] font-bold tracking-wider">EMD</span>
                      <span className="text-blue-600 font-bold text-[11px]">{tender.emd || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-md px-2.5 py-1.5 shadow-sm">
                      <span className="text-slate-500 uppercase text-[9px] font-bold tracking-wider">Cost</span>
                      <span className="text-purple-600 font-bold text-[11px]">{tender.applicationCost || "N/A"}</span>
                    </div>
                  </div>
                </td>

                {/* Timeline */}
                <td className="px-5 py-5 align-top">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-start">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Start</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-800">{tender.startDate ? format(new Date(tender.startDate), 'dd MMM yy') : 'N/A'}</span>
                        {subStartDays === 0 && <span className="text-blue-600 font-bold text-[9px] mt-1">(TODAY)</span>}
                      </div>
                      
                      <div className="flex-1 flex flex-col items-center justify-center mx-2 mt-2">
                        {subEndDays !== null && subEndDays >= 0 && (
                          <span className="text-amber-600 font-bold text-[9px] mb-1">({subEndDays} DAYS LEFT)</span>
                        )}
                        {subEndDays !== null && subEndDays < 0 && (
                          <span className="text-red-500 font-bold text-[9px] mb-1">(EXPIRED)</span>
                        )}
                        <div className="w-full h-px bg-slate-200 relative">
                          <div className="absolute right-0 -top-[3.5px] w-2 h-2 border-t border-r border-slate-300 transform rotate-45"></div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">End</span>
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        </div>
                        <span className="text-xs font-semibold text-slate-800">{tender.endDate ? format(new Date(tender.endDate), 'dd MMM yy') : 'N/A'}</span>
                      </div>
                    </div>

                    {tender.bidOpeningDate && (
                      <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-100 border-dashed">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Bid Open</span>
                        <span className="text-xs font-semibold text-slate-700">{format(new Date(tender.bidOpeningDate), 'dd MMM yyyy')}</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Documents */}
                <td className="px-5 py-5 align-top text-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-600 hover:text-white hover:border-fuchsia-600 bg-white transition-all shadow-sm font-semibold h-8 px-3"
                    onClick={(e) => handleTenderDownload(tender, e)}
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Tender
                  </Button>
                </td>

                {/* Actions */}
                <td className="px-5 py-5 align-top">
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-row items-center bg-slate-50 border border-slate-200 rounded-lg p-1 shadow-sm">
                      <button className="text-slate-400 hover:text-emerald-600 hover:bg-white hover:shadow-sm p-2.5 rounded-md transition-all group/btn" title="Mark as Applied">
                        <CheckCircle2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      </button>
                      <div className="w-px h-5 bg-slate-200 mx-0.5"></div>
                      <button className="text-slate-400 hover:text-amber-500 hover:bg-white hover:shadow-sm p-2.5 rounded-md transition-all group/btn" title="Bookmark">
                        <Star className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      </button>
                      {tender.sourceUrl && (
                        <>
                          <div className="w-px h-5 bg-slate-200 mx-0.5"></div>
                          <button 
                            className="text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-sm p-2.5 rounded-md transition-all group/btn" 
                            title="View Source"
                            onClick={() => window.open(tender.sourceUrl, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
