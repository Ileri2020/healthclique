"use client"
import { motion } from "framer-motion"
import { Filters, Gallery} from "@/components/myComponents/subs"
import ECommerceSalesPage from "@/components/myComponents/salestore"
import Hero from "@/components/myComponents/subs/hero"
import FeaturedCategories from "@/components/myComponents/subs/featuredCategories"
import FeaturedProducts from "@/components/myComponents/subs/featuredProducts"
import Features from "@/components/myComponents/subs/features"
import ConcernGrid from "@/components/myComponents/subs/concern-grid"
import PartnerBrands from "@/components/myComponents/subs/partner-brands"
import FeaturedIngredients from "@/components/myComponents/subs/featuredIngredients"


const Home = () => {
  return (
    <motion.section
      initial = {{ opacity: 0 }}
      animate = {{
        opacity : 1,
        transition : { delay: 0.5, duration: 0.6, ease: "easeIn"}
      }}
      className="w-[100vw] min-h-full overflow-clip flex flex-col"
    >
      {/* <Filters /> */}
      <Hero />
      <PartnerBrands />
      <ConcernGrid />
      <FeaturedCategories />
      <FeaturedIngredients />
      <FeaturedProducts />
      <Features />
      {/* converted to a do you know section */}
      {/* <div className="flex-1 flex justify-center items-center w-full md:w-[85%] overflow-clip mx-auto">
        <Gallery />
      </div> */}
      {/* <ECommerceSalesPage /> */}
    </motion.section>
  )
}

export default Home
