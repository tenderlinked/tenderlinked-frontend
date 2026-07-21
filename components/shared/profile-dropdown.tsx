import Logout from "@/components/auth/logout";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import userImg from "@/public/assets/images/user.png";
import { Mail, Settings, User, Calendar, CreditCard, Clock, Users, ShieldCheck } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { format } from "date-fns";

const ProfileDropdown = () => {
  const { data: session } = useSession();
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex items-center gap-2.5 h-auto py-1 px-1.5 pr-3 rounded-full hover:bg-white/10 data-[state=open]:bg-white/20 transition-colors cursor-pointer border-0"
          )}
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/30">
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
          <div className="flex flex-col items-start hidden sm:flex">
            <span className="text-[13px] font-bold text-white leading-tight max-w-[120px] truncate">
              {session?.user?.name || "User"}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <Settings className="w-2.5 h-2.5 text-white/80" />
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">
                {(session?.user as any)?.globalRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Member'}
              </span>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="sm:w-[320px] min-w-[280px] right-[40px] absolute p-4 rounded-2xl overflow-hidden shadow-xl border-slate-200 dark:border-slate-800"
        side="bottom"
        align="end"
      >
        <div className="py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-3 mb-3 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h6 className="text-lg text-slate-900 dark:text-white font-bold mb-0 truncate max-w-[180px]">
              {session?.user?.name || session?.user?.email || "User"}
            </h6>
          </div>
          <div>
            {(session?.user as any)?.hasActivePlan ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800">
                Active Plan: {(subDetails?.planType || (session?.user as any)?.planType || 'Active').charAt(0).toUpperCase() + (subDetails?.planType || (session?.user as any)?.planType || 'Active').slice(1).toLowerCase()}
              </span>
            ) : (
              <Link href="/checkout" className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 hover:opacity-80 transition-opacity ring-1 ring-rose-200 dark:ring-rose-800">
                No Active Plan - Upgrade
              </Link>
            )}
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto scroll-sm pt-4">
          <ul className="flex flex-col gap-3">
            <li>
              <Link
                href="/view-profile"
                className="text-black dark:text-white hover:text-primary dark:hover:text-primary flex items-center gap-3"
              >
                <User className="w-5 h-5" /> My Profile
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/subscription"
                className="text-black dark:text-white hover:text-primary dark:hover:text-primary flex items-center gap-3"
              >
                <CreditCard className="w-5 h-5" /> My Subscription
              </Link>
            </li>
            <li>
              <Link
                href="/email"
                className="text-black dark:text-white hover:text-primary dark:hover:text-primary flex items-center gap-3"
              >
                <Mail className="w-5 h-5" /> Inbox
              </Link>
            </li>
            <li>
              <Link
                href="/settings"
                className="text-black dark:text-white hover:text-primary dark:hover:text-primary flex items-center gap-3"
              >
                <Settings className="w-5 h-5" /> Settings
              </Link>
            </li>
            <li>
              <Link
                href="/settings/team"
                className="text-black dark:text-white hover:text-primary dark:hover:text-primary flex items-center gap-3"
              >
                <Users className="w-5 h-5" /> Team Settings
              </Link>
            </li>
            <li>
              <Link
                href="/settings/roles"
                className="text-black dark:text-white hover:text-primary dark:hover:text-primary flex items-center gap-3"
              >
                <ShieldCheck className="w-5 h-5" /> Role Management
              </Link>
            </li>
            <li>
              <Logout />
            </li>
          </ul>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;
