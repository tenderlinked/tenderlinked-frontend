'use client'

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import LogoIcon from "@/public/assets/images/logo-icon.png";

import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed';
import { cn } from '@/lib/utils';

function LogoSidebar() {
  const isCollapsed = useSidebarCollapsed();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <Link
      href="/dashboard"
      className={cn(
        'sidebar-logo h-[72px] py-3.5 flex items-center justify-center border-b border-neutral-100 dark:border-slate-700',
        isCollapsed ? 'px-1' : 'px-4'
      )}
    >
      {isCollapsed ? (
        <svg viewBox="0 0 55 55" className="h-[32px] w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="15,5 50,5 45,20 10,20" fill="#2563EB" />
            <polygon points="30,20 45,20 35,50 20,50" fill="#2563EB" />
            <polygon points="54,5 65,5 60,20 49,20" fill="#8b5cf6" />
        </svg>
      ) : (
        <svg viewBox="0 0 170 55" className="h-[36px] w-auto ml-1" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Left T shape (Blue) */}
            <polygon points="15,5 50,5 45,20 10,20" fill="#2563EB" />
            <polygon points="30,20 45,20 35,50 20,50" fill="#2563EB" />
            
            {/* Right Top Bar (Purple) */}
            <polygon points="54,5 170,5 165,20 49,20" fill="#8b5cf6" />
            
            {/* Typography */}
            <text x="51" y="40" fontFamily="Inter, system-ui, sans-serif" fontSize="23" fontWeight="900" fill="#2563EB" letterSpacing="1.5">TENDER</text>
            <text x="52" y="51" fontFamily="Inter, system-ui, sans-serif" fontSize="10" fontWeight="700" fill="#8b5cf6" letterSpacing="6">LINKED</text>
        </svg>
      )}
    </Link>
  )
}

export default LogoSidebar