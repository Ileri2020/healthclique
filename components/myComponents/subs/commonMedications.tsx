"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Plus, Minus } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState, useCallback, useRef } from "react";
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
import Autoplay from "embla-carousel-autoplay";
import axios from "axios";

/**
 * CommonMedications – shown just below the hero on the home page.
 * Admins see a "+ Feature / − Remove" toggle button on each card.
 */
const CommonMedications = () => {
  const [pharmacyProducts, setPharmacyProducts] = useState<any[]>([]);
  const [featuredIds, setFeaturedIds] = useState<Set<string>>(new Set());
  const [featuredMap, setFeaturedMap] = useState<Record<string, string>>({}); // productId → featuredProduct.id
  const [loading, setLoading] = useState(true);
  const [manageOpen, setManageOpen] = useState(false);
  const isAdmin = useIsAdmin();
  const { addItem } = useCart();
  const plugin = React.useRef(Autoplay({ delay: 3500, stopOnInteraction: false }));

  const fetchData = useCallback(async () => {
    try {
      const [prodRes, featRes] = await Promise.all([
        fetch("/api/dbhandler?model=product&include=category"),
        fetch("/api/dbhandler?model=featuredProduct"),
      ]);
      const prodData = await prodRes.json();
      const featData = await featRes.json();

      // Common Medications — first 15 products
      setPharmacyProducts(prodData.slice(0, 15));

      // Build featuredIds and featuredMap for toggling
      const ids = new Set<string>();
      const map: Record<string, string> = {};
      if (Array.isArray(featData)) {
        featData.forEach((f: any) => {
          ids.add(f.productId);
          map[f.productId] = f.id;
        });
      }
      setFeaturedIds(ids);
      setFeaturedMap(map);
    } catch (err) {
      console.error("CommonMedications: fetch error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddToCart = (product: any) => {
    addItem(product, 1);
    toast.success(`${product.name} added to cart`);
  };

  const handleToggleFeatured = async (product: any) => {
    const isFeatured = featuredIds.has(product.id);
    try {
      if (isFeatured) {
        const featId = featuredMap[product.id];
        await axios.delete(`/api/dbhandler?model=featuredProduct&id=${featId}`);
        toast.success(`${product.name} removed from Deals carousel`);
      } else {
        await axios.post("/api/dbhandler?model=featuredProduct", {
          productId: product.id,
        }, { headers: { "Content-Type": "application/json" } });
        toast.success(`${product.name} added to Deals carousel`);
      }
      await fetchData();
    } catch (err) {
      toast.error("Failed to update featured list");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (pharmacyProducts.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 px-4">
          <div className="text-left">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Common Medications
            </h2>
            <p className="text-muted-foreground">
              Recently added essential pharmaceuticals and healthcare products
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Admin: Manage Featured Dialog */}
            {isAdmin && (
              <Dialog open={manageOpen} onOpenChange={(open) => { setManageOpen(open); if (!open) fetchData(); }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                    <Plus className="h-4 w-4" />
                    Manage Deals Carousel
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Manage "Deals & New Arrivals" Carousel</DialogTitle>
                  </DialogHeader>
                  <FeaturedProductForm hideList={false} />
                </DialogContent>
              </Dialog>
            )}

            <Link href="/store" className="text-primary font-semibold flex items-center gap-1 hover:underline text-sm">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Carousel — continuous, no pause on hover */}
        <Carousel
          opts={{ align: "start", loop: true }}
          plugins={[plugin.current]}
          className="w-full relative px-4"
        >
          <CarouselContent className="-ml-4">
            {pharmacyProducts.map((product) => {
              const isFeatured = featuredIds.has(product.id);
              return (
                <CarouselItem
                  key={product.id}
                  className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 pt-2 pb-2"
                >
                  <div className="relative group/card">
                    <ProductCard
                      className="w-full"
                      variant="default"
                      orientation="vertical"
                      product={{
                        ...product,
                        inStock: true,
                        originalPrice: Number(product.price) * 1.2,
                        rating: 5,
                        categoryName: product.category?.name || "Pharmacy",
                      }}
                      onAddToCart={() => handleAddToCart(product)}
                    />
                    {/* Admin inline toggle: always visible for admins */}
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant={isFeatured ? "destructive" : "default"}
                        className="absolute bottom-14 left-1/2 -translate-x-1/2 z-40 text-xs gap-1 px-3 py-1 h-7 rounded-full shadow-lg whitespace-nowrap"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleFeatured(product);
                        }}
                      >
                        {isFeatured ? (
                          <><Minus className="h-3 w-3" /> Remove from Deals</>
                        ) : (
                          <><Plus className="h-3 w-3" /> Add to Deals</>
                        )}
                      </Button>
                    )}
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious className="-left-4 bg-background/80 backdrop-blur-sm" />
            <CarouselNext className="-right-4 bg-background/80 backdrop-blur-sm" />
          </div>
        </Carousel>
      </div>
    </section>
  );
};

export default CommonMedications;
