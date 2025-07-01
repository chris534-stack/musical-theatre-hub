
'use client';

import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

export function Header() {
  const { isAdmin } = useAuth();

  return (
    <header className="py-4 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground hidden md:block">
      <div className="container mx-auto flex justify-between items-center">
        <Logo />
        <div className="flex items-center gap-6">
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/calendar" className="hover:text-accent transition-colors">Calendar</Link>
            <Link href="/reviews" className="hover:text-accent transition-colors">Reviews</Link>
            <Link href="/news" className="hover:text-accent transition-colors">News</Link>
            <Link href="/about-us" className="hover:text-accent transition-colors">About Us</Link>
            {isAdmin && (
              <Link href="/admin" className="hover:text-accent transition-colors opacity-70 hover:opacity-100">Admin</Link>
            )}
          </nav>
          <Button
            asChild
            variant="secondary"
            size="icon"
            className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Link href="/profile">
              <User className="h-5 w-5" />
              <span className="sr-only">Profile</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
