import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id?: string
      role?: string
      avatarUrl?: string
      addresses?: any[]
    } & DefaultSession["user"]
  }

  interface User {
    id?: string
    role?: string
    avatarUrl?: string
    addresses?: any[]
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** OpenID ID Token */
    id?: string
    role?: string
    avatarUrl?: string
    addresses?: any[]
  }
}
