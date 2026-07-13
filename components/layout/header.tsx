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
import { Coins, LayoutDashboard, Search as SearchIcon, CalendarDays, Bookmark, ShieldCheck, MapPin, Building2, Map } from 'lucide-react';
import LogoIcon from "@/public/assets/images/logo-icon.png";
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
        { title: "Indian Tenders", url: "/tenders", icon: SearchIcon },
        { title: "Today", url: "/today", icon: CalendarDays },
        { title: "Bookmarks", url: "/bookmarks", icon: Bookmark },
    ];

    return (
        <header className="dashboard-header flex items-center justify-between sm:h-16 h-16 shrink-0 gap-4 md:px-8 px-4 bg-blue-600 dark:bg-blue-700 text-white shadow-md sticky top-0 z-50">
            
            {/* Left: Logo & Nav Links */}
            <div className="flex items-center gap-4 h-full">
                {isAdmin && <SidebarTrigger className="text-white hover:bg-white/10 hover:text-white" />}
                
                {/* Logo (Hidden in admin since it's in the sidebar) */}
                {!isAdmin && (
                    <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity shrink-0">
                        <Image
                            src={LogoIcon}
                            alt="TenderLinked"
                            width={32}
                            height={32}
                            className="brightness-0 invert"
                            style={{ objectFit: "contain" }}
                            priority
                        />
                        <span className="text-xl font-bold tracking-tight text-white hidden sm:block">
                            TenderLinked
                        </span>
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
                                pathname === link.url 
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
                        placeholder="Add more keywords (Press Enter to search)" 
                        className="block w-full pl-9 pr-3 py-2 border-0 rounded-md leading-5 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/20 sm:text-sm"
                    />
                    
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

                <ModeToggle />
                <NotificationDropdown />
                <ProfileDropdown />
            </div>
        </header>
    );
};

export default Header;