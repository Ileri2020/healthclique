"use client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Similar from "@/components/myComponents/subs/similar"
import { useCart } from "@/hooks/use-cart"
import { toast } from "sonner"
import { HeartPulse, Loader2, MessageCircle, ShoppingCart } from "lucide-react"
import { useAppContext } from "@/hooks/useAppContext"
import { getProductPrice, formatPrice } from "@/lib/stock-pricing"

const Description = () => {
  const [product, setProduct] = useState<any>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const { addItem } = useCart();
  const { user } = useAppContext()

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        // Fetch current product
        const res = await fetch(`/api/dbhandler?model=product&id=${id}`);
        const data = await res.json();
        setProduct(data);

        // Fetch similar products (same category or just random for now)
        const simRes = await fetch(`/api/dbhandler?model=product`);
        const allProds = await simRes.json();
        const filtered = allProds
          .filter((p: any) => p.id !== id)
          .sort(() => 0.5 - Math.random())
          .slice(0, 10);
        setSimilarProducts(filtered);
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Failed to load product details");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProductDetails();
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      addItem(product, 1);
      toast.success(`${product.name} added to cart`);
    }
  };

  if (loading) {
    return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto max-w-7xl px-4 py-8 md:py-16"
      >
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Product Image Skeleton */}
          <div className="relative aspect-square overflow-hidden rounded-3xl border bg-white p-8 shadow-sm">
             <Skeleton className="h-full w-full rounded-2xl" />
          </div>

          {/* Product Info Skeleton */}
          <div className="flex flex-col space-y-6">
            <Skeleton className="h-6 w-32 rounded-md" />
            <Skeleton className="h-12 w-3/4 rounded-md" />
            <Skeleton className="h-6 w-48 rounded-md" />
            <Skeleton className="h-10 w-1/3 rounded-md mt-4" />

            <div className="space-y-2 py-4">
               <Skeleton className="h-4 w-full rounded-md" />
               <Skeleton className="h-4 w-full rounded-md" />
               <Skeleton className="h-4 w-5/6 rounded-md" />
               <Skeleton className="h-4 w-2/3 rounded-md" />
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
               <Skeleton className="h-14 w-full rounded-xl" />
            </div>
            
            <div className="grid grid-cols-1 gap-4 mt-4 rounded-2xl bg-muted/30 p-4 sm:grid-cols-2">
               <Skeleton className="h-8 w-full rounded-md" />
               <Skeleton className="h-8 w-full rounded-md" />
            </div>
          </div>
        </div>
      </motion.section>
    );
  }

  if (!product) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold">Product not found</h2>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto max-w-7xl px-4 py-8 md:py-16"
    >
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden rounded-3xl border bg-white p-8 shadow-sm">
          <img
            src={product.images?.[0] || "/logo.png"}
            alt={product.name}
            className="h-full w-full object-contain"
          />
        </div>

        {/* Product Info */}
        <div className="flex flex-col space-y-6">
          <div className="space-y-2">
            <div className="text-sm font-bold uppercase tracking-widest text-primary">
              {product.brand || "General"}
            </div>
            <h1 className="text-3xl font-bold md:text-5xl">{product.name}</h1>
          </div>

          <div className="text-3xl font-black text-foreground">
            ₦ {formatPrice(getProductPrice(product, user?.role))}
          </div>

          {/* Product Specifications */}
          <div className="grid grid-cols-1 gap-4 rounded-2xl bg-muted/30 p-4 sm:grid-cols-2">
            {product.form && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Form:</span>
                <span className="text-sm font-bold capitalize">{product.form}</span>
              </div>
            )}
            {product.numberPcs && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Pack Size:</span>
                <span className="text-sm font-bold">{product.numberPcs}</span>
              </div>
            )}
            {product.weight && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Weight:</span>
                <span className="text-sm font-bold">{product.weight}</span>
              </div>
            )}
            {product.regulatoryClassification && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Classification:</span>
                <span className="text-sm font-bold">{product.regulatoryClassification}</span>
              </div>
            )}
          </div>

          <div className="prose prose-sm max-w-none text-muted-foreground">
            <p className="whitespace-pre-line">{product.description || "No description available."}</p>
          </div>

          {product.activeIngredients?.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-foreground">Active Ingredients:</h3>
              <div className="flex flex-wrap gap-2">
                {product.activeIngredients.map((ing: string) => (
                  <span key={ing} className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4 pt-4">
            <Button size="lg" onClick={handleAddToCart} className="flex-1 gap-2 rounded-xl h-14 text-lg">
              <ShoppingCart className="h-5 w-5" />
              Add to Cart
            </Button>
            <Button size="lg" variant="outline" className="flex-1 gap-2 rounded-xl h-14 text-lg border-2">
              <MessageCircle className="h-5 w-5 text-green-500" />
              Order via WhatsApp
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-2xl bg-muted/30 p-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <HeartPulse className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Authenticity Guaranteed</span>
            </div>
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Arrives in 1-4 hrs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Products */}
      <div className="mt-20">
        <div className="mb-8 border-b pb-4">
          <h2 className="text-2xl font-bold">Similar Products</h2>
        </div>
        <Similar similar={similarProducts} />
      </div>
    </motion.section>
  );
};

export default Description;
