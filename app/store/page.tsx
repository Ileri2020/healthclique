"use client"
import { motion } from "framer-motion"
import { Filters, Stocks, GlobalSearch } from "@/components/myComponents/subs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"


const Store = () => {
  return (
    <motion.section
      initial = {{ opacity: 0 }}
      animate = {{
        opacity : 1,
        transition : { delay: 0.5, duration: 0.6, ease: "easeIn"}
      }}
      className="w-[100vw] overflow-clip p-2 md:p-4"
    >
      <div className="w-full md:container md:mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center bg-accent/10 p-3 md:p-6 rounded-2xl mb-3 gap-2">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
              <MessageCircle className="text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Need help with your prescription?</h2>
              <p className="text-sm text-muted-foreground">Our pharmacists are ready to help you.</p>
            </div>
          </div>
          <Link href="/contact">
            <Button variant="default" className="bg-accent hover:bg-accent/90">Talk to a Pharmacist</Button>
          </Link>
        </div>

        <div className="mb-10 max-w-2xl mx-auto">
          <GlobalSearch placeholder="Search more products in our store..." />
        </div>
        
        <div className="relative w-full h-full flex flex-col justify-center items-center">
          {/* <Filters /> */}
          <Stocks />
        </div>
      </div>
    </motion.section>
  )
}

export default Store
