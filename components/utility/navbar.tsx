"use client"
import Link from 'next/link';
import Nav from './nav';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Sidenav from './sidenav';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Suspense } from "react"
import {AiOutlineSearch, AiOutlineHome, AiOutlineShop, AiOutlineMan, AiOutlineContacts} from "react-icons/ai"
import { Advert } from "@/components/myComponents/subs"
import logo from "@/public/whitelogo.png"
import greenlogo from "@/public/greenlogo.png"
import Image from "next/image";
import { Cart } from '../myComponents/subs/cart';
import { SearchInput } from '../myComponents/subs/searchcomponent';
import { useSession } from "next-auth/react";
import { useAppContext } from '@/hooks/useAppContext';

const Navbar = () : JSX.Element => {
  const {setUser, user } = useAppContext();
  const { data: session, status, update } = useSession();
  if (status === "authenticated" && user.email === "nil") {
    // console.log('navbar session', session)
    setUser({
      ...session.user,
      avatarUrl: session.user.image
    });
  }
  return (
    <div className="w-[100vw] overflow-clip flex flex-col m-0 p-0 relative">
      <header className="w-[100%] py-4 bg-background sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center h-[50px] overflow-clip">
            <div className="lg:hidden">
              <Sidenav />
            </div>
            <Link href={"/"} className="flex dark:hidden flex-1 md:flex-none max-h-[43px] md:max-h-[50px] overflow-clip flex justify-center items-center py-5 /rounded-full">
                <Image src={greenlogo} alt="" className="w-[100px] h-auto"/>
            </Link>
            <Link href={"/"} className="hidden dark:flex flex-1 md:flex-none max-h-[43px] md:max-h-[50px] overflow-clip justify-center items-center py-5 /rounded-full">
                <Image src={logo} alt="" className="w-[100px] h-auto"/>
            </Link>
            
            
            <Button variant={"outline"} className="lg:hidden relative flex justify-center items-center rounded-full w-[35px] h-[35px] overflow-clip text-accent text-xl"><AiOutlineSearch /></Button>

            <SearchInput />


            <div className="hidden lg:flex items-center gap-8">

              <Nav/>
              {/*
                <Link to="/contact">
                  <Button className="">Hire me</Button>
                </Link>
              */}
              <Cart />
              <ModeToggle />
            </div>
        </div>
        <Advert />
      </header>
    </div>
  )
}

export default Navbar
