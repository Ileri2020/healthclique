import Link from 'next/link'
import { categories } from '@/data/mock'

// Fetch categories from backend
async function getCategories() {
  const res = await fetch(`/api/dbhandler?model=category`, {
    next: { revalidate: 60 } // ISR
  });

  if (!res.ok) return [];

  const categories = await res.json();

  // Transform backend categories to match mock format
  return categories.map((cat: any) => ({
    image: cat.image || "/placeholder.png",
    name: cat.name,
    productCount: cat.products?.length || 0,
  }));
}

const FeaturedCategories = async () => {
  const categories = await getCategories();

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="mb-8 flex flex-col items-center text-center">
          <h2 className="font-display text-3xl leading-tight font-bold tracking-tight md:text-4xl">
            Shop by Category
          </h2>
          <div className="mt-2 h-1 w-12 rounded-full bg-primary" />
          <p className="mt-4 max-w-2xl text-center text-muted-foreground">
            Find the perfect product for your needs from our curated collections
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {categories.map((category: any) => (
            <Link
              key={category.name}
              href={`/products?category=${category.name.toLowerCase()}`}
              aria-label={`Browse ${category.name} products`}
              className="group relative flex flex-col space-y-4 overflow-hidden
                         rounded-2xl border bg-card shadow transition-all duration-300 hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-background/80 to-transparent" />
                <img
                  src={category.image}
                  alt={category.name}
                  className="object-cover transition duration-300 group-hover:scale-105 w-full h-full"
                />
              </div>

              <div className="relative z-20 -mt-6 p-4">
                <div className="mb-1 text-lg font-semibold">{category.name}</div>
                <p className="text-sm text-muted-foreground">
                  {category.productCount} products
                </p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
};

export default FeaturedCategories;
