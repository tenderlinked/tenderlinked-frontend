"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CreditCard, Calendar, Clock, AlertTriangle, ShieldCheck, Zap, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const [subDetails, setSubDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "checkout_success") {
        setIsCheckoutModalOpen(false);
        fetchSubscription(); // Refresh details
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

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

  const handleUpdatePaymentMethod = async () => {
    if (!subDetails?.paymentId) {
      toast.error("Subscription ID not found");
      return;
    }

    setUpdatingPayment(true);

    try {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        name: "TenderLinked",
        description: `Update payment method for ${subDetails.planType} Plan`,
        subscription_id: subDetails.paymentId, // Same subscription ID, Razorpay will update payment instrument
        handler: async function (response: any) {
          toast.success("Payment method updated successfully!");
          fetchSubscription(); // Refresh details
          setUpdatingPayment(false);
        },
        prefill: {
          name: session?.user?.name || "",
          email: session?.user?.email || "",
        },
        theme: {
          color: "#244376",
        },
        modal: {
          ondismiss: function() {
            setUpdatingPayment(false);
          }
        }
      };

      // @ts-ignore
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any){
        toast.error(`Update failed: ${response.error.description}`);
        setUpdatingPayment(false);
      });
      rzp.open();
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to load checkout widget");
      setUpdatingPayment(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchSubscription();
    }
  }, [session?.user?.id]);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}`}/api/subscriptions/${session?.user?.id}/active`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSubDetails(data.subscription || null);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load subscription details");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!session?.user?.id) return;
    setCancelling(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}`}/api/payments/cancel-subscription`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({ userId: session.user.id })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      toast.success("Subscription cancelled successfully. You will have access until the end of your billing cycle.");
      setShowConfirm(false);
      fetchSubscription(); // Refresh data
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to cancel subscription");
    } finally {
      setCancelling(false);
    }
  };

  const handleOpenCheckoutPopup = () => {
    setIsCheckoutModalOpen(true);
  };

  if (loading) {
    return <div className="p-8 flex justify-center">Loading subscription details...</div>;
  }

  const getPlanTotalCredits = (planType: string) => {
    const plan = planType.toLowerCase();
    if (plan === "starter") return 100;
    if (plan === "standard") return 300;
    if (plan === "premium") return 500;
    if (plan === "free") return 10;
    return 10;
  };

  const maxCredits = getPlanTotalCredits(subDetails.planType);
  const currentCredits = subDetails.availableCredits ?? 0;
  const percentage = Math.min(100, Math.max(0, (currentCredits / maxCredits) * 100));

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Billing & Subscription</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Manage your active plans, review usage limits, and configure auto-renew preferences.</p>
      </div>

      {!subDetails ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center shadow-sm">
          <ShieldCheck className="w-12 h-12 text-[#244376] dark:text-blue-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Active Subscription</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto text-sm leading-relaxed">
            You do not have an active premium plan. Get started now to unlock advanced search and AI tender analysis.
          </p>
          <Button asChild className="bg-[#244376] hover:bg-[#1b345c] text-white px-6 h-11 rounded-lg font-semibold text-sm">
            <a href="/checkout">Upgrade Now</a>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Section 1: Overview Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Current Plan</span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                  {subDetails.planType} Plan
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    subDetails.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/30'
                  }`}>
                    {subDetails.status}
                  </span>
                </h2>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">₹{subDetails.amount}</div>
                <div className="text-xs text-slate-400">per cycle</div>
              </div>
            </div>
            
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <span className="text-xs font-medium text-slate-400 block uppercase">Start Date</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 block">
                  {format(new Date(subDetails.startDate), 'MMM dd, yyyy')}
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block uppercase">
                  {subDetails.status === 'CANCELLED_PENDING' ? 'Access Ends' : 'Next Invoice Date'}
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 block">
                  {format(new Date(subDetails.endDate), 'MMM dd, yyyy')}
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block uppercase">Payment Method</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {subDetails.paymentMethod === 'RAZORPAY_SUB' ? 'Razorpay Auto-Pay' : subDetails.paymentMethod}
                  </span>
                  <button 
                    onClick={handleUpdatePaymentMethod} 
                    disabled={updatingPayment}
                    className="text-xs text-[#244376] dark:text-blue-400 font-semibold hover:underline bg-transparent border-0 p-0 cursor-pointer inline-flex items-center"
                  >
                    {updatingPayment ? "Updating..." : "Change"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Usage & Credits Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Usage & AI Credits</h3>
                <p className="text-xs text-slate-400 mt-1">Available credits will reset at the start of each billing cycle.</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-[#244376] dark:text-blue-400">{currentCredits}</span>
                <span className="text-sm text-slate-400"> / {maxCredits} Credits</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#244376] dark:bg-blue-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Section 3: Billing Operations Stack */}
          {subDetails.status === 'ACTIVE' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
              {/* Change Subscription Plan */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="max-w-xl">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Change Subscription Plan</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Upgrade or downgrade your current subscription tier. Remaining cycle duration is automatically prorated based on your plan costs, and all unused credits will carry over.
                  </p>
                </div>
                <Button 
                  onClick={handleOpenCheckoutPopup} 
                  className="bg-[#244376] hover:bg-[#1b345c] text-white font-semibold px-5 h-10 rounded-lg text-sm shrink-0"
                >
                  Change Plan
                </Button>
              </div>



              <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="max-w-xl">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Cancel Auto-Renewal</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Stop automatic subscription renewal charges. Your premium features will remain fully active and accessible until the current invoice cycle expires.
                  </p>
                </div>

                {!showConfirm ? (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowConfirm(true)}
                    className="border-rose-200 hover:border-rose-300 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-semibold px-5 h-10 rounded-lg text-sm shrink-0"
                  >
                    Cancel Subscription
                  </Button>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-rose-50/80 dark:bg-rose-950/25 border border-rose-100 dark:border-rose-900/30 rounded-xl p-4 w-full sm:w-auto">
                    <div className="text-xs text-rose-800 dark:text-rose-300 font-medium flex-1">
                      Retain access until {format(new Date(subDetails.endDate), 'MMM dd, yyyy')} but stop automatic renewal.
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button 
                        variant="ghost" 
                        className="text-slate-600 hover:bg-white/80 dark:hover:bg-slate-800 h-8 rounded-lg text-xs" 
                        onClick={() => setShowConfirm(false)}
                      >
                        Keep It
                      </Button>
                      <Button 
                        variant="destructive" 
                        className="h-8 rounded-lg text-xs"
                        onClick={handleCancel} 
                        disabled={cancelling}
                      >
                        {cancelling ? "Cancelling..." : "Confirm"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Checkout Modal Overlay */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[90vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">Change Subscription Plan</h3>
              <button 
                onClick={() => setIsCheckoutModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Modal Body (Iframe) */}
            <div className="flex-1 bg-[#F8FAFC] dark:bg-slate-950 relative">
              <iframe 
                src="/checkout?embed=true" 
                className="w-full h-full border-0"
                title="TenderLinked Checkout"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
