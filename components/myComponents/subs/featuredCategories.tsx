import { categories } from '@/data/mock'
import Link from 'next/link'
import React from 'react'

const FeaturedCategories = () => {
  return (
    <section
    className={`
      py-12
      md:py-16
    `}
  >
    {/* Featured Categories */}
    <div
      className={`
        container mx-auto max-w-7xl px-4
        sm:px-6
        lg:px-8
      `}
    >
      <div className="mb-8 flex flex-col items-center text-center">
        <h2
          className={`
            font-display text-3xl leading-tight font-bold tracking-tight
            md:text-4xl
          `}
        >
          Shop by Category
        </h2>
        <div className="mt-2 h-1 w-12 rounded-full bg-primary" />
        <p className="mt-4 max-w-2xl text-center text-muted-foreground">
          Find the perfect device for your needs from our curated
          collections
        </p>
      </div>
      <div
        className={`
          grid grid-cols-2 gap-4
          md:grid-cols-4 md:gap-6
        `}
      >
        {categories.map((category) => (
          <Link
            aria-label={`Browse ${category.name} products`}
            className={`
              group relative flex flex-col space-y-4 overflow-hidden
              rounded-2xl border bg-card shadow transition-all
              duration-300
              hover:shadow-lg
            `}
            href={`/products?category=${category.name.toLowerCase()}`}
            key={category.name}
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <div
                className={`
                  absolute inset-0 z-10 bg-gradient-to-t
                  from-background/80 to-transparent
                `}
              />
              <img
                alt={category.name}
                className={`
                  object-cover transition duration-300
                  group-hover:scale-105
                `}
                // fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                src={category.image}
              />
            </div>
            <div className="relative z-20 -mt-6 p-4">
              <div className="mb-1 text-lg font-medium">
                {category.name}
              </div>
              <p className="text-sm text-muted-foreground">
                {category.productCount} products
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
  )
}

export default FeaturedCategories