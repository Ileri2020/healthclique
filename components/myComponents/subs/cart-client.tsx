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
import { PRICE_MARKUPS } from "@/lib/stock-pricing";
import { Login, Signup } from "./index";
import EditUser from "./useredit";
import MonnifyPaymentButton from "../../payment/monnify";
import FlutterWaveButtonHook from "../../payment/flutterwavehook";




export interface CartItem {
  category: string;
  id: string;
  images: any;
  name: string;
  price: number;
  quantity: number;
}

interface Address {
  id: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zip?: string | null;
  phone?: string | null;
}

interface CartProps {
  className?: string;
  cart: any;
}

const normalizeState = (state?: string | null): string | null => {
  if (!state) return null;
  return state.replace(/state/i, "").replace(/[-\s]/g, "_").trim();
};

export function CartClient({ className, cart }: CartProps) { 
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const { items, removeItem, clearCart, subtotal, updateQuantity, itemCount } = useCart();
  const { user, checkoutData, setCheckoutData } = useAppContext();
  
  const [selectedAddressId, setSelectedAddressId] = React.useState<string | null>(
    user?.addresses?.[0]?.id ?? null
  );
  const [dbDeliveryFee, setDbDeliveryFee] = React.useState<number>(0);
  const [loadingFee, setLoadingFee] = React.useState(false);

  const role = user?.role || "customer";
  const markup = PRICE_MARKUPS[role as keyof typeof PRICE_MARKUPS] || 1.3;

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    if (!selectedAddressId && user?.addresses?.length) {
      setSelectedAddressId(user.addresses[0].id);
    }
  }, [user?.addresses, selectedAddressId]);

  const selectedAddress: Address | undefined = user?.addresses?.find(
    (a: Address) => a.id === selectedAddressId
  );

  React.useEffect(() => {
    const fetchDeliveryFee = async () => {
      if (!selectedAddress) {
        setDbDeliveryFee(0);
        return;
      }

      setLoadingFee(true);
      try {
        const res = await axios.get('/api/dbhandler?model=deliveryFee');
        const fees: any[] = res.data;

        if (!Array.isArray(fees)) return;

        const { country, state, city } = selectedAddress;
        const normalizedState = normalizeState(state);

        const match = fees.find(f =>
          f.country === (country || 'Nigeria') &&
          f.state === normalizedState &&
          f.city === city
        ) || fees.find(f =>
          f.country === (country || 'Nigeria') &&
          f.state === normalizedState &&
          !f.city
        ) || fees.find(f =>
          f.country === (country || 'Nigeria') &&
          !f.state
        );

        setDbDeliveryFee(match ? match.price : 6500); 
      } catch (err) {
        console.error("Failed to fetch delivery fee", err);
        setDbDeliveryFee(6500);
      } finally {
        setLoadingFee(false);
      }
    };

    fetchDeliveryFee();
  }, [selectedAddress]);

  
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





  const deliveryFee = items.length > 0 ? dbDeliveryFee : 0;
  const totalAmount = Number(subtotal || 0) + Number(deliveryFee || 0);

  const prepareCheckout = async () => {
    if (!user?.id || user.id === 'nil' || items.length === 0) return;

    try {
      const payload = {
        userId: user.id,
        items: items.map((i) => ({
          productId: i.id,
          quantity: i.quantity,
          bulkPriceId: (i as any).bulkPriceId,
          customName: (i as any).customName,
          customPrice: (i as any).customPrice,
          isSpecial: (i as any).isSpecial,
        })),
        deliveryFee,
        deliveryAddressId: selectedAddressId,
        ...(checkoutData?.cartId ? { cartId: checkoutData.cartId } : {}),
      };

      const res = await axios.post("/api/payment", payload);
      setCheckoutData(res.data);
      return res.data;
    } catch (err: any) {
      console.error("Checkout initiation failed:", err);
      alert("Checkout failed, please try again.");
      return null;
    }
  };

  const handleCheckout = prepareCheckout;







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
                        src={item.img ?? item.images?.[0] ?? '/placeholder.jpg'}
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
                            {(item as any).bulkName && <span className="text-xs ml-2 text-primary font-black uppercase">({(item as any).bulkName})</span>}
                          </Link>
                          <button
                            className={` -mt-1 -mr-1 ml-2 rounded-full p-1 text-muted-foreground transition-colors  hover:bg-muted hover:text-destructive`}
                            onClick={() => removeItem(item.id, (item as any).bulkPriceId)}
                            type="button"
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove item</span>
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.category ? (typeof item.category === 'string' ? item.category : (item.category as any).name) : null}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center rounded-md border">
                          <button
                            className={`flex h-7 w-7 items-center justify-center rounded-l-md border-r text-muted-foreground transition-colors hover:bg-muted hover:text-foreground`}
                            disabled={item.quantity <= 1}
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1, (item as any).bulkPriceId)
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
                              updateQuantity(item.id, item.quantity + 1, (item as any).bulkPriceId)
                            }
                            type="button"
                          >
                            <Plus className="h-3 w-3" />
                            <span className="sr-only">Increase quantity</span>
                          </button>
                        </div>
                        <div className="text-sm font-medium">
                          ₦{(item.price * markup * item.quantity).toFixed(2)}
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
          <div className="border-t px-6 py-4 space-y-3 w-full flex flex-col bg-background">
            
            {/* DELIVERY ADDRESS OR LOGIN */}
            {user?.id !== 'nil' ? (
              <div className="space-y-1">
                <label className="text-sm font-medium">Delivery Address</label>
                {user.addresses && user.addresses.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      value={selectedAddressId ?? ""}
                      onChange={(e) => setSelectedAddressId(e.target.value)}
                    >
                      {user.addresses.map((address: any) => (
                        <option key={address.id} value={address.id}>
                          {[address.address, address.city, address.state].filter(Boolean).join(", ")}
                        </option>
                      ))}
                    </select>
                    <EditUser />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-red-500">No addresses found. Please add one in settings.</p>
                    <EditUser />
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full flex flex-col justify-center items-center space-y-4 py-2">
                <p className="font-medium text-red-500 text-center text-sm">
                  Please log in to proceed with checkout.
                </p>
                <div className="flex flex-row gap-5">
                  <Login />
                  <Signup />
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₦{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">₦{deliveryFee.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold">Total</span>
                <span className="text-base font-semibold">
                  ₦{totalAmount.toFixed(2)}
                </span>
              </div>

              {/* CHECKOUT / PAYMENT BUTTONS */}
              {user?.id !== 'nil' && (
                <div className="space-y-3 pt-2">
                  {!checkoutData ? (
                    <Button 
                      className="w-full" 
                      size="lg" 
                      onClick={prepareCheckout}
                      disabled={!selectedAddressId}
                    >
                      Proceed to Checkout
                    </Button>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <FlutterWaveButtonHook
                        tx_ref={checkoutData.tx_ref}
                        amount={totalAmount}
                        currency="NGN"
                        email={user?.email ?? ""}
                        phone_number={user?.contact ?? ""}
                        name={user?.name ?? ""}
                        onSuccess={async (response: any) => {
                          await axios.post(`/api/payment?action=confirm`, { tx_ref: checkoutData.tx_ref, method: 'flutterwave' });
                          clearCart();
                          setCheckoutData(null);
                          setIsOpen(false);
                          alert("Payment Successful!");
                        }}
                      />
                      <MonnifyPaymentButton
                        reference={checkoutData.tx_ref}
                        amount={totalAmount}
                        currency="NGN"
                        email={user?.email ?? ""}
                        phoneNumber={user?.contact ?? ""}
                        name={user?.name ?? ""}
                        onSuccess={async (response: any) => {
                          await axios.post(`/api/payment?action=confirm`, { tx_ref: checkoutData.tx_ref, method: 'monnify' });
                          clearCart();
                          setCheckoutData(null);
                          setIsOpen(false);
                          alert("Payment Successful!");
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              <Link href="/cart" onClick={() => setIsOpen(false)}>
                <Button className="w-full mt-2" variant="secondary" size="lg">
                  View Full Cart
                </Button>
              </Link>
              
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
                  onClick={() => {
                    clearCart();
                    setCheckoutData(null);
                  }}
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
