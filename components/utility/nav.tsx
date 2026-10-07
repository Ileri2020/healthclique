"use client"
import Link from "next/link";
import Links from "../../data/links";
import { usePathname } from 'next/navigation';
import { useSession } from "next-auth/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const inventoryLinks = [
  { path: "/inventory/analytics", name: "Analytics", title: "Inventory analytics" },
  { path: "/stock", name: "Stock", title: "Stock" },
  { path: "/sales", name: "Sales", title: "Sales" },
  { path: "/vitals", name: "Vitals", title: "Blood pressure tracker" },
  { path: "/staff", name: "Staff signup", title: "Register a customer" },
  { path: "/stock/all", name: "All stock", title: "All stock" },
  { path: "/sales/all", name: "All sales", title: "All sales" },
  { path: "/stock/products", name: "Products", title: "products" },
  { path: "/expenses", name: "Expenses", title: "Expenses" },
]

const Nav = () => {
  const { data: session } = useSession();
  const pathname = usePathname();        
  const inventoryMode = pathname.startsWith("/inventory/") || pathname.startsWith("/stock/") || pathname.startsWith("/sales/") || pathname.startsWith("/expenses") || pathname === "/stock" || pathname === "/sales" || pathname.startsWith("/vitals") || pathname.startsWith("/staff")
  const canManageUsers = session?.user?.role === "admin" || session?.user?.role === "staff"
  const navigationLinks = inventoryMode ? inventoryLinks.filter((link) => link.path !== "/staff" || canManageUsers) : Links.Links
  return (
    <nav className="flex gap-8 text-xl">
      <TooltipProvider>
        {navigationLinks.map((link, index) => {
          const isActive = pathname === link.path || (link.path === "/stock" && pathname.startsWith("/stock/")) || (link.path === "/sales" && pathname.startsWith("/sales/")) || (link.path === "/expenses" && pathname.startsWith("/expenses")) || (link.path === "/vitals" && pathname.startsWith("/vitals")) || (link.path === "/staff" && pathname.startsWith("/staff"))
          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Link href={link.path} className={` ${isActive && "text-accent border-b-2 border-accent"} capitalize font-medium hover:text-accent transition-all`}>
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

