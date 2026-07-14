import {
  Boxes,
  CalendarDays,
  ChartPie,
  Component,
  House,
  Mail,
  MessageCircleMore,
  Server,
  Settings,
  ShieldCheck,
  StickyNote,
  UsersRound,
  Plus,
} from "lucide-react";

export const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: House,
      isActive: true,
    },
    {
      title: "Search Tenders",
      url: "/tenders",
      icon: Boxes,
      requiredPermission: "tenders:read"
    },
    {
      title: "Today",
      url: "/today",
      icon: CalendarDays,
      requiredPermission: "tenders:read"
    },
    {
      title: "Bookmarks",
      url: "/bookmarks",
      icon: StickyNote,
      requiredPermission: "tenders:read"
    },
    {
      title: "Team Settings",
      url: "/settings/team",
      icon: UsersRound,
      requiredPermission: "members:read"
    },
    {
      title: "Role Management",
      url: "/settings/roles",
      icon: ShieldCheck,
      requiredPermission: "settings:manage" // Only admins can manage roles
    },
  ],
  adminNavMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: ShieldCheck,
      isActive: true,
    },
    {
      title: "Tenant Management",
      url: "/admin/tenants",
      icon: UsersRound,
    },
    {
      title: "System Roles",
      url: "/admin/roles",
      icon: ShieldCheck,
    },
    {
      title: "Keywords Management",
      url: "/admin/keywords",
      icon: Boxes,
    },
    {
      title: "Subscription Plans",
      url: "/admin/plans",
      icon: Component,
    },
    {
      title: "Scraper Targets",
      url: "/admin/scraper-targets",
      icon: Server,
    },
    {
      title: "Add Target",
      url: "/admin/add-target",
      icon: Plus,
    },
    {
      title: "Active Scrapes",
      url: "/admin/scraper-instances",
      icon: Component,
    },
    {
      title: "Region Management",
      url: "/admin/regions",
      icon: Boxes,
    },
    {
      title: "Billing",
      url: "/admin/billing",
      icon: Server,
    },
    {
      title: "System Settings",
      url: "/admin/settings",
      icon: Settings,
    },
  ],
};
