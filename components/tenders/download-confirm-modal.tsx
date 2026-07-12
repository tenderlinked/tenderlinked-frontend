"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface DownloadConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isWarning: boolean;
  isExhausted?: boolean;
  freeLimit: number;
  isLoading?: boolean;
}

export function DownloadConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isWarning,
  isExhausted,
  freeLimit,
  isLoading
}: DownloadConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isExhausted ? (
              <><AlertCircle className="w-5 h-5 text-red-500" /> Free Limit Exhausted</>
            ) : isWarning ? (
              <><AlertCircle className="w-5 h-5 text-amber-500" /> Final Free Redownload</>
            ) : (
              <><AlertCircle className="w-5 h-5 text-blue-500" /> Confirm Download</>
            )}
          </DialogTitle>
          <DialogDescription className="pt-2 text-base text-slate-700">
            {isExhausted
              ? `You have exhausted your ${freeLimit} free redownloads for this tender. Downloading it again will cost 1 credit.`
              : isWarning
              ? `This is your final free redownload (limit: ${freeLimit}). If you download it again in the future, it will cost 1 credit.`
              : "Downloading these documents will cost 1 credit from your subscription plan."}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="sm:justify-end mt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white" 
            onClick={() => onConfirm()}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Proceed to Download"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
