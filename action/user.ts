//  @ts-nocheck
"use server";

// import connectDB from "@/lib/db";
// import { User } from "@/models/User";
import { redirect } from "next/navigation";
import { CredentialsSignin } from "next-auth";
import { signIn } from "@/auth";
import { compare, hash } from 'bcrypt';
import { PrismaClient } from '@prisma/client';
// import { compareSync, hashSync } from "bcryptjs";
const prisma = new PrismaClient();

const login = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", {
      redirect: false,
      callbackUrl: "/",
      email,
      password,
    });
  } catch (error) {
    const someError = error as CredentialsSignin;
    return someError.cause;
  }
  redirect("/");
};

const register = async (formData: FormData) => {
  const username = formData.get("username") as string;
  // const lastName = formData.get("lastname") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if ( !username || !email || !password) {
    throw new Error("Please fill all fields");
  }

  // await connectDB();

  // existing user
  const existingUser = await prisma.user.findUnique({
    where: { email },
    // select: { password: true, role: true },
  });
  if (existingUser) throw new Error("User already exists");

  const hashedPassword = await hash(password, parseInt(process.env.SALT_ROUNDS));

  // await User.create({ firstName, lastName, email, password: hashedPassword });
  await prisma.user.create({
    data: {
      email,
      username,
      // avatarUrl : image,
      // authProviderId: id,
      password: hashedPassword,
    },
  });
  console.log(`User created successfully 🥂`);
  redirect("/login");
};

// const fetchAllUsers = async () => {
//   await connectDB();
//   const users = await User.find({});
//   return users;
// };

export { register, login };
