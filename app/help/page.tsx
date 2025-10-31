"use client"
import { motion } from "framer-motion"

const Help = () => {
  return (
    <motion.section
      initial = {{ opacity: 0 }}
      animate = {{
        opacity : 1,
        transition : { delay: 0.5, duration: 0.6, ease: "easeIn"}
      }}
      className="w-[100vw] overflow-clip"
    >
      help
    </motion.section>
  )
}

export default Help
