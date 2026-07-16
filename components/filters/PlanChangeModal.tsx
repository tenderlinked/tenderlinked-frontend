"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Zap, TrendingUp, Building2, Crown, Mail, ChevronDown, ChevronUp, AlertTriangle, ArrowDown, ArrowUp } from "lucide-react";
import { useSession } from "next-auth/react";

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  maxKeywords: number;
  maxStates: number;
  monthlyCredits: number;
  hasEmailAlerts: boolean;
  hasWhatsappAlerts: boolean;
  isDefault: boolean;
  allowedTenderFields: string[];
}

interface PlanChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlanType?: string;
  currentKeywords?: string[];
  onPlanChanged?: () => void;
}

const PLAN_ICONS: Record<string, React.ElementType> = {
  default: Building2,
  basic: Building2,
  professional: TrendingUp,
  pro: TrendingUp,
  enterprise: Zap,
  premium: Crown,
};

const PLAN_GRADIENTS: Record<string, string> = {
  default: "from-slate-500 to-slate-600",
  basic: "from-blue-500 to-blue-600",
  professional: "from-violet-500 to-purple-600",
  pro: "from-violet-500 to-purple-600",
  enterprise: "from-amber-500 to-orange-600",
  premium: "from-rose-500 to-pink-600",
};

const getPlanKey = (name: string) => (name || "").toLowerCase().replace(/\s+/g, "");

