import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import type { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      // Only allow emails in the admin list
      const fs = require('fs');
      const path = require('path');
      const adminsPath = path.join(process.cwd(), 'data', 'admins.json');
      let admins: string[] = [];
      try {
        admins = JSON.parse(fs.readFileSync(adminsPath, 'utf8'));
      } catch (err) {
        console.error('Could not read admins.json:', err);
        return false;
      }
      if (profile?.email === "christopher.ridgley@gmail.com") return true;
      return !!profile?.email && admins.includes(profile.email);
    },
  },
};

export default NextAuth(authOptions);
