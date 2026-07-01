import React from "react";

const Footer = () => {
  return (
    <footer className="w-full mt-auto bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-[1536px] mx-auto px-6 lg:px-8 py-12 text-sm">
        <div className="flex flex-col gap-4">
          <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            TenderLinked
          </span>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed pr-4">
            Providing institutional-grade tender intelligence for professional
            enterprises worldwide. Empowering transparency in government
            markets.
          </p>
        </div>
        <div>
          <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-6 uppercase tracking-wider text-xs">
            Quick Links
          </h4>
          <ul className="flex flex-col gap-3">
            <li>
              <a
                className="text-gray-500 dark:text-gray-400 hover:text-[#2563EB] transition-colors duration-200"
                href="#"
              >
                Federal Government
              </a>
            </li>
            <li>
              <a
                className="text-gray-500 dark:text-gray-400 hover:text-[#2563EB] transition-colors duration-200"
                href="#"
              >
                State Portals
              </a>
            </li>
            <li>
              <a
                className="text-gray-500 dark:text-gray-400 hover:text-[#2563EB] transition-colors duration-200"
                href="#"
              >
                Legal Policy
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-6 uppercase tracking-wider text-xs">
            Resources
          </h4>
          <ul className="flex flex-col gap-3">
            <li>
              <a
                className="text-gray-500 dark:text-gray-400 hover:text-[#2563EB] transition-colors duration-200"
                href="#"
              >
                Privacy Center
              </a>
            </li>
            <li>
              <a
                className="text-gray-500 dark:text-gray-400 hover:text-[#2563EB] transition-colors duration-200"
                href="#"
              >
                Accessibility
              </a>
            </li>
            <li>
              <a
                className="text-gray-500 dark:text-gray-400 hover:text-[#2563EB] transition-colors duration-200"
                href="#"
              >
                Contact Support
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-6 uppercase tracking-wider text-xs">
            Newsletter
          </h4>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Get weekly summaries of new tender opportunities in your sector.
          </p>
          <div className="flex border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#2563EB] focus-within:border-transparent transition-all">
            <input
              className="bg-white dark:bg-gray-800 border-none focus:ring-0 px-4 py-2 w-full text-gray-900 dark:text-white outline-none"
              placeholder="Email address"
              type="email"
            />
            <button className="bg-[#2563EB] text-white px-5 hover:bg-[#1D4ED8] transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-800 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>© 2024 TenderLinked Authority. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
