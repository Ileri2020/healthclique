"use client"
import Link from "next/link";
import Links from "../../data/links";
import { usePathname } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const Nav = () => {
  const pathname = usePathname();        
  return (
    <nav className="flex gap-8 text-xl">
      <TooltipProvider>
        {Links.Links.map((link, index) => {
          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Link href={link.path} className={` ${link.path === pathname && "text-accent border-b-2 border-accent"} capitalize font-medium hover:text-accent transition-all`}>
                  {link.name}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-sm font-semibold bg-primary text-primary-foreground border-none">
                <p>{link.title}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </TooltipProvider>
    </nav>
  )
}

export default Nav

