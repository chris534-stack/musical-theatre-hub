import { useSession } from 'next-auth/react';

export default function useIsAdmin(): boolean {
  const { data: session } = useSession();
  // Hardcoded email for now, can be extended to check admins.json or session roles
  return !!session?.user?.email && session.user.email === "christopher.ridgley@gmail.com";
}
