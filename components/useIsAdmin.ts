import { useSession } from "next-auth/react";

// Optionally, support multiple admin emails from an env variable
const HARDCODED_ADMIN = "christopher.ridgley@gmail.com";
const ADMIN_EMAILS = [
  HARDCODED_ADMIN,
  ...((process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean))
];

console.log('[useIsAdmin] Hook loaded');
export default function useIsAdmin(): boolean {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  return !!userEmail && ADMIN_EMAILS.includes(userEmail);
}
