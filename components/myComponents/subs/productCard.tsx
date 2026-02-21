"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Heart, ShoppingCart, Star, Edit3, Trash2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ProductForm from "@/prisma/forms/ProductForm";
import axios from "axios";
import { toast } from "sonner";

type ProductCardProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onError"
> & {
  onAddToCart?: (product: any) => void;
  onAddToWishlist?: (productId: string) => void;
  product: {
    category?: any;
    categoryName?: string;
    id: string;
    images: any;
    inStock?: boolean;
    name: string;
    originalPrice?: number;
    price: number;
    rating?: number;
    categoryId: string;
    description?: string;
  };
  variant?: "compact" | "default";
};

export function ProductCard({
  className,
  onAddToCart,
  onAddToWishlist,
  product,
  variant = "default",
  ...props
}: ProductCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isAddingToCart, setIsAddingToCart] = React.useState(false);
  const [isInWishlist, setIsInWishlist] = React.useState(false);
  const isAdmin = useIsAdmin();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onAddToCart) {
      setIsAddingToCart(true);
      setTimeout(() => {
        onAddToCart(product);
        setIsAddingToCart(false);
      }, 600);
    }
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onAddToWishlist) {
      setIsInWishlist(!isInWishlist);
      onAddToWishlist(product.id);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${product.name}?`)) {
      try {
        await axios.delete(`/api/dbhandler?model=product&id=${product.id}`);
        toast.success("Product deleted");
        window.location.reload();
      } catch (err) {
        toast.error("Failed to delete product");
      }
    }
  };

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  const renderStars = () => {
    const rating = product.rating ?? 0;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            className={cn(
              "h-4 w-4",
              i < fullStars
                ? "fill-yellow-400 text-yellow-400"
                : i === fullStars && hasHalfStar
                ? "fill-yellow-400/50 text-yellow-400"
                : "stroke-muted/40 text-muted"
            )}
            key={`star-${product.id}-position-${i + 1}`}
          />
        ))}
        {rating > 0 && (
          <span className="ml-1 text-xs text-muted-foreground">
            {rating.toFixed(1)}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={cn("group relative", className)} {...props}>
      {isAdmin && (
        <div className="absolute top-2 right-2 z-30 flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Product: {product.name}</DialogTitle>
              </DialogHeader>
              <ProductForm initialProduct={product} hideList={true} />
            </DialogContent>
          </Dialog>
          <Button
            size="icon"
            variant="destructive"
            className="h-8 w-8 rounded-full bg-destructive/80 backdrop-blur-sm shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
      <Link href={`/products/${product.id}`}>
        <Card
          className={cn(
            `
              relative h-full overflow-hidden rounded-lg py-0 transition-all
              duration-300 ease-in-out
              hover:shadow-lg
            `,
            isHovered && "ring-1 ring-primary/20"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="relative aspect-square overflow-hidden rounded-t-lg">
            {product.images && (
              <img
                alt={product.name}
                className={cn(
                  "object-cover w-full transition-transform duration-500 ease-in-out scale-110",
                  isHovered && "scale-100"
                )}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                src={product.images[0]}
              />
            )}

            <Badge
              className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm"
              variant="outline"
            >
              {product.categoryName || product.category?.name || "Pharmacy"}
            </Badge>

            {discount > 0 && (
              <Badge
                className="absolute top-2 right-2 bg-destructive text-destructive-foreground"
              >
                {discount}% OFF
              </Badge>
            )}

            <Button
              className={cn(
                "absolute right-2 bottom-2 z-10 rounded-full bg-background/80 backdrop-blur-sm transition-opacity duration-300",
                !isHovered && !isInWishlist && "opacity-0"
              )}
              onClick={handleAddToWishlist}
              size="icon"
              type="button"
              variant="outline"
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  isInWishlist
                    ? "fill-destructive text-destructive"
                    : "text-muted-foreground"
                )}
              />
              <span className="sr-only">Add to wishlist</span>
            </Button>
          </div>

          <CardContent className="p-4 pt-4">
            <h3 className="line-clamp-2 text-base font-medium transition-colors group-hover:text-primary">
              {product.name}
            </h3>

            {variant === "default" && (
              <>
                <div className="mt-1.5">{renderStars()}</div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="font-medium text-foreground text-lg">
                    ₦{product.price.toLocaleString()}
                  </span>
                  {product.originalPrice ? (
                    <span className="text-sm text-muted-foreground line-through">
                      ₦{product.originalPrice.toLocaleString()}
                    </span>
                  ) : null}
                </div>
              </>
            )}
          </CardContent>

          {variant === "default" && (
            <CardFooter className="p-4 pt-0">
              <Button
                className={cn(
                  "w-full gap-2 transition-all",
                  isAddingToCart && "opacity-70"
                )}
                disabled={isAddingToCart}
                onClick={handleAddToCart}
              >
                {isAddingToCart ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
                Add to Cart
              </Button>
            </CardFooter>
          )}

          {variant === "compact" && (
            <CardFooter className="p-4 pt-0">
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground">
                    ₦{product.price.toLocaleString()}
                  </span>
                  {product.originalPrice ? (
                    <span className="text-sm text-muted-foreground line-through">
                      ₦{product.originalPrice.toLocaleString()}
                    </span>
                  ) : null}
                </div>
                <Button
                  className="h-8 w-8 rounded-full"
                  disabled={isAddingToCart}
                  onClick={handleAddToCart}
                  size="icon"
                  variant="ghost"
                >
                  {isAddingToCart ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <ShoppingCart className="h-4 w-4" />
                  )}
                  <span className="sr-only">Add to cart</span>
                </Button>
              </div>
            </CardFooter>
          )}

          {!product.inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20">
              <Badge className="px-3 py-1 text-sm" variant="destructive">
                Out of Stock
              </Badge>
            </div>
          )}
        </Card>
      </Link>
    </div>
  );
}
