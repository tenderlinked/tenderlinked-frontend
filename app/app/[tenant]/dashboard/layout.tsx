import { auth } from "@/auth";
import { doLogout } from "@/components/auth/actions/logout";
import { ClientRoot } from "@/app/client-root";
import { ReactNode } from "react";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Auth check on the server — we KNOW this works because the proxy already confirmed
  // cookies are shared across subdomains. If somehow a user arrives unauthenticated,
  // redirect them to login immediately without any client-side flicker.
  const session = await auth();

  if (!session) {
    redirect('/auth/login');
  }

  // @ts-ignore
  if (session?.user?.isSuspended) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 p-4 text-center">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-red-200 dark:border-red-900 max-w-md w-full space-y-4">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Account Suspended</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            This account has been suspended by an administrator. You do not have access to the dashboard. Please contact support if you believe this is a mistake.
          </p>
          <div className="pt-4">
             <form action={doLogout}>
               <button type="submit" className="text-sm font-medium text-blue-600 hover:underline bg-transparent border-none cursor-pointer">
                 Sign out
               </button>
             </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    // Pass the server session into ClientRoot so SessionProvider is hydrated instantly.
    // This eliminates the cold-fetch race where useSession() briefly returns "unauthenticated".
    <ClientRoot defaultOpen={true} session={session}>
      {children}
    </ClientRoot>
  );
}
