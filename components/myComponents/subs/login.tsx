"use client"
import React, { FormEvent, useEffect, useRef, useState } from 'react'
//import dynamic from 'next/dynamic'
// const AlertDialog = dynamic(() => import('@/components/ui/alert-dialog').then((e) => e.AlertDialog),{ssr: false,})
// const AlertDialogAction = dynamic(() => import('@/components/ui/alert-dialog').then((e) => e.AlertDialogAction),{ssr: false,})
// const AlertDialogCancel = dynamic(() => import('@/components/ui/alert-dialog').then((e) => e.AlertDialogCancel),{ssr: false,})
// const AlertDialogContent = dynamic(() => import('@/components/ui/alert-dialog').then((e) => e.AlertDialogContent),{ssr: false,})
// const AlertDialogDescription = dynamic(() => import('@/components/ui/alert-dialog').then((e) => e.AlertDialogDescription),{ssr: false,})
// const AlertDialogFooter = dynamic(() => import('@/components/ui/alert-dialog').then((e) => e.AlertDialogFooter),{ssr: false,})
// const AlertDialogHeader = dynamic(() => import('@/components/ui/alert-dialog').then((e) => e.AlertDialogHeader),{ssr: false,})
// const AlertDialogTitle = dynamic(() => import('@/components/ui/alert-dialog').then((e) => e.AlertDialogTitle),{ssr: false,})
// const AlertDialogTrigger = dynamic(() => import('@/components/ui/alert-dialog').then((e) => e.AlertDialogTrigger),{ssr: false,})
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
//import { cookies } from "next/headers";
// import {login} from '@/server/action/login'
import { redirect } from 'next/navigation'
import axios from 'axios'
// import { getSession } from '@/server/action/getSession'
import { useAppContext } from '@/hooks/useAppContext'
import { FcGoogle } from 'react-icons/fc'
import { googleSignIn } from './googlesignin'
import Signup from './signup'



const Login = () => {
  const { selectedVideo, setSelectedVideo, useMock, setUser } = useAppContext();
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [editId, setEditId] = useState(null);

  // useEffect(() => {
  //   fetchUsers();
  // }, []);

  const form = useRef<HTMLFormElement>(null);

  const fetchUser = async () => {
    const res = await axios.get('/api/dbhandler?model=user');
    console.log(formData)
    setUsers(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await axios.post('/api/auth/login', formData);
    console.log("axios response",res.data)
    setUser(res.data)
    resetForm();
    // fetchUser();
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
    });
    setEditId(null);
  };

  return (
    <div className='inline'>
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline">Login</Button>
        </DrawerTrigger>
        <DrawerContent className='flex flex-col justify-center items-center py-10 /bg-red-500 max-w-5xl mx-auto'>

          <DrawerHeader>
            <DrawerTitle className='w-full text-center'>Login to <span className='text-accent'>Lois Food and Spices</span></DrawerTitle>
            <DrawerDescription></DrawerDescription>
          </DrawerHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-10 bg-secondary rounded-xl max-w-xl"> 
          
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            
            <DrawerFooter className="flex flex-row w-full gap-2 mt-2">
              {/* <Button>Submit</Button> */}
              <DrawerClose className='flex-1' asChild>
                <Button className='flex-1' variant="outline">Cancel</Button>
              </DrawerClose>
              <Button type="submit" className="flex-1 before:ani-shadow w-full">Login &rarr;</Button>
            </DrawerFooter>
          </form>
          {/* <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter> */}
          <div className="w-full my-2">
            <form
              action={googleSignIn}
            >
              <Button
                className=" relative w-full max-w-[300px] mx-auto flex /space-x-2 items-center justify-center text-black rounded-md h-10 font-medium shadow-input bg-gray-50 dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_var(--neutral-800)]"
                type="submit"
              >
                <FcGoogle className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
                <span className="text-neutral-700 dark:text-neutral-300 text-sm">
                  Google
                </span>
              </Button>
            </form>
          </div>
          <div className="w-full my-2">
            <Signup />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}



// const Login = () => {
//   // const csrfToken = cookies().get("authjs.csrf-token")?.value ?? "";
// // <input type="hidden" name="csrfToken" value={csrfToken} />

//   // const session = await getSession()
//   // const user = session?.user;
//   // console.log(user)

//   // if (user) redirect("/home")
//   console.log("sign in component active")

//   const [details, setDetails] = useState({
//     email : "",
//     password : "",
//   })

//   const [render, setRender] = useState(0);

//   // useEffect(() => {
//   // }, [render]);

//   // interface RefObject<T> {
//   //   readonly current: T | null
//   // }

//   //   const form = useRef<HTMLFormElement>(null); form  as RefObject<HTMLFormElement>}


//   const submitToServer = () => {
//     fetch( "/api/login", {
//       //mode: 'no-cors',  mode: 'no-cores'   mode: 'cores'
//       method: 'POST',
//       headers: {
//           "Content-Type": "application/json",
//       },
//       body: JSON.stringify(details),
//       // body: JSON.stringify(form)
//     })
//     .then((response) => response.json())
//     .then((data) => {setRender((prevRender) => (prevRender++)); alert("login succesful"); redirect("/account")})
//     .catch((error) => console.error(error));
//   }

//   const signin = (e : FormEvent) => {
//     e.preventDefault();
    
//     submitToServer()
//   };


//     const handleChange = (e : any)=>{
//       const { name, value } = e.target;

//       setDetails((prevFormData) => ({ ...prevFormData, [name]: value }));
//     }

//   return (
//     <Drawer>
//       <DrawerTrigger asChild>
//         <Button variant="outline">Login</Button>
//       </DrawerTrigger>

//       <DrawerContent className='flex flex-col justify-center items-center py-10 /bg-red-500 max-w-5xl mx-auto'>
//           <DrawerHeader>
//             <DrawerTitle className='w-full text-center'>Login to <span className='text-accent'>Succo</span></DrawerTitle>
//             <DrawerDescription></DrawerDescription>
//         </DrawerHeader>
//         <form onSubmit={signin} className="flex flex-col gap-4 p-10 bg-secondary rounded-xl max-w-xl">
//                 <div className="/grid /grid-cols-1 /md:grid-cols-2 /gap-2 flex flex-col gap-2">
//                   <div className='flex flex-row justify-between items-center'>
//                     <Label htmlFor="email">Email</Label>
//                     <Input type="email" id="email" name="email" onChange={handleChange} placeholder="example@gmail.com" className="rounded-sm bg-background w-56" />
//                   </div>

//                   <div className='flex flex-row justify-between items-center'>
//                     <Label htmlFor="password">Password</Label>
//                     <Input type="password" id='password' name='password' onChange={handleChange} placeholder="*********" className="rounded-sm bg-background w-56" />
//                   </div>
//                 </div>
                
//                 <DrawerFooter className="flex flex-row w-full gap-2 mt-2">
//                   <DrawerClose className='flex-1' asChild>
//                     <Button className='flex-1' variant="outline">Cancel</Button>
//                 </DrawerClose>
//                   {/* <Button type="submit"  className='flex-1 before:ani-shadow w-full'>Login &rarr;</Button> */}
//                   <Button type="submit"  className='flex-1 before:ani-shadow w-full'>Login &rarr;</Button>
//                 </DrawerFooter>
//             </form>
//         {/* <AlertDialogFooter>
//           <AlertDialogCancel>Cancel</AlertDialogCancel>
//           <AlertDialogAction>Continue</AlertDialogAction>
//         </AlertDialogFooter> */}

//       </DrawerContent>
//     </Drawer>
//   )
// }

export default Login
