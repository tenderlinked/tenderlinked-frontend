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
      title: "District Tenders",
      url: "/dashboard/district",
      icon: Boxes,
    },
    {
      title: "State Tenders",
      url: "/dashboard/state",
      icon: Component,
    },
    {
      title: "Today",
      url: "/today",
      icon: CalendarDays,
    },
    {
      title: "Bookmarks",
      url: "/bookmarks",
      icon: StickyNote,
    },
    {
      title: "Team Settings",
      url: "/settings/team",
      icon: UsersRound,
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
      title: "Billing",
      url: "/admin/billing",
      icon: Server,
    },
  ],
};
