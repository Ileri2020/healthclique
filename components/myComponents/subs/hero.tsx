"use client";

import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, Clock, ShieldCheck, HeartPulse, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import landingimg from '@/public/pharmacist.png'

const Hero = () => {
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (value: string) => {
    setSearchValue(value);
    if (value.length < 2) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    try {
      const response = await axios.get(`/api/dbhandler?model=product`);
      const products = response.data;
      const filtered = products.filter((p: any) =>
        p.name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8);
      setSearchResults(filtered);
      setIsSearchOpen(true);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="relative bg-background">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-grid-black/[0.02] bg-[length:20px_20px]" />
      <div className="absolute top-0 right-0 -tr-y-1/2 w-1/3 h-1/2 bg-primary/5 blur-3xl rounded-full" />
      
      <div className="relative z-10 container mx-auto max-w-7xl px-4 py-8 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column: Text & Search */}
          <div className="flex flex-col space-y-8 animate-in fade-in slide-in-from-left duration-700">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <ShieldCheck className="w-4 h-4" />
                NAFDAC Approved Pharmacy
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-[1.1]">
                With a click, get your <br />
                <span className="text-accent text-4xl md:text-5xl underline decoration-accent/30">Premium Medical Supplies</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-xl">
                Order authentic medications, pharmaceutical products, and medical equipment at the lowest prices, delivered to your doorstep.
              </p>
            </div>

            {/* Instant Search Bar (OneHealth Replication) */}
            <div className="relative w-full max-w-lg" ref={searchRef}>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  type="text"
                  placeholder="Search for medications, brands or ingredients..."
                  className="h-14 pl-12 pr-4 text-lg border-2 border-muted hover:border-primary/50 focus:border-primary transition-all rounded-xl shadow-sm"
                  value={searchValue}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>

              {isSearchOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-2 border-b bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Matching Products
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {searchResults.map((product: any) => (
                      <Link 
                        key={product.id} 
                        href={`/products/${product.id}`}
                        className="flex items-center gap-4 p-3 hover:bg-accent/50 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="object-cover w-full h-full" />
                          ) : (
                            <HeartPulse className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold group-hover:text-primary transition-colors">{product.name}</div>
                          <div className="text-xs text-muted-foreground">#{product.price.toLocaleString()}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link href="/store" className="block p-3 text-center text-sm font-medium text-primary hover:bg-primary/5 border-t">
                    View all results
                  </Link>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link href="/store">
                <Button size="lg" className="h-14 px-8 rounded-xl text-lg bg-accent hover:bg-accent/90">
                  Shop All Meds
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-xl text-lg gap-2 border-2">
                <MessageCircle className="w-5 h-5 text-green-500" />
                WhatsApp Order
              </Button>
            </div>

            {/* Value Badges */}
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-5 h-5 text-primary" />
                <span>Doorstep Delivery (1-4 hrs)</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <HeartPulse className="w-5 h-5 text-primary" />
                <span>Talk to a Pharmacist</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visuals */}
          <div className="relative hidden lg:block animate-in fade-in slide-in-from-right duration-700">
            <div className="relative aspect-square w-full max-w-lg mx-auto overflow-hidden rounded-3xl border-8 border-background shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
               <Image
                src={landingimg}
                alt="Expert Pharmacist"
                fill
                className="object-cover scale-110 hover:scale-100 transition-transform duration-700"
                priority
              />
            </div>
            
            {/* Float Cards */}
            <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-2xl shadow-xl border animate-bounce-slow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Quality Guaranteed</div>
                  <div className="text-sm font-bold">100% Authentic</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Quick Action Floating Widget */}
      <div className="fixed left-6 bottom-24 z-50 flex flex-col gap-2">
        <a href="tel:+2348188762448" className="bg-primary text-white p-3 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center gap-2 group">
          <Phone className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-medium whitespace-nowrap">Call to Order</span>
        </a>
      </div>

    </div>
  );
};

export default Hero;