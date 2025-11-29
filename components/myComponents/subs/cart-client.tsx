"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/hooks/use-cart";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingCart, X } from "lucide-react";
// import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { useAppContext } from '@/hooks/useAppContext';




export interface CartItem {
  category: string;
  id: string;
  images: any;
  name: string;
  price: number;
  quantity: number;
}

interface CartProps {
  className?: string;
  cart: any;//CartItem[];
}

export function CartClient({ className, cart }: CartProps) { 
  const [isOpen, setIsOpen] = React.useState(false);
  // const [cartItems, setCartItems] = React.useState<any[]>(cart);//React.useState<CartItem[]>(mockCart);
  const [isMounted, setIsMounted] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const { items, addItem, removeItem, clearCart, subtotal, updateQuantity, itemCount } = useCart();
  const {user } = useAppContext();

  React.useEffect(() => {
    setIsMounted(true);
  }, []);











  
  // const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  // const subtotal = cartItems.reduce(
  //   (acc, item) => acc + item.price * item.quantity,
  //   0,
  // );

  // const handleUpdateQuantity = (id: string, newQuantity: number) => {
  //   if (newQuantity < 1) return;
  //   setCartItems((prev) =>
  //     prev.map((item) =>
  //       item.id === id ? { ...item, quantity: newQuantity } : item,
  //     ),
  //   );
  // };

  // const handleRemoveItem = (id: string) => {
  //   setCartItems((prev) => prev.filter((item) => item.id !== id));
  // };

  // const handleClearCart = () => {
  //   setCartItems([]);
  // };





  const handleCheckout = async () => {
    if (items.length === 0) return;

    try {
      // Prepare payload
      const payload = {
        userId: user.id, // replace with actual logged-in user ID
        products: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        total: subtotal,
        status: "pending", // or "paid" depending on your logic
      };

      console.log("Checkout payload:", payload);

      // POST to your API route
      const res = await axios.post("/api/dbhandler?model=cart", payload);

      if (res.status === 200) {
        console.log("Checkout successful:", res.data);
        clearCart(); // empty local cart
        alert("Checkout successful!");
        // Optionally redirect to order summary page
        // window.location.href = `/orders/${res.data.id}`;
      }
    } catch (err) {
      // console.error("Checkout failed:", err);
      alert("Checkout failed, please try again.");
      alert("Checkout failed, please try again.");
    }
  };







  const CartTrigger = (
    <Button
      aria-label="Open cart"
      className="relative h-9 w-9 rounded-full"
      size="icon"
      variant="outline"
    >
      <ShoppingCart className="h-4 w-4" />
      {itemCount > 0 && (
        <Badge
          className={`
            absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-[10px]
          `}
          variant="default"
        >
          <div className="w-full h-full flex justify-center items-center text-center">
            {itemCount}
          </div>
        </Badge>
      )}
    </Button>
  );











  const CartContent = (
    <>
      <div className="flex flex-col">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <div className="text-xl font-semibold">Your Cart</div>
            <div className="text-sm text-muted-foreground">
              {itemCount === 0
                ? "Your cart is empty"
                : `You have ${itemCount} item${itemCount !== 1 ? "s" : ""} in your cart`}
            </div>
          </div>
          {isDesktop && (
            <SheetClose asChild>
              <Button size="icon" variant="ghost">
                <X className="h-5 w-5" />
              </Button>
            </SheetClose>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          <AnimatePresence>
            {items.length === 0 ? (
              <motion.div
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
              >
                <div
                  className={`
                    mb-4 flex h-20 w-20 items-center justify-center rounded-full
                    bg-muted
                  `}
                >
                  <ShoppingCart className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-medium">Your cart is empty</h3>
                <p className="mb-6 text-center text-sm text-muted-foreground">
                  Looks like you haven't added anything to your cart yet.
                </p>
                {isDesktop ? (
                  <SheetClose asChild>
                    <Link href="/store">
                      <Button>Browse Products</Button>
                    </Link>
                  </SheetClose>
                ) : (
                  <DrawerClose asChild>
                    <Link href="/store">
                      <Button>Browse Products</Button>
                    </Link>
                  </DrawerClose>
                )}
              </motion.div>
            ) : (
              <div className="space-y-4 py-4">
                {items.map((item) => (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    className={`group relative flex rounded-lg border bg-card p-2 shadow-sm transition-colors hover:bg-accent/50`}
                    exit={{ opacity: 0, y: -10 }}
                    initial={{ opacity: 0, y: 10 }}
                    key={item.id}
                    layout
                    transition={{ duration: 0.15 }}
                  >
                    <div className="relative h-20 w-20 overflow-hidden rounded">
                      <img
                        alt={item.name}
                        className="object-cover"
                        // fill
                        src={item.images?.[0] ?? '/placeholder.jpg'}
                      />
                    </div>
                    <div className="ml-4 flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between">
                          <Link
                            className={`line-clamp-2 text-sm font-medium group-hover:text-primary`}
                            href={`/products/${item.id}`}
                            onClick={() => setIsOpen(false)}
                          >
                            {item.name}
                          </Link>
                          <button
                            className={` -mt-1 -mr-1 ml-2 rounded-full p-1 text-muted-foreground transition-colors  hover:bg-muted hover:text-destructive`}
                            onClick={() => removeItem(item.id)}
                            type="button"
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove item</span>
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.category}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center rounded-md border">
                          <button
                            className={`flex h-7 w-7 items-center justify-center rounded-l-md border-r text-muted-foreground transition-colors hover:bg-muted hover:text-foreground`}
                            disabled={item.quantity <= 1}
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            type="button"
                          >
                            <Minus className="h-3 w-3" />
                            <span className="sr-only">Decrease quantity</span>
                          </button>
                          <span
                            className={`flex h-7 w-7 items-center justify-center text-xs font-medium `}
                          >
                            {item.quantity}
                          </span>
                          <button
                            className={`flex h-7 w-7 items-center justify-center rounded-r-md border-l text-muted-foreground transition-colors hover:bg-muted hover:text-foreground`}
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            type="button"
                          >
                            <Plus className="h-3 w-3" />
                            <span className="sr-only">Increase quantity</span>
                          </button>
                        </div>
                        <div className="text-sm font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                <div className="flex flex-row gap-3 w-full max-w-sm px-2">
                  <Button>Order</Button>
                  <Button>Save</Button>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {items.length > 0 && (
          <div className="border-t px-6 py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₦{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">Calculated at checkout</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold">Total</span>
                <span className="text-base font-semibold">
                ₦{subtotal.toFixed(2)}
                </span>
              </div>
              <Button className="w-full" size="lg" onClick={handleCheckout}>
                Checkout
              </Button>
              <div className="flex items-center justify-between">
                {isDesktop ? (
                  <SheetClose asChild>
                    <Button variant="outline">Continue Shopping</Button>
                  </SheetClose>
                ) : (
                  <DrawerClose asChild>
                    <Button variant="outline">Continue Shopping</Button>
                  </DrawerClose>
                )}
                <Button
                  className="ml-2"
                  onClick={clearCart}
                  variant="outline"
                >
                  Clear Cart
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );










  if (!isMounted) {
    return (
      <div className={cn("relative", className)}>
        <Button
          aria-label="Open cart"
          className="relative h-9 w-9 rounded-full"
          size="icon"
          variant="outline"
        >
          <ShoppingCart className="h-4 w-4" />
          {itemCount > 0 && (
            <Badge
              className={`
                absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-[10px]
              `}
              variant="default"
            >
              {itemCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }












  return (
    <div className={cn("relative", className)}>
      {isDesktop ? (
        <Sheet onOpenChange={setIsOpen} open={isOpen}>
          <SheetTrigger asChild>{CartTrigger}</SheetTrigger>
          <SheetContent className="flex w-[400px] flex-col p-0">
            <SheetHeader>
              <SheetTitle>Shopping Cart</SheetTitle>
            </SheetHeader>
            {CartContent}
          </SheetContent>
        </Sheet>
      ) : (
        <Drawer onOpenChange={setIsOpen} open={isOpen}>
          <DrawerTrigger asChild>{CartTrigger}</DrawerTrigger>
          <DrawerContent>{CartContent}</DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
