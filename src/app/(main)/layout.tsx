"use client"; // Required for hooks like useRouter and useAuth

import type React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/shared/Navbar';
import { useAuth } from '@/components/providers/auth-provider';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    // Optionally, show a more specific loading screen for authenticated routes
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading user session...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Peso Sensei. All rights reserved.
      </footer>
    </div>
  );
}
