import Logout from "@/components/auth/logout";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import userImg from "@/public/assets/images/user.png";
import { Mail, Settings, User, Calendar, CreditCard, Clock } from "lucide-react";
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
      fetch(`http://localhost:3001/api/subscriptions/${session.user.id}/active`)
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
          variant="outline"
          size="icon"
          className={cn(
            "rounded-full sm:w-10 sm:h-10 w-8 h-8 bg-gray-200/75 hover:bg-slate-200 focus-visible:ring-0 dark:bg-slate-700 dark:hover:bg-slate-600 border-0 cursor-pointer data-[state=open]:bg-gray-300 data-[state=open]:ring-4 data-[state=open]:ring-slate-300 dark:data-[state=open]:ring-slate-500 dark:data-[state=open]:bg-slate-600"
          )}
        >
          {session?.user?.image ? (
            <Image
              src={session?.user?.image}
              className="rounded-full"
              width={40}
              height={40}
              alt={session?.user?.name ?? "User profile"}
            />
          ) : (
            <Image
              src={userImg}
              className="rounded-full"
              width={40}
              height={40}
              alt={"User profile"}
            />
          )}
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
                Active Plan: {subDetails?.planType || 'Premium'}
              </span>
            ) : (
              <Link href="/checkout" className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 hover:opacity-80 transition-opacity ring-1 ring-rose-200 dark:ring-rose-800">
                No Active Plan - Upgrade
              </Link>
            )}
          </div>

          {subDetails && (
            <div className="mt-2 space-y-2 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-3">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Start Date</span>
                <span className="font-medium text-slate-900 dark:text-slate-300">{format(new Date(subDetails.startDate), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Next Renew</span>
                <span className="font-medium text-slate-900 dark:text-slate-300">{format(new Date(subDetails.endDate), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Payment</span>
                <span className="font-medium text-slate-900 dark:text-slate-300">₹{subDetails.amount} via {subDetails.paymentMethod}</span>
              </div>
            </div>
          )}
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
              <Logout />
            </li>
          </ul>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;
