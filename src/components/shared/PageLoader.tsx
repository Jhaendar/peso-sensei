
"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';

export function PageLoader() {
  return (
    <div className="flex flex-1 items-center justify-center py-12">
      <div className="flex flex-col items-center space-y-3">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Loading page...</p>
      </div>
    </div>
  );
}
