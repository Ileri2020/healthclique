import { NextApiRequest, NextApiResponse } from 'next';
import connect from '@/server/config/mongodb';
import User from '@/server/db/mongodb/models/users';
import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { signIn } from "@/server/auth.ts";



export const POST = async (req: Request) => {
    try{
      const body =await req.json()
      const {email, password} = body
      console.log(email)

    if (!email && !password) {
         console.log("invalid account")
         return
    }

    try{
        await signIn("credentials", {
            // redirect: false,
            // callbackUrl: "/account",
            email,
            password,
        })
    } catch (error) {
        console.log("credentials sign in error")
    }

      return new NextResponse(JSON.stringify({message : "signed in user"}), {status: 200})
    } catch (error) {
      return new NextResponse(JSON.stringify({error : error}), {status: 500})
    }
  }