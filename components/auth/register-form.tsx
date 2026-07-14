"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MultiSelect, OptionType } from "@/components/ui/multi-select";
import { useLoading } from "@/contexts/LoadingContext";
import { registerSchema } from "@/lib/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Lock, Mail, UserRound, Check, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import SocialLogin from "./social-login";

const ALL_INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam",
  "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "All India"
].map(state => ({ label: state, value: state }));

const RegisterForm = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { loading, setLoading } = useLoading();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isEmailAvailable, setIsEmailAvailable] = useState<boolean | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isPhoneAvailable, setIsPhoneAvailable] = useState<boolean | null>(null);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [successData, setSuccessData] = useState<{
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    tenantId: string;
  } | null>(null);

  const [otp, setOtp] = useState("");
  const [phoneOnly, setPhoneOnly] = useState("");
  const [phoneExists, setPhoneExists] = useState(false);
  const [pendingValues, setPendingValues] = useState<z.infer<typeof registerSchema> | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const [step, setStep] = useState(0);
  const [preferencesForm, setPreferencesForm] = useState<{
    keywords: string[];
    states: string[];
    valueRange: string[];
    website: string;
  }>({
    keywords: [],
    states: [],
    valueRange: [],
    website: "",
  });

  const [aggregateFilters, setAggregateFilters] = useState<{
    keywords: OptionType[];
    states: OptionType[];
    tenderValues: OptionType[];
  }>({ keywords: [], states: [], tenderValues: [] });

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    fetch(`${apiUrl}/api/tenders/filters/aggregate`)
      .then(res => res.json())
      .then(data => {
        if (data.keywords) {
          setAggregateFilters({
            keywords: data.keywords.map((k: any) => ({ label: k.name, value: k.name, count: k.count })),
            states: data.states.map((s: any) => ({ label: s.name, value: s.name, count: s.count })),
            tenderValues: data.tenderValues.map((v: any) => ({ label: v.name, value: v.name, count: v.count }))
          });
        }
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      firstName: "",
      lastName: "",
      phone: "",
      companyName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const email = form.watch("email");
  const phone = form.watch("phone");
  const username = form.watch("username");

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setIsEmailAvailable(null);
      return;
    }

    setIsCheckingEmail(true);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (res.ok) {
          setIsEmailAvailable(data.available);
        } else {
          setIsEmailAvailable(null);
        }
      } catch (error) {
        setIsEmailAvailable(null);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [email]);

  useEffect(() => {
    if (!username || username.length < 2) {
      setIsUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        if (res.ok) {
          setIsUsernameAvailable(data.available);
        } else {
          setIsUsernameAvailable(null);
        }
      } catch (error) {
        setIsUsernameAvailable(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username]);

  useEffect(() => {
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setIsPhoneAvailable(null);
      return;
    }

    setIsCheckingPhone(true);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-phone?phone=${encodeURIComponent(phone)}`);
        const data = await res.json();
        if (res.ok) {
          setIsPhoneAvailable(data.available);
        } else {
          setIsPhoneAvailable(null);
        }
      } catch (error) {
        setIsPhoneAvailable(null);
      } finally {
        setIsCheckingPhone(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [phone]);

  const handleSendOtpFirst = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOnly || phoneOnly.replace(/\D/g, '').length < 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    setIsSubmitting(true);
    setPhoneExists(false);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      // 1. Check if phone exists
      const checkRes = await fetch(`/api/auth/check-phone?phone=${encodeURIComponent(phoneOnly)}`);
      const checkData = await checkRes.json();
      if (checkData.available === false) {
         setPhoneExists(true);
         setLoading(false);
         setIsSubmitting(false);
         return;
      }

      // 2. Send OTP if it doesn't exist
      const response = await fetch(`${apiUrl}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneOnly }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to send OTP");
      toast.success("OTP sent to your phone number!");
      
      // Update the main form's phone value
      form.setValue("phone", phoneOnly);
      setStep(1);
      setResendTimer(60);
    } catch (error: any) {
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneOnly }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to resend OTP");
      toast.success("OTP resent successfully!");
      setResendTimer(60);
    } catch (error: any) {
      toast.error(error.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpFirst = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    setLoading(true);
    setIsSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const verifyRes = await fetch(`${apiUrl}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneOnly, otp }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.message || "Invalid OTP");
      toast.success("Phone number verified!");
      setStep(2);
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleRegisterFormSubmit = async (
    values: z.infer<typeof registerSchema>
  ) => {
    setLoading(true);
    setIsSubmitting(true);

    try {
      // Direct registration since OTP is already verified in step 1
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.username,
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
          companyName: values.companyName,
          email: values.email,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      toast.success("Account created successfully!");
      setSuccessData({
        username: values.username || "",
        email: values.email || "",
        firstName: values.firstName || "",
        lastName: values.lastName || "",
        tenantId: data.tenantId,
      });
      setStep(3);
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/tenants/setup-preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: successData?.tenantId,
          keywords: preferencesForm.keywords,
          preferredStates: preferencesForm.states,
          tenderValueRange: preferencesForm.valueRange.join(', '),
          companyWebsite: preferencesForm.website
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }
      
      toast.success('Alert preferences saved!');
    } catch (error) {
      toast.error('Failed to save preferences, but you can configure them later.');
    } finally {
      setLoading(false);
      setStep(4); // Proceed to success screen regardless
    }
  };

  if (step === 4 && successData) {
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
    const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "https:" : "http:";
    const loginUrl = `${protocol}//${rootDomain}/auth/login`;

    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
          <Check className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Account Created!</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Your workspace has been set up successfully. You can now log in to your dedicated portal.
        </p>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 w-full text-left space-y-4 border border-slate-200 dark:border-slate-700">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Name</p>
            <p className="font-semibold">{successData.firstName} {successData.lastName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Email</p>
            <p className="font-semibold">{successData.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Username</p>
            <p className="font-semibold">{successData.username}</p>
          </div>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Login Address</p>
            <a href={loginUrl} className="text-primary font-medium hover:underline break-all">
              {loginUrl}
            </a>
          </div>
        </div>

        <Button
          onClick={() => window.location.href = loginUrl}
          className="w-full rounded-lg mt-4 h-[52px] text-sm"
        >
          Go to Login Page
        </Button>
      </div>
    );
  }

  if (step === 3 && successData) {
    return (
      <div className="flex flex-col space-y-6 py-4 animate-in fade-in zoom-in duration-300">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Configure Your Tender Alerts</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            Provide your keywords, preferred states, and tender value to receive curated tender alerts via email.
          </p>
        </div>

        <form onSubmit={handlePreferencesSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Keywords</label>
            <MultiSelect
              options={aggregateFilters.keywords}
              selected={preferencesForm.keywords}
              onChange={(selected) => setPreferencesForm({ ...preferencesForm, keywords: selected })}
              placeholder="e.g. Road Construction, IT Consultancy"
              className="bg-neutral-100 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Preferred States</label>
            <MultiSelect
              options={ALL_INDIAN_STATES}
              selected={preferencesForm.states}
              onChange={(selected) => setPreferencesForm({ ...preferencesForm, states: selected })}
              placeholder="e.g. Tamil Nadu, Karnataka"
              className="bg-neutral-100 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Tender Value Range</label>
            <MultiSelect
              options={aggregateFilters.tenderValues}
              selected={preferencesForm.valueRange}
              onChange={(selected) => setPreferencesForm({ ...preferencesForm, valueRange: selected })}
              placeholder="e.g. More than 10 Lakhs or 10 - 50 Lakhs"
              className="bg-neutral-100 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Your company website (Optional)</label>
            <Input 
              placeholder="e.g. www.example.com" 
              value={preferencesForm.website}
              onChange={e => setPreferencesForm({...preferencesForm, website: e.target.value})}
              className="h-12 bg-neutral-100 dark:bg-slate-800"
            />
          </div>
          <Button type="submit" className="w-full h-[52px] bg-amber-500 hover:bg-amber-600 text-white font-semibold" disabled={loading}>
            {loading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
            Send & Continue
          </Button>
        </form>
      </div>
    );
  }

  if (step === 0) {
    if (phoneExists) {
      return (
        <div className="flex flex-col space-y-6 py-4 animate-in fade-in zoom-in duration-300">
           <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-center">
              <h3 className="font-bold text-lg mb-2">Number Already Registered</h3>
              <p className="text-sm mb-6">The mobile number <b>{phoneOnly}</b> is already registered with an account.</p>
              <div className="flex flex-col gap-3">
                 <Link href="/auth/login" className="w-full">
                   <Button className="w-full h-[52px] bg-[#244376] hover:bg-[#1b345c] text-white">Go to Login</Button>
                 </Link>
                 <Button variant="outline" className="w-full h-[52px]" onClick={() => { setPhoneExists(false); setPhoneOnly(''); }}>
                   Change Mobile Number
                 </Button>
              </div>
           </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col space-y-6 py-4 animate-in fade-in zoom-in duration-300">
        <form onSubmit={handleSendOtpFirst} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Mobile Number *</label>
            <Input
              type="tel"
              placeholder="Enter 10-digit mobile number"
              value={phoneOnly}
              onChange={(e) => setPhoneOnly(e.target.value)}
              className="h-12 border-slate-300"
            />
          </div>
          <Button
            type="submit"
            className="w-full rounded-lg mt-4 h-[52px] font-semibold bg-[#244376] hover:bg-[#1b345c]"
            disabled={loading || phoneOnly.length < 10}
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

        {/* Divider */}
        <div className="mt-8 relative text-center before:absolute before:w-full before:h-px before:bg-neutral-300 dark:before:bg-slate-600 before:top-1/2 before:left-0">
          <span className="relative z-10 px-4 bg-white dark:bg-slate-900 text-base">
            Or sign up with
          </span>
        </div>

        {/* Social Login */}
        <div className="mt-2">
          <SocialLogin />
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="flex flex-col space-y-6 py-4 animate-in fade-in zoom-in duration-300">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Verify Phone Number</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            We've sent a 6-digit OTP to {phoneOnly}. Please enter it below.
          </p>
        </div>
        <form onSubmit={handleVerifyOtpFirst} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              className="text-center tracking-widest text-lg font-semibold h-12"
            />
          </div>
          <Button
            type="submit"
            className="w-full rounded-lg mt-4 h-[52px] font-semibold bg-[#244376] hover:bg-[#1b345c]"
            disabled={loading || otp.length !== 6}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin h-4.5 w-4.5 mr-2" />
                Verifying...
              </>
            ) : (
              "Verify OTP"
            )}
          </Button>
          <div className="flex flex-col space-y-2 mt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={handleResendOtp}
              disabled={loading || resendTimer > 0}
            >
              {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full h-11"
              onClick={() => { setStep(0); setResendTimer(0); }}
              disabled={loading}
            >
              Change Phone Number
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-md text-sm border border-green-200 flex items-center">
        <Check className="w-4 h-4 mr-2" /> Phone number verified. Complete your profile.
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleRegisterFormSubmit)}
          className="space-y-5"
        >
          {/* Username Field */}
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <UserRound className="absolute start-5 top-1/2 transform -translate-y-1/2 text-xl text-neutral-700 dark:text-neutral-200 w-5 h-5" />
                    <Input
                      {...field}
                      type="text"
                      placeholder="Username (e.g. johndoe123)"
                      className={`ps-13 pe-12 h-14 rounded-xl bg-neutral-100 dark:bg-slate-800 border ${
                        isUsernameAvailable === true
                          ? "border-green-500 focus-visible:border-green-500"
                          : isUsernameAvailable === false
                          ? "border-red-500 focus-visible:border-red-500"
                          : "border-neutral-300 dark:border-slate-700 focus-visible:border-primary"
                      } focus:border-primary dark:focus:border-primary !shadow-none !ring-0`}
                      disabled={loading}
                    />
                    <div className="absolute end-4 top-1/2 transform -translate-y-1/2 flex items-center">
                      {isCheckingUsername && (
                        <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
                      )}
                      {!isCheckingUsername && isUsernameAvailable === true && (
                        <Check className="w-5 h-5 text-green-500" />
                      )}
                      {!isCheckingUsername && isUsernameAvailable === false && (
                        <X className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>
                </FormControl>
                {!isCheckingUsername && isUsernameAvailable === true && (
                  <p className="text-sm text-green-600 mt-1 font-medium">Username is available</p>
                )}
                {!isCheckingUsername && isUsernameAvailable === false && (
                  <p className="text-sm text-red-600 mt-1 font-medium">Username is unavailable</p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            {/* First Name Field */}
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <div className="relative">
                      <UserRound className="absolute start-5 top-1/2 transform -translate-y-1/2 text-xl text-neutral-700 dark:text-neutral-200 w-5 h-5" />
                      <Input
                        {...field}
                        type="text"
                        placeholder="First Name"
                        className="ps-13 pe-4 h-14 rounded-xl bg-neutral-100 dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 focus:border-primary dark:focus:border-primary focus-visible:border-primary !shadow-none !ring-0"
                        disabled={loading}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Last Name Field */}
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type="text"
                        placeholder="Last Name"
                        className="px-4 h-14 rounded-xl bg-neutral-100 dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 focus:border-primary dark:focus:border-primary focus-visible:border-primary !shadow-none !ring-0"
                        disabled={loading}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute start-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-700 dark:text-neutral-200" />
                    <Input
                      {...field}
                      type="email"
                      placeholder="Email"
                      className={`ps-13 pe-12 h-14 rounded-xl bg-neutral-100 dark:bg-slate-800 border ${
                        isEmailAvailable === true
                          ? "border-green-500 focus-visible:border-green-500"
                          : isEmailAvailable === false
                          ? "border-red-500 focus-visible:border-red-500"
                          : "border-neutral-300 dark:border-slate-700 focus-visible:border-primary"
                      } focus:border-primary dark:focus:border-primary !shadow-none !ring-0`}
                      disabled={loading}
                    />
                    <div className="absolute end-4 top-1/2 transform -translate-y-1/2 flex items-center">
                      {isCheckingEmail && (
                        <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
                      )}
                      {!isCheckingEmail && isEmailAvailable === true && (
                        <Check className="w-5 h-5 text-green-500" />
                      )}
                      {!isCheckingEmail && isEmailAvailable === false && (
                        <X className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>
                </FormControl>
                {!isCheckingEmail && isEmailAvailable === true && (
                  <p className="text-sm text-green-600 mt-1 font-medium">Email is available</p>
                )}
                {!isCheckingEmail && isEmailAvailable === false && (
                  <p className="text-sm text-red-600 mt-1 font-medium">Email is already taken</p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            {/* Phone Field */}
            {/* Phone Field */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type="text"
                        placeholder="Phone Number"
                        disabled
                        className="px-4 h-14 rounded-xl bg-slate-100 text-slate-500 border border-neutral-300 dark:border-slate-700 !shadow-none !ring-0 cursor-not-allowed"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company Field */}
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        value={field.value || ""}
                        type="text"
                        placeholder="Company Name (Optional)"
                        className="px-4 h-14 rounded-xl bg-neutral-100 dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 focus:border-primary dark:focus:border-primary focus-visible:border-primary !shadow-none !ring-0"
                        disabled={loading}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Password Field */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute start-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-700 dark:text-neutral-200" />
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      className="ps-13 pe-12 h-14 rounded-xl bg-neutral-100 dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 focus:border-primary dark:focus:border-primary focus-visible:border-primary !shadow-none !ring-0"
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 !p-0 bg-transparent hover:bg-transparent text-muted-foreground h-[unset]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Confirm Password Field */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute start-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-700 dark:text-neutral-200" />
                    <Input
                      {...field}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      className="ps-13 pe-12 h-14 rounded-xl bg-neutral-100 dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 focus:border-primary dark:focus:border-primary focus-visible:border-primary !shadow-none !ring-0"
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 !p-0 bg-transparent hover:bg-transparent text-muted-foreground h-[unset]"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Remember Me and Forgot Password */}
          <FormField
            control={form.control}
            name="acceptTerms"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-2 flex justify-between items-center">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="createAccount"
                      className="border border-neutral-500 w-4.5 h-4.5 mt-1"
                    />
                  </FormControl>
                  <label htmlFor="createAccount" className="text-sm">
                    By creating an account means you agree to the{" "}
                    <Link
                      href="#"
                      className="text-primary font-semibold hover:underline"
                    >
                      Terms & Conditions
                    </Link>{" "}
                    and our{" "}
                    <Link
                      href="#"
                      className="text-primary font-semibold hover:underline"
                    >
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full rounded-lg mt-1 h-[52px] text-sm mt-2"
            disabled={loading}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin h-4.5 w-4.5 mr-2" />
                Loading...
              </>
            ) : (
              "Register"
            )}
          </Button>
        </form>
      </Form>

      {/* Divider */}
      <div className="mt-8 relative text-center before:absolute before:w-full before:h-px before:bg-neutral-300 dark:before:bg-slate-600 before:top-1/2 before:left-0">
        <span className="relative z-10 px-4 bg-white dark:bg-slate-900 text-base">
          Or sign in with
        </span>
      </div>

      {/* Social Login */}
      <SocialLogin />

      {/* Signup Prompt */}
      <div className="mt-8 text-center text-sm">
        <p>
          Already have an account? {" "}
          <Link
            href="/auth/login"
            className="text-primary font-semibold hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </>
  );
};

export default RegisterForm;