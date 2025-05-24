
"use client";

import { app } from '@/lib/firebase'; // app is used to ensure firebase initializes
import React from 'react';

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
