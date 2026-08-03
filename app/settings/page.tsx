"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SettingsRedirectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
      return;
    }
    
    if (status === "authenticated") {
      const isOwnerOrAdmin = (session?.user as any)?.tenantRole === 'OWNER' || (session?.user as any)?.tenantRole === 'ADMIN' || (session?.user as any)?.isOwner || (session?.user as any)?.globalRole === 'SUPER_ADMIN';
      if (isOwnerOrAdmin) {
        router.replace("/settings/bidder-profile");
      } else {
        router.replace("/tenders");
      }
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen pt-24 pb-16 bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="flex items-center gap-3 text-blue-600 font-medium">
        <Loader2 className="w-6 h-6 animate-spin" />
        Redirecting to Settings...
      </div>
    </div>
  );
}
