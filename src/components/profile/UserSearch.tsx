
'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getUserCountAction, searchUsersAction } from '@/lib/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Search } from 'lucide-react';
import type { UserProfile } from '@/lib/types';
import { useDebounce } from 'use-debounce';

type SearchResult = Pick<UserProfile, 'userId' | 'displayName' | 'photoURL'>;

export function UserSearch() {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, startSearchTransition] = useTransition();

  useEffect(() => {
    async function fetchUserCount() {
      const result = await getUserCountAction();
      if (result.success && result.data) {
        setUserCount(result.data);
      }
    }
    fetchUserCount();
  }, []);

  useEffect(() => {
    if (debouncedQuery.trim().length > 1) {
      startSearchTransition(async () => {
        const result = await searchUsersAction(debouncedQuery);
        if (result.success && result.data) {
          setResults(result.data);
        }
      });
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  const placeholderText = userCount !== null
    ? `Search ${userCount} community members...`
    : 'Search for a user...';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Find a Friend</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={placeholderText} 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="space-y-3 h-48 overflow-y-auto pr-2">
          {isSearching && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ))}
            </div>
          )}
          {!isSearching && debouncedQuery && results.length === 0 && (
             <div className="text-center text-muted-foreground pt-8">
                <p className="text-sm">No users found.</p>
            </div>
          )}
           {!isSearching && !debouncedQuery && (
             <div className="text-center text-muted-foreground pt-8">
                <Users className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Start typing to find someone.</p>
            </div>
          )}
          {!isSearching && results.map(user => (
            <Link key={user.userId} href={`/profile/${user.userId}`} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.photoURL} alt={user.displayName} />
                <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{user.displayName}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
