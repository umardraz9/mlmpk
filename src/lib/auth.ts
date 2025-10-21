// NextAuth.js Configuration for MCNmart Platform
// Authentication setup with Pakistani market considerations

// import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import bcrypt from 'bcryptjs';
import { supabaseAuth } from '@/lib/supabase-auth';
import type { JWT } from 'next-auth/jwt';
import type { User as NextAuthUser } from 'next-auth';

export const authOptions = {
  // Remove Prisma adapter to avoid database connection issues
  // adapter: PrismaAdapter(prisma),
  providers: [
    // Credentials Provider for email/password login
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        loginType: { label: 'Login Type', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        try {
          // Find user in database using Supabase (normalize email)
          const user = await supabaseAuth.findUserByEmail(email);

          if (!user || !user.password) {
            throw new Error('Invalid email or password');
          }

          // Verify password
          const isValid = await supabaseAuth.verifyPassword(password, user.password);
          if (!isValid) {
            throw new Error('Invalid email or password');
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email.split('@')[0],
            isAdmin: user.isAdmin,
            role: user.role,
            referralCode: user.referralCode,
            phone: user.phone,
            balance: user.balance,
          } as const;
        } catch (error) {
          console.error('Auth error:', error);
          // Rethrow known errors so NextAuth surfaces the specific message to the client
          if (error instanceof Error) {
            throw new Error(error.message);
          }
          // Fallback generic error
          throw new Error('Unable to sign in. Please try again later.');
        }
      },
    }),

    // Google OAuth Provider (only if credentials are provided)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),

    // Facebook OAuth Provider (only if credentials are provided)  
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET ? [
      FacebookProvider({
        clientId: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      })
    ] : []),
  ],

  session: {
    strategy: 'jwt' as const,
    maxAge: 24 * 60 * 60, // 24 hours
  },

  jwt: {
    secret: process.env.NEXTAUTH_SECRET || 'mcnmart-development-secret-key-2024',
    maxAge: 24 * 60 * 60, // 24 hours
  },

  // Ensure NextAuth uses a consistent secret
  secret: process.env.NEXTAUTH_SECRET || 'mcnmart-development-secret-key-2024',

  // Disable CSRF protection completely
  useSecureCookies: process.env.NODE_ENV === 'production',

  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
    // Custom pages for admin routes
    newUser: '/admin/register',
  },

  callbacks: {
    async jwt({ token, user, account }: { token: JWT; user?: NextAuthUser | null; account?: { provider?: string } | null }) {
      if (account && user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
        token.role = user.role;
        token.referralCode = user.referralCode;
        token.phone = user.phone;
        token.balance = user.balance;
      }
      return token;
    },

    async session({ session, token }: { session: import('next-auth').Session; token: JWT }) {
      session.user.id = token.id as string;
      session.user.isAdmin = token.isAdmin;
      session.user.role = token.role;
      session.user.referralCode = token.referralCode;
      session.user.phone = token.phone;
      session.user.balance = token.balance;
      return session;
    },

    async signIn({ user, account, profile }: { user: NextAuthUser; account: { provider?: string } | null; profile?: unknown }) {
      // Allow all verified users to sign in
      if (account?.provider === 'credentials') {
        return true;
      }

      // For OAuth providers, check if email is verified
      if (account?.provider === 'google') {
        const p = (profile || {}) as { email_verified?: boolean };
        return !!p.email_verified;
      }
      if (account?.provider === 'facebook') {
        const p = (profile || {}) as { verified?: boolean };
        return !!p.verified;
      }

      return true;
    },

    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      if (isNewUser) {
        console.log(`New user registered: ${user.email}`);
        // Could trigger welcome email here
      }
      console.log(`User signed in: ${user.email} via ${account?.provider}`);
    },

    async signOut({ token }) {
      console.log(`User signed out: ${token?.email}`);
    },
  },

  // Enable verbose NextAuth logging when NEXTAUTH_DEBUG=true
  debug: process.env.NEXTAUTH_DEBUG === 'true',
};

// Helper functions for authentication

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Pakistani phone number validation
export const validatePakistaniPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+92|0)?[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\s|-/g, ''));
};

// Pakistani CNIC validation
export const validateCNIC = (cnic: string): boolean => {
  const cnicRegex = /^[0-9]{5}-[0-9]{7}-[0-9]$/;
  return cnicRegex.test(cnic);
}; 