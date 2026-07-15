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

const features = [
  { icon: BellRing, title: "Daily Tender Alert Services" },
  { icon: LineChart, title: "Tender Analytics & Insights" },
  { icon: FileSpreadsheet, title: "Data Export in Excel Format" },
  { icon: Trophy, title: "Contract Awards & Results" },
  { icon: FolderOpen, title: "Project Information" },
  { icon: Briefcase, title: "Bid Consultancy Services" },
  { icon: BookOpen, title: "Knowledge Centre" },
  { icon: Scale, title: "Dispute & Complaint Redressal" },
];

const Register = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-900 font-sans">
      {/* Top Navbar */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center p-4 md:p-8 pt-[72px]">
        <div className="max-w-[1000px] w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row min-h-[600px]">
          
          {/* Left Panel (Dark Blue) */}
          <div className="lg:w-[45%] bg-[#244376] text-white p-10 flex flex-col justify-between relative overflow-hidden hidden md:flex">
            {/* Background Pattern overlay (optional) */}
            <div className="absolute inset-0 opacity-10 bg-[url('/assets/images/auth/pattern.png')] bg-cover mix-blend-overlay"></div>
            
            <div className="relative z-10">
              <h1 className="text-3xl font-bold leading-tight mb-2">
                Your Complete Tender<br/>Intelligence Platform
              </h1>
              <p className="text-blue-200 text-sm mb-8 font-medium">
                Trusted by 10,000+ businesses across India
              </p>

              <div className="space-y-4">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-center space-x-4 group cursor-default">
                    <div className="w-8 h-8 rounded bg-[#325690] flex items-center justify-center group-hover:bg-amber-500 transition-colors shrink-0">
                      <feature.icon className="w-4 h-4 text-amber-400 group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-sm text-slate-100 group-hover:text-white font-medium">{feature.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Stats */}
            <div className="relative z-10 grid grid-cols-3 gap-2 mt-12 pt-6 border-t border-blue-800/50">
              <div>
                <p className="text-xl font-bold text-amber-400">10K+</p>
                <p className="text-[10px] text-blue-200 uppercase tracking-wider mt-1 font-semibold">Active Users</p>
              </div>
              <div>
                <p className="text-xl font-bold text-amber-400">50K+</p>
                <p className="text-[10px] text-blue-200 uppercase tracking-wider mt-1 font-semibold">Daily Tenders</p>
              </div>
              <div>
                <p className="text-xl font-bold text-amber-400">99%</p>
                <p className="text-[10px] text-blue-200 uppercase tracking-wider mt-1 font-semibold">Accuracy</p>
              </div>
            </div>
          </div>

          {/* Right Panel (White - Form) */}
          <div className="lg:w-[55%] p-8 md:p-10 flex flex-col relative bg-white dark:bg-slate-900">
            <div className="flex-grow flex flex-col max-w-md w-full mx-auto">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">Sign Up</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Choose your preferred sign-up method
              </p>
              
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
