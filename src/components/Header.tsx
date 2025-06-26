import Link from 'next/link';
import { Logo } from '@/components/Logo';

export function Header() {
  return (
    <header className="py-4 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground hidden md:block">
      <div className="container mx-auto flex justify-between items-center">
        <Logo />
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link href="/" className="hover:text-accent transition-colors">Home</Link>
          <Link href="/calendar" className="hover:text-accent transition-colors">Calendar</Link>
          <Link href="#" className="hover:text-accent transition-colors">Involved</Link>
          <Link href="#" className="hover:text-accent transition-colors">News</Link>
          <Link href="#" className="hover:text-accent transition-colors">About Us</Link>
          <Link href="/admin" className="hover:text-accent transition-colors opacity-70 hover:opacity-100">Admin</Link>
        </nav>
      </div>
    </header>
  );
}
