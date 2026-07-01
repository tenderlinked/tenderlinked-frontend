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
  ],
};
