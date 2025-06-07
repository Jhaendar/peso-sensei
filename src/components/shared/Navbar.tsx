
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/icons/Logo';
import { useAuth } from '@/components/providers/auth-provider';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogOut, LayoutDashboard, ListChecks, ListFilter, PieChart } from 'lucide-react'; // Added PieChart
import { ThemeToggleButton } from './ThemeToggleButton';
import type React from 'react';

export function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    if (!auth) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Firebase authentication is not initialized.",
      });
      return;
    }
    try {
      await signOut(auth);
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/login');
    } catch { // _error removed
      toast({ variant: 'destructive', title: 'Logout Failed', description: 'Could not log you out. Please try again.' });
    }
  };

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: '/transactions', label: 'Transactions', icon: <ListFilter className="h-5 w-5" /> },
    { href: '/categories', label: 'Categories', icon: <ListChecks className="h-5 w-5" /> },
    { href: '/reports', label: 'Reports', icon: <PieChart className="h-5 w-5" /> }, // New Reports link
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label="Peso Sensei Home">
          <Logo />
          <span className="font-semibold text-lg">Peso Sensei</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {user && navLinks.map(link => (
            <Button key={link.href} variant="ghost" asChild>
              <Link href={link.href} className="flex items-center gap-2 px-3">
                {link.icon}
                {link.label}
              </Link>
            </Button>
          ))}
          <div className="flex items-center gap-2 ml-2">
            <ThemeToggleButton />
            {user ? (
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            ) : (
              <Button asChild>
                <Link href="/login">Login</Link>
              </Button>
            )}
          </div>
        </nav>

        {/* Mobile Navigation */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggleButton />
          {user && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle className="sr-only">Main Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 p-4 pt-0 h-full">
                  <Link href="/" className="flex items-center gap-2 mb-4 border-b pb-4">
                    <Logo />
                    <span className="font-semibold text-lg">Peso Sensei</span>
                  </Link>
                  {navLinks.map(link => (
                    <Button key={link.href} variant="ghost" asChild className="justify-start">
                      <Link href={link.href} className="flex items-center gap-2 text-base">
                        {link.icon}
                        {link.label}
                      </Link>
                    </Button>
                  ))}
                  <Button variant="outline" onClick={handleLogout} className="mt-auto">
                     <LogOut className="mr-2 h-4 w-4" /> Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}
           {!user && ( // Show login button if no user for mobile view as well
             <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
           )}
        </div>
      </div>
    </header>
  );
}
