
"use client";

import '@/lib/firebase'; // Import for side-effects (ensures firebase initializes)
import React from 'react';

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
