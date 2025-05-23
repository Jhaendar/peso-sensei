"use client";

import { app } from '@/lib/firebase'; // This will ensure firebase is initialized
import type React from 'react';

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  // The mere act of importing 'app' from '@/lib/firebase' initializes Firebase.
  // This provider doesn't need to do much else.
  return <>{children}</>;
}
