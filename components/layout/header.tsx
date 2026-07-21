"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

import LanguageSelect from '../shared/language-select';
import MessageDropdown from '../shared/message-dropdown';
import { ModeToggle } from '../shared/mode-toggle';
import ProfileDropdown from '../shared/profile-dropdown';
import SearchBox from '../shared/search-box';
import { Button } from '../ui/button';
import { SidebarTrigger } from '../ui/sidebar';
import NotificationDropdown from './../shared/notification-dropdown';
import { Coins, LayoutDashboard, Search as SearchIcon, CalendarDays, Bookmark, ShieldCheck, MapPin, Building2, Map, Sparkles } from 'lucide-react';
import Logo from "@/public/logo/tenderlinked_icon.png";
import { cn } from "@/lib/utils";

const Header = () => {
    const { data: session } = useSession();
    const [usage, setUsage] = useState<{availableCredits: number} | null>(null);

    useEffect(() => {
        if (session?.accessToken) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/billing/usage`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            })
            .then(res => res.json())
            .then(data => setUsage(data))
            .catch(console.error);
        }
    }, [session?.accessToken]);

    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const isAdmin = pathname?.startsWith("/admin");
    const userRole = (session?.user as any)?.globalRole;

    const [searchValue, setSearchValue] = useState(searchParams.get('q') || "");
    const [suggestions, setSuggestions] = useState<{ text: string, type: string, category: string }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Click outside listener
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!searchValue || searchValue.length < 2) {
            setSuggestions([]);
            return;
        }
        
        const fetchSuggestions = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenders/autocomplete?q=${encodeURIComponent(searchValue)}`, {
                    headers: session?.accessToken ? { 'Authorization': `Bearer ${session.accessToken}` } : {}
                });
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data);
                }
            } catch (err) {
                console.error("Autocomplete fetch error", err);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [searchValue, session?.accessToken]);

    useEffect(() => {
        setSearchValue(searchParams.get('q') || "");
    }, [searchParams]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(e.target.value);
        setShowSuggestions(true);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setShowSuggestions(false);
            if (searchValue) {
                router.push(`/tenders?q=${encodeURIComponent(searchValue)}`);
            } else {
                router.push(`/tenders`);
            }
        }
    };

    const handleSuggestionClick = (suggestion: { text: string, type: string, category: string }) => {
        setShowSuggestions(false);
        setSearchValue(""); // Clear input or set to text
        
        const params = new URLSearchParams(searchParams.toString());
        params.set(suggestion.category, suggestion.text);
        
        router.push(`/tenders?${params.toString()}`);
    };

    const navLinks = isAdmin ? [
        { title: "Admin Dashboard", url: "/admin", icon: ShieldCheck },
        { title: "Tenants", url: "/admin/tenants", icon: LayoutDashboard },
        { title: "Keywords", url: "/admin/keywords", icon: SearchIcon },
    ] : [
        { title: "All Tenders", url: "/tenders", icon: SearchIcon },
        { title: "Bookmarks", url: "/tenders?bookmarked=true", icon: Bookmark },
    ];

    const isActive = (linkUrl: string) => {
        if (linkUrl === '/tenders?bookmarked=true') {
            return pathname === '/tenders' && searchParams.get('bookmarked') === 'true';
        }
        if (linkUrl === '/tenders') {
            return pathname === '/tenders' && searchParams.get('bookmarked') !== 'true';
        }
        return pathname === linkUrl;
    };

    return (
        <header className="dashboard-header flex items-center justify-between sm:h-16 h-16 shrink-0 gap-4 md:px-8 px-4 bg-blue-600 dark:bg-blue-700 text-white shadow-md sticky top-0 z-50">
            
            {/* Left: Logo & Nav Links */}
            <div className="flex items-center gap-4 h-full">
                {isAdmin && <SidebarTrigger className="text-white hover:bg-white/10 hover:text-white" />}
                
                {/* Logo (Hidden in admin since it's in the sidebar) */}
                {!isAdmin && (
                    <Link href="/dashboard" className="flex items-center hover:opacity-90 transition-opacity shrink-0 ml-1">
                        {/* Pixel-perfect inline SVG matching "Tender Management" layout */}
                        <svg viewBox="0 0 170 55" className="h-[42px] w-auto hidden sm:block" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Left T shape (White) */}
                            <polygon points="15,5 50,5 45,20 10,20" fill="#ffffff" />
                            <polygon points="30,20 45,20 35,50 20,50" fill="#ffffff" />
                            
                            {/* Right Top Bar (Purple) */}
                            <polygon points="54,5 170,5 165,20 49,20" fill="#d4c6f1" />
                            
                            {/* Typography */}
                            <text x="51" y="40" fontFamily="Inter, system-ui, sans-serif" fontSize="23" fontWeight="900" fill="#ffffff" letterSpacing="1.5">TENDER</text>
                            <text x="52" y="51" fontFamily="Inter, system-ui, sans-serif" fontSize="10" fontWeight="700" fill="#d4c6f1" letterSpacing="6">LINKED</text>
                        </svg>

                        {/* Mobile view (Icon only) */}
                        <svg viewBox="0 0 55 55" className="h-[36px] w-auto sm:hidden" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <polygon points="15,5 50,5 45,20 10,20" fill="#ffffff" />
                            <polygon points="30,20 45,20 35,50 20,50" fill="#ffffff" />
                            <polygon points="54,5 65,5 60,20 49,20" fill="#d4c6f1" />
                        </svg>
                    </Link>
                )}

                {/* Primary Nav Links */}
                <nav className="hidden md:flex items-center gap-2 h-full">
                    {navLinks.map((link) => (
                        <Link 
                            key={link.title} 
                            href={link.url}
                            className={cn(
                                "flex items-center gap-2 px-3 h-full border-b-[3px] font-medium text-sm transition-colors",
                                isActive(link.url)
                                    ? "border-white text-white bg-white/10" 
                                    : "border-transparent text-blue-100 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {link.title}
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Middle: Global Search Bar */}
            <div className="flex-1 max-w-xl mx-4 hidden lg:flex items-center" ref={searchRef}>
                <div className="relative w-full flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                        type="text" 
                        value={searchValue}
                        onChange={handleSearch}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="Search by Keyword, Tender ID, Title, District, City, State... (Press Enter)" 
                        className="block w-full pl-9 pr-[120px] py-2 border-0 rounded-md leading-5 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/20 sm:text-sm"
                    />
                    
                    <div className="absolute inset-y-1 right-1 flex items-center">
                        <button
                            onClick={() => {
                                if (searchValue.trim()) {
                                    router.push(`/tenders?search=${encodeURIComponent(searchValue.trim())}`);
                                    setShowSuggestions(false);
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 transition-all cursor-pointer"
                        >
                            <Sparkles className="w-4 h-4" />
                            AI Search
                        </button>
                    </div>
                    
                    {/* Autocomplete Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg border border-slate-200 overflow-hidden z-[100] max-h-96 overflow-y-auto">
                            {suggestions.map((s, idx) => (
                                <div 
                                    key={`${s.text}-${s.type}-${idx}`} 
                                    onClick={() => handleSuggestionClick(s)}
                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center gap-3 border-b border-slate-100 last:border-0"
                                >
                                    <div className="flex-shrink-0 text-slate-400">
                                        <SearchIcon className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-slate-700">
                                            {/* Highlight matching text logic could go here, for now just show text */}
                                            {s.text}
                                        </span>
                                        <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                                            in {s.type}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-3 h-full">
                {usage && (
                    <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-white font-medium text-sm">
                        <Coins className="w-4 h-4" />
                        <span>{usage.availableCredits} Credits</span>
                    </div>
                )}

                <NotificationDropdown />
                <ProfileDropdown />
            </div>
        </header>
    );
};

export default Header;