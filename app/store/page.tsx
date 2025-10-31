"use client"
import { motion } from "framer-motion"
import { Filters, Stocks } from "@/components/myComponents/subs"


const Store = () => {
  return (
    <motion.section
      initial = {{ opacity: 0 }}
      animate = {{
        opacity : 1,
        transition : { delay: 0.5, duration: 0.6, ease: "easeIn"}
      }}
      className="w-[100vw] overflow-clip p-1"
    >
      <div className="relative w-full h-full flex flex-col justify-center items-center">
        {/* <Filters /> */}
        <Stocks />
      </div>
    </motion.section>
  )
}

export default Store
