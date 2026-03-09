"use client"
import { motion } from "framer-motion"
import { Filters, Gallery} from "@/components/myComponents/subs"
import ECommerceSalesPage from "@/components/myComponents/salestore"
import Hero from "@/components/myComponents/subs/hero"
import FeaturedCategories from "@/components/myComponents/subs/featuredCategories"
import FeaturedProducts from "@/components/myComponents/subs/featuredProducts"
import CommonMedications from "@/components/myComponents/subs/commonMedications"
import Features from "@/components/myComponents/subs/features"
import ConcernGrid from "@/components/myComponents/subs/concern-grid"
import PartnerBrands from "@/components/myComponents/subs/partner-brands"
import FeaturedIngredients from "@/components/myComponents/subs/featuredIngredients"
import { MessageCircle } from "lucide-react"
import Link from "next/link"
import { HeavilyDiscountedCarousel } from "@/components/myComponents/subs/HeavilyDiscountedCarousel";
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
      <CommonMedications />
      <PartnerBrands />
      <ConcernGrid />
      <FeaturedCategories />
      <FeaturedIngredients />
      <FeaturedProducts />
      <Features />
      <HeavilyDiscountedCarousel />

      {/* converted to a do you know section */}
      {/* <div className="flex-1 flex justify-center items-center w-full md:w-[85%] overflow-clip mx-auto">
        <Gallery />
      </div> */}
      {/* <ECommerceSalesPage /> */}

      {/* Fixed Contact Button */}
      <Link href="/contact" className="fixed bottom-6 left-6 z-50">
        <div className="flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all hover:scale-105 cursor-pointer border-2 border-white dark:border-gray-800">
          <MessageCircle className="w-6 h-6" />
        </div>
      </Link>
    </motion.section>
  )
}

export default Home
