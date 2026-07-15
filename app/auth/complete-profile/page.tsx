"use client";

import CompleteProfileForm from "@/components/auth/complete-profile-form";
import ThemeLogo from "@/components/shared/theme-logo";
import { AlertCircle, ShieldCheck, Smartphone } from "lucide-react";
import Link from "next/link";
import React from "react";
import Image from "next/image";
import LogoIcon from "@/public/assets/images/logo-icon.png";

const CompleteProfile = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-900 font-sans">
      {/* Top Navbar */}
      <header className="w-full bg-[#244376] text-white py-3 px-6 flex justify-between items-center shadow-md z-10 h-16">
        <div className="flex items-center space-x-2 text-white">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src={LogoIcon}
              alt="TenderLinked Logo"
              width={36}
              height={36}
              style={{ objectFit: "contain" }}
              priority
              className="brightness-0 invert"
            />
            <span className="text-xl font-bold tracking-tight text-white uppercase mt-1">
              TenderLinked
            </span>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">Sales : +91-777 804 8217</span>
          <Link href="/auth/login">
            <button className="bg-white text-[#244376] hover:bg-slate-100 px-5 py-2 rounded-md font-bold text-sm transition-colors">
              Login
            </button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-start justify-center p-4 md:p-8 pt-24 md:pt-28 pb-12">
        <div className="w-full max-w-4xl bg-white dark:bg-slate-950 rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Side - Information */}
          <div className="md:w-1/2 bg-[#244376] text-white p-10 flex flex-col justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-4">Almost There!</h2>
              <p className="text-blue-100 mb-8 leading-relaxed">
                To maintain the highest level of security and provide you with personalized tender alerts, we require all users to verify their mobile number.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500/20 p-3 rounded-xl shrink-0">
                    <ShieldCheck className="w-6 h-6 text-blue-200" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Enhanced Security</h4>
                    <p className="text-sm text-blue-200">Your phone number acts as an extra layer of protection for your account.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-blue-500/20 p-3 rounded-xl shrink-0">
                    <Smartphone className="w-6 h-6 text-blue-200" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Instant SMS Alerts</h4>
                    <p className="text-sm text-blue-200">Receive high-value tender matches directly on your mobile device instantly.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 flex gap-4 text-center border-t border-blue-400/30 pt-6">
              <div className="flex-1">
                <div className="text-2xl font-bold text-amber-400">10K+</div>
                <div className="text-xs text-blue-200 uppercase tracking-wide mt-1">Active Users</div>
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold text-amber-400">50K+</div>
                <div className="text-xs text-blue-200 uppercase tracking-wide mt-1">Daily Tenders</div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="md:w-1/2 p-10 flex flex-col justify-center bg-white dark:bg-slate-900 relative">
            <div className="max-w-sm w-full mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Complete Profile</h2>
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>Mobile number is mandatory for social sign-ins.</p>
                </div>
              </div>

              <CompleteProfileForm />

            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default CompleteProfile;
