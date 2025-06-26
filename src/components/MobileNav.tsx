'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarDays, UserPlus, Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '#', label: 'Involved', icon: UserPlus },
  { href: '#', label: 'News', icon: Newspaper },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-primary border-t border-border/20 shadow-t-lg z-50">
      <div className="container mx-auto flex justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center text-center px-0 py-2 rounded-md transition-colors w-1/4',
                isActive ? 'text-accent' : 'text-primary-foreground/70 hover:text-primary-foreground'
              )}
            >
              <Icon className="h-6 w-6 mb-1" />
              <span className="text-[11px] font-medium leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
