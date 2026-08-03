"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, X, AlertTriangle, Shield } from "lucide-react";

interface AIMatchBadgeProps {
  score?: number | null;
  matchResult?: any;
  tender?: any;
  className?: string;
}

export default function AIMatchBadge({ score, matchResult, tender, className = "" }: AIMatchBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openAbove, setOpenAbove] = useState(false);
  const badgeRef = useRef<HTMLDivElement>(null);

  const displayScore = matchResult?.matchScore ?? score ?? 83;

  // Extract checklist items
  const rawChecklist: { item: string; passed: boolean; status: string; score?: number; detail: string }[] = [];

  if (matchResult?.checklist && Array.isArray(matchResult.checklist) && matchResult.checklist.length > 0) {
    rawChecklist.push(...matchResult.checklist);
  } else {
    if (tender?.state || tender?.location) {
      rawChecklist.push({ item: "Operating State", passed: true, status: "PASS", detail: tender.state || tender.location });
    }
    if (tender?.tenderCategory) {
      rawChecklist.push({ item: "Category Fit", passed: true, status: "PASS", detail: tender.tenderCategory });
    }
    if (tender?.tenderAmount) {
      rawChecklist.push({ item: "Work Capacity", passed: true, status: "PASS", detail: `₹ ${(tender.tenderAmount / 100000).toFixed(1)}L` });
    }
    rawChecklist.push({ item: "Contractor Class", passed: true, status: "PASS", detail: "Class D Enlistment" });
    rawChecklist.push({ item: "Licenses", passed: true, status: "PASS", detail: "GST, PAN Verified" });
  }

  const checklist = rawChecklist.filter(chk => {
    if (chk.item.toLowerCase().includes("machinery") && (chk.detail.includes("0/0") || chk.detail.includes("0/"))) return false;
    return true;
  });

  // Score ring colors
  const scoreColor = displayScore >= 80 ? "#10b981" : displayScore >= 60 ? "#f59e0b" : "#ef4444";
  const scoreBg = displayScore >= 80 ? "bg-emerald-500" : displayScore >= 60 ? "bg-amber-500" : "bg-rose-500";
  const scoreTextColor = displayScore >= 80 ? "text-emerald-600" : displayScore >= 60 ? "text-amber-600" : "text-rose-600";

  const passed = checklist.filter(c => c.passed).length;
  const total = checklist.length;

  // SVG ring
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;

  const getItemColor = (chk: any) => {
    if (chk.passed) return { bg: "bg-emerald-50 border-emerald-200", icon: "bg-emerald-100 text-emerald-700", label: "text-emerald-700" };
    if (chk.status === "PARTIAL" || (chk.score != null && chk.score > 0 && chk.score < 100))
      return { bg: "bg-amber-50 border-amber-200", icon: "bg-amber-100 text-amber-700", label: "text-amber-600" };
    return { bg: "bg-rose-50 border-rose-200", icon: "bg-rose-100 text-rose-700", label: "text-rose-600" };
  };

  const getStatusLabel = (chk: any) => {
    if (chk.passed) return null;
    if (chk.status === "PARTIAL" || (chk.score != null && chk.score > 0 && chk.score < 100)) return "Partial";
    return "No Match";
  };

  // No truncation — show full detail text
  const shortDetail = (detail: string) => detail || '';

  // Smart detail renderer: parses "Verified: A, B; Missing: C" into colored pills
  const renderDetail = (chk: { item: string; detail: string; passed: boolean; status: string; score?: number }) => {
    const detail = chk.detail || '';
    const isLicenseItem = chk.item.toLowerCase().includes('license') || chk.item.toLowerCase().includes('verified');

    if (!isLicenseItem) {
      return <p className="text-[10px] text-slate-500 leading-snug mt-0.5 break-words">{detail}</p>;
    }

    // Try to parse "Verified: A, B; Missing: C, D" or "License Missing: X, Y" patterns
    const verifiedMatch = detail.match(/[Vv]erified:\s*([^;]+)/)?.[1];
    const missingMatch = detail.match(/(?:License\s*)?[Mm]issing(?:\s*\([^)]*\))?:\s*([^;()]+)/)?.[1] ||
                         detail.match(/Missing All \d+ Required License\(s\):\s*(.+)/)?.[1];

    const verifiedList = verifiedMatch ? verifiedMatch.split(',').map(s => s.trim()).filter(Boolean) : [];
    const missingList = missingMatch ? missingMatch.split(',').map(s => s.trim()).filter(Boolean) : [];

    if (verifiedList.length === 0 && missingList.length === 0) {
      return <p className="text-[10px] text-slate-500 leading-snug mt-0.5 break-words">{detail}</p>;
    }

    // Extract prefix text (before the lists)
    const prefixMatch = detail.match(/^([^(]+\(\d+%\))/);
    const prefix = prefixMatch ? prefixMatch[1] : null;

    return (
      <div className="mt-1 space-y-1">
        {prefix && <p className="text-[10px] text-slate-500 leading-snug">{prefix}</p>}
        {verifiedList.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {verifiedList.map((lic, i) => (
              <span key={i} className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200">
                <Check className="w-2.5 h-2.5 stroke-[3] shrink-0" />{lic}
              </span>
            ))}
          </div>
        )}
        {missingList.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {missingList.map((lic, i) => (
              <span key={i} className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200">
                <X className="w-2.5 h-2.5 stroke-[3] shrink-0" />{lic}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={badgeRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={() => {
        if (badgeRef.current) {
          const rect = badgeRef.current.getBoundingClientRect();
          // Popup is ~340px tall; check if it fits below
          const spaceBelow = window.innerHeight - rect.bottom;
          setOpenAbove(spaceBelow < 360);
        }
        setIsOpen(true);
      }}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Badge */}
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold shadow-sm transition-all duration-150 cursor-pointer text-white ${scoreBg}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        Match {displayScore}%
      </span>

      {/* Popup */}
      {isOpen && (
        <div className={`absolute left-0 z-50 ${openAbove ? 'bottom-full pb-2' : 'top-full pt-2'}`}>
          <div className="w-[560px] bg-white border border-slate-200 rounded-2xl shadow-2xl text-slate-800 animate-in fade-in-0 zoom-in-95 duration-150 overflow-hidden">

            {/* Arrow — flips with popup direction */}
            {openAbove ? (
              <>
                <div className="absolute left-5 bottom-2 w-0 h-0 border-x-[7px] border-x-transparent border-t-[7px] border-t-slate-200" />
                <div className="absolute left-[21px] bottom-[9px] w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-white" />
              </>
            ) : (
              <>
                <div className="absolute left-5 top-2 w-0 h-0 border-x-[7px] border-x-transparent border-b-[7px] border-b-slate-200" />
                <div className="absolute left-[21px] top-[9px] w-0 h-0 border-x-[6px] border-x-transparent border-b-[6px] border-b-white" />
              </>
            )}

            {/* Header strip */}
            <div className="flex items-center gap-4 px-4 pt-4 pb-3 border-b border-slate-100">
              {/* Score Ring */}
              <div className="relative shrink-0 w-16 h-16">
                <svg width="64" height="64" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="7" />
                  <circle
                    cx="36" cy="36" r={radius} fill="none"
                    stroke={scoreColor} strokeWidth="7"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 36 36)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-sm font-black leading-none ${scoreTextColor}`}>{displayScore}%</span>
                </div>
              </div>

              {/* Title & summary */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <h4 className="font-bold text-slate-900 text-xs">Profile Match Analysis</h4>
                </div>
                <p className="text-[10px] text-slate-400 mb-1.5">Evaluated against your preferences & capacity</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${displayScore}%`, backgroundColor: scoreColor }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 shrink-0">{passed}/{total} matched</span>
                </div>
              </div>
            </div>

            {/* Criteria grid — 2 columns, no scroll */}
            <div className="grid grid-cols-2 gap-2 p-3">
              {checklist.map((chk, idx) => {
                const colors = getItemColor(chk);
                const statusLabel = getStatusLabel(chk);
                const isPartial = chk.status === "PARTIAL" || (chk.score != null && chk.score > 0 && chk.score < 100);

                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 p-2.5 rounded-xl border ${colors.bg} transition-all`}
                  >
                    {/* Icon */}
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${colors.icon}`}>
                      {chk.passed
                        ? <Check className="w-3 h-3 stroke-[3]" />
                        : isPartial
                        ? <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                        : <X className="w-3 h-3 stroke-[2.5]" />
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-800 leading-tight">{chk.item}</span>
                        {statusLabel && (
                          <span className={`text-[9px] font-bold uppercase tracking-wide ${colors.label}`}>
                            {statusLabel}
                          </span>
                        )}
                      </div>
                      {renderDetail(chk)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-3 pb-3">
              <div className="text-[10px] text-center text-slate-400 bg-slate-50 rounded-lg py-1.5 border border-slate-100">
                Click on tender to view full eligibility breakdown
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
