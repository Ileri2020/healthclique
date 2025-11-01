import React from 'react'
import { HeroBadge } from './hero-badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Clock, Truck } from 'lucide-react'
import Image from "next/image";
import landingimg from '@/public/pharmacist.png'
import whitelandingimgmobile from '@/public/landingmobilewhite.png'
import bluelandingimgmobile from '@/public/landingmobileblue.png'
import greenlandingimgmobile from '@/public/landingmobilegreen.png'

const Hero = () => {
  return (
    <div className={`relative overflow-hidden py-5 md:py-16`}>
    <div className={`bg-grid-black/[0.02] absolute inset-0 bg-[length:20px_20px]`}/>
    <div className={`relative z-10 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8`}>
      <div className={`grid items-center gap-10 grid-cols-1 lg:grid-cols-2 lg:gap-12`}>
        <div className="flex flex-col justify-center space-y-6">
          <div className="space-y-4">
            {/* <HeroBadge /> */}
            <h1 className={`
                font-display text-4xl leading-tight font-bold tracking-tight text-foreground
                sm:text-2xl md:text-3xl lg:leading-[1.1]`}
            >
              <div className='hidden dark:flex md:dark:hidden md:hidden animate-pulse'>
               <Image
                  alt="Shopping experience"
                  className="object-cover w-full h-full "
                  // fill
                  // priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  //src="https://images.unsplash.com/photo-1624767735494-1929dc24ad43?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
                  src={whitelandingimgmobile}
                />
              </div>
              <div className='md:hidden dark:hidden animate-pulse'>
               <Image
                  alt="Shopping experience"
                  className="object-cover w-full h-full "
                  // fill
                  // priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  //src="https://images.unsplash.com/photo-1624767735494-1929dc24ad43?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
                  src={greenlandingimgmobile}
                />
              </div>
              <div className='text-2xl  text-center md:text-start'>With a click, get your Premium </div>
              <div className={` /bg-gradient-to-r /from-primary /to-primary/70 bg-clip-text
                  /text-transparent sm:text-4xl md:text-5xl text-center md:text-start text-accent`}
              >
                Drug, Pharmaceuticals & Medical Equipment
              </div>
            </h1>
            <p className={`max-w-[700px] text-lg text-muted-foreground md:text-xl`}>
              Discover products at competitive prices, with fast
              shipping and exceptional customer service.
            </p>
          </div>
          <div className={`flex flex-col gap-3 sm:flex-row`}>
            <Link href="/products">
              <Button className={`h-12 gap-1.5 px-8 transition-colors duration-200 bg-accent/70`} size="lg">
                Shop Now <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/showcase">
              <Button className="h-12 px-8 transition-colors duration-200" size="lg" variant="outline">
                View Showcase
              </Button>
            </Link>
          </div>
          <div className={`flex flex-wrap gap-5 text-sm text-muted-foreground `}>
            <div className="flex items-center gap-1.5">
              <Truck className="h-5 w-5 text-primary/70" />
              <span>Free shipping over $50</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-5 w-5 text-primary/70" />
              <span>24/7 Customer Support</span>
            </div>
          </div>
        </div>
        <div className={`relative mx-auto hidden aspect-square w-full max-w-md
            overflow-hidden rounded-xl border shadow-lg lg:block`}
        >
          <div className={`absolute inset-0 z-10 bg-gradient-to-tr from-primary/20
              via-transparent to-transparent`}
          />
          <Image
            alt="Shopping experience"
            className="object-cover w-full h-full"
            // fill
            // priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            //src="https://images.unsplash.com/photo-1624767735494-1929dc24ad43?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
            src={landingimg}
          />
        </div>
      </div>
    </div>
    <div
      className={`
        absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent
        via-primary/20 to-transparent
      `}
    />
  </div>
  )
}

export default Hero