import React from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PremiumGateProps {
  hasAccess: boolean;
  featureName: string;
  children: React.ReactNode;
}

export function PremiumGate({ hasAccess, featureName, children }: PremiumGateProps) {
  // If the backend has redacted the field, it will literally equal the string __PREMIUM_LOCKED__
  // Alternatively, if hasAccess is passed explicitly as false, we gate it.
  const isRedacted = children === '__PREMIUM_LOCKED__';
  const shouldGate = !hasAccess || isRedacted;

  if (!shouldGate) {
    return <>{children}</>;
  }

  return (
    <div className="relative group overflow-hidden rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
      {/* Blurred "fake" content to hint at what's missing */}
      <div className="p-4 opacity-30 blur-sm pointer-events-none select-none">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-white/60 dark:bg-black/60 backdrop-blur-[2px]">
        <div className="bg-white dark:bg-gray-950 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 text-center max-w-sm w-full transition-transform duration-300 group-hover:scale-105">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            {featureName} Locked
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Upgrade your subscription plan to unlock this premium feature.
          </p>
          <Button className="w-full" onClick={() => window.location.href = '/billing'}>
            Upgrade Plan
          </Button>
        </div>
      </div>
    </div>
  );
}
