import { Theater } from 'lucide-react';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Our Stage, Eugene Home">
      <Theater className="h-8 w-8 text-primary" />
      <span className="text-xl font-bold font-headline text-primary">
        Our Stage, Eugene
      </span>
    </Link>
  );
}
