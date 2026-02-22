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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user } = useAppContext();
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
          onFocus={() => searchValue.length >= 2 && setIsSearchOpen(true)}
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
        </div>
      )}
    </div>
  );
};
