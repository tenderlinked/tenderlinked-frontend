"use client";

import { useState } from 'react';
import LanguageSelect from '../shared/language-select';
import MessageDropdown from '../shared/message-dropdown';
import { ModeToggle } from '../shared/mode-toggle';
import ProfileDropdown from '../shared/profile-dropdown';
import SearchBox from '../shared/search-box';
import { SidebarTrigger } from '../ui/sidebar';
import { Button } from '../ui/button';
import NotificationDropdown from './../shared/notification-dropdown';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { Coins } from 'lucide-react';

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

    // @ts-ignore
    const userRole = session?.user?.globalRole;

    return (
        <header className="dashboard-header flex items-center justify-between sm:h-18 h-13 shrink-0 gap-2 md:px-6 px-4 py-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-18 dark:bg-[#273142]">
            <div className="flex items-center gap-4">
                <SidebarTrigger className="-ms-1 p-0 size-[unset] cursor-pointer" />
                <SearchBox />
            </div>
            <div className="flex items-center gap-3">
                {usage && (
                    <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium text-sm border border-amber-200 dark:border-amber-800">
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