
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Loader2, AlertTriangle } from "lucide-react";
import type { ExtractReceiptDataOutput } from "@/ai/flows/extract-receipt-data";

interface ReceiptScanModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  imageSrc: string | null;
  extractedData: ExtractReceiptDataOutput | null;
  isLoading: boolean;
  error: string | null;
  onConfirm: (data: ExtractReceiptDataOutput) => void;
}

export function ReceiptScanModal({
  isOpen,
  onOpenChange,
  imageSrc,
  extractedData,
  isLoading,
  error,
  onConfirm,
}: ReceiptScanModalProps) {

  const handleConfirm = () => {
    if (extractedData) {
      onConfirm(extractedData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Scan Receipt Details</DialogTitle>
          <DialogDescription>
            Review the extracted information and the receipt image.
          </DialogDescription>
        </DialogHeader>

        {imageSrc && (
          <div className="my-4 rounded-md overflow-hidden border">
            <Image
              src={imageSrc}
              alt="Scanned Receipt"
              width={400}
              height={600}
              style={{ objectFit: 'contain', maxHeight: '300px', width: '100%' }}
              data-ai-hint="receipt document"
            />
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center space-y-2 my-4 p-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Extracting details from receipt...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="my-4 p-4 bg-destructive/10 border border-destructive/30 rounded-md text-destructive">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-semibold">Extraction Failed</h3>
            </div>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {extractedData && !isLoading && !error && (
          <div className="space-y-3 my-4 text-sm">
            <div>
              <span className="font-semibold text-muted-foreground">Amount:</span>
              <span className="ml-2 text-foreground">PHP {extractedData.amount.toFixed(2)}</span>
            </div>
            <div>
              <span className="font-semibold text-muted-foreground">Date:</span>
              <span className="ml-2 text-foreground">{extractedData.date}</span>
            </div>
            <div>
              <span className="font-semibold text-muted-foreground">Suggested Category:</span>
              <span className="ml-2 text-foreground">{extractedData.category}</span>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isLoading || !!error || !extractedData}
          >
            Confirm & Populate Form
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
