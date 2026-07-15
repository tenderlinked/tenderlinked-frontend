"use client";

import { useLoading } from "@/contexts/LoadingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const CompleteProfileForm = () => {
  const { data: session, update } = useSession();
  const router = useRouter();
  const { loading } = useLoading();
  const [step, setStep] = useState(0); // 0 = Phone, 1 = OTP
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // If user already has a phone number in session, redirect to dashboard
  useEffect(() => {
    // @ts-ignore
    if (session?.user?.phoneNumber) {
      router.push("/dashboard");
    }
  }, [session, router]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedPhone = phone.replace(/\D/g, '');
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      if (!response.ok) {
        throw new Error("Failed to send OTP");
      }

      toast.success(`OTP sent to ${formattedPhone}`);
      setStep(1);
    } catch (error) {
      toast.error("Error sending OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      toast.error("Please enter a valid OTP");
      return;
    }
    
    if (!session?.user?.id) {
      toast.error("Session expired, please log in again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedPhone = phone.replace(/\D/g, '');
      
      // 1. Verify OTP
      const verifyResponse = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedPhone, otp }),
      });

      if (!verifyResponse.ok) {
        throw new Error("Invalid OTP");
      }

      // 2. Patch Profile safely via Next.js API route to avoid CORS/auth issues
      const patchResponse = await fetch("/api/auth/update-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      if (!patchResponse.ok) {
         throw new Error("Failed to update profile");
      }

      toast.success("Mobile number verified successfully!");
      
      // 3. Update Session
      await update({ phoneNumber: formattedPhone });
      
      // 4. Redirect
      router.push("/dashboard");

    } catch (error: any) {
      toast.error(error.message || "Failed to verify OTP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 1) {
    return (
      <div className="flex flex-col space-y-6 py-4 animate-in fade-in zoom-in duration-300">
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Enter OTP *</label>
            <Input
              type="text"
              placeholder="Enter the OTP sent to your phone"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="h-12 border-slate-300"
              maxLength={6}
            />
            <p className="text-xs text-neutral-500 mt-2">
              OTP sent to {phone}. <button type="button" onClick={() => setStep(0)} className="text-primary hover:underline">Change Number</button>
            </p>
          </div>
          <Button
            type="submit"
            className="w-full rounded-lg mt-4 h-[52px] font-semibold bg-[#244376] hover:bg-[#1b345c]"
            disabled={loading || otp.length < 4 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin h-4.5 w-4.5 mr-2" />
                Verifying...
              </>
            ) : (
              "Verify & Continue"
            )}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 py-4 animate-in fade-in zoom-in duration-300">
      <form onSubmit={handleSendOtp} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Mobile Number *</label>
          <div className="relative">
            <div className="absolute start-4 top-1/2 transform -translate-y-1/2 flex items-center gap-1.5 select-none pointer-events-none">
              <span className="text-base leading-none">🇮🇳</span>
              <span className="text-slate-500 dark:text-neutral-400 text-sm font-semibold">
                +91
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 dark:text-neutral-500" />
            </div>
            <div className="absolute left-[84px] top-1/2 transform -translate-y-1/2 h-5 w-[1px] bg-neutral-300 dark:bg-slate-700 pointer-events-none" />
            <Input
              type="tel"
              placeholder="Enter 10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="ps-[96px] h-14 rounded-xl bg-neutral-100 dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 focus:border-primary dark:focus:border-primary focus-visible:border-primary !shadow-none !ring-0"
            />
          </div>
        </div>
        <Button
          type="submit"
          className="w-full rounded-lg mt-4 h-[52px] font-semibold bg-[#244376] hover:bg-[#1b345c]"
          disabled={loading || phone.length < 10 || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin h-4.5 w-4.5 mr-2" />
              Generating...
            </>
          ) : (
            "Generate OTP"
          )}
        </Button>
      </form>
    </div>
  );
};

export default CompleteProfileForm;
