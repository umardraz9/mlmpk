// NextAuth type declarations
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string
      isAdmin?: boolean
      role?: string
      referralCode?: string
      phone?: string
      balance?: number
      walletBalance?: number // Keep for backward compatibility
    }
  }

  interface User {
    id: string
    email: string
    name: string
    image?: string
    isAdmin?: boolean
    role?: string
    referralCode?: string
    phone?: string
    balance?: number
    walletBalance?: number // Keep for backward compatibility
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    isAdmin?: boolean
    role?: string
    referralCode?: string
    phone?: string
    balance?: number
  }
}