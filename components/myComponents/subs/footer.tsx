import { Facebook, Github, Instagram, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";

import { SEO_CONFIG } from "../../../app/layout";
import { cn } from "@/lib/utils"
// import { Button } from "~/ui/primitives/button";
import { Button } from "@/components/ui/button";

export function Footer({ className }: { className?: string }) {
  const socialMediaLinks = [
    { href: "#", icon: <Facebook className="h-4 w-4" />, label: "Facebook" },
    { href: "#", icon: <Twitter className="h-4 w-4" />, label: "Twitter" },
    { href: "#", icon: <Instagram className="h-4 w-4" />, label: "Instagram" },
    //{ href: "#", icon: <Github className="h-4 w-4" />, label: "GitHub" },
    { href: "#", icon: <Linkedin className="h-4 w-4" />, label: "LinkedIn" },
  ];
  
  const pageLinks = [
    { href: "/home", label: "Home" },
    { href: "/about", label: "About Us" },
    { href: "/store", label: "Store" },
    { href: "/help", label: "Help Center" },
    { href: "/account", label: "User Account" },
  ];
  
  const categoryLinks = [
    { href: "/", label: "Spices" },
    { href: "/", label: "Food Item" },
    { href: "/", label: "Cloth" },
    { href: "/", label: "Poultry Food" },
    { href: "/", label: "Content Tools" },
  ];
  
  const supportLinks = [
    { href: "/help", label: "Help Center" },
    { href: "/contact", label: "Contact and Advert" },
    { href: "/privacy", label: "Privacy Policy" },  
    { href: "/terms", label: "Terms of Service" },
  ];
  
  const footerLinks = [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/cookies", label: "Cookies" },
    { href: "/sitemap", label: "Sitemap" },
  ];

  const columns = [
    {
      label : 'Pages',
      links : pageLinks,
    },
    {
      label : 'Categories',
      links : categoryLinks,
    },
    {
      label : 'Support and Advert',
      links : supportLinks,
    },
  ]
  
  
  return (
    <footer className={cn("border-t bg-background", className)}>
      <div
        className={`container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 `}
      >
        <div
          className={`grid grid-cols-1 gap-8 md:grid-cols-4`}
        >
          <div className="space-y-4">
            <Link className="flex items-center gap-2" href="/">
              <span
                className={`
                  bg-gradient-to-r from-primary to-primary/70 bg-clip-text
                  text-xl font-bold tracking-tight text-transparent
                `}
              >
                {SEO_CONFIG.name}
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {SEO_CONFIG.description}
            </p>



            {/* socials */}
            <div className="flex space-x-4">
              {
                socialMediaLinks.map((social, index)=>(
                  <Button
                    className="h-8 w-8 rounded-full"
                    size="icon"
                    variant="ghost"
                    key={index}
                  >
                    {social.icon}
                    <span className="sr-only">{social.label}</span>
                  </Button>
                ))
              }
            </div>
          </div>

          {/* Collumns */}
          {columns.map((column, index)=>(
            <div key={index}>
              <h3 className="mb-4 text-sm font-semibold">{column.label}</h3>
              <ul className="space-y-2 text-sm">
                {
                  column.links.map((link, index)=>(
                    <li key={index}>
                      <Link
                        className={`
                          text-muted-foreground
                          hover:text-foreground
                        `}
                        href={link.href}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))
                }
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t pt-8">
          <div
            className={`
              flex flex-col items-center justify-between gap-4
              md:flex-row
            `}
          >
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} {SEO_CONFIG.name}. All rights
              reserved.
            </p>
            <div
              className={
                "flex items-center gap-4 text-sm text-muted-foreground"
              }
            >
              {
                footerLinks.map((link, index)=>(
                  <Link key={index} className="hover:text-foreground" href={link.href}>
                    {link.label}
                  </Link>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
