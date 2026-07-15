"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Check, X, ArrowRight, ShieldCheck, CheckCircle2, Phone, Building2, TrendingUp, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import Header from "@/components/Header";
import { format } from "date-fns";

export default function CheckoutPage() {
  const { data: session, status, update } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isEmbed = searchParams.get("embed") === "true";
  
  const [dbPlans, setDbPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  
  const defaultPlanKey = searchParams.get("plan");
  const [selectedPlanId, setSelectedPlanId] = useState<string>(defaultPlanKey || "");
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [isTrialEligible, setIsTrialEligible] = useState(true);

  useEffect(() => {
    if (session?.user?.id && session?.accessToken) {
      const fetchEligibility = async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/payments/trial-eligibility/${session.user.id}`, {
            headers: {
              Authorization: `Bearer ${session.accessToken}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setIsTrialEligible(data.eligible);
          }
        } catch (e) {
          console.error("Failed to check trial eligibility", e);
        }
      };
      fetchEligibility();
    }
  }, [session?.user?.id, session?.accessToken]);

  useEffect(() => {
    if (session?.user?.id && session?.accessToken) {
      const fetchActiveSub = async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/subscriptions/${session.user.id}/active`, {
            headers: {
              Authorization: `Bearer ${session.accessToken}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setActiveSub(data.subscription || null);
          }
        } catch (e) {
          console.error("Failed to fetch active sub", e);
        }
      };
      fetchActiveSub();
    }
  }, [session?.user?.id, session?.accessToken]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/plans`);
        if (res.ok) {
          const data = await res.json();
          setDbPlans(data);
          
          if (!selectedPlanId || !data.find((p: any) => p.id === selectedPlanId)) {
            const defaultPlan = data.find((p: any) => p.isDefault) || data[0];
            if (defaultPlan) {
              setSelectedPlanId(defaultPlan.id);
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch plans", e);
      } finally {
        setPlansLoading(false);
      }
    };
    fetchPlans();
  }, [selectedPlanId]);

  const selectedPlan = dbPlans.find(p => p.id === selectedPlanId) || dbPlans[0] || { price: 0, name: '' };
  
  const subtotal = selectedPlan.price;
  const taxRate = 0.18; // 18% GST for India
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;
  const trialSetupFee = Number(process.env.NEXT_PUBLIC_TRIAL_SETUP_FEE || 5);

  const getProrationEstimate = () => {
    if (!activeSub || !selectedPlan || selectedPlan.id === activeSub.planType || selectedPlan.name === activeSub.planType) {
      return null;
    }

    const now = new Date();
    const currentEndDate = new Date(activeSub.endDate);
    const remainingTime = currentEndDate.getTime() - now.getTime();
    const remainingDays = Math.max(0, remainingTime / (1000 * 60 * 60 * 24));

    const oldPrice = activeSub.amount || 0;
    const newPrice = selectedPlan.price || 0;

    if (oldPrice > 0 && newPrice > 0 && remainingDays > 0) {
      // Prorate: remaining monetary value ÷ new daily rate
      const newRemainingDays = remainingDays * (oldPrice / newPrice);
      const roundedNewDays = Math.max(1, Math.round(newRemainingDays));
      const nextBillingDate = new Date();
      nextBillingDate.setDate(nextBillingDate.getDate() + roundedNewDays);
      return {
        remainingDays: Math.round(remainingDays),
        newRemainingDays: roundedNewDays,
        nextBillingDate,
        oldPrice,
        newPrice,
        isUpgrade: newPrice > oldPrice
      };
    }

    // Fallback: keep existing end date
    return {
      remainingDays: Math.round(remainingDays),
      newRemainingDays: Math.round(remainingDays),
      nextBillingDate: currentEndDate,
      oldPrice,
      newPrice,
      isUpgrade: newPrice > oldPrice
    };
  };

  const prorationEstimate = getProrationEstimate();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/checkout");
    }
  }, [status, router]);

  useEffect(() => {
    // Dynamically load Razorpay SDK
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handlePayment = async () => {
    if (!session?.user?.id) {
      toast.error("Please log in first");
      router.push("/auth/login?callbackUrl=/checkout");
      return;
    }

    setIsProcessing(true);
    
    try {
      // 0a. DOWNGRADE — change plan directly, no charge, no new mandate needed
      if (activeSub && activeSub.planType !== 'Free' && prorationEstimate && !prorationEstimate.isUpgrade) {
        toast.loading("Adjusting your plan...", { id: "change-toast" });
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/payments/change-plan`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.accessToken}`
          },
          body: JSON.stringify({ userId: session.user.id, planType: selectedPlanId })
        });
        if (!res.ok) { const text = await res.text(); throw new Error(text || 'Failed to change plan'); }
        toast.success("Plan downgraded! Your next billing date has been adjusted.", { id: "change-toast" });
        update({ hasActivePlan: true }).catch(console.error);
        setTimeout(() => {
          if (isEmbed) { window.parent.postMessage("checkout_success", "*"); }
          else { window.location.href = "/dashboard"; }
        }, 1000);
        return;
      }

      // 0b. UPGRADE — cancel old mandate, create new Razorpay subscription for re-authorization
      if (activeSub && activeSub.planType !== 'Free' && prorationEstimate && prorationEstimate.isUpgrade) {
        toast.loading("Preparing upgrade...", { id: "upgrade-toast" });
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/payments/cancel-and-upgrade`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.accessToken}`
          },
          body: JSON.stringify({ userId: session.user.id, planType: selectedPlanId })
        });
        if (!res.ok) { const text = await res.text(); throw new Error(text || 'Failed to initiate upgrade'); }
        const { subscriptionId } = await res.json();
        toast.dismiss("upgrade-toast");

        // Open Razorpay checkout for the new subscription mandate (same as normal subscribe flow)
        // @ts-ignore
        if (!window.Razorpay) { throw new Error("Razorpay SDK not loaded"); }
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          subscription_id: subscriptionId,
          name: "TenderLinked",
          description: `Upgrade to ${selectedPlan.name} Plan`,
          handler: async (response: any) => {
            try {
              toast.loading("Verifying upgrade...", { id: "verify-toast" });
              const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/payments/verify-subscription`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.accessToken}` },
                body: JSON.stringify({
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySubscriptionId: response.razorpay_subscription_id,
                  razorpaySignature: response.razorpay_signature,
                  userId: session?.user?.id || "",
                  planType: selectedPlanId,
                  amount: prorationEstimate?.newPrice ?? selectedPlan.price
                })
              });
              if (!verifyRes.ok) { const t = await verifyRes.text(); throw new Error(t); }
              toast.success("Plan upgraded successfully!", { id: "verify-toast" });
              update({ hasActivePlan: true }).catch(console.error);
              setTimeout(() => {
                if (isEmbed) { window.parent.postMessage("checkout_success", "*"); }
                else { window.location.href = "/dashboard"; }
              }, 1000);
            } catch (e: any) {
              toast.error(e.message || "Upgrade verification failed.", { id: "verify-toast" });
              setIsProcessing(false);
            }
          },
          prefill: { name: session.user?.name || "", email: session.user?.email || "" },
          theme: { color: "#244376" },
          modal: { ondismiss: () => setIsProcessing(false) }
        };
        // @ts-ignore
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (r: any) => {
          toast.error(`Upgrade Failed: ${r.error.description}`);
          setIsProcessing(false);
        });
        rzp.open();
        return;
      }


      // 1. If it's a Free plan (price === 0), activate directly on the backend
      if (selectedPlan.price === 0) {
        toast.loading("Activating Free plan...", { id: "activate-toast" });
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/payments/free-activate`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.accessToken}`
          },
          body: JSON.stringify({
            userId: session.user.id,
            planType: selectedPlanId
          })
        });

        if (!res.ok) {
          throw new Error('Failed to activate Free plan');
        }

        toast.success("Free plan activated successfully!", { id: "activate-toast" });
        update({ hasActivePlan: true }).catch(console.error);
        
        setTimeout(() => {
          if (isEmbed) {
            window.parent.postMessage("checkout_success", "*");
          } else {
            window.location.href = "/dashboard";
          }
        }, 1000);
        return;
      }

      // 2. Otherwise, create a subscription mandate on Razorpay
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/payments/create-subscription`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({
          userId: session.user.id,
          planType: selectedPlanId
        })
      });
      
      if (!res.ok) {
        throw new Error('Failed to create subscription mandate');
      }

      const orderData = await res.json();
      
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        name: "TenderLinked",
        description: selectedPlan.name,
        subscription_id: orderData.subscriptionId, // Set subscription_id for recurring mandate (auto-pay)
        handler: async function (response: any) {
          try {
            toast.loading("Verifying subscription mandate...", { id: "verify-toast" });

            const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/payments/verify-subscription`, {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session?.accessToken}`
              },
              body: JSON.stringify({
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySubscriptionId: response.razorpay_subscription_id,
                razorpaySignature: response.razorpay_signature,
                userId: session?.user?.id || "",
                planType: selectedPlanId,
                amount: isTrialEligible ? trialSetupFee : totalAmount
              })
            });
            
            if (!verifyRes.ok) {
              const text = await verifyRes.text();
              throw new Error(`Verification failed: ${text}`);
            }
            
            toast.success("Subscription set up successfully!", { id: "verify-toast" });
            update({ hasActivePlan: true }).catch(console.error);
            
            setTimeout(() => {
              if (isEmbed) {
                window.parent.postMessage("checkout_success", "*");
              } else {
                window.location.href = "/dashboard";
              }
            }, 1000);
            
          } catch (e: any) {
            toast.error(e.message || "Subscription verification failed.", { id: "verify-toast" });
            setIsProcessing(false);
          }
        },
        prefill: {
          name: session.user?.name || "",
          email: session.user?.email || "",
        },
        theme: {
          color: "#244376", // brand dark blue
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        }
      };
      
      // @ts-ignore
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any){
        toast.error(`Subscription Setup Failed: ${response.error.description}`);
        setIsProcessing(false);
      });
      rzp.open();
      
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during checkout. Please try again.");
      setIsProcessing(false);
    }
  };

  if (status === "loading" || status === "unauthenticated") {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex flex-col">
      {/* Top Navbar */}
      {!isEmbed && <Header />}

      {/* Stepper */}
      {!isEmbed && (
        <div className="w-full max-w-2xl mx-auto py-10 px-4 pt-24">
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-[#244376] text-white rounded-full flex items-center justify-center mb-2 z-10 relative">
                <Check className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#244376] tracking-wider uppercase">Account</span>
            </div>
            
            <div className="w-32 h-[2px] bg-[#244376] -mt-6 mx-2"></div>
            
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-[#244376] text-white rounded-full flex items-center justify-center mb-2 z-10 relative">
                <span className="text-sm font-bold">2</span>
              </div>
              <span className="text-xs font-bold text-[#244376] tracking-wider uppercase">Plan</span>
            </div>

            <div className="w-32 h-[2px] bg-slate-300 -mt-6 mx-2"></div>
            
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center mb-2 z-10 relative">
                <span className="text-sm font-bold">3</span>
              </div>
              <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">Payment</span>
            </div>
          </div>
        </div>
      )}

      <main className={`flex-1 max-w-6xl w-full mx-auto px-4 pb-32 flex flex-col items-center ${isEmbed ? 'pt-6' : 'pt-10'}`}>
        {/* Top: Header */}
        <div className="w-full text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shadow-sm">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-[30px] font-bold text-slate-900 leading-none">Upgrade Your Subscription</h1>
          </div>
          <p className="text-[15px] text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Upgrade your plan anytime. Your unused subscription value will automatically be converted into your new plan.
          </p>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
          {plansLoading ? (
            <div className="col-span-4 text-center text-slate-500 py-10">Loading plans...</div>
          ) : dbPlans.map((plan: any) => {
            const isSelected = selectedPlanId === plan.id;
            const isCurrentPlan = activeSub && (activeSub.planType.toUpperCase() === plan.name.toUpperCase() || activeSub.planType === plan.id) && activeSub.status === "ACTIVE";
            
            const features = [
              isTrialEligible ? "14 Days Free Trial" : null,
              plan.hasEmailAlerts ? "Email Alerts" : null,
              plan.hasWhatsappAlerts ? "WhatsApp Alerts" : null,
              plan.hasSmsAlerts ? "SMS Alerts" : null,
              plan.maxKeywords > 0 ? `Up to ${plan.maxKeywords} Keywords` : "Unlimited Keywords",
              plan.maxStates > 0 ? `Access to ${plan.maxStates} States` : "All States Coverage",
              plan.monthlyCredits > 0 ? `${plan.monthlyCredits} Monthly AI Credits` : "Unlimited AI Credits",
              plan.maxTenderViews > 0 ? `${plan.maxTenderViews} Tender Views/mo` : "Unlimited Tender Views",
              plan.allowedTenderFields?.includes('aiSummary') ? 'AI Summarization' : null
            ].filter(Boolean) as string[];

            let cardClass = "relative flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer";
            if (isCurrentPlan) {
               cardClass = "relative flex flex-col bg-green-50/40 border-2 border-green-600 rounded-2xl overflow-hidden cursor-not-allowed opacity-95";
            } else if (isSelected) {
               cardClass = "relative flex flex-col bg-blue-50/50 border-2 border-blue-600 rounded-2xl overflow-hidden shadow-lg scale-[1.02] transition-all duration-300 cursor-pointer ring-4 ring-blue-600/10";
            }

            return (
              <div key={plan.id} className={cardClass} onClick={() => { if (!isCurrentPlan) setSelectedPlanId(plan.id); }}>
                {/* Badge Header */}
                {isCurrentPlan ? (
                  <div className="bg-green-600 text-white text-[10px] font-bold uppercase tracking-wider text-center py-2 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Current Plan
                  </div>
                ) : isSelected ? (
                  <div className="bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider text-center py-2 animate-in slide-in-from-top-2 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Selected Upgrade
                  </div>
                ) : plan.isDefault ? (
                  <div className="bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider text-center py-2">
                    Most Popular
                  </div>
                ) : (
                  <div className="h-9"></div> /* Spacer for alignment */
                )}

                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-[16px] font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-0.5">
                    <span className="text-[28px] font-bold text-slate-900 leading-none tracking-tight">₹{plan.price?.toLocaleString() || 0}</span>
                    <span className="text-[12px] font-medium text-gray-500">/month</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mb-5">+ GST</p>

                  <ul className="space-y-3 mb-5 flex-1">
                    {features.slice(0, 6).map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[13px] text-slate-700">
                        <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span className="leading-tight">{f}</span>
                      </li>
                    ))}
                    {features.length > 6 && (
                      <li className="text-[11px] text-gray-400 pl-6 font-medium">+{features.length - 6} more features</li>
                    )}
                  </ul>
                  
                  {/* Subtle indication for non-selected cards */}
                  {!isCurrentPlan && !isSelected && (
                    <div className="mt-auto pt-3 text-center">
                      <span className="text-[12px] font-bold text-blue-600 group-hover:underline">Select Plan</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summaries Section */}
        <div className={`grid grid-cols-1 ${prorationEstimate && prorationEstimate.isUpgrade ? 'md:grid-cols-2' : 'max-w-md mx-auto'} gap-6 w-full mt-10`}>
          
          {/* Upgrade Summary (Left) */}
          {prorationEstimate && prorationEstimate.isUpgrade && (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <h2 className="text-[20px] font-bold text-slate-900 mb-6 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-600" /> Upgrade Summary
              </h2>
              
              <div className="space-y-5">
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex flex-col">
                    <span className="text-[13px] text-gray-500 font-medium uppercase tracking-wider mb-1">Current Plan</span>
                    <span className="text-[16px] font-bold text-slate-900">{activeSub.planType}</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300" />
                  <div className="flex flex-col text-right">
                    <span className="text-[13px] text-blue-600 font-medium uppercase tracking-wider mb-1">Upgrade To</span>
                    <span className="text-[16px] font-bold text-blue-600">{selectedPlan.name}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[14px] px-2">
                  <span className="text-gray-500 font-medium">Remaining Validity</span>
                  <span className="text-[16px] font-semibold text-slate-900">{prorationEstimate.remainingDays} days</span>
                </div>
                
                <div className="flex justify-between items-center text-[14px] px-2 group relative">
                  <span className="text-gray-500 font-medium cursor-help border-b border-dotted border-gray-400" title="Your unused subscription value is automatically converted based on the price difference.">
                    Unused Subscription Value
                  </span>
                  <span className="text-[16px] font-semibold text-slate-900">₹{Math.round((prorationEstimate.oldPrice / 30) * prorationEstimate.remainingDays).toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-[14px] bg-blue-50 -mx-4 px-6 py-4 rounded-xl border border-blue-100/50">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-700 font-bold">Converted Validity</span>
                  </div>
                  <span className="text-[16px] font-bold text-blue-700">{prorationEstimate.newRemainingDays} {selectedPlan.name} days</span>
                </div>

                <div className="flex justify-between items-center text-[14px] px-2 pt-2 border-t border-gray-100">
                  <span className="text-gray-500 font-medium">Next Billing Date</span>
                  <span className="text-[16px] font-semibold text-slate-900">{format(prorationEstimate.nextBillingDate, 'dd MMM yyyy')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Summary (Right) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-[20px] font-bold text-slate-900 mb-6 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-gray-500" /> Payment Summary
            </h2>
            
            <div className="space-y-5">
              <div className="flex justify-between items-start text-[14px]">
                <div className="flex flex-col">
                  <span className="text-gray-500 font-medium">Today's Charge</span>
                  {prorationEstimate?.isUpgrade && <span className="text-[12px] text-gray-400 mt-0.5">Refundable Verification Charge</span>}
                </div>
                <span className="text-[16px] font-semibold text-slate-900">
                  {prorationEstimate?.isUpgrade ? `₹${trialSetupFee.toFixed(2)}` : '₹0.00'}
                </span>
              </div>

              <div className="flex justify-between items-start text-[14px]">
                <div className="flex flex-col">
                  <span className="text-gray-500 font-medium">Monthly Subscription</span>
                  <span className="text-[12px] text-gray-400 mt-0.5">
                    Billing starts {prorationEstimate?.isUpgrade ? format(prorationEstimate.nextBillingDate, 'dd MMM yyyy') : "Immediately"}
                  </span>
                </div>
                <span className="text-[16px] font-semibold text-slate-900">₹{selectedPlan.price?.toLocaleString()}/month</span>
              </div>

              <div className="flex justify-between items-center text-[14px]">
                <span className="text-gray-500 font-medium">GST</span>
                <span className="text-[14px] font-medium text-gray-500">Calculated during checkout</span>
              </div>

              <div className="flex justify-between items-center pt-5 mt-2 border-t border-gray-100">
                <span className="text-[18px] font-bold text-slate-900">Grand Total Today</span>
                <span className="text-[24px] font-bold text-blue-600">
                  {prorationEstimate?.isUpgrade ? `₹${trialSetupFee.toFixed(2)}` : '₹0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky CTA Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.03)] p-4 z-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
            <span className="leading-snug">
              🔒 <b>Secure payment</b> powered by Razorpay.<br/>Bank-grade 256-bit encryption.
            </span>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {!isEmbed && (
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                disabled={isProcessing}
                className="h-[52px] px-6 rounded-xl font-bold text-gray-700 border-gray-300 hover:bg-gray-50 transition-colors w-full md:w-auto text-[16px]"
              >
                Cancel
              </Button>
            )}
            <Button 
              onClick={handlePayment}
              disabled={isProcessing}
              className="h-[52px] px-8 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white w-full md:w-auto text-[16px] transition-all shadow-md hover:shadow-lg flex items-center justify-center relative overflow-hidden"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center">
                  {prorationEstimate?.isUpgrade ? `Upgrade to ${selectedPlan.name}` : selectedPlan.price > 0 ? "Subscribe Now" : "Activate"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>


    </div>
  );
}
