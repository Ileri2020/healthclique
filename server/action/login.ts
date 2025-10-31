"use server"

import { signIn } from "../auth.ts";

const login = async ( formData : FormData) => {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

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

};

export {login}