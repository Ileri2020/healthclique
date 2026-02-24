"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, HeartPulse } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import axios from "axios";
import { useAppContext } from "@/hooks/useAppContext";
import { getProductPrice } from "@/lib/stock-pricing";

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
}

export const GlobalSearch = ({ placeholder = "Search for medications, brands or ingredients...", className = "" }: GlobalSearchProps) => {
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Filters
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterBrand, setFilterBrand] = useState("All");
  const [filterPrice, setFilterPrice] = useState("All");

  const { user } = useAppContext();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Pre-fetch all products for quick local filtering
    axios.get(`/api/dbhandler?model=product&include=category`).then(res => {
      setAllProducts(res.data);
    }).catch(console.error);
  }, []);

  const uniqueCategories = Array.from(new Set(allProducts.map(p => p.category?.name || "Uncategorized")));
  const uniqueBrands = Array.from(new Set(allProducts.map(p => p.brand).filter(Boolean)));


  const handleSearch = (value: string, cat = filterCategory, br = filterBrand, pr = filterPrice) => {
    setSearchValue(value);
    
    // Always open if we type or if we choose a filter
    if (value.length < 2 && cat === "All" && br === "All" && pr === "All") {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    let filtered = allProducts;
    
    if (value.length >= 2) {
      filtered = filtered.filter((p: any) =>
        p.name?.toLowerCase().includes(value.toLowerCase()) ||
        p.description?.toLowerCase().includes(value.toLowerCase()) ||
        p.activeIngredients?.some((ing: string) => ing.toLowerCase().includes(value.toLowerCase()))
      );
    }

    if (cat !== "All") {
      filtered = filtered.filter((p: any) => p.category?.name === cat || (!p.category && cat === "Uncategorized"));
    }
    
    if (br !== "All") {
      filtered = filtered.filter((p: any) => p.brand === br);
    }

    if (pr !== "All") {
      filtered = filtered.filter((p: any) => {
        const price = getProductPrice(p, user?.role) || 0;
        if (pr === "under-5000") return price < 5000;
        if (pr === "5000-20000") return price >= 5000 && price <= 20000;
        if (pr === "over-20000") return price > 20000;
        return true;
      });
    }

    setSearchResults(filtered.slice(0, 8));
    setIsSearchOpen(true);
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative w-full ${className}`} ref={searchRef}>
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          type="text"
          placeholder={placeholder}
          className="h-12 pl-12 pr-4 text-base border-2 border-muted hover:border-primary/50 focus:border-primary transition-all rounded-xl shadow-sm"
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => {
            setIsSearchOpen(true);
            handleSearch(searchValue);
          }}
        />
      </div>

      {isSearchOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Quick Filters */}
          <div className="p-3 border-b bg-muted/10 grid grid-cols-3 gap-2">
             <select 
                className="w-full text-xs p-1.5 rounded border bg-background"
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  handleSearch(searchValue, e.target.value, filterBrand, filterPrice);
                }}
             >
                <option value="All">All Categories</option>
                {uniqueCategories.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
             </select>
             
             <select 
                className="w-full text-xs p-1.5 rounded border bg-background"
                value={filterBrand}
                onChange={(e) => {
                  setFilterBrand(e.target.value);
                  handleSearch(searchValue, filterCategory, e.target.value, filterPrice);
                }}
             >
                <option value="All">All Brands</option>
                {uniqueBrands.map(b => <option key={b as string} value={b as string}>{b as string}</option>)}
             </select>

             <select 
                className="w-full text-xs p-1.5 rounded border bg-background"
                value={filterPrice}
                onChange={(e) => {
                  setFilterPrice(e.target.value);
                  handleSearch(searchValue, filterCategory, filterBrand, e.target.value);
                }}
             >
                <option value="All">All Prices</option>
                <option value="under-5000">Under ₦5,000</option>
                <option value="5000-20000">₦5,000 - ₦20,000</option>
                <option value="over-20000">Over ₦20,000</option>
             </select>
          </div>

          {searchResults.length > 0 ? (
            <>
              <div className="p-2 border-b bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Matching Products
              </div>
          <div className="max-h-[300px] overflow-y-auto">
            {searchResults.map((product: any) => (
              <Link 
                key={product.id} 
                href={`/products/${product.id}`}
                onClick={() => setIsSearchOpen(false)}
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
                  <div className="text-xs text-muted-foreground">₦{getProductPrice(product, user?.role).toLocaleString()}</div>
                </div>
              </Link>
            ))}
          </div>
              <Link href="/store" onClick={() => setIsSearchOpen(false)} className="block p-3 text-center text-sm font-medium text-primary hover:bg-primary/5 border-t">
                View all results
              </Link>
            </>
          ) : (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No products found matching your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
