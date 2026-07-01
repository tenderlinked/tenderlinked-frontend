'use client'

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import LogoIcon from "@/public/logo/types/multicolor-icon.png";

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
        <Image
          src={LogoIcon}
          alt="Enfycon"
          width={36}
          height={36}
          style={{ objectFit: "contain" }}
          priority
        />
      ) : (
        <div className="flex items-center gap-2.5">
          <Image
            src={LogoIcon}
            alt="Enfycon"
            width={36}
            height={36}
            style={{ objectFit: "contain" }}
            priority
          />
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "-0.4px",
              background: "linear-gradient(135deg, #f97316 0%, #3b82f6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Enfycon
          </span>
        </div>
      )}
    </Link>
  )
}

export default LogoSidebar