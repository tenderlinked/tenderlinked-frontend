import React, { useState } from 'react';
import { Unlock, Loader2, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface CreditGateProps {
  tenderId: string;
  hasAccess: boolean; // True if it's already unlocked in TenantUnlockedTender or if they're Super Admin
  featureName: string;
  children: React.ReactNode;
}

export function CreditGate({ tenderId, hasAccess, featureName, children }: CreditGateProps) {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockedLocally, setUnlockedLocally] = useState(false);
  const isRedacted = children === '__CREDIT_LOCKED__';
  const shouldGate = (!hasAccess || isRedacted) && !unlockedLocally;

  if (!shouldGate) {
    return <>{children}</>;
  }

  const handleUnlock = async () => {
    try {
      setIsUnlocking(true);
      
      // We will implement this endpoint in the backend shortly
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tenders/${tenderId}/unlock`, {
        method: 'POST',
        headers: {
          // Assuming you have an interceptor or passing token manually
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (res.ok) {
        toast.success('Successfully unlocked documents!');
        setUnlockedLocally(true);
        // In a real scenario, we might want to re-fetch the tender data to get the actual PDF URLs
        // Since we are mocking, we can just trigger a page reload for now to fetch fresh unredacted data
        window.location.reload();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Not enough credits to unlock.');
      }
    } catch (e) {
      console.error(e);
      toast.error('An error occurred while unlocking.');
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="relative group overflow-hidden rounded-md border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
      {/* Blurred "fake" content */}
      <div className="p-4 opacity-30 blur-sm pointer-events-none select-none">
        <div className="h-4 bg-amber-300 dark:bg-amber-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-amber-300 dark:bg-amber-700 rounded w-1/2 mb-2"></div>
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-white/70 dark:bg-black/70 backdrop-blur-[3px]">
        <div className="bg-white dark:bg-gray-950 p-4 rounded-xl shadow-lg border border-amber-200 dark:border-amber-800 text-center max-w-sm w-full transition-transform duration-300 group-hover:scale-105">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Coins className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            {featureName} Locked
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Spend 1 credit to unlock these documents permanently for your workspace.
          </p>
          <Button 
            className="w-full bg-amber-600 hover:bg-amber-700 text-white" 
            onClick={handleUnlock}
            disabled={isUnlocking}
          >
            {isUnlocking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Unlock className="w-4 h-4 mr-2" />}
            Unlock (Costs 1 Credit)
          </Button>
        </div>
      </div>
    </div>
  );
}
