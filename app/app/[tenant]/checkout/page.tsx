"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Check, X, ArrowRight, ShieldCheck, CheckCircle2, Phone, Building2, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

import { PLANS } from "@/config/pricing";

export default function CheckoutPage() {
  const { data: session, status, update } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get plan from query or default to professional
  const defaultPlanKey = searchParams.get("plan") as keyof typeof PLANS || "professional";
  const [selectedPlanId, setSelectedPlanId] = useState<keyof typeof PLANS>(
    Object.keys(PLANS).includes(defaultPlanKey) ? defaultPlanKey : "professional"
  );
  
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedPlan = PLANS[selectedPlanId];
  
  const subtotal = selectedPlan.price;
  const taxRate = 0.18; // 18% GST for India
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

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
      // 1. Create subscription on backend (needed for trial support)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}`}/api/payments/create-subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          planType: selectedPlanId,
        })
      });
      
      if (!res.ok) {
        throw new Error('Failed to create subscription');
      }

      const orderData = await res.json();
      
      // 2. Open Razorpay Checkout Modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        name: "TenderLinked",
        description: selectedPlan.name,
        subscription_id: orderData.subscriptionId || undefined,
        order_id: orderData.orderId || undefined,
        handler: async function (response: any) {
          try {
            toast.loading("Verifying payment...", { id: "verify-toast" });

            const verifyEndpoint = orderData.subscriptionId ? "verify-subscription" : "verify";
            const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}`}/api/payments/${verifyEndpoint}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpaySubscriptionId: response.razorpay_subscription_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                userId: session?.user?.id || "",
                planType: selectedPlanId,
                amount: totalAmount
              })
            });
            
            if (!verifyRes.ok) {
              const text = await verifyRes.text();
              throw new Error(`Verification failed: ${text}`);
            }
            
            toast.success("Payment successful! Welcome aboard.", { id: "verify-toast" });
            update({ hasActivePlan: true }).catch(console.error);
            
            setTimeout(() => {
              window.location.href = "/dashboard";
            }, 1000);
            
          } catch (e: any) {
            toast.error(e.message || "Payment verification failed.", { id: "verify-toast" });
            setIsProcessing(false);
          }
        },
        prefill: {
          name: session.user?.name || "",
          email: session.user?.email || "",
        },
        theme: {
          color: "#047857", // emerald-700
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
        toast.error(`Payment Failed: ${response.error.description}`);
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


      {/* Stepper */}
      <div className="w-full max-w-2xl mx-auto py-10 px-4">
        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-emerald-700 text-white rounded-full flex items-center justify-center mb-2 z-10 relative">
              <Check className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-emerald-700 tracking-wider uppercase">Account</span>
          </div>
          
          <div className="w-32 h-[2px] bg-emerald-700 -mt-6 mx-2"></div>
          
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-emerald-700 text-white rounded-full flex items-center justify-center mb-2 z-10 relative">
              <span className="text-sm font-bold">2</span>
            </div>
            <span className="text-xs font-bold text-emerald-700 tracking-wider uppercase">Plan</span>
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

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 pb-20 flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column - Plans */}
        <div className="flex-1 w-full">
          <h1 className="text-3xl font-bold mb-2">Choose your procurement advantage</h1>
          <p className="text-slate-600 mb-8">Select a subscription tier that matches your business scale and tender volume.</p>

          <div className="space-y-6">
            {Object.values(PLANS).map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              const Icon = plan.icon;
              
              return (
                <div 
                  key={plan.id}
                  className={`relative bg-white border-2 rounded-lg p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all cursor-pointer ${
                    isSelected ? 'border-emerald-700 shadow-sm' : 'border-slate-200 hover:border-emerald-300'
                  }`}
                  onClick={() => setSelectedPlanId(plan.id as keyof typeof PLANS)}
                >
                  {plan.recommended && (
                    <div className="absolute -top-3 left-6 bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded">
                      Recommended
                    </div>
                  )}
                  
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`mt-1 ${isSelected ? 'text-emerald-700' : 'text-emerald-600'}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-3">{plan.name}</h3>
                      <ul className="space-y-2">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center text-sm text-slate-600">
                            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 mt-4 md:mt-0 shrink-0">
                    <div className="text-right">
                      <div className="flex items-end justify-start md:justify-end">
                        <span className="text-2xl font-bold">₹{plan.price.toLocaleString()}</span>
                        <span className="text-sm text-slate-500 mb-1 ml-1">/mo</span>
                      </div>
                      <div className="text-xs text-slate-500">Billed monthly</div>
                    </div>
                    
                    <button 
                      className={`px-6 py-2 rounded font-bold text-sm transition-colors border w-auto min-w-[120px] text-center ${
                        isSelected 
                          ? 'bg-emerald-700 text-white border-emerald-700' 
                          : 'bg-white text-emerald-700 border-emerald-700 hover:bg-emerald-50'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlanId(plan.id as keyof typeof PLANS);
                      }}
                    >
                      {isSelected ? 'Selected' : plan.ctaText || 'Select Plan'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Security Banner */}
          <div className="mt-8 bg-slate-100/50 rounded-lg p-6 flex items-start gap-4">
            <ShieldCheck className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900 mb-1">Bank-Grade Security</h4>
              <p className="text-sm text-slate-600">Your transaction is encrypted using 256-bit SSL technology. We do not store your credit card details on our servers.</p>
            </div>
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div className="w-full lg:w-[380px] shrink-0 sticky top-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Selected Plan</span>
                <span className="font-bold">{selectedPlan.name}</span>
              </div>
              {selectedPlan.id === "basic" ? (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">3-Day Trial Period</span>
                    <span className="text-emerald-700 font-bold">Free</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Refundable Auth Charge</span>
                    <span>₹5.00</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Monthly Subtotal</span>
                    <span>₹{subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Estimated Tax (18%)</span>
                    <span>₹{taxAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-slate-200 pt-4 mb-8">
              <div className="flex justify-between items-end">
                <span className="font-bold text-lg">Total Today</span>
                <div className="text-right">
                  <span className="font-bold text-2xl text-emerald-700 block">
                    ₹{selectedPlan.id === "basic" ? "5.00" : totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                    {selectedPlan.id === "basic" ? "Refundable Setup" : "INR / Monthly"}
                  </span>
                </div>
              </div>
            </div>

            <Button 
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white h-12 rounded flex items-center justify-center font-bold"
            >
              {isProcessing ? "Processing..." : (
                <>
                  {selectedPlan.id === "basic" ? "Start Free Trial" : "Continue to Payment"} <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
            
            <p className="text-[10px] text-center text-slate-500 mt-4 uppercase">
              By continuing, you agree to our <Link href="/terms" className="underline hover:text-slate-700">Terms of Service</Link>
            </p>
          </div>

          {/* Need Help */}
          <div className="mt-8">
            <p className="text-sm text-slate-600 mb-4">Need help choosing a plan?</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                <div className="w-full h-full bg-slate-300 flex items-center justify-center text-slate-500">
                  <Phone className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="font-bold text-sm">Talk to Sales</p>
                <p className="text-xs text-slate-500">+91 800 TENDER-HQ</p>
              </div>
            </div>
          </div>
        </div>
      </main>


    </div>
  );
}
