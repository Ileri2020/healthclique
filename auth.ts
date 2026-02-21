// @ts-nocheck
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt, { compare } from "bcryptjs";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),

    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      authorize: async (credentials) => {
        const email = credentials.email as string | undefined;
        const password = credentials.password as string | undefined;

        if (!email || !password) {
          throw new CredentialsSignin("Please provide both email & password");
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        if (!user.password) {
          throw new Error("This account was created with Google. Please sign in with Google.");
        }

        const isMatched = await compare(password, user.password);

        if (!isMatched) {
          throw new Error("Password did not match");
        }

        const userData = {
          id: user.id,
          name: user.name,
          email: user.email,
          contact: user.contact,
          role: user.role,
          avatarUrl: user.avatarUrl,
        };

        return userData;
      },
    }),
  ],

  callbacks: {
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id;
      }
      if (token?.role) {
        session.user.role = token.role;
      }
      if (token?.avatarUrl) {
        session.user.avatarUrl = token.avatarUrl;
      }
      return session;
    },

    async jwt({ token, user, account }) {
      // When signing in for the first time
      if (account?.provider === "google") {
        if (user?.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role ?? "customer";
            token.avatarUrl = dbUser.avatarUrl;
          }
        }
      }

      // When signing in with credentials
      if (account?.provider === "credentials" && user) {
        token.id = user.id;
        token.role = user.role;
        token.avatarUrl = user.avatarUrl;
      }

      return token;
    },

    signIn: async ({ user, account }) => {
      if (account?.provider === "google") {
        try {
          const { email, name, image, id } = user;

          // Create high-quality Google avatar URL
          const googleAvatar =
            image?.replace(/=s\d+(-c)?$/, "=s500-c") ?? image;

          const defaultAvatar =
            "https://res.cloudinary.com/dc5khnuiu/image/upload/v1752627019/uxokaq0djttd7gsslwj9.png";

          const existingUser = await prisma.user.findUnique({
            where: { email },
          });

          // 1️⃣ USER DOES NOT EXIST → CREATE (no password required for OAuth)
          if (!existingUser) {
            await prisma.user.create({
              data: {
                email,
                name,
                avatarUrl: googleAvatar ?? defaultAvatar,
                providerid: await bcrypt.hash(
                  id,
                  parseInt(process.env.SALT_ROUNDS || "10")
                ),
                // password is intentionally omitted — it's optional for OAuth users
              },
            });

            return true;
          }

          // 2️⃣ USER EXISTS → UPDATE avatarUrl if needed
          const shouldUpdateAvatar =
            !existingUser.avatarUrl ||
            existingUser.avatarUrl.trim() === "" ||
            existingUser.avatarUrl === defaultAvatar;

          if (shouldUpdateAvatar && googleAvatar) {
            await prisma.user.update({
              where: { email },
              data: { avatarUrl: googleAvatar },
            });
          }

          return true;
        } catch (error) {
          console.error("Google SignIn Error:", error);
          throw new Error("Error while creating/updating user");
        }
      }

      // Credentials provider
      if (account?.provider === "credentials") {
        return true;
      }

      return false;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 10 * 60 * 60, // 10 hours
  },

  jwt: {
    maxAge: 10 * 60 * 60, // 10 hours
  },

  debug: false,
});