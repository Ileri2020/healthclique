"use client"
import { Button } from '@/components/ui/button';
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { ProductCard } from "./productCard";
import { useCart } from "@/hooks/use-cart";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ProductForm from "@/prisma/forms/ProductForm";

const ITEMS_PER_PAGE = 30;

const Stocks = () => {
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get("category");
  const concernFilter = searchParams.get("concern"); // ✅ NEW: health concern filter
  
  const { addItem } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const isAdmin = useIsAdmin();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/dbhandler?model=product&include=category');
      let data = res.data;
      
      if (categoryFilter) {
        data = data.filter((p: any) => {
          const filterLower = categoryFilter.toLowerCase();
          const catName = p.category?.name?.toLowerCase();
          const pCatName = p.categoryName?.toLowerCase();
          return catName === filterLower || pCatName === filterLower;
        });
      }

      // Filter by health concern if ?concern= param is present
      if (concernFilter) {
        data = data.filter((p: any) =>
          Array.isArray(p.healthConcerns) &&
          p.healthConcerns.some((c: string) =>
            c.toLowerCase() === concernFilter.toLowerCase()
          )
        );
      }
      
      setProducts(data);
      setCurrentPage(1); // Reset to first page on filter change
    } catch (err) {
      setError("Failed to fetch products, please check your network connection");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, concernFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddToWishlist = (productId: string) => {
    alert(`Adding product ${productId} to wishlist`);
  };

  // Pagination Logic
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = products.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className='w-full max-w-7xl flex gap-5 flex-wrap p-4 justify-center mx-auto'>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((_, index) => (
          <Skeleton key={index} className="w-full md:w-[240px] h-[350px] rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center py-8">

      {/* 📦 Fixed Floating Add Product Button (Admin Only) */}
      {isAdmin && (
        <div className="fixed bottom-6 left-6 z-50">
          <Dialog onOpenChange={(open) => !open && fetchProducts()}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="gap-2 bg-primary hover:bg-primary/90 shadow-xl rounded-full px-5 py-3 font-semibold text-sm"
              >
                <Plus className="h-5 w-5" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <ProductForm hideList={true} />
            </DialogContent>
          </Dialog>
        </div>
      )}

      {currentItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4 max-w-7xl w-full">
          {currentItems.map((product) => (
            <ProductCard
              key={product.id}
              className="w-full group"
              orientation="horizontal"   // mobile: show as horizontal card
              // md+ the card's internal flex already adapts via md:flex-col class
              product={{ 
                ...product, 
                inStock: true, 
                originalPrice: Number(product.price) * 1.2, 
                rating: 5,
                categoryName: product.category?.name || "Pharmacy"
              }}
              onAddToCart={() => addItem(product, 1)}
              onAddToWishlist={() => handleAddToWishlist(product.id)}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <h3 className="text-xl font-medium text-muted-foreground">No products found in this category.</h3>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="icon"
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-lg"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => {
            // Show first, last, and pages around current
            if (
              number === 1 ||
              number === totalPages ||
              (number >= currentPage - 2 && number <= currentPage + 2)
            ) {
              return (
                <Button
                  key={number}
                  variant={currentPage === number ? "default" : "outline"}
                  onClick={() => paginate(number)}
                  className={`w-10 h-10 rounded-lg ${currentPage === number ? 'bg-primary' : ''}`}
                >
                  {number}
                </Button>
              );
            } else if (
              number === currentPage - 3 ||
              number === currentPage + 3
            ) {
              return <span key={number} className="px-1 text-muted-foreground">...</span>;
            }
            return null;
          })}

          <Button
            variant="outline"
            size="icon"
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="rounded-lg"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Stocks;