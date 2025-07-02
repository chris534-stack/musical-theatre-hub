'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export function Footer() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    // This will only run on the client, after the initial render, preventing a hydration mismatch.
    setYear(new Date().getFullYear());
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <footer className="py-6 px-4 sm:px-6 lg:px-8 border-t border-border/40 mt-auto bg-secondary">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-sm text-muted-foreground">
        <p>&copy; {year} Our Stage, Eugene. All rights reserved.</p>
        <nav className="flex gap-4">
            <Link href="/about-us" className="hover:text-primary transition-colors">About Us</Link>
        </nav>
      </div>
    </footer>
  );
}
