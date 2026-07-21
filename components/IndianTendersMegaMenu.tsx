import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const tabs = [
  "By States",
  "By Cities",
  "By Authorities",
  "By Categories",
  "By Keywords",
];

const IndianTendersMegaMenu = () => {
  const [activeTab, setActiveTab] = useState("By States");
  const [menuData, setMenuData] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenders/metadata/mega-menu`);
        if (res.ok) {
          const data = await res.json();
          setMenuData(data);
        }
      } catch (err) {
        console.error("Mega menu fetch error", err);
      }
    };
    fetchData();
  }, []);

  const currentData = menuData[activeTab] || ["Loading..."];

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
          <Link href="/tenders">
            <h4 className="text-sm font-bold text-[#2563EB] hover:underline cursor-pointer transition-all">
              View all {activeTab.replace("By ", "")}
            </h4>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {currentData.map((item) => {
            const stateName = item.replace(" Tenders", "");
            let href = `/tenders?q=${encodeURIComponent(stateName)}`;
            
            if (activeTab === "By States") href = `/tenders?states=${encodeURIComponent(stateName)}`;
            if (activeTab === "By Cities") href = `/tenders?districts=${encodeURIComponent(stateName)}`;
            if (activeTab === "By Authorities") href = `/tenders?authorities=${encodeURIComponent(stateName)}`;
            if (activeTab === "By Categories") href = `/tenders?categories=${encodeURIComponent(stateName)}`;
            if (activeTab === "By Keywords") href = `/tenders?keywords=${encodeURIComponent(stateName)}`;

            return (
              <Link
                key={item}
                href={href}
                className="text-[13px] text-gray-600 dark:text-gray-300 hover:text-[#2563EB] transition-colors"
              >
                {item}
              </Link>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default IndianTendersMegaMenu;
