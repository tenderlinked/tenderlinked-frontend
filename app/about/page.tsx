"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  Cpu,
  ShieldCheck,
  Zap,
  TrendingUp,
  Users,
  Target,
  ArrowRight,
  Globe2,
  CheckCircle2,
} from "lucide-react";

export default function AboutPage() {
  const stats = [
    { label: "Tender Portals & Sources", value: "164+", description: "GeM, CPWD, Railways & State Portals" },
    { label: "Daily Live Tenders", value: "2.5K+", description: "Updated continuously 24/7" },
    { label: "Cumulative Tender Value", value: "₹48.9B+", description: "Across 6+ States and Union Territories" },
    { label: "Matching Accuracy", value: "99.8%", description: "AI-driven industry classification" },
  ];

  const features = [
    {
      icon: <Zap className="w-6 h-6 text-blue-600" />,
      title: "Real-Time Aggregation",
      description:
        "We continuously monitor and parse 164+ government sources, so you discover relevant opportunities before your competitors.",
    },
    {
      icon: <Cpu className="w-6 h-6 text-blue-600" />,
      title: "AI-Powered Matching",
      description:
        "Our smart recommendation engine analyzes your company's turnover, past bidding history, and capacity to deliver exact-fit tenders.",
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-blue-600" />,
      title: "Market & Competitor Insights",
      description:
        "Gain deep visibility into historical bid prices, winning trends, and buyer tender patterns to optimize your bidding strategy.",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-blue-600" />,
      title: "Verified & Filtered Data",
      description:
        "Eliminate noise with our multi-tier data cleaning algorithms that verify deadlines, EMD requirements, and tender documents.",
    },
  ];

  const values = [
    {
      title: "Transparency First",
      desc: "We ensure equal, unbiased access to public procurement data for MSMEs, contractors, and corporate enterprises alike.",
    },
    {
      title: "Precision Engineering",
      desc: "Our automated scraper framework runs with 99.9% uptime, keeping data accurate and document downloads seamless.",
    },
    {
      title: "Customer Centricity",
      desc: "We build features based on real feedback from Indian bidders, ensuring every tool solves actual tendering bottlenecks.",
    },
  ];

  return (
    <div className="bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 min-h-screen font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28 border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-b from-white via-slate-50 to-slate-100/50 dark:from-[#0F172A] dark:via-[#0B0F17] dark:to-[#0B0F17]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm"
          >
            <Building2 className="w-4 h-4" /> About Tenderlinked
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl lg:text-6xl font-bold text-slate-800 dark:text-slate-100 tracking-tight max-w-4xl mx-auto leading-tight md:leading-tight"
          >
            Simplifying Indian Government Tenders with <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Intelligent Data</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-base md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed"
          >
            Tenderlinked is modern procurement intelligence built to help contractors, suppliers, and businesses effortlessly find, track, and win government contracts across India.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/tenders"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/25 active:scale-95"
            >
              Explore Live Tenders <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all shadow-sm active:scale-95"
            >
              View Pricing
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-16 bg-white dark:bg-[#0E1420] border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-center hover:border-blue-200 dark:hover:border-blue-900/50 transition-all shadow-sm"
              >
                <div className="text-3xl md:text-4xl font-black text-blue-600 dark:text-blue-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {stat.label}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {stat.description}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Mission & Vision */}
      <section className="py-20 bg-slate-50 dark:bg-[#0B0F17]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
                <Target className="w-3.5 h-3.5" /> Our Mission
              </div>
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
                Leveling the Playing Field for Government Bidders
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg leading-relaxed">
                Finding government tenders in India used to mean navigating dozens of scattered, slow, and hard-to-search portal sites. Important deadlines were often missed, and key tender specifications remained hidden under nested PDFs.
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg leading-relaxed">
                We built Tenderlinked to centralize procurement data, automate document extraction, and provide intelligent alerts—empowering vendors to spend less time searching and more time crafting winning bids.
              </p>
              <ul className="space-y-3 pt-2">
                {[
                  "Continuous 24/7 Scraping across GeM, State PWDs, & Railways",
                  "Smart Keyword & Financial Threshold Filters",
                  "Automated Tender Summary & Document Parsing",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative p-8 md:p-10 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl overflow-hidden"
            >
              <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <Globe2 className="w-12 h-12 text-blue-200 mb-6" />
              <h3 className="text-2xl font-bold mb-4 !text-white">Our Vision for Procurement</h3>
              <p className="!text-blue-100 text-base leading-relaxed mb-6">
                We envision an ecosystem where any eligible business—regardless of location or company size—can seamlessly discover government opportunities and compete with full transparency.
              </p>
              <div className="pt-6 border-t border-white/20 grid grid-cols-2 gap-4 text-center">
                <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                  <div className="text-2xl font-bold !text-white">100%</div>
                  <div className="text-xs !text-blue-100 mt-1">Direct Source Accuracy</div>
                </div>
                <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                  <div className="text-2xl font-bold !text-white">Real-Time</div>
                  <div className="text-xs !text-blue-100 mt-1">Notification Engine</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white dark:bg-[#0E1420] border-t border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-slate-100">
              Built Specifically for Indian Tender Bidders
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg">
              Engineered from the ground up to solve the specific complexity of Indian public sector procurement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-slate-100">{feature.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-slate-50 dark:bg-[#0B0F17]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Users className="w-3.5 h-3.5" /> Our Guiding Principles
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">What Drives Tenderlinked</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((val, idx) => (
              <motion.div
                key={val.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="p-8 rounded-2xl bg-white dark:bg-[#0E1420] border border-slate-200/80 dark:border-slate-800 shadow-sm"
              >
                <div className="text-blue-600 font-black text-xl mb-3">0{idx + 1}.</div>
                <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100">{val.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  {val.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 !text-white text-center">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <h2 className="text-2xl md:text-4xl font-extrabold mb-4 !text-white">
            Ready to Find Your Next High-Value Tender?
          </h2>
          <p className="!text-blue-100 max-w-2xl mx-auto text-base md:text-lg mb-8">
            Join thousands of vendors using Tenderlinked to streamline their government contract discovery today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="px-8 py-3.5 rounded-xl font-bold bg-white !text-blue-600 hover:bg-blue-50 transition-all shadow-lg shadow-black/10 active:scale-95"
            >
              Get Started for Free
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-3.5 rounded-xl font-bold bg-blue-700/60 hover:bg-blue-700 !text-white border border-white/20 transition-all active:scale-95"
            >
              Explore Plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
