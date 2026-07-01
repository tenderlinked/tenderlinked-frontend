"use client";

import React from "react";
import Link from "next/link";
import { PLANS } from "@/config/pricing";

export default function PricingPage() {
  return (
    <div className="bg-gray-50 min-h-screen font-sans flex flex-col">
      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="bg-white pt-20 pb-16 text-center px-4 md:px-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-base text-gray-500 font-medium tracking-widest uppercase mb-4">
              Simple, Transparent Pricing for Government Success
            </h1>
            <p className="text-base text-gray-500 mb-12">
              Gain a competitive edge with institutional-grade tender
              intelligence. From individual contractors to global enterprises, we
              have a plan designed to help you win more government business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1280px] mx-auto mt-12 text-left">
            <div className="flex flex-col items-start gap-4 p-6">
              <div className="bg-[#2563EB] text-white p-3 rounded-xl shadow-sm">
                <span className="material-symbols-outlined">explore</span>
              </div>
              <h3 className="font-bold text-[18px]">Unlimited Coverage</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Access 500k+ active Indian government tenders across all states
                and departments.
              </p>
            </div>
            <div className="flex flex-col items-start gap-4 p-6">
              <div className="bg-[#2563EB] text-white p-3 rounded-xl shadow-sm">
                <span className="material-symbols-outlined">psychology</span>
              </div>
              <h3 className="font-bold text-[18px]">Intelligent Matching</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Our AI engine matches your business profile to relevant
                opportunities automatically.
              </p>
            </div>
            <div className="flex flex-col items-start gap-4 p-6">
              <div className="bg-[#2563EB] text-white p-3 rounded-xl shadow-sm">
                <span className="material-symbols-outlined">notifications_active</span>
              </div>
              <h3 className="font-bold text-[18px]">Real-time Intelligence</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Get instant alerts on new tenders, corrigendum, and award results.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20 bg-white px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="font-bold text-[24px] uppercase tracking-widest text-[#2563EB] mb-2">
              Choose Your Plan
            </h2>
            <p className="text-base text-gray-500 mb-8">
              Guaranteed Value-for-Money Plans
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <span className="flex items-center gap-2 bg-gray-100 text-[#2563EB] px-4 py-2 rounded-lg font-medium text-sm">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                No Keyword Restriction
              </span>
              <span className="flex items-center gap-2 bg-gray-100 text-[#2563EB] px-4 py-2 rounded-lg font-medium text-sm">
                <span className="material-symbols-outlined text-[18px]">schedule</span>
                3-days Free Trial
              </span>
              <span className="flex items-center gap-2 bg-gray-100 text-[#2563EB] px-4 py-2 rounded-lg font-medium text-sm">
                <span className="material-symbols-outlined text-[18px]">credit_card_off</span>
                No Credit Card Required
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1280px] mx-auto items-end">
            {Object.values(PLANS).map((plan) => (
              <div 
                key={plan.id} 
                className={`bg-white p-8 rounded-2xl ${
                  plan.recommended 
                    ? "border-2 border-[#2563EB] shadow-lg relative transform md:-translate-y-4" 
                    : "border border-gray-200 shadow-sm"
                }`}
              >
                {plan.recommended && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#2563EB] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                <div className="text-xs font-bold text-[#2563EB] tracking-widest uppercase mb-4">
                  {plan.name}
                </div>
                <h3 className="font-bold text-[20px] mb-2">{plan.title}</h3>
                <p className="text-sm text-gray-500 mb-6 h-16">
                  {plan.description}
                </p>
                <div className="text-[32px] font-bold text-gray-900 mb-8">
                  ₹{plan.price.toLocaleString()} <span className="text-sm font-normal text-gray-500">/{plan.duration}</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className={`flex items-center gap-3 text-sm ${plan.recommended ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                      <span className="material-symbols-outlined text-[16px] text-[#2563EB]">check</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href={`/checkout?plan=${plan.id}`} className={`block text-center w-full py-3 rounded-xl font-medium transition-colors ${
                  plan.recommended 
                    ? 'bg-[#2563EB] text-white hover:bg-blue-700 shadow-md' 
                    : 'border border-gray-200 text-[#2563EB] hover:bg-gray-100'
                }`}>
                  {plan.ctaText}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Detailed Feature Comparison */}
        <section className="py-20 bg-white px-4 md:px-8 border-y border-gray-200">
          <div className="max-w-[1000px] mx-auto">
            <h2 className="text-center font-bold text-[24px] mb-12 text-gray-900">
              Detailed Feature Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="p-4 font-bold text-sm text-gray-900">Features</th>
                    <th className="p-4 font-bold text-sm text-gray-900 text-center">Basic</th>
                    <th className="p-4 font-bold text-sm text-[#2563EB] text-center">Professional</th>
                    <th className="p-4 font-bold text-sm text-gray-900 text-center">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 hover:bg-white transition-colors">
                    <td className="p-4 text-sm text-gray-500">Tender Notifications</td>
                    <td className="p-4 text-sm text-gray-500 text-center">Daily</td>
                    <td className="p-4 text-sm font-medium text-gray-900 text-center">Real-time</td>
                    <td className="p-4 text-sm text-gray-500 text-center">Real-time</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-white transition-colors">
                    <td className="p-4 text-sm text-gray-500">Keywords Search</td>
                    <td className="p-4 text-sm text-[#2563EB] text-center">Unlimited</td>
                    <td className="p-4 text-sm text-[#2563EB] text-center">Unlimited</td>
                    <td className="p-4 text-sm text-[#2563EB] text-center">Unlimited</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-white transition-colors">
                    <td className="p-4 text-sm text-gray-500">AI Matchmaking</td>
                    <td className="p-4 text-sm text-gray-500 text-center">—</td>
                    <td className="p-4 text-sm text-gray-500 text-center">—</td>
                    <td className="p-4 text-sm text-[#2563EB] text-center">
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-white transition-colors">
                    <td className="p-4 text-sm text-gray-500">Historical Data Archive</td>
                    <td className="p-4 text-sm text-gray-500 text-center">1 Year</td>
                    <td className="p-4 text-sm text-gray-500 text-center">5 Years</td>
                    <td className="p-4 text-sm text-gray-500 text-center">Full History</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-white transition-colors">
                    <td className="p-4 text-sm text-gray-500">Team Collaboration</td>
                    <td className="p-4 text-sm text-gray-500 text-center">None</td>
                    <td className="p-4 text-sm text-gray-500 text-center">Collaborative</td>
                    <td className="p-4 text-sm text-gray-500 text-center">Advanced Workflow</td>
                  </tr>
                  <tr className="hover:bg-white transition-colors">
                    <td className="p-4 text-sm text-gray-500">API Access</td>
                    <td className="p-4 text-sm text-gray-500 text-center">—</td>
                    <td className="p-4 text-sm text-gray-500 text-center">Read-Only</td>
                    <td className="p-4 text-sm text-gray-500 text-center">Full Read/Write</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-20 bg-white px-4 md:px-8">
          <div className="max-w-[1000px] mx-auto">
            <h2 className="text-center font-bold text-[24px] mb-12 text-gray-900">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl">
                <h4 className="font-medium text-[15px] mb-3 text-gray-900">Where does the tender data come from?</h4>
                <p className="text-sm text-gray-500 leading-relaxed">
                  We aggregate data directly from over 4,500 official government portals, regional councils, and international development banks daily to ensure 100% accuracy and coverage.
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl">
                <h4 className="font-medium text-[15px] mb-3 text-gray-900">Can I cancel my subscription anytime?</h4>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Yes, TenderLinked is a month-to-month service with no long-term contracts. You can cancel or change your plan through your account dashboard at any time.
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl">
                <h4 className="font-medium text-[15px] mb-3 text-gray-900">Is there a limit on keywords for alerts?</h4>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Unlike competitors, we offer 'Guaranteed No Keyword Restriction' across all plans. You can track as many product codes or niches as your business requires.
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl">
                <h4 className="font-medium text-[15px] mb-3 text-gray-900">Do you offer onboarding assistance?</h4>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Professional and Enterprise users receive a 1-on-1 walkthrough to set up advanced filters and team workflows to maximize their win rate.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 md:px-8">
          <div className="max-w-[1280px] mx-auto bg-[#2563EB] text-white p-16 rounded-2xl text-center shadow-lg">
            <h2 className="font-bold text-[28px] mb-4">
              Ready to start winning more tenders?
            </h2>
            <p className="text-[16px] opacity-90 mb-10 max-w-2xl mx-auto">
              Join over 15,000 businesses using TenderLinked to scale their government revenue. Start your 3-day free trial today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register" className="inline-block bg-white text-[#2563EB] px-8 py-3 rounded-lg font-bold hover:bg-white transition-colors shadow-md">
                Start My Free Trial
              </Link>
              <Link href="/auth/register" className="inline-block bg-transparent border border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors">
                Speak to an Expert
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
