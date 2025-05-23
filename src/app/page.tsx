
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';

export default function RootPage() {
  const router = useRouter();
  const { user, loading } = useAuth(); // user variable is kept for potential future use or if other parts rely on it

  useEffect(() => {
    if (!loading) {
      // Always redirect to the main dashboard page to bypass login
      router.replace('/'); 
    }
  }, [loading, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p>Loading Peso Sensei...</p>
    </div>
  );
}
