import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const tabs = [
  "By Preferences",
  "By States",
  "By Cities",
  "By Authorities",
  "By Categories",
  "By Authority Groups",
  "By Procurement",
  "By Keywords",
  "All",
];

const mockData: Record<string, string[]> = {
  "By States": [
    "Karnataka Tenders",
    "Andhra Pradesh Tenders",
    "Andaman And Nicobar Islands Tenders",
    "Punjab Tenders",
    "Haryana Tenders",
    "Maharashtra Tenders",
    "Arunachal Pradesh Tenders",
    "Manipur Tenders",
    "West Bengal Tenders",
    "Tripura Tenders",
    "Odisha Tenders",
    "Madhya Pradesh Tenders",
    "Daman And Diu Tenders",
    "Assam Tenders",
    "Delhi Tenders",
    "Ladakh Tenders",
    "Jharkhand Tenders",
    "Mizoram Tenders",
    "Telangana Tenders",
    "Chandigarh Tenders",
    "Goa Tenders",
    "Gujarat Tenders",
  ],
  "By Cities": [
    "Mumbai Tenders",
    "Delhi Tenders",
    "Bangalore Tenders",
    "Hyderabad Tenders",
    "Ahmedabad Tenders",
    "Chennai Tenders",
    "Kolkata Tenders",
    "Surat Tenders",
    "Pune Tenders",
    "Jaipur Tenders",
  ],
  "By Authorities": [
    "NHAI Tenders",
    "Railways Tenders",
    "Defence Tenders",
    "CPWD Tenders",
    "Smart City Tenders",
    "ONGC Tenders",
    "NTPC Tenders",
    "BHEL Tenders",
  ],
  "By Categories": [
    "Construction Tenders",
    "IT & Software Tenders",
    "Medical Equipment Tenders",
    "Electrical Tenders",
    "Manpower Tenders",
    "Housekeeping Tenders",
    "Catering Tenders",
  ],
  "By Keywords": [
    "Solar Tenders",
    "CCTV Tenders",
    "Laptop Tenders",
    "Drone Tenders",
    "Ambulance Tenders",
    "Security Services Tenders",
  ],
};

const IndianTendersMegaMenu = () => {
  const [activeTab, setActiveTab] = useState("By States");

  const currentData = mockData[activeTab] || ["Coming Soon..."];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute top-[72px] -left-8 w-[800px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl overflow-hidden flex"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Left Sidebar Tabs */}
      <div className="w-[240px] bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 py-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onMouseEnter={() => setActiveTab(tab)}
            className={`w-full text-left px-6 py-2.5 text-sm transition-colors ${
              activeTab === tab
                ? "bg-white dark:bg-gray-900 text-[#2563EB] font-bold border-l-4 border-[#2563EB]"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium border-l-4 border-transparent"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Right Content Area */}
      <div className="flex-1 p-6 bg-white dark:bg-gray-900 max-h-[400px] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-sm font-bold text-[#2563EB]">View all {activeTab.replace("By ", "")}</h4>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {currentData.map((item) => (
            <Link
              key={item}
              href="#"
              className="text-[13px] text-gray-600 dark:text-gray-300 hover:text-[#2563EB] transition-colors"
            >
              {item}
            </Link>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default IndianTendersMegaMenu;
