"use client";

import Logout from "@/components/auth/logout";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import userImg from "@/public/assets/images/user.png";
import { 
  Settings, 
  CreditCard, 
  Users, 
  ShieldCheck, 
  UserCheck, 
  Shield, 
  ChevronDown,
  Sparkles,
  Building
} from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const ProfileDropdown = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [subDetails, setSubDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      setLoading(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/subscriptions/${session.user.id}/active`, {
        headers: {
          "Authorization": `Bearer ${(session as any).accessToken}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.subscription) {
            setSubDetails(data.subscription);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [session?.user?.id]);

  const globalRole = (session?.user as any)?.globalRole;
  const tenantRole = (session?.user as any)?.tenantRole;
  const isOwner = (session?.user as any)?.isOwner || tenantRole === 'OWNER';
  const isOwnerOrAdmin = isOwner || tenantRole === 'ADMIN' || globalRole === 'SUPER_ADMIN';
  
  const displayRoleLabel = globalRole === 'SUPER_ADMIN' 
    ? 'Super Admin' 
    : (isOwner ? 'Workspace Owner' : (tenantRole === 'ADMIN' ? 'Admin' : 'Tenant Member'));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex items-center gap-3 py-1 px-1.5 pr-2.5 rounded-full transition-all cursor-pointer border-0 hover:bg-slate-100 dark:hover:bg-slate-800/80 data-[state=open]:bg-slate-100 dark:data-[state=open]:bg-slate-800"
          )}
        >
          <div className="p-[1.5px] bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 rounded-full shadow-sm">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white dark:bg-slate-900 flex-shrink-0 flex items-center justify-center overflow-hidden">
              {session?.user?.image ? (
                <Image
                  src={session?.user?.image}
                  className="w-full h-full object-cover"
                  width={36}
                  height={36}
                  alt={session?.user?.name ?? "User profile"}
                />
              ) : (
                <Image
                  src={userImg}
                  className="w-full h-full object-cover"
                  width={36}
                  height={36}
                  alt={"User profile"}
                />
              )}
            </div>
          </div>

          <div className="flex flex-col items-start hidden sm:flex text-left">
            <span className="text-[13px] font-bold text-slate-800 dark:text-slate-100 leading-tight max-w-[130px] truncate">
              {session?.user?.name || session?.user?.email?.split('@')[0] || "User"}
            </span>
            
            <div className="flex items-center gap-1 mt-0.5">
              {globalRole === 'SUPER_ADMIN' ? (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                  <ShieldCheck className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" />
                  SUPER ADMIN
                </span>
              ) : isOwner ? (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  <Shield className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                  OWNER
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <UserCheck className="w-2.5 h-2.5 text-slate-500 dark:text-slate-400" />
                  TENANT MEMBER
                </span>
              )}
            </div>
          </div>

          <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 ml-0.5 hidden sm:block transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="sm:w-[310px] min-w-[280px] p-2 rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
        side="bottom"
        align="end"
      >
        {/* User Card Header */}
        <div className="p-3.5 rounded-xl bg-gradient-to-b from-slate-50 to-slate-100/60 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex flex-col gap-2.5 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base border border-primary/20 shrink-0">
              {session?.user?.name?.charAt(0).toUpperCase() || session?.user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {session?.user?.name || "User"}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {session?.user?.email}
              </span>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/50">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Subscription</span>
            {(session?.user as any)?.hasActivePlan ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                {(subDetails?.planType || (session?.user as any)?.planType || 'Active').toUpperCase()}
              </span>
            ) : (
              <Link href="/checkout" className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 hover:bg-rose-200 transition-colors">
                No Active Plan
              </Link>
            )}
          </div>
        </div>

        {/* Menu Actions */}
        <div className="py-1">
          <ul className="flex flex-col gap-0.5">
            {isOwnerOrAdmin && (
              <>
                <li>
                  <Link
                    href="/settings/bidder-profile"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <UserCheck className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span>Bidder Profile</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/subscription"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span>My Subscription</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settings/team"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <Users className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span>Team Settings</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settings/roles"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span>Role Management</span>
                  </Link>
                </li>
              </>
            )}
            <li className="pt-1.5 mt-1 border-t border-slate-100 dark:border-slate-800">
              <Logout />
            </li>
          </ul>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;
