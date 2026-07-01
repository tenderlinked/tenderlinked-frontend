"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import IndianTendersMegaMenu from "./IndianTendersMegaMenu";
import { Network, Search, Menu, X, ChevronDown, CheckCircle2, LogOut, LayoutDashboard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "Indian Tenders", path: "/", hasDropdown: true },
    { name: "Sectors", path: "/sectors" },
    { name: "Analysis", path: "/analysis" },
    { name: "Pricing", path: "/pricing" },
  ].map(item => ({ ...item, active: pathname === item.path }));

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-[72px] transition-all duration-300 border-b border-[#E5E7EB] dark:border-gray-800 ${
        isScrolled
          ? "bg-white/90 dark:bg-[#111827]/90 backdrop-blur-xl shadow-sm"
          : "bg-white/90 dark:bg-[#111827]/90 backdrop-blur-xl"
      }`}
    >
      <div className="max-w-[1536px] mx-auto px-4 md:px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-2 cursor-pointer text-[#2563EB]"
        >
          <div className="bg-[#2563EB] text-white p-1.5 rounded-lg shadow-sm">
            <Network size={22} strokeWidth={2.5} />
          </div>
          <span className="font-[800] text-[24px] tracking-tight">
            TenderLinked
          </span>
        </motion.div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-10 h-full relative">
          {navItems.map((item) => (
            <div
              key={item.name}
              className="h-full flex items-center relative group"
              onMouseEnter={() =>
                item.hasDropdown && setActiveDropdown(item.name)
              }
              onMouseLeave={() =>
                item.hasDropdown && setActiveDropdown(null)
              }
            >
              <a
                href={item.path}
                className={`text-[16px] font-medium flex items-center gap-1 transition-colors duration-250 ${
                  item.active
                    ? "text-[#2563EB]"
                    : "text-[#111827] dark:text-gray-200 group-hover:text-[#2563EB]"
                }`}
              >
                {item.name}
                {item.hasDropdown && (
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${
                      activeDropdown === item.name ? "rotate-180" : ""
                    }`}
                  />
                )}
              </a>

              {/* Active Indicator */}
              {item.active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}

              {/* Mega Menu Dropdown */}
              <AnimatePresence>
                {item.hasDropdown && activeDropdown === item.name && (
                  item.name === "Indian Tenders" ? (
                    <IndianTendersMegaMenu key="indian-tenders-menu" />
                  ) : (
                    <motion.div
                      key="generic-menu"
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-[72px] -left-1/2 w-[500px] bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-800 rounded-xl shadow-xl overflow-hidden"
                    >
                      <div className="grid grid-cols-2 p-6 gap-6">
                        <div>
                          <h4 className="text-[13px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider mb-4">
                            Government
                          </h4>
                          <ul className="space-y-3">
                            {[
                              "Central Ministries",
                              "State Governments",
                              "PSUs",
                              "Railways",
                            ].map((link) => (
                              <li key={link}>
                                <a
                                  href="#"
                                  className="text-[15px] text-[#111827] dark:text-gray-200 font-medium hover:text-[#2563EB] transition-colors"
                                >
                                  {link}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-[13px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider mb-4">
                            Public Sector
                          </h4>
                          <ul className="space-y-3">
                            {["Oil & Gas", "Defence", "Smart Cities"].map(
                              (link) => (
                                <li key={link}>
                                  <a
                                    href="#"
                                    className="text-[15px] text-[#111827] dark:text-gray-200 font-medium hover:text-[#2563EB] transition-colors"
                                  >
                                    {link}
                                  </a>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="hidden lg:flex items-center gap-6">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <div className="flex items-center gap-3 border border-gray-200 dark:border-gray-700 rounded-full py-1.5 px-2 pr-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-900 shadow-sm">
                  <Avatar className="w-9 h-9 border border-gray-100">
                    <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || "User"} />
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                      {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[13px] font-bold leading-tight text-gray-900 dark:text-white max-w-[130px] truncate">
                      {session?.user?.name || "User"}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl">
                <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{session?.user?.name || "User"}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{session?.user?.email}</p>
                </div>
                <div className="p-1">
                  <DropdownMenuItem onClick={() => router.push('/dashboard')} className="cursor-pointer py-2.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">
                    <LayoutDashboard className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm font-medium">Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer py-2.5 rounded-md text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-700 dark:hover:bg-red-900/20">
                    <LogOut className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Sign Out</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/auth/login" className="text-[15px] font-medium text-[#111827] dark:text-gray-200 hover:text-[#2563EB] transition-colors">
                Login
              </Link>

              <div className="flex items-center gap-3 relative">
                <motion.button
                  whileHover={{ y: -1, boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.3), 0 4px 6px -2px rgba(37, 99, 235, 0.15)" }}
                  whileTap={{ y: 0 }}
                  className="text-[15px] font-medium text-white bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-6 py-2.5 rounded-[12px] shadow-sm transition-all"
                  onClick={() => router.push('/auth/login')}
                >
                  Start Free
                </motion.button>
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden text-[#111827] dark:text-gray-200 p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "100vh" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden fixed top-[72px] left-0 right-0 bg-white dark:bg-[#111827] border-t border-[#E5E7EB] dark:border-gray-800 overflow-y-auto"
          >
            <div className="p-6 flex flex-col h-[calc(100vh-72px)]">
              

              {/* Nav */}
              <nav className="flex flex-col gap-6 mb-auto">
                {navItems.map((item) => (
                  <div key={item.name}>
                    <a
                      href={item.path}
                      className={`text-[18px] font-medium ${
                        item.active ? "text-[#2563EB]" : "text-[#111827] dark:text-gray-200"
                      }`}
                    >
                      {item.name}
                    </a>
                    {item.hasDropdown && (
                      <div className="mt-4 pl-4 border-l-2 border-[#E5E7EB] dark:border-gray-800 flex flex-col gap-4">
                        <a href="#" className="text-[16px] text-[#6B7280] dark:text-gray-400">Government</a>
                        <a href="#" className="text-[16px] text-[#6B7280] dark:text-gray-400">Public Sector</a>
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              {/* Mobile Footer Actions */}
              <div className="pt-8 mt-8 border-t border-[#E5E7EB] dark:border-gray-800 flex flex-col gap-4">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <Avatar className="w-12 h-12 border-2 border-white dark:border-gray-900 shadow-sm">
                        <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || "User"} />
                        <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-lg">
                          {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-base font-bold text-gray-900 dark:text-white truncate">{session?.user?.name || "User"}</span>
                        <span className="text-sm text-gray-500 truncate mt-0.5">{session?.user?.email}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <button onClick={() => router.push('/dashboard')} className="flex items-center justify-center gap-2 w-full text-[14px] font-medium text-[#111827] dark:text-gray-200 py-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </button>
                      <button onClick={() => signOut()} className="flex items-center justify-center gap-2 w-full text-[14px] font-medium text-red-600 py-3 border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" className="text-center text-[16px] font-medium text-[#111827] dark:text-gray-200 py-3">
                      Login
                    </Link>
                    
                    <button onClick={() => router.push('/auth/login')} className="w-full text-[16px] font-medium text-white bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] py-3 rounded-xl shadow-md">
                      Start Free
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
