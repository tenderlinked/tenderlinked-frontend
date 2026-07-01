import { auth } from "@/auth";
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

  return (
    // Pass the server session into ClientRoot so SessionProvider is hydrated instantly.
    // This eliminates the cold-fetch race where useSession() briefly returns "unauthenticated".
    <ClientRoot defaultOpen={true} session={session}>
      {children}
    </ClientRoot>
  );
}
