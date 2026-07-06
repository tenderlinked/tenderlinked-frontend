import { auth } from "@/auth";
import { ClientRoot } from "@/app/client-root";
import { ReactNode } from "react";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect('/auth/login');
  }

  // @ts-ignore
  if (session.user?.globalRole !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  return (
    <ClientRoot defaultOpen={true} session={session}>
      {children}
    </ClientRoot>
  );
}
