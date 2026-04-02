"use client";
import Link from "next/link";
import Nav from "./nav";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import Sidenav from "./sidenav";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Suspense } from "react";
import {
  AiOutlineSearch,
  AiOutlineHome,
  AiOutlineShop,
  AiOutlineMan,
  AiOutlineContacts,
} from "react-icons/ai";
import { Advert } from "@/components/myComponents/subs";
import logo from "@/public/whitelogo.png";
import greenlogo from "@/public/greenlogo.png";
import Image from "next/image";
import { Cart } from "../myComponents/subs/cart";
import { GlobalSearch } from "../myComponents/subs/GlobalSearch";
import { NotificationBell } from "../myComponents/subs/NotificationUI";
import { useSession } from "next-auth/react";
import { useAppContext } from "@/hooks/useAppContext";
import { useEffect } from "react";
import { initializeAffiliateTracking } from "@/lib/affiliate-tracking";

const Navbar = (): JSX.Element => {
  const { setUser, user } = useAppContext();
  const { data: session, status, update } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user && user.email === "nil") {
      setUser({
        ...session.user,
        avatarUrl: session.user.image,
      });
    }
    initializeAffiliateTracking();
  }, [status, session, user.email, setUser]);

  return (
    <div className="sticky top-0 z-30 w-[100vw] overflow-clip flex flex-col m-0 p-0">
      <header className="w-[100%] py-4 bg-background sticky top-0 z-10 shadow-md shadow-accent/40">
        <div className="container mx-auto flex justify-between items-center h-[50px] overflow-clip">
          <div className="lg:hidden">
            <Sidenav />
          </div>
          <Link
            href={"/"}
            className="flex dark:hidden flex-1 md:flex-none max-h-[43px] md:max-h-[50px] overflow-clip justify-center items-center py-5 /rounded-full"
          >
            <Image src={greenlogo} alt="" className="w-[100px] h-auto" />
          </Link>
          <Link
            href={"/"}
            className="hidden dark:flex flex-1 md:flex-none max-h-[43px] md:max-h-[50px] overflow-clip justify-center items-center py-5 /rounded-full"
          >
            <Image src={logo} alt="" className="w-[100px] h-auto" />
          </Link>

          <div className="flex items-center gap-2 lg:hidden">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant={"outline"}
                  className="relative flex justify-center items-center rounded-full w-[35px] h-[35px] overflow-clip text-accent text-xl"
                >
                  <AiOutlineSearch />
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 border-none bg-transparent shadow-none w-11/12 overflow-visible translate-y-[-30vh]">
                <DialogTitle className="sr-only">Search</DialogTitle>
                <GlobalSearch placeholder="Search medications..." className="w-full" />
              </DialogContent>
            </Dialog>
            <Cart />
            <NotificationBell />
          </div>

          <div className="hidden lg:block flex-1 max-w-md mx-4">
            <GlobalSearch
              placeholder="Search medications..."
              className="h-10"
            />
          </div>

          <div className="hidden lg:flex items-center gap-8">
            <Nav />
            {/*
                <Link to="/contact">
                  <Button className="">Hire me</Button>
                </Link>
              */}
            <Cart />
            <NotificationBell />
            <ModeToggle />
          </div>
        </div>
        <Advert />
      </header>
    </div>
  );
};

export default Navbar;
