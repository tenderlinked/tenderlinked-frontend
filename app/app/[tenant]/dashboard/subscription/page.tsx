"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CreditCard, Calendar, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const [subDetails, setSubDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchSubscription();
    }
  }, [session?.user?.id]);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/subscriptions/${session?.user?.id}/active`);
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
      const res = await fetch(`http://localhost:3001/api/payments/cancel-subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  if (loading) {
    return <div className="p-8 flex justify-center">Loading subscription details...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Subscription</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your billing and subscription details.</p>
      </div>

      {!subDetails ? (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-700">
          <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Active Subscription</h2>
          <p className="text-slate-500 mb-6">You don't have an active premium plan.</p>
          <Button asChild>
            <a href="/checkout">Upgrade Now</a>
          </Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {subDetails.planType} Plan
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${subDetails.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                    {subDetails.status}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  {subDetails.status === 'CANCELLED_PENDING' 
                    ? "Your subscription is cancelled and will not renew."
                    : "Your subscription is active and will auto-renew."}
                </p>
              </div>
              <div className="text-left md:text-right">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">₹{subDetails.amount}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">per cycle</div>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Start Date</div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {format(new Date(subDetails.startDate), 'MMMM dd, yyyy')}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {subDetails.status === 'CANCELLED_PENDING' ? 'Access Ends On' : 'Next Billing Date'}
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {format(new Date(subDetails.endDate), 'MMMM dd, yyyy')}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Payment Method</div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {subDetails.paymentMethod === 'RAZORPAY_SUB' ? 'Razorpay Auto-Pay' : subDetails.paymentMethod}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {subDetails.status === 'ACTIVE' && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 md:p-8 border-t border-slate-100 dark:border-slate-700">
              {!showConfirm ? (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Cancel Subscription</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Stop auto-renewal at any time.</p>
                  </div>
                  <Button variant="destructive" onClick={() => setShowConfirm(true)}>
                    Cancel Subscription
                  </Button>
                </div>
              ) : (
                <div className="border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-900/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-rose-800 dark:text-rose-300">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium">Are you sure? You will retain access until {format(new Date(subDetails.endDate), 'MMM dd, yyyy')} but won't be billed again.</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" className="text-slate-600 hover:bg-rose-100" onClick={() => setShowConfirm(false)}>
                      Keep It
                    </Button>
                    <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
                      {cancelling ? "Cancelling..." : "Confirm Cancel"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
