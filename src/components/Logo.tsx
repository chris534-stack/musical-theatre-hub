import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label="Our Stage, Eugene Home">
        <div className={cn("font-headline text-2xl font-bold tracking-tight", className)}>
            Our Stage, Eugene
        </div>
    </Link>
  );
}
