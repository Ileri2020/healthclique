import type { Metadata } from "next";
// import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "@/store/providers";
import Navbar from "@/components/utility/navbar";
import { AppContextProvider } from "@/context/appContext";
import { Footer } from "@/components/myComponents/subs/footer";
import { CartProvider } from "@/hooks/use-cart";
import { SessionProvider } from "next-auth/react"
import { usersession } from "@/session";
// import {Roboto} from "next/font/google"

// const roboto = Roboto({
//   subsets : ["latin"], style : "normal"
// });

// const geistSans = localFont({
//   src: "./fonts/GeistVF.woff",
//   variable: "--font-geist-sans",
//   weight: "100 900",
// });
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });

const metadata: Metadata = {
  title: "Health Click",
  description: "Your one stop shop for health needs",
};

export const SEO_CONFIG = {
  description:'Your one stop shop for health needs',
  fullName: "Health Click",
  name: "Health Click",
  slogan: "your health on click always",
};

export const SYSTEM_CONFIG = {
  redirectAfterSignIn: "/dashboard/uploads",
  redirectAfterSignUp: "/dashboard/uploads",
  // repoName: "relivator",
  // repoOwner: "blefnk",
  // repoStars: true,
};

interface Session {
  user?: {
    name?: string
    email?: string
    image?: string
  }
  expires: string
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session : Session | null =  await usersession();
  return (
    <html lang="en">
      <SessionProvider  session={session}>
        <AppContextProvider>
          <body
            className={`font-roboto_mono antialiased`}
            // ${geistSans.variable} ${geistMono.variable}
          >
            <Providers>
              <CartProvider>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem
                    disableTransitionOnChange
                  >
                    <Navbar />
                    {children}
                    <Footer />
                  </ThemeProvider>
              </CartProvider>
            </Providers>
          </body>
        </AppContextProvider>
      </SessionProvider>
    </html>
  );
}
