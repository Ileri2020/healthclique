"use client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { ProductCard } from "@/components/myComponents/subs/productCard"
import { GlobalSearch } from "@/components/myComponents/subs"
import { useCart } from "@/hooks/use-cart"
import { toast } from "sonner"
import { HeartPulse, Loader2, MessageCircle, ShoppingCart } from "lucide-react"
import { useAppContext } from "@/hooks/useAppContext"
import { getProductPrice, PRICE_MARKUPS } from "@/lib/stock-pricing"
import { Badge } from "@/components/ui/badge"
import { FileText, AlertCircle, Star } from "lucide-react"
import { ProductReviews } from "@/components/myComponents/subs/productReviews"
import { PriceFeedback } from "@/components/myComponents/subs/priceFeedback"
import Similar from "@/components/myComponents/subs/similar"
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

const Description = () => {
  const [product, setProduct] = useState<any>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [selectedBulk, setSelectedBulk] = useState<any>(null);
  const { id } = useParams();
  const { addItem } = useCart();
  const { user } = useAppContext();
  
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 3000, stopOnInteraction: false })] as any);

  const regClass = product?.regulatoryClassification || "OTC";
  const isPrescription = regClass === "Prescription Medicine";
  const isControlled = regClass === "Controlled Medicine";

  const whatsappNumber = "2348000000000"; // Replace with real company number
  const speakToRepUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hello, I'm interested in the controlled medicine: ${product?.name}. Please guide me on how to proceed.`)}`;
  const whatsappOrderUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hello, I'd like to order: ${product?.name}`)}`;

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        // Fetch current product
        const res = await fetch(`/api/dbhandler?model=product&id=${id}`);
        const data = await res.json();
        setProduct(data);

        // Fetch similar products (same category or brand)
        let simUrl = `/api/dbhandler?model=product`;
        if (data.categoryId) simUrl += `&categoryId=${data.categoryId}`;
        
        const simRes = await fetch(simUrl);
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
      const basePrice = selectedBulk ? selectedBulk.price : product.price;
      addItem({
        ...product,
        price: basePrice,
        bulkPriceId: selectedBulk?.id,
        bulkName: selectedBulk?.name,
      }, 1);
      toast.success(`${product.name}${selectedBulk ? ` (${selectedBulk.name})` : ''} added to cart`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Skeleton className="h-10 w-10 rounded-full bg-muted/40" />
        <Skeleton className="h-6 w-[200px] bg-muted/30 ml-4" />
      </div>
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
      <div className="mb-12 max-w-2xl">
        <GlobalSearch placeholder="Search more products..." />
      </div>

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
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-bold uppercase tracking-widest text-primary">
                {product.brand?.name || product.brand || "General"}
              </div>
              <Badge variant={isPrescription || isControlled ? "destructive" : "outline"} className="uppercase font-bold text-[10px]">
                {regClass}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold md:text-5xl">{product.name}</h1>
            <div className="flex items-center gap-1 mt-2 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2 text-sm font-medium text-muted-foreground">5.0 (Customer Reviews)</span>
              {product.weight && (
                  <Badge variant="secondary" className="ml-auto font-black px-3 py-1 bg-primary/5 text-primary border-primary/20">
                      {product.weight}
                  </Badge>
              )}
            </div>
          
          {isPrescription && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-sm font-semibold">
              <FileText className="h-5 w-5" />
              Prescription required for this medication
            </div>
          )}

          {isControlled && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/10 text-accent border border-accent/20 text-sm font-semibold">
              <AlertCircle className="h-5 w-5" />
              Controlled Medicine: Representative consultation required
            </div>
          )}

          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-black text-foreground">
                ₦ {((selectedBulk ? selectedBulk.price : getProductPrice(product, user?.role)) * (selectedBulk ? (PRICE_MARKUPS[user?.role as keyof typeof PRICE_MARKUPS] || 1.3) : 1)).toLocaleString()}
            </span>
            {selectedBulk && (
                <span className="text-sm font-bold text-muted-foreground">
                    / {selectedBulk.name}
                </span>
            )}
          </div>

          {product.bulkPrices?.length > 0 && (
            <div className="space-y-4 py-4 border-y border-dashed">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Multi-Buy Options
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <button 
                        onClick={() => setSelectedBulk(null)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${!selectedBulk ? 'border-primary bg-primary/5 shadow-md' : 'border-muted hover:border-primary/50'}`}
                    >
                        <div className="text-[10px] font-black uppercase text-muted-foreground">Single Unit</div>
                        <div className="text-sm font-bold">1 {product.weight || 'Piece'}</div>
                        <div className="text-xs font-black mt-1 text-primary">₦ {getProductPrice(product, user?.role).toLocaleString()}</div>
                    </button>
                    {product.bulkPrices.map((bp: any) => (
                        <button 
                            key={bp.id}
                            onClick={() => setSelectedBulk(bp)}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${selectedBulk?.id === bp.id ? 'border-primary bg-primary/5 shadow-md' : 'border-muted hover:border-primary/50'}`}
                        >
                            <div className="text-[10px] font-black uppercase text-muted-foreground">{bp.name}</div>
                            <div className="text-sm font-bold">{bp.quantity} {product.weight || 'Units'}</div>
                            <div className="text-xs font-black mt-1 text-primary">₦ {(bp.price * (PRICE_MARKUPS[user?.role as keyof typeof PRICE_MARKUPS] || 1.3)).toLocaleString()}</div>
                        </button>
                    ))}
                </div>
            </div>
          )}

          <div className="prose prose-sm max-w-none text-muted-foreground">
            <p className="whitespace-pre-line">
              {(() => {
                if (!product.description) return "No description available.";
                const words = product.description.split(" ");
                if (words.length <= 70 || showFullDesc) return product.description;
                return `${words.slice(0, 70).join(" ")}...`;
              })()}
            </p>
            {product.description && product.description.split(" ").length > 70 && (
              <button 
                onClick={() => setShowFullDesc(!showFullDesc)} 
                className="text-primary font-semibold mt-2 hover:underline text-sm"
              >
                {showFullDesc ? "Show less" : "Read more"}
              </button>
            )}
          </div>

          {product.activeIngredients?.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-foreground">Active Ingredients:</h3>
              <div className="flex flex-wrap gap-2">
                {product.activeIngredients.map((ing: any) => (
                  <span key={ing.id || ing} className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                    {ing.name || ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4 pt-4">
            {isControlled ? (
              <Button 
                size="lg" 
                onClick={() => window.open(speakToRepUrl, "_blank")} 
                className="flex-1 gap-2 rounded-xl h-14 text-lg bg-accent hover:bg-accent/90"
              >
                <MessageCircle className="h-5 w-5 text-white" />
                Speak to a Representative
              </Button>
            ) : (
                <Button size="lg" onClick={handleAddToCart} className="w-full gap-2 rounded-xl h-14 text-lg">
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </Button>
            )}
          </div>
          
          <PriceFeedback productId={product.id} productName={product.name} />

          <div className="grid grid-cols-1 gap-4 mt-4 rounded-2xl bg-muted/30 p-4 sm:grid-cols-2">
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

      <div className="mt-12 bg-muted/10 p-4 md:p-8 rounded-3xl border shadow-sm">
         <ProductReviews productId={product.id} />
      </div>

      {/* Closely Similar Carousel */}
      {similarProducts.length > 0 && (
        <div className="mt-16 overflow-hidden" ref={emblaRef}>
          <div className="mb-6 px-2">
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
              <HeartPulse className="h-5 w-5" /> Recommended for You
            </h2>
          </div>
          <div className="flex gap-4 p-2">
            {similarProducts.map((simProd) => (
              <div key={`carousel-${simProd.id}`} className="flex-[0_0_auto] w-[260px]">
                <ProductCard
                  className="w-full"
                  variant="compact"
                  orientation="vertical"
                  product={{
                    ...simProd,
                    inStock: true,
                    categoryName: simProd.category?.name || "General"
                  }}
                  onAddToCart={() => {
                    addItem(simProd, 1);
                    toast.success(`${simProd.name} added to cart`);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Similar Products */}
      <div className="mt-20">
        <div className="mb-8 border-b pb-4">
          <h2 className="text-2xl font-bold">Similar Products</h2>
        </div>
        
        <div className="mb-10 hidden md:block">
           <Similar similar={similarProducts} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {similarProducts.map((simProd) => (
             <ProductCard
               key={simProd.id}
               className="w-full"
               variant="default"
               orientation="vertical"
               product={{
                 ...simProd,
                 inStock: true,
                 categoryName: simProd.category?.name || "General"
               }}
               onAddToCart={() => {
                 addItem(simProd, 1);
                 toast.success(`${simProd.name} added to cart`);
               }}
             />
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default Description;
