"use client"
import Link from "next/link";
import Links from "../../data/links";
import { usePathname } from 'next/navigation';
import { useSession } from "next-auth/react";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const inventoryLinks = [
  { path: "/stock", name: "Stock", title: "Stock" },
  { path: "/sales", name: "Sales", title: "Sales" },
  { path: "/count", name: "Count", title: "Stock count" },
  { path: "/stock/products", name: "Products", title: "Products" },
  { path: "/expenses", name: "Expenses", title: "Expenses" },
  { path: "/vitals", name: "Vitals", title: "Blood pressure tracker" },
  { path: "/staff", name: "Staff signup", title: "Register a customer" },
  { path: "/sales/all", name: "All sales", title: "All sales" },
  { path: "/inventory/analytics", name: "Analytics", title: "Inventory analytics" },
  { path: "/stock/all", name: "All stock", title: "All stock" },
]

const Nav = () => {
  const { data: session } = useSession();
  const pathname = usePathname();        
  const inventoryMode = pathname.startsWith("/inventory/") || pathname.startsWith("/stock/") || pathname.startsWith("/sales/") || pathname.startsWith("/count") || pathname.startsWith("/expenses") || pathname === "/stock" || pathname === "/sales" || pathname.startsWith("/vitals") || pathname.startsWith("/staff")
  const canManageUsers = session?.user?.role === "admin" || session?.user?.role === "staff"
  const navigationLinks = inventoryMode ? inventoryLinks.filter((link) => link.path !== "/staff" || canManageUsers) : Links.Links
  const visibleLinks = navigationLinks.slice(0, 6)
  const overflowLinks = navigationLinks.slice(6)
  const isLinkActive = (path: string) => pathname === path || (path === "/stock" && pathname.startsWith("/stock/")) || (path === "/sales" && pathname.startsWith("/sales/")) || (path === "/count" && pathname.startsWith("/count/")) || (path === "/expenses" && pathname.startsWith("/expenses")) || (path === "/vitals" && pathname.startsWith("/vitals")) || (path === "/staff" && pathname.startsWith("/staff"))
  return (
    <nav className="flex items-center gap-6 text-xl">
      <TooltipProvider>
        {visibleLinks.map((link, index) => {
          const isActive = isLinkActive(link.path)
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
        {overflowLinks.length ? <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" aria-label="More navigation links" title="More navigation links" className={`h-9 w-9 shrink-0 ${overflowLinks.some((link) => isLinkActive(link.path)) ? "text-accent" : ""}`}>
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            {overflowLinks.map((link) => (
              <DropdownMenuItem key={link.path} asChild>
                <Link href={link.path} className={`flex w-full items-center justify-between gap-4 ${isLinkActive(link.path) ? "font-semibold text-accent" : ""}`}>
                  <span>{link.title}</span>
                  {isLinkActive(link.path) ? <span aria-hidden="true">•</span> : null}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu> : null}
      </TooltipProvider>
    </nav>
  )
}

export default Nav

