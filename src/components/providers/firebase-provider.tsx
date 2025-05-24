
"use client";

import { app } from '@/lib/firebase'; 
import type React from 'react';

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
