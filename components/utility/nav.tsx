"use client"
//import { Link, useLocation } from "react-router-dom"
import Link from "next/link";
import Links from "../../data/links";
import { usePathname } from 'next/navigation';


const Nav = () => {
  const pathname = usePathname();        
  return (
    <nav className="flex gap-8 text-xl">
      {Links.Links.map((link, index) => {
        return (
          <Link href={link.path} key={index} className={` ${link.path === pathname && "text-accent border-b-2 border-accent"} capitalize font-medium hover:text-accent transition-all`}>
            {link.name}
          </Link>
        )
      })}
      {/* <a href="/portfolio">Portfolio</a> */}
    </nav>
  )
}

export default Nav
