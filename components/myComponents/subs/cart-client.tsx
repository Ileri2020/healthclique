'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  ShoppingCart, 
  X, 
  Plus, 
  Minus, 
  Loader2, 
  CreditCard, 
  Landmark, 
  LayoutList,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose
} from '@/components/ui/drawer';
import { useCart } from '@/hooks/use-cart';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useAppContext } from '@/hooks/useAppContext';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { toast } from 'sonner';

// Payment Components
import MonnifyPaymentButton from '../../payment/monnify';
import { ManualTransfer } from "../../payment/manual";
import { AddressEdit } from "./AddressEdit";
import Login from "./login";
import Signup from "./signup";

type CartClientProps = {
  className?: string;
  cart?: any; // Added to support props from parent components
};

export function CartClient({ className }: CartClientProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [pendingAutoMethod, setPendingAutoMethod] = React.useState<'monnify' | 'manual' | null>(null);

  const monnifyRef = React.useRef<HTMLButtonElement>(null);
  const manualRef = React.useRef<HTMLButtonElement>(null);

  const isDesktop = useMediaQuery("(min-width: 768px)");

  const { items, removeItem, clearCart, subtotal, updateQuantity, itemCount } = useCart();
  const { user, setUser, checkoutData, setCheckoutData } = useAppContext();
  
  const [selectedAddressId, setSelectedAddressId] = React.useState<string | null>(
    user?.addresses?.[0]?.id ?? null
  );

  const deliveryFee = 1500; // Simplified for now
  const totalAmount = subtotal + deliveryFee;
  const markup = 1.0; // Handled server-side usually, but for UI display

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Proactive address sync
  React.useEffect(() => {
    if (user?.id && user.id !== 'nil' && (!user.addresses || user.addresses.length === 0)) {
      const fetchAddresses = async () => {
        try {
          const res = await axios.get(`/api/dbhandler?model=shippingAddress&userId=${user.id}`);
          if (Array.isArray(res.data)) {
            setUser({ ...user, addresses: res.data });
          }
        } catch (err) {
          console.error("Failed to fetch user addresses in cart", err);
        }
      };
      fetchAddresses();
    }
  }, [user?.id, user?.addresses, setUser]);

  React.useEffect(() => {
    if (!selectedAddressId && user?.addresses?.length) {
      setSelectedAddressId(user.addresses[0].id);
    }
  }, [user?.addresses, selectedAddressId]);

  // Handle automatic payment trigger
  React.useEffect(() => {
    if (checkoutData && pendingAutoMethod) {
      const timer = setTimeout(() => {
        if (pendingAutoMethod === 'monnify' && monnifyRef.current) {
          monnifyRef.current.click();
        } else if (pendingAutoMethod === 'manual' && manualRef.current) {
          manualRef.current.click();
        }
        setPendingAutoMethod(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [checkoutData, pendingAutoMethod]);

  const initiateCheckout = async (forcedAmount?: number) => {
    if (!user?.id || user.id === 'nil') {
      toast.error("Please log in to checkout");
      return;
    }
    if (!selectedAddressId) {
      toast.error("Please select a delivery address");
      return;
    }

    setIsCheckingOut(true);
    try {
      const res = await axios.post('/api/payment', {
        userId: user.id,
        items: items.map(i => ({
          productId: i.id,
          quantity: i.quantity,
          bulkPriceId: (i as any).bulkPriceId,
          isSpecial: !!(i as any).isSpecial
        })),
        deliveryFee,
        deliveryAddressId: selectedAddressId,
        forcedAmount // For Admin Test
      });
      
      setCheckoutData(res.data);
      return res.data;
    } catch (err) {
      console.error("Checkout failed:", err);
      toast.error("Failed to initiate checkout. Please try again.");
      setPendingAutoMethod(null);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handlePaymentMethod = async (method: 'monnify' | 'manual' | null) => {
    setPendingAutoMethod(method);
    await initiateCheckout();
  };

  const handleAdminTest = async () => {
    setPendingAutoMethod('monnify');
    await initiateCheckout(100);
  };

  const CartTrigger = (
    <Button
      aria-label="Open cart"
      className="relative h-10 w-10 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-md active:scale-95"
      size="icon"
      variant="ghost"
    >
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <Badge
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-black border-2 border-background"
          variant="default"
        >
          {itemCount}
        </Badge>
      )}
    </Button>
  );

  const CartContent = (
    <div className="flex flex-col h-full bg-background no-scrollbar">
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b px-6 py-4 bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div>
          <div className="text-xl font-black flex items-center gap-2">
             <ShoppingCart className="w-6 h-6 text-primary" />
             Your Cart
          </div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
            {itemCount === 0
              ? "Your cart is empty"
              : `You have ${itemCount} item${itemCount !== 1 ? "s" : ""} in your cart`}
          </p>
        </div>
        {isDesktop ? (
          <SheetClose asChild>
            <Button size="icon" variant="ghost" className="rounded-full hover:bg-muted/50">
              <X className="h-5 w-5" />
            </Button>
          </SheetClose>
        ) : (
          <DrawerClose asChild>
             <Button size="icon" variant="ghost" className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </DrawerClose>
        )}
      </div>

      {/* 2. Items Area */}
      <div className="flex-1 overflow-y-auto px-6 no-scrollbar">
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
              exit={{ opacity: 0, scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.95 }}
            >
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/5 border-2 border-primary/10 shadow-inner">
                <ShoppingCart className="h-12 w-12 text-primary/40" />
              </div>
              <h3 className="mb-2 text-xl font-black">Your cart is empty</h3>
              <p className="mb-8 max-w-[220px] text-sm font-medium text-muted-foreground leading-relaxed">
                Explore our catalog and find the medicines you need.
              </p>
              {isDesktop ? (
                <SheetClose asChild>
                  <Link href="/store">
                    <Button className="rounded-xl h-12 px-8 font-black shadow-lg shadow-primary/20">Browse Products</Button>
                  </Link>
                </SheetClose>
              ) : (
                <DrawerClose asChild>
                  <Link href="/store">
                    <Button className="rounded-xl h-12 px-8 font-black">Browse Products</Button>
                  </Link>
                </DrawerClose>
              )}
            </motion.div>
          ) : (
            <div className="space-y-3 py-6">
              {items.map((item) => (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative flex rounded-2xl border-2 border-muted/30 bg-card p-3 shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
                  exit={{ opacity: 0, x: -20 }}
                  initial={{ opacity: 0, y: 10 }}
                  key={`${item.id}-${(item as any).bulkPriceId || 'single'}`}
                  layout
                >
                  <div className="relative h-20 w-20 overflow-hidden rounded-xl border bg-muted/20">
                    <img
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-110"
                      src={item.img ?? (item as any).images?.[0] ?? '/placeholder.jpg'}
                    />
                  </div>
                  <div className="ml-4 flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <Link
                          className="line-clamp-1 text-sm font-black group-hover:text-primary transition-colors"
                          href={`/products/${item.id}`}
                          onClick={() => setIsOpen(false)}
                        >
                          {item.name}
                        </Link>
                        <button
                          className="-mt-1 -mr-1 h-7 w-7 flex items-center justify-center rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all"
                          onClick={() => removeItem(item.id, (item as any).bulkPriceId)}
                          type="button"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Badge variant="outline" className="text-[9px] h-4 font-black uppercase tracking-tighter bg-primary/5 text-primary">
                          {item.category ? (typeof item.category === 'string' ? item.category : (item.category as any).name) : 'Medical'}
                        </Badge>
                        {(item as any).bulkName && (
                          <Badge variant="default" className="text-[9px] h-4 font-black uppercase tracking-tighter">
                            {(item as any).bulkName}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-lg border-2 border-muted bg-muted/30 p-0.5">
                        <button
                          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-white hover:shadow-sm"
                          disabled={item.quantity <= 1}
                          onClick={() => updateQuantity(item.id, item.quantity - 1, (item as any).bulkPriceId)}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                        <button
                          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-white hover:shadow-sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1, (item as any).bulkPriceId)}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-sm font-black text-primary">
                        ₦{(item.price * markup * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Actions / Selection Section */}
      {items.length > 0 && (
        <div className="border-t px-6 py-5 bg-muted/10 space-y-5">
           {/* Address Selection */}
          {user?.id !== 'nil' ? (
             <div className="space-y-2">
               <div className="flex justify-between items-center px-1">
                 <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Delivery Address</label>
                 {user.addresses?.length > 0 && <AddressEdit />}
               </div>
               {user.addresses && user.addresses.length > 0 ? (
                 <select
                    className="w-full h-11 rounded-xl border-2 border-muted bg-background px-4 text-xs font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                    value={selectedAddressId ?? ""}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                  >
                    {user.addresses.map((address: any) => (
                      <option key={address.id} value={address.id}>
                        {[address.address, address.city, address.state].filter(Boolean).join(", ")}
                      </option>
                    ))}
                  </select>
               ) : (
                 <div className="flex items-center justify-between p-3 rounded-xl border-2 border-dashed border-red-200 bg-red-50/30">
                    <p className="text-[11px] font-black text-red-500 italic">No address found. Add one to pay.</p>
                    <AddressEdit />
                 </div>
               )}
             </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-100 flex flex-col items-center text-center gap-3">
               <AlertCircle className="w-8 h-8 text-amber-500" />
               <p className="text-xs font-black text-amber-700 uppercase tracking-tight">Login Required to Checkout</p>
               <div className="flex gap-4">
                  <Login />
                  <Signup />
               </div>
            </div>
          )}

          {/* Pricing Logic */}
          <div className="bg-card rounded-2xl border-2 border-muted shadow-sm overflow-hidden text-sm">
            <div className="grid grid-cols-2 p-3 border-b text-xs font-bold text-muted-foreground uppercase tracking-tight">
               <div className="flex items-center gap-1.5"><LayoutList className="w-3 h-3"/> Subtotal</div>
               <div className="text-right">₦{subtotal.toFixed(2)}</div>
            </div>
            <div className="grid grid-cols-2 p-3 border-b text-xs font-bold text-muted-foreground uppercase tracking-tight">
               <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3"/> Shipping</div>
               <div className="text-right">₦{deliveryFee.toFixed(2)}</div>
            </div>
            <div className="grid grid-cols-2 p-4 bg-primary text-white font-black">
               <div className="text-sm">Total Amount</div>
               <div className="text-right text-base text-white">₦{totalAmount.toFixed(2)}</div>
            </div>
          </div>

          {/* PAYMENT ACTION CLUSTER */}
          {user?.id !== 'nil' && (
             <div className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Option 1: Save Only */}
                  <Button 
                    className="h-14 rounded-2xl font-black text-xs border-2 transition-all gap-2"
                    disabled={isCheckingOut || !selectedAddressId}
                    onClick={() => handlePaymentMethod(null)}
                    variant="outline"
                  >
                    {isCheckingOut && !pendingAutoMethod ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <LayoutList className="w-4 h-4 text-primary" />
                    )}
                    CHECKOUT & SAVE
                  </Button>

                  {/* Option 2: Pay Online */}
                  <div className="relative">
                    <Button 
                      className="h-14 rounded-2xl font-black text-xs border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-400 transition-all gap-2 w-full text-blue-700"
                      disabled={isCheckingOut || !selectedAddressId}
                      onClick={() => handlePaymentMethod('monnify')}
                      variant="outline"
                    >
                      {isCheckingOut && pendingAutoMethod === 'monnify' ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      ) : (
                        <CreditCard className="w-4 h-4 text-blue-600" />
                      )}
                      PAY ONLINE
                    </Button>
                    <div className="hidden">
                      {checkoutData && (
                        <MonnifyPaymentButton
                          amount={checkoutData.amount}
                          email={user.email}
                          name={user.name || 'User'}
                          onSuccess={() => { clearCart(); setCheckoutData(null); setIsOpen(false); window.location.reload(); }}
                          ref={monnifyRef}
                          reference={checkoutData.tx_ref}
                        />
                      )}
                    </div>
                  </div>

                  {/* Option 3: Bank Transfer */}
                  <div className="relative">
                    <Button 
                      className="h-14 rounded-2xl font-black text-xs border-2 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-400 transition-all gap-2 w-full text-emerald-700"
                      disabled={isCheckingOut || !selectedAddressId}
                      onClick={() => handlePaymentMethod('manual')}
                      variant="outline"
                    >
                      {isCheckingOut && pendingAutoMethod === 'manual' ? (
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      ) : (
                        <Landmark className="w-4 h-4 text-emerald-600" />
                      )}
                      BANK TRANSFER
                    </Button>
                    <div className="hidden">
                      {checkoutData && (
                        <ManualTransfer
                          amount={checkoutData.amount}
                          cartId={checkoutData.cartId}
                          ref={manualRef}
                          tx_ref={checkoutData.tx_ref}
                          userId={user.id}
                        />
                      )}
                    </div>
                  </div>

                  {/* Admin Test (NGN100) */}
                  {user.role === 'admin' && (
                    <Button 
                      className="h-14 rounded-2xl font-black text-[10px] border-2 border-amber-300 bg-amber-50/50 hover:bg-amber-100 transition-all gap-1.5 text-amber-700"
                      disabled={isCheckingOut || !selectedAddressId}
                      onClick={handleAdminTest}
                      variant="outline"
                    >
                      {isCheckingOut && pendingAutoMethod === 'monnify' ? (
                         <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                      ) : (
                        <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-white p-0">₦</div>
                      )}
                      ADMIN TEST (₦100)
                    </Button>
                  )}
               </div>

               {!selectedAddressId && (
                  <p className="text-[10px] text-red-500 font-black text-center animate-pulse">
                    * PLEASE SELECT AN ADDRESS TO ENABLE PAYMENT BUTTONS
                  </p>
               )}
             </div>
          )}
        </div>
      )}

      {/* 4. Sticky Footer (See All Carts, etc) */}
       <div className="p-6 pt-2 space-y-3 bg-background border-t mt-auto">
        <Link href="/cart" onClick={() => setIsOpen(false)} className="block w-full">
          <Button className="w-full h-11 rounded-xl font-black shadow-sm" variant="secondary">
             VIEW ALL SAVED CARTS
          </Button>
        </Link>
        {items.length > 0 && (
          <div className="flex items-center gap-2">
            {isDesktop ? (
              <SheetClose asChild>
                <Button variant="ghost" className="flex-1 h-10 rounded-xl font-bold text-xs text-muted-foreground uppercase tracking-widest">Back to Store</Button>
              </SheetClose>
            ) : (
              <DrawerClose asChild>
                <Button variant="ghost" className="flex-1 h-10 rounded-xl font-bold text-xs text-muted-foreground uppercase tracking-widest">Back to Store</Button>
              </DrawerClose>
            )}
            <Button
              className="flex-1 h-10 rounded-xl font-bold text-xs hover:bg-destructive hover:text-white transition-colors uppercase tracking-widest"
              onClick={() => { clearCart(); setCheckoutData(null); }}
              variant="outline"
            >
              Empty Cart
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  if (!isMounted) {
    return (
      <div className={cn("relative", className)}>
        <Button
          aria-label="Open cart"
          className="relative h-10 w-10 rounded-full"
          size="icon"
          variant="outline"
        >
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-black border-2 border-background"
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
          <SheetContent className="flex w-[400px] flex-col p-0 no-scrollbar overflow-y-auto">
            <SheetHeader className="hidden">
              <SheetTitle>Shopping Cart</SheetTitle>
            </SheetHeader>
            {CartContent}
          </SheetContent>
        </Sheet>
      ) : (
        <Drawer onOpenChange={setIsOpen} open={isOpen}>
          <DrawerTrigger asChild>{CartTrigger}</DrawerTrigger>
          <DrawerContent className="h-[90vh] p-0 flex flex-col no-scrollbar">
            <DrawerHeader className="hidden">
              <DrawerTitle>Shopping Cart</DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 overflow-hidden">
               {CartContent}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
