"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Plus, ShoppingCart, MessageCircle, Info } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { ProductCard } from "./productCard";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import FeaturedProductForm from "@/prisma/forms/FeaturedProductForm";
import { toast } from "sonner";
import { useCart } from "@/hooks/use-cart";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const FeaturedProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [pharmacyProducts, setPharmacyProducts] = useState<any[]>([]);
  const [brandProducts, setBrandProducts] = useState<any[]>([]);
  const [oralCare, setOralCare] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = useIsAdmin();
  const { addItem } = useCart();

  async function fetchData() {
    try {
      // 1. Fetch Admin Featured Products
      const featRes = await fetch("/api/dbhandler?model=featuredProduct");
      const featData = await featRes.json();
      setProducts(featData.map((item: any) => ({
        ...item.product,
        categoryName: item.product.category?.name
      })));

      // If no featured products, fetch latest 10 products as fallback
      if (featData.length === 0) {
        const fallbackRes = await fetch("/api/dbhandler?model=product");
        const fallbackData = await fallbackRes.json();
        setProducts(fallbackData.slice(-10).map((p: any) => ({
            ...p,
            categoryName: p.category?.name || "New Arrival"
        })));
      }

      // 2. Fetch All Products for Subsets
      const prodRes = await fetch("/api/dbhandler?model=product&include=category");
      const prodData = await prodRes.json();
      
      // Common Medications
      setPharmacyProducts(prodData.slice(0, 15));
      
      // Top Brands (e.g., Emzor, Vitabiotics)
      const brands = prodData.filter((p: any) => 
        ["emzor", "vitabiotics", "glaxo", "nivea"].some(b => 
          p.brand?.toLowerCase().includes(b) || p.name.toLowerCase().includes(b)
        )
      ).slice(0, 15);
      setBrandProducts(brands);

      // Category Subset: Dental/Oral Care
      const oral = prodData.filter((p: any) => 
         p.category?.name?.toLowerCase().includes("dental") || 
         p.category?.name?.toLowerCase().includes("oral") ||
         p.name.toLowerCase().includes("toothpaste")
      ).slice(0, 15);
      setOralCare(oral);

    } catch (err) {
      console.error("Failed to fetch featured products", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddToCart = (product: any) => {
    addItem(product, 1);
    toast.success(`${product.name} added to cart`);
  };

  const ProductSection = ({ title, subtitle, items }: { title: string, subtitle: string, items: any[] }) => (
    <div className="mb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 px-4">
        <div className="text-left">
          <h3 className="text-2xl font-bold tracking-tight text-foreground">{title}</h3>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        <Link href="/store" className="text-primary font-semibold flex items-center gap-1 hover:underline">
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      
      <Carousel opts={{ align: "start", loop: true }} className="w-full relative px-4">
        <CarouselContent className="-ml-4">
          {items.map((product) => (
            <CarouselItem key={product.id} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/5">
                <div className="group relative bg-card border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                  {/* Badge */}
                  <div className="absolute top-2 left-2 z-10 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Available
                  </div>
                  
                  {/* Image */}
                  <div className="relative aspect-square bg-muted/30 overflow-hidden">
                    <img 
                      src={product.images?.[0] || "/logo.png"} 
                      alt={product.name} 
                      className="object-contain w-full h-full p-4 transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="text-xs text-primary font-medium mb-1 uppercase tracking-wider">
                      {product.categoryName || "Pharmacy"}
                    </div>
                    <h4 className="font-bold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors min-h-[40px]">
                      {product.name}
                    </h4>
                    
                    <div className="mt-auto">
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-lg font-black text-foreground">#{product.price.toLocaleString()}</span>
                        {product.price > 1000 && (
                           <span className="text-xs text-muted-foreground line-through">#{(product.price * 1.1).toFixed(0)}</span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          onClick={() => handleAddToCart(product)}
                          size="sm" 
                          className="w-full bg-primary hover:bg-primary/90 text-[10px] font-bold h-9"
                        >
                          <ShoppingCart className="w-3 h-3 mr-1" /> BUY
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full border-2 text-[10px] font-bold h-9"
                        >
                          <MessageCircle className="w-3 h-3 mr-1 text-green-500" /> WHATSAPP
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden md:block">
          <CarouselPrevious className="-left-4 bg-background/80 backdrop-blur-sm" />
          <CarouselNext className="-right-4 bg-background/80 backdrop-blur-sm" />
        </div>
      </Carousel>
    </div>
  );

  return (
    <section className="bg-muted/30 py-12 md:py-20">
      <div className="container mx-auto max-w-7xl">
        
        {loading ? (
             <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
             </div>
        ) : (
          <>
            {/* 1. Admin Featured Section (Legacy Styled) */}
            {products.length > 0 && (
               <ProductSection 
                title="Deals & New Arrivals" 
                subtitle="Explore our top picks and recently added premium medical supplies"
                items={products}
               />
            )}

            {/* 2. Pharmacy Section (Imported Data) */}
            {pharmacyProducts.length > 0 && (
               <ProductSection 
                title="Common Medications" 
                subtitle="Recently added essential pharmaceuticals and healthcare products"
                items={pharmacyProducts}
               />
            )}

            {/* 3. Top Brands Section */}
            {brandProducts.length > 0 && (
               <ProductSection 
                title="Top Brands" 
                subtitle="Quality products from trusted global pharmaceutical leaders"
                items={brandProducts}
               />
            )}

            {/* 4. Oral Care Section */}
            {oralCare.length > 0 && (
               <ProductSection 
                title="Dental & Oral Care" 
                subtitle="Maintain bright smiles with our expert dental selection"
                items={oralCare}
               />
            )}

            {isAdmin && (
              <div className="flex justify-center mb-10">
                <Dialog onOpenChange={(open) => !open && fetchData()}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-accent hover:bg-accent/90">
                      <Plus className="h-4 w-4" />
                      Manage Home Sections
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Section Manager</DialogTitle>
                    </DialogHeader>
                    <FeaturedProductForm hideList={true} />
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
