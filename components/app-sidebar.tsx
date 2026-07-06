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
  
  let navItems = isAdmin ? data.adminNavMain : data.navMain;

  // Filter items based on permissions if the user is not a super admin or owner
  // @ts-ignore
  const userPermissions = session?.user?.permissions || [];
  // @ts-ignore
  const isOwnerOrSuperAdmin = userPermissions.includes('*') || session?.user?.globalRole === 'SUPER_ADMIN';

  if (!isOwnerOrSuperAdmin) {
    navItems = navItems.filter((item: any) => {
      if (!item.requiredPermission) return true;
      return userPermissions.includes(item.requiredPermission);
    });
  }

  return (
    <Sidebar collapsible="icon" {...props} className="hidden xl:block">
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
