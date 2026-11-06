import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Inventory desk | HealthClique",
  description: "A focused sales and stock workspace.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}