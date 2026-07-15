"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { handleTenderDownload, showNoDocumentsTooltip } from "@/lib/download";
import { DownloadConfirmModal } from "@/components/tenders/download-confirm-modal";
import toast from "react-hot-toast";

export function useTenderDownload() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const [isOpen, setIsOpen] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const [isExhausted, setIsExhausted] = useState(false);
  const [freeLimit, setFreeLimit] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingDownload, setPendingDownload] = useState<{ tender: any, target?: HTMLElement } | null>(null);

  const initiateDownload = async (tender: any, event?: React.MouseEvent) => {
    let targetElement: HTMLElement | undefined;
    if (event) {
      targetElement = event.currentTarget as HTMLElement;
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (tender.hasDocuments === false) {
      showNoDocumentsTooltip(targetElement);
      return;
    }

    if (!token) {
      toast.error("You must be logged in to download");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`${apiUrl}/api/tenders/${tender.id}/download-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      let data = { isUnlocked: false, downloadCount: 0, freeRedownloads: 3 };
      if (res.ok) {
        data = await res.json();
      }
      
      setFreeLimit(data.freeRedownloads);
      
      const maxDownloadsBeforeCharge = data.freeRedownloads + 1;

      if (!data.isUnlocked || data.downloadCount >= maxDownloadsBeforeCharge) {
        // Needs to pay 1 credit
        setIsWarning(false);
        setIsExhausted(data.isUnlocked && data.downloadCount >= maxDownloadsBeforeCharge);
        setPendingDownload({ tender, target: targetElement });
        setIsOpen(true);
      } else {
        // Unlocked and free
        setIsExhausted(false);
        if (data.downloadCount === data.freeRedownloads) {
          // Warning for final free redownload
          setIsWarning(true);
          setPendingDownload({ tender, target: targetElement });
          setIsOpen(true);
        } else {
          // Silent free redownload
          await executeDownload(tender, targetElement);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to check download status");
    } finally {
      setIsLoading(false);
    }
  };

  const executeDownload = async (tender: any, targetElement?: HTMLElement) => {
    await handleTenderDownload(tender, targetElement, token);
  };

  const handleConfirm = async () => {
    setIsOpen(false);
    if (pendingDownload) {
      await executeDownload(pendingDownload.tender, pendingDownload.target);
      setPendingDownload(null);
    }
  };

  const DownloadModal = () => (
    <DownloadConfirmModal
      isOpen={isOpen}
      onClose={() => { setIsOpen(false); setPendingDownload(null); }}
      onConfirm={handleConfirm}
      isWarning={isWarning}
      isExhausted={isExhausted}
      freeLimit={freeLimit}
    />
  );

  return { initiateDownload, DownloadModal, isLoading };
}
