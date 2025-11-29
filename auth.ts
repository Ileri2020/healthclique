// @ts-nocheck
import NextAuth, { CredentialsSignin } from "next-auth";
// @ts-nocheck
import Credentials from "next-auth/providers/credentials";
// import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";
// import connectDB from "./lib/db";
// import { User } from "./models/User";
import bcrypt, { compare } from "bcryptjs";
// import bcrypt, { compare } from 'bcrypt';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();





export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true, 
  providers: [
    // Github({
    //   clientId: process.env.GITHUB_CLIENT_ID,
    //   clientSecret: process.env.GITHUB_CLIENT_SECRET,
    // }),

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

        // await connectDB();

        // const user = await User.findOne({ email }).select("+password +role");
        const user = await prisma.user.findUnique({
          where: { email },
          // select: { password: true, role: true },
        });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        if (!user.password) {
          throw new Error("Invalid email or password");
        }

        const isMatched = await compare(password, user.password);

        if (!isMatched) {
          throw new Error("Password did not matched");
        }

        const userData = {
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

  // pages: {
  //   signIn: "/login",
  // },

  callbacks: {
    // async session({ session, token, user }) {
    //   if (token?.sub && token?.role) {
    //     //add whatever else to session here
    //     session.user.id = token.sub;
    //     session.user.role = token.role;
    //   }
    //   return session;
    // },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id;     // <-- PASS ID INTO SESSION
      }
      if (token?.role) {
        session.user.role = token.role;
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
            token.id = dbUser.id;   // <-- PASS DB USER ID
            token.role = dbUser.role ?? "user"; 
          }
        }
      }
    

      // When signing in with credentials
      if (account?.provider === "credentials" && user) {
        token.id = user.id;         // <-- PASS USER ID
        token.role = user.role;
      }

      return token;
    },

    //    async jwt({ token, user }) {
    //   if (user) {
    //     token.role = user.role;
    //   }
    //   return token;
    // },


    signIn: async ({ user, account }) => {
      if (account?.provider === "google") {
        try {
          const { email, name, image, id } = user;

          // Create high-quality Google avatar URL
          const googleAvatar =
            image?.replace(/=s\d+(-c)?$/, "=s500-c") ?? image;

          const defaultAvatar =
            "https://res.cloudinary.com/dc5khnuiu/image/upload/v1752627019/uxokaq0djttd7gsslwj9.png"; // <-- your Prisma default

          const existingUser = await prisma.user.findUnique({
            where: { email }
          });

          // 1️⃣ USER DOES NOT EXIST → CREATE
          if (!existingUser) {
            await prisma.user.create({
              data: {
                email,
                name,
                avatarUrl: googleAvatar,
                providerid: await bcrypt.hash(
                  id,
                  parseInt(process.env.SALT_ROUNDS)
                ),
              },
            });

            return true;
          }

          // 2️⃣ USER EXISTS → CHECK IF avatarUrl SHOULD BE UPDATED
          const shouldUpdateAvatar =
            !existingUser.avatarUrl ||               // empty avatar
            existingUser.avatarUrl.trim() === "" ||  // blank avatar
            existingUser.avatarUrl === defaultAvatar; // Prisma default avatar

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
});







// signin user from 
// google: {"id":"4bebdf1d-2753-4047-ab31-8a6a9db26d0c",
//   "name":"Adepoju Ololade",
//   "email":"adepojuololade2020@gmail.com",
//   "image":"https://lh3.googleusercontent.com/a/ACg8ocLdrFmljf-SPXpYAl7HcdIPIVgBam0jRZ5YkySzCZW8zI7oIik2=s96-c"
// }
//  GET /api/auth/callback/google?code=4%2F0Ab32j90_a7v-5QU2RibG3S8IjethT361aaX-zs2MbKjnfg5ipPemiIGXQFosoJmCzXEtJg&scope=
// email+profile+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email
// +openid&authuser=0&prompt=consent 302 in 21974ms