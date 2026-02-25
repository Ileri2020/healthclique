"use client"
import { motion } from "framer-motion"
import { Filters, Stocks, GlobalSearch, SpecialOrderForm } from "@/components/myComponents/subs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageCircle, FlaskConical } from "lucide-react"


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
        <div className="flex flex-col md:flex-row justify-between items-stretch bg-accent/10 p-2 md:p-3 rounded-2xl mb-3 gap-3">
          <div className="flex-1 flex items-center gap-3 md:gap-4 bg-background/50 p-3 rounded-xl border border-accent/20">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <MessageCircle className="text-accent w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-black">Need help?</h2>
              <p className="text-[10px] md:text-xs text-muted-foreground font-bold">Our pharmacists are ready to consult.</p>
            </div>
            <Link href="/contact" className="ml-auto">
              <Button size="sm" variant="default" className="bg-accent hover:bg-accent/90 h-8 text-[10px] font-black uppercase">Talk Now</Button>
            </Link>
          </div>

          <div className="flex-1 flex items-center gap-3 md:gap-4 bg-amber-500/5 p-3 rounded-xl border border-amber-500/20">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <FlaskConical className="text-amber-600 w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-black">Scarce Medicine?</h2>
              <p className="text-[10px] md:text-xs text-muted-foreground font-bold">Order special formulations or hard-to-find drugs.</p>
            </div>
            <SpecialOrderForm>
              <Button size="sm" variant="outline" className="ml-auto border-amber-500/50 text-amber-600 hover:bg-amber-600 hover:text-white h-8 text-[10px] font-black uppercase">Order Special</Button>
            </SpecialOrderForm>
          </div>
        </div>

        <div className="mb-2 w-full p-1 max-w-2xl mx-auto">
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
