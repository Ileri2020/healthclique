"use client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Similar from "@/components/myComponents/subs/similar"
import { GlobalSearch } from "@/components/myComponents/subs"
import { useCart } from "@/hooks/use-cart"
import { toast } from "sonner"
import { HeartPulse, Loader2, MessageCircle, ShoppingCart } from "lucide-react"
import { useAppContext } from "@/hooks/useAppContext"
import { getProductPrice } from "@/lib/stock-pricing"
import { Badge } from "@/components/ui/badge"
import { FileText, AlertCircle } from "lucide-react"

const Description = () => {
  const [product, setProduct] = useState<any>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const { addItem } = useCart();
  const { user } = useAppContext();

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
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
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
                {product.brand || "General"}
              </div>
              <Badge variant={isPrescription || isControlled ? "destructive" : "outline"} className="uppercase font-bold text-[10px]">
                {regClass}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold md:text-5xl">{product.name}</h1>
          
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

          <div className="text-3xl font-black text-foreground">
            ₦ {getProductPrice(product, user?.role)?.toLocaleString()}
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
              <>
                <Button size="lg" onClick={handleAddToCart} className="flex-1 gap-2 rounded-xl h-14 text-lg">
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => window.open(whatsappOrderUrl, "_blank")}
                  className="flex-1 gap-2 rounded-xl h-14 text-lg border-2"
                >
                  <MessageCircle className="h-5 w-5 text-green-500" />
                  Order via WhatsApp
                </Button>
              </>
            )}
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
