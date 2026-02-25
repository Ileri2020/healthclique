"use client"
import  { lazy } from "react"
import dynamic from "next/dynamic"

export const Advert = dynamic(()=>import('./advert'), { ssr: false,}) 
export const Dashboard = dynamic(()=>import("./dashboard"), { ssr: false,}) 
export const Filters = dynamic(()=>import("./filters"), { ssr: false, }) 
export const Gallery = dynamic(()=>import("./gallery"), { ssr: false, }) 
export const Item = dynamic(()=>import("./item"), { ssr: false,}) 
export const Login = dynamic(()=>import("./login"), { ssr: false, }) 
export const Search = dynamic(()=>import("./search"), { ssr: false, }) 
export const Signup = dynamic(()=>import("./signup"), { ssr: false, }) 
export const Stocks = dynamic(()=>import("./stocks"), { ssr: false, }) 
// export const Footer = dynamic(()=>import("./footer"), { ssr: false, }) 
export const CartItems = dynamic(()=>import("./cartitem"), { ssr: false, }) 
export const FeaturedIngredients = dynamic(()=>import("./featuredIngredients"), { ssr: false, })
export const GlobalSearch = dynamic(()=>import("./GlobalSearch").then(mod => mod.GlobalSearch), { ssr: false, })
export const SnapPrescription = dynamic(()=>import("./SnapPrescription").then(mod => mod.SnapPrescription), { ssr: false, })
export const NotificationUI = dynamic(()=>import("./NotificationUI").then(mod => mod.NotificationUI), { ssr: false, })
export { SpecialOrderForm } from "./SpecialOrderForm"
 