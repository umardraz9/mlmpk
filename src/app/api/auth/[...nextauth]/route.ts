import NextAuth from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Force Node.js runtime to ensure compatibility with bcrypt/prisma
export const runtime = 'nodejs';

const handler = NextAuth(authOptions as any);

export { handler as GET, handler as POST, authOptions };