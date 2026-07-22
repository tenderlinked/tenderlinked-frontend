"use client";

import RegisterForm from "@/components/auth/register-form";
import ThemeLogo from "@/components/shared/theme-logo";
import {
  BellRing,
  LineChart,
  FileSpreadsheet,
  Trophy,
  FolderOpen,
  Briefcase,
  BookOpen,
  Scale,
  Phone
} from "lucide-react";
import Link from "next/link";
import React from "react";
import Image from "next/image";
import LogoIcon from "@/public/assets/images/logo-icon.png";
import Header from "@/components/Header";

// Features array removed for a cleaner minimal layout

const Register = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-900 font-sans">
      {/* Top Navbar */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-grow flex items-start justify-center p-4 md:p-8 pt-24 md:pt-28 pb-12">
        <div className="max-w-[950px] w-full bg-white dark:bg-slate-800 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col lg:flex-row min-h-[520px]">
          
          {/* Left Panel (Premium Minimalist Theme) */}
          <div className="lg:w-[45%] bg-gradient-to-br from-[#0F172A] via-blue-900 to-primary text-white p-10 flex flex-col justify-between relative overflow-hidden hidden md:flex shadow-[inset_-10px_0_30px_rgba(0,0,0,0.2)]">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-10 bg-[url('/assets/images/auth/pattern.png')] bg-cover mix-blend-overlay"></div>
            
            {/* Decorative Ambient Glowing Orbs */}
            <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-500 rounded-full mix-blend-screen filter blur-[80px] opacity-40"></div>
            <div className="absolute top-1/2 -right-32 w-80 h-80 bg-teal-500 rounded-full mix-blend-screen filter blur-[80px] opacity-20"></div>

            <div className="relative z-10 flex flex-col flex-grow justify-center -mt-8">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 mb-8 shadow-xl">
                 <Trophy className="w-7 h-7 text-amber-400" />
              </div>
              
              <h1 className="text-[2.4rem] font-black leading-[1.1] mb-5 text-white tracking-tight">
                Unlock Tender<br/>Intelligence
              </h1>
              
              <p className="text-blue-100 text-[15px] leading-relaxed font-medium opacity-90 max-w-[90%]">
                Join 10,000+ businesses across India discovering opportunities, analyzing trends, and winning contracts seamlessly.
              </p>
            </div>

            {/* Bottom Minimal Stats */}
            <div className="relative z-10 flex items-center gap-8 mt-12 pt-8 border-t border-white/10">
              <div>
                <p className="text-2xl font-black text-amber-400 tracking-tight">10K+</p>
                <p className="text-[10px] text-blue-100 uppercase tracking-widest mt-1 font-bold opacity-80">Users</p>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div>
                <p className="text-2xl font-black text-amber-400 tracking-tight">50K+</p>
                <p className="text-[10px] text-blue-100 uppercase tracking-widest mt-1 font-bold opacity-80">Tenders</p>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div>
                <p className="text-2xl font-black text-amber-400 tracking-tight">99%</p>
                <p className="text-[10px] text-blue-100 uppercase tracking-widest mt-1 font-bold opacity-80">Accuracy</p>
              </div>
            </div>
          </div>

          {/* Right Panel (White - Form) */}
          <div className="lg:w-[55%] p-8 md:p-10 flex flex-col relative bg-white dark:bg-slate-900">
            <div className="flex-grow flex flex-col max-w-md w-full mx-auto">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Sign Up</h2>
              <div className="w-12 h-1 bg-[#2563EB] rounded-full mb-6"></div>
              
              <RegisterForm />
            </div>

            {/* Contact Support Link */}
            <div className="mt-8 text-center text-sm text-slate-500 font-medium">
              Need access? <Link href="#" className="text-amber-500 font-bold hover:underline">Contact Us</Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Register;