export function PlanChangeModal({ isOpen, onClose, currentPlanType, currentKeywords = [], onPlanChanged }: PlanChangeModalProps) {
  const { data: session } = useSession();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  useEffect(() => {
    if (!isOpen) return;
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/plans`);
        if (res.ok) {
          const data = await res.json();
          setPlans(data.filter((p: PricingPlan) => !p.isDefault));
        }
      } catch (e) {
        console.error("Failed to load plans", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [isOpen]);

  const normalizedCurrent = getPlanKey(currentPlanType || "");

  // Find current plan object
  const currentPlan = plans.find(p => getPlanKey(p.name) === normalizedCurrent);
  const sortedPlans = [...plans].sort((a, b) => (a.price || 0) - (b.price || 0));
  const isHighestPlan = currentPlan && sortedPlans.length > 0 && currentPlan.id === sortedPlans[sortedPlans.length - 1]?.id;

  const handleChangePlan = async (plan: PricingPlan) => {
    if (!session) return;
    const userId = (session.user as any)?.id;
    if (!userId) return;

    const isDowngrade = currentPlan && (plan.price || 0) < (currentPlan.price || 0);

    setChangingPlan(plan.id);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // For downgrades: trim keywords to fit new plan's maxKeywords (keep most recent)
      if (isDowngrade && currentKeywords.length > (plan.maxKeywords || 3)) {
        const trimmedKeywords = currentKeywords.slice(-plan.maxKeywords);
        // Save trimmed keywords via billing usage endpoint
        await fetch(`${API}/api/billing/keywords`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(session as any)?.accessToken}`,
          },
          body: JSON.stringify({ keywords: trimmedKeywords }),
        });
      }

      const res = await fetch(`${API}/api/payments/change-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
        body: JSON.stringify({ userId, planType: plan.name }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to change plan");
      }

      setSuccessMsg(`Successfully changed to ${plan.name} plan!`);
      setTimeout(() => {
        onPlanChanged?.();
        onClose();
      }, 1800);
    } catch (e: any) {
      setErrorMsg(e.message || "Something went wrong. Please try again.");
    } finally {
      setChangingPlan(null);
    }
  };

  const handleContactSupport = () => {
    window.open("mailto:support@tenderlinked.com?subject=Plan Change Request - Highest Plan", "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold text-slate-900">
            {isHighestPlan ? "You're on our Best Plan!" : "Change Your Plan"}
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            {isHighestPlan
              ? "You already have access to all premium features. Contact us for custom enterprise solutions."
              : currentPlan
                ? `Currently on: ${currentPlan.name} (₹${currentPlan.price?.toLocaleString()}/mo) · Select a plan below to upgrade or downgrade.`
                : "Select a plan to get started."}
          </DialogDescription>
        </DialogHeader>

        {isHighestPlan ? (
          <div className="flex flex-col items-center gap-6 py-8 text-center">
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 w-20 h-20 rounded-full flex items-center justify-center shadow-lg shadow-orange-200">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Maximum Plan Active</h3>
              <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
                You're already on our highest tier. For custom pricing, extra seats, or dedicated account management, please reach out to our team.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleContactSupport}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 px-8 py-5 rounded-full shadow-md font-semibold"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Customer Care
              </Button>
              <Button variant="outline" onClick={onClose} className="px-6">
                Close
              </Button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 pt-2">
            {successMsg && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedPlans.map((plan) => {
                const key = getPlanKey(plan.name);
                const Icon = PLAN_ICONS[key] || Building2;
                const gradient = PLAN_GRADIENTS[key] || "from-blue-500 to-blue-600";
                const isCurrent = getPlanKey(plan.name) === normalizedCurrent;
                const isUpgrade = currentPlan && (plan.price || 0) > (currentPlan.price || 0);
                const isDowngrade = currentPlan && (plan.price || 0) < (currentPlan.price || 0);
                const keywordsTrimmed = isDowngrade && currentKeywords.length > (plan.maxKeywords || 3)
                  ? currentKeywords.length - (plan.maxKeywords || 3)
                  : 0;

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-xl border-2 p-5 flex flex-col gap-3 transition-all duration-200 ${isCurrent
                        ? "border-blue-500 bg-blue-50/50 shadow-md shadow-blue-100"
                        : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-md"
                      }`}
                  >
                    {isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-blue-600 text-white text-[11px] font-bold px-3 py-0.5 shadow-sm">Current Plan</Badge>
                      </div>
                    )}

                    {/* Icon & Name */}
                    <div className="flex items-center gap-3">
                      <div className={`bg-gradient-to-br ${gradient} w-9 h-9 rounded-lg flex items-center justify-center shadow-sm`}>
                        <Icon className="w-4.5 h-4.5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">{plan.name}</p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          ₹{(plan.price || 0).toLocaleString()}/mo
                        </p>
                      </div>
                    </div>

                    {/* Key Features */}
                    <ul className="flex flex-col gap-1.5 text-[12px] text-slate-600">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        {plan.maxKeywords >= 100 ? "Unlimited" : `Up to ${plan.maxKeywords}`} keywords
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        {plan.maxStates >= 100 ? "All" : `${plan.maxStates}`} state{plan.maxStates !== 1 ? "s" : ""}
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        {plan.monthlyCredits || 0} credits/mo
                      </li>
                      {plan.hasEmailAlerts && (
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          Email alerts
                        </li>
                      )}
                    </ul>

                    {/* Downgrade warning */}
                    {keywordsTrimmed > 0 && (
                      <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[11px] text-amber-700">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{keywordsTrimmed} keyword{keywordsTrimmed > 1 ? "s" : ""} will be removed (latest {plan.maxKeywords} kept)</span>
                      </div>
                    )}

                    {/* Action button */}
                    {isCurrent ? (
                      <Button disabled variant="outline" className="w-full text-xs font-semibold mt-auto opacity-60">
                        Active
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleChangePlan(plan)}
                        disabled={!!changingPlan}
                        className={`w-full text-xs font-semibold mt-auto flex items-center justify-center gap-1.5 ${isUpgrade
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
                            : "bg-slate-700 text-white hover:bg-slate-800"
                          }`}
                      >
                        {changingPlan === plan.id ? (
                          <><div className="animate-spin rounded-full h-3 w-3 border-b border-white" /> Processing...</>
                        ) : (
                          <>
                            {isUpgrade ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                            {isUpgrade ? "Upgrade" : "Downgrade"}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-center text-[11px] text-slate-400 mt-2">
              Plan changes are prorated based on your remaining subscription period.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
