import { Building2, TrendingUp, Zap, LucideIcon } from "lucide-react";

export type Plan = {
  id: string;
  name: string; // e.g. "Entry Level"
  title: string; // e.g. "Basic"
  description: string;
  price: number;
  duration: string;
  features: string[];
  icon: LucideIcon;
  recommended?: boolean;
  ctaText: string;
};

export const PLANS: Record<string, Plan> = {
  basic: {
    id: "basic",
    name: "Entry Level",
    title: "Basic",
    description: "Essential features for new bidders exploring the procurement landscape.",
    price: 2499,
    duration: "month",
    features: [
      "Daily Tender Alerts",
      "Standard Search Tools",
      "Single User Seat",
      "Email Support"
    ],
    icon: Building2,
    ctaText: "Start Trial"
  },
  professional: {
    id: "professional",
    name: "Growth Focused",
    title: "Professional",
    description: "Includes advanced search and real-time smart alerts for serious enterprises.",
    price: 6499,
    duration: "month",
    features: [
      "Real-time Push Alerts",
      "Advanced Filter Logic",
      "Up to 5 User Seats",
      "Priority Portal Access"
    ],
    icon: TrendingUp,
    recommended: true,
    ctaText: "Get Started Now"
  },
  enterprise: {
    id: "enterprise",
    name: "Total Scale",
    title: "Enterprise",
    description: "Full suite with AI matchmaking and comprehensive supplier quota analysis.",
    price: 14999,
    duration: "month",
    features: [
      "AI Opportunity Matchmaking",
      "Supplier Network Quotes",
      "Unlimited User Seats",
      "Dedicated Account Manager"
    ],
    icon: Zap,
    ctaText: "Contact Sales"
  }
};
