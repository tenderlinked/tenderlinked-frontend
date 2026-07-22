"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import LogoSidebar from "./shared/logo-sidebar";
import { data } from "./sidebar-data";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = pathname?.startsWith("/admin");
  // @ts-ignore
  const userPermissions = session?.user?.permissions || [];
  // @ts-ignore
  const isSuperAdmin = session?.user?.globalRole === 'SUPER_ADMIN';
  const isOwnerOrSuperAdmin = userPermissions.includes('*') || isSuperAdmin;
  
  let navItems = (isAdmin && isSuperAdmin) ? data.adminNavMain : data.navMain;

  // For normal users, we completely remove the sidebar as requested
  if (!isOwnerOrSuperAdmin) {
    return null;
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <LogoSidebar />
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin scrollbar-invisible hover:scrollbar-visible">
        <NavMain items={navItems} />
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
