// @ts-nocheck
'use server'

import { signIn } from "@/auth";
// import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";

export const GoogleSignIn =async () => {
//   const googleSignIn = async () => {
//     "use server";
//     await signIn("google");
//   }
  // The above won't work. Instead, define it like this:
  const googleSignInAction = async () => {
    "use server";
    await signIn("google");
  }

  return (
    <div className="m-2">
      <form action={googleSignInAction}>
        <button
          className=" relative group/btn flex space-x-2 items-center justify-start px-4 w-full text-black rounded-md h-10 font-medium shadow-input bg-gray-50 dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_var(--neutral-800)]"
          type="submit"
        >
          <FcGoogle className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
          <span className="text-neutral-700 dark:text-neutral-300 text-sm">
            Google
          </span>
        </button>
      </form>
    </div>
  );
}


export const googleSignIn = async () => {
    'use server'
    await signIn("google");
  }