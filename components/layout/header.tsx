"use client";

import { useState } from 'react';
import LanguageSelect from '../shared/language-select';
import MessageDropdown from '../shared/message-dropdown';
import { ModeToggle } from '../shared/mode-toggle';
import ProfileDropdown from '../shared/profile-dropdown';
import SearchBox from '../shared/search-box';
import { SidebarTrigger } from '../ui/sidebar';
import { Button } from '../ui/button';
import { Play, Loader2, Pause } from 'lucide-react';
import NotificationDropdown from './../shared/notification-dropdown';
import toast from 'react-hot-toast';

const Header = () => {
    const [scrapingDistrict, setScrapingDistrict] = useState(false);
    const [scrapingState, setScrapingState] = useState(false);

    const handleRunScrap = async (type: 'district' | 'state') => {
        const isState = type === 'state';
        try {
            isState ? setScrapingState(true) : setScrapingDistrict(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/scrape`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(isState ? { district: 'state' } : {})
            });
            
            if (!response.ok) {
                console.warn('Scrape API returned:', response.status);
            }
            toast.success(`Scraping ${type} started successfully!`);
        } catch (error) {
            console.error(error);
            toast.error(`Failed to start ${type} scraping.`);
        } finally {
            isState ? setScrapingState(false) : setScrapingDistrict(false);
        }
    };
    
    const handleStopScrap = async (type: 'district' | 'state') => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/scrape/stop`, {
                method: 'POST',
                credentials: 'include'
            });
            toast.success(`Scraping ${type} stopped.`);
        } catch (error) {
            console.error(error);
        } finally {
            if (type === 'state') setScrapingState(false);
            else setScrapingDistrict(false);
        }
    };

    return (
        <header className="dashboard-header flex items-center justify-between sm:h-18 h-13 shrink-0 gap-2 md:px-6 px-4 py-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-18 dark:bg-[#273142]">
            <div className="flex items-center gap-4">
                <SidebarTrigger className="-ms-1 p-0 size-[unset] cursor-pointer" />
                <SearchBox />
            </div>
            <div className="flex items-center gap-3">
                <Button 
                    variant={scrapingDistrict ? "default" : "outline"} 
                    className="hidden sm:flex items-center gap-2 rounded-full"
                    onClick={() => scrapingDistrict ? handleStopScrap('district') : handleRunScrap('district')}
                    disabled={scrapingState}
                >
                    {scrapingDistrict ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {scrapingDistrict ? "Pause Scraper" : "Scrap District"}
                </Button>
                <Button 
                    variant={scrapingState ? "default" : "outline"} 
                    className="hidden sm:flex items-center gap-2 rounded-full"
                    onClick={() => scrapingState ? handleStopScrap('state') : handleRunScrap('state')}
                    disabled={scrapingDistrict}
                >
                    {scrapingState ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {scrapingState ? "Pause Scraper" : "Scrap State"}
                </Button>
                <ModeToggle />
                <NotificationDropdown />
                <ProfileDropdown />
            </div>
        </header>
    );
};

export default Header;