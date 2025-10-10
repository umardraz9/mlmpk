import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      isAdmin?: boolean;
      role?: string;
      referralCode?: string;
      phone?: string;
      balance?: number;
      name?: string;
      email?: string;
      image?: string;
    };
  }

  interface User {
    id: string;
    isAdmin?: boolean;
    role?: string;
    referralCode?: string;
    phone?: string;
    balance?: number;
    name?: string;
    email?: string;
    image?: string;
  }

  interface JWT {
    id?: string;
    isAdmin?: boolean;
    role?: string;
    referralCode?: string;
    phone?: string;
    balance?: number;
  }
}
