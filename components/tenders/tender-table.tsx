"use client";

import { CheckCircle2, Download, ExternalLink, Sparkles, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, differenceInDays } from "date-fns";

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
    <div className="w-full overflow-x-auto bg-white rounded-md border border-border shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-white uppercase bg-[#1f2937]">
          <tr>
            <th scope="col" className="px-4 py-4 w-[12%]">
              {type === "district" ? "District" : "Organisation"}
            </th>
            <th scope="col" className="px-4 py-4 w-[38%]">
              Title & AI Summary
            </th>
            <th scope="col" className="px-4 py-4 w-[15%]">
              Financials
            </th>
            <th scope="col" className="px-4 py-4 w-[15%]">
              Timeline
            </th>
            <th scope="col" className="px-4 py-4 w-[10%] text-center">
              Documents
            </th>
            <th scope="col" className="px-4 py-4 w-[10%] text-center">
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
              <tr key={tender.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                {/* District / Organisation */}
                <td className="px-4 py-4 font-medium text-gray-900 align-top">
                  {orgName || "N/A"}
                </td>

                {/* Title & AI Summary */}
                <td className="px-4 py-4 align-top space-y-3">
                  <div className="font-semibold text-gray-900">{tender.title}</div>
                  
                  {tender.tags && tender.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tender.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-normal border border-blue-100">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {tender.aiSummary ? (
                    <div className="flex items-start gap-2 bg-yellow-50/80 p-3 rounded-md border border-yellow-100/50 text-yellow-800 text-xs leading-relaxed">
                      <Sparkles className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                      <p className="italic">{tender.aiSummary}</p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-md border border-gray-100 text-gray-500 text-xs">
                      <p>AI Summary not available yet.</p>
                    </div>
                  )}
                </td>

                {/* Financials */}
                <td className="px-4 py-4 align-top space-y-2 text-xs">
                  <div>
                    <span className="text-gray-500 block uppercase text-[10px] font-semibold mb-0.5">Est. Value</span>
                    <span className="text-emerald-600 font-medium">{tender.tenderValue || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block uppercase text-[10px] font-semibold mb-0.5">EMD</span>
                    <span className="text-blue-600 font-medium">{tender.emd || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block uppercase text-[10px] font-semibold mb-0.5">Application Cost</span>
                    <span className="text-purple-600 font-medium">{tender.applicationCost || "N/A"}</span>
                  </div>
                </td>

                {/* Timeline */}
                <td className="px-4 py-4 align-top space-y-3 text-xs text-gray-600">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded border border-gray-300 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="w-2 h-2 bg-gray-300 rounded-sm"></span>
                    </span>
                    <div>
                      <div>Sub Start: {tender.startDate ? format(new Date(tender.startDate), 'dd MMM yyyy') : 'N/A'}</div>
                      {subStartDays === 0 && <div className="text-blue-600 font-medium mt-0.5">(Today)</div>}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded border border-gray-300 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="w-2 h-2 bg-gray-300 rounded-sm"></span>
                    </span>
                    <div>
                      <div>Sub End: {tender.endDate ? format(new Date(tender.endDate), 'dd MMM yyyy') : 'N/A'}</div>
                      {subEndDays !== null && subEndDays >= 0 && (
                        <div className="text-blue-600 font-medium mt-0.5">(Expires in {subEndDays} days)</div>
                      )}
                      {subEndDays !== null && subEndDays < 0 && (
                        <div className="text-red-500 font-medium mt-0.5">(Expired)</div>
                      )}
                    </div>
                  </div>
                  {tender.bidOpeningDate && (
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded border border-gray-300 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="w-2 h-2 bg-gray-300 rounded-sm"></span>
                      </span>
                      <div>
                        <div>Bid Open: {format(new Date(tender.bidOpeningDate), 'dd-MMM-yyyy')}</div>
                      </div>
                    </div>
                  )}
                </td>

                {/* Documents */}
                <td className="px-4 py-4 align-top text-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-fuchsia-600 border-fuchsia-200 hover:bg-fuchsia-50 hover:text-fuchsia-700 bg-white"
                    onClick={() => {
                        if (tender.tenderPdfUrl) window.open(tender.tenderPdfUrl, '_blank');
                        else if (tender.sourceUrl) window.open(tender.sourceUrl, '_blank');
                    }}
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Tender
                  </Button>
                </td>

                {/* Actions */}
                <td className="px-4 py-4 align-top text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <button className="hover:text-emerald-500 transition-colors" title="Mark as Applied">
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <button className="hover:text-yellow-500 transition-colors" title="Bookmark">
                      <Star className="w-5 h-5" />
                    </button>
                    {tender.sourceUrl && (
                      <button 
                        className="hover:text-blue-500 transition-colors" 
                        title="View Source"
                        onClick={() => window.open(tender.sourceUrl, '_blank')}
                      >
                        <ExternalLink className="w-5 h-5" />
                      </button>
                    )}
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
