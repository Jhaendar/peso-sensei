"use client";

import React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/shared/Navbar';
import { useAuth } from '@/components/providers/auth-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a single QueryClient instance with optimized settings for better cache management
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds - reduced from 2 minutes for faster updates
      gcTime: 1000 * 60 * 5, // 5 minutes - reduced from 10 minutes
      retry: 1,
      refetchOnWindowFocus: true, // Enable refetch on focus for better sync
      refetchOnMount: true, // Always refetch on mount
      refetchOnReconnect: true, // Refetch when internet connection is restored
      refetchInterval: false, // Disable automatic polling by default
      refetchIntervalInBackground: false, // Disable background polling
    },
    mutations: {
      retry: 1,
    },
  },
});

// Enhanced page visibility and focus handling for better cross-device sync
const setupPageVisibilityHandlers = (queryClient: QueryClient) => {
  // Handle page visibility changes (when user switches tabs or apps)
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      // Page became visible again - refetch all queries
      queryClient.refetchQueries({
        type: 'active',
        stale: true,
      });
    }
  };

  // Handle window focus events
  const handleWindowFocus = () => {
    queryClient.refetchQueries({
      type: 'active',
      stale: true,
    });
  };

  // Handle online/offline events for better network sync
  const handleOnline = () => {
    queryClient.refetchQueries({
      type: 'active',
      stale: true,
    });
  };

  // Add event listeners
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('online', handleOnline);

    // Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('online', handleOnline);
    };
  }
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Set up page visibility handlers for better cross-device sync
  useEffect(() => {
    const cleanup = setupPageVisibilityHandlers(queryClient);
    return cleanup;
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </QueryClientProvider>
  );
}
