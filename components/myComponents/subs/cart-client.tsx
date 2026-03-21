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
  cart?: any;
};

export function CartClient({ className, cart: _unusedCart }: CartClientProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [pendingAutoMethod, setPendingAutoMethod] = React.useState<'monnify' | 'manual' | 'test' | null>(null);

  const monnifyRef = React.useRef<HTMLButtonElement>(null);
  const manualRef = React.useRef<HTMLButtonElement>(null);

  const isDesktop = useMediaQuery("(min-width: 768px)");

  const { items, removeItem, clearCart, subtotal, updateQuantity, itemCount } = useCart();
  const { user, setUser, checkoutData, setCheckoutData } = useAppContext();
  
  const [selectedAddressId, setSelectedAddressId] = React.useState<string | null>(
    user?.addresses?.[0]?.id ?? null
  );

  const deliveryFee = 1500;
  const totalAmount = subtotal + deliveryFee;
  const markup = 1.0; 

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Handle Automatic payment trigger after checkoutData is received
  // We use a separate effect for triggering the programmatic click to avoid re-render conflicts
  React.useEffect(() => {
    if (checkoutData && pendingAutoMethod) {
      const timer = setTimeout(() => {
        let triggered = false;
        if ((pendingAutoMethod === 'monnify' || pendingAutoMethod === 'test') && monnifyRef.current) {
          console.log("Auto-launching Monnify for:", checkoutData.tx_ref);
          // CLOSE the cart dialog first to release body pointer-events block
          setIsOpen(false); 
          // Slight further delay to let the Sheet/Drawer close transition finish
          setTimeout(() => {
            monnifyRef.current?.click();
          }, 300);
          triggered = true;
        } else if (pendingAutoMethod === 'manual' && manualRef.current) {
          manualRef.current.click();
          triggered = true;
        }
        
        if (triggered) {
          // Reset after triggering click to prevent duplicate triggers
          setPendingAutoMethod(null);
        }
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
      const payload = {
        userId: user.id,
        items: items.map(i => ({
          productId: i.id,
          quantity: i.quantity,
          bulkPriceId: (i as any).bulkPriceId,
          isSpecial: !!(i as any).isSpecial,
          customPrice: (i as any).customPrice,
          customName: (i as any).customName
        })),
        deliveryFee,
        deliveryAddressId: selectedAddressId,
        forcedAmount 
      };

      const res = await axios.post('/api/payment', payload);
      setCheckoutData(res.data);
      return res.data;
    } catch (err) {
      console.error("Checkout failed:", err);
      toast.error("Failed to initiate checkout");
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
    setPendingAutoMethod('test');
    await initiateCheckout(100);
  };

  const CartTrigger = (
    <Button
      aria-label="Open cart"
      className="relative h-10 w-10 rounded-full"
      size="icon"
      variant="outline"
    >
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <Badge
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
          variant="default"
        >
          {itemCount}
        </Badge>
      )}
    </Button>
  );

  const CartContent = (
    <div className="flex flex-col h-full bg-background no-scrollbar overflow-hidden">
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b px-6 py-4 bg-background z-20">
        <div>
          <div className="text-xl font-bold">Shopping Cart</div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">
            {itemCount === 0
              ? "Your cart is empty"
              : `You have ${itemCount} item${itemCount !== 1 ? "s" : ""} in your cart`}
          </p>
        </div>
        {isDesktop ? (
          <SheetClose asChild>
            <Button size="icon" variant="ghost" className="rounded-full">
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
      <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar min-h-0 bg-secondary/5">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-bold">Your cart is empty</h3>
            <p className="text-sm text-muted-foreground mb-6">Looks like you haven't added anything yet.</p>
            {isDesktop ? (
              <SheetClose asChild>
                <Link href="/store"><Button>Browse Products</Button></Link>
              </SheetClose>
            ) : (
              <DrawerClose asChild>
                <Link href="/store"><Button>Browse Products</Button></Link>
              </DrawerClose>
            )}
          </div>
        ) : (
          <div className="space-y-4">
             {items.map((item) => (
              <div
                key={`${item.id}-${(item as any).bulkPriceId || 'single'}`}
                className="flex gap-4 p-3 rounded-xl border bg-card hover:shadow-sm transition-shadow"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-muted">
                  <img
                    alt={item.name}
                    className="h-full w-full object-cover"
                    src={item.img ?? (item as any).images?.[0] ?? '/placeholder.jpg'}
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                   <div className="space-y-1">
                    <div className="flex justify-between items-start gap-2">
                       <Link
                        className="text-sm font-bold truncate hover:text-primary transition-colors"
                        href={`/products/${item.id}`}
                        onClick={() => setIsOpen(false)}
                      >
                        {item.name}
                      </Link>
                      <button
                        className="text-muted-foreground hover:text-destructive p-1"
                        onClick={() => removeItem(item.id, (item as any).bulkPriceId)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                       <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 font-black">
                          {item.category ? (typeof item.category === 'string' ? item.category : (item.category as any).name) : 'Medical'}
                       </Badge>
                       {(item as any).bulkName && (
                          <Badge variant="default" className="text-[9px] px-1 py-0 h-4 font-black">
                             {(item as any).bulkName}
                          </Badge>
                       )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border rounded-lg bg-background">
                      <button
                        className="p-1 hover:bg-muted rounded-l-lg transition-colors"
                        disabled={item.quantity <= 1}
                        onClick={() => updateQuantity(item.id, item.quantity - 1, (item as any).bulkPriceId)}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                      <button
                        className="p-1 hover:bg-muted rounded-r-lg transition-colors"
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Actions Section */}
      {items.length > 0 && (
        <div className="border-t px-6 py-4 bg-background space-y-4 shadow-top z-20">
          {/* Address */}
          {user?.id !== 'nil' ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Delivery Address</label>
                <AddressEdit />
              </div>
              {user.addresses && user.addresses.length > 0 ? (
                <select
                  className="w-full h-10 rounded-xl border px-3 text-xs font-bold bg-muted/20 outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
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
                <div className="p-3 rounded-xl border border-dashed border-red-300 bg-red-50 text-center">
                  <p className="text-[10px] font-bold text-red-600">No address found. Add one to proceed.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-primary/5 border-2 border-primary/10 flex flex-col items-center gap-3">
              <p className="text-xs font-black text-primary uppercase italic">Login to Complete Order</p>
              <div className="flex gap-4">
                <Login />
                <Signup />
              </div>
            </div>
          )}

          {/* Pricing Summary */}
          <div className="space-y-2 py-3 border-t border-b border-dashed">
             <div className="flex justify-between text-xs font-bold text-muted-foreground">
                <span>Subtotal</span>
                <span>₦{subtotal.toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-xs font-bold text-muted-foreground">
                <span>Delivery Charge</span>
                <span>₦{deliveryFee.toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-lg font-black text-primary pt-1">
                <span>Total Amount</span>
                <span>₦{totalAmount.toFixed(2)}</span>
             </div>
          </div>

          {/* Buttons Block */}
          {user?.id !== 'nil' && !isCheckingOut && (
            <div className="space-y-2">
              {/* Checkout Only */}
              <Button 
                className="w-full h-11 rounded-xl text-lg font-black shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all gap-2"
                disabled={!selectedAddressId}
                onClick={() => handlePaymentMethod(null)}
              >
                  <LayoutList className="w-5 h-5" />
                  Checkout
              </Button>

              <div className="grid grid-cols-2 gap-2">
                 <Button 
                    className="w-full h-10 rounded-xl font-black border-2 border-primary/20 hover:bg-primary/5 transition-all gap-2 text-xs"
                    disabled={!selectedAddressId}
                    onClick={() => handlePaymentMethod('monnify')}
                    variant="outline"
                  >
                    <CreditCard className="w-4 h-4 text-primary" />
                    Monnify
                  </Button>

                 <Button 
                    className="w-full h-10 rounded-xl font-black border-2 border-primary/20 hover:bg-primary/5 transition-all gap-2 text-xs"
                    disabled={!selectedAddressId}
                    onClick={() => handlePaymentMethod('manual')}
                    variant="outline"
                  >
                    <Landmark className="w-4 h-4 text-primary" />
                    Bank Transfer
                  </Button>
              </div>

              {user.role === 'admin' && (
                <Button 
                  className="w-full h-9 rounded-xl font-black border-dashed border-2 border-amber-500 text-amber-600 hover:bg-amber-100 transition-all gap-2 text-xs"
                  disabled={!selectedAddressId}
                  onClick={handleAdminTest}
                  variant="outline"
                >
                  <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-white text-[10px]">₦</div>
                  Admin Test (₦100)
                </Button>
              )}
            </div>
          )}

          {isCheckingOut && (
            <div className="flex flex-col items-center justify-center py-6 gap-2 text-primary animate-pulse">
               <Loader2 className="w-8 h-8 animate-spin" />
               <p className="text-xs font-black uppercase tracking-widest">Applying Checkout...</p>
            </div>
          )}
        </div>
      )}

      {/* 4. Footer Links */}
      <div className="p-6 pt-2 space-y-3 bg-background border-t mt-auto shadow-inner text-center z-20">
        <Link href="/cart" onClick={() => setIsOpen(false)} className="inline-block w-full">
          <Button className="w-full h-11 rounded-xl font-black" variant="secondary">
             VIEW ALL SAVED CARTS
          </Button>
        </Link>
        {items.length > 0 && !isCheckingOut && (
          <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 h-9 rounded-xl text-xs font-black text-destructive hover:bg-destructive hover:text-white transition-all"
                onClick={() => { clearCart(); setCheckoutData(null); }}
              >
                CLEAR CART
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
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-black" variant="default">
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
            <SheetHeader className="hidden">
              <SheetTitle>Shopping Cart</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-hidden h-full">
               {CartContent}
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Drawer onOpenChange={setIsOpen} open={isOpen}>
          <DrawerTrigger asChild>{CartTrigger}</DrawerTrigger>
          <DrawerContent className="h-[95vh] p-0 flex flex-col">
            <DrawerHeader className="hidden">
              <DrawerTitle>Shopping Cart</DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 overflow-hidden h-full">
               {CartContent}
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* STABLE POSITION TRIGGERS OUTSIDE DIALOG CONTENT */}
      {/* We REMOVED pointer-events-none because it can interfere with the Monnify iframe interactivity */}
      <div 
        id="payment-trigger-container"
        className="fixed bottom-0 left-0 w-1 h-1 overflow-hidden opacity-0 invisible z-[-1]" 
        aria-hidden="true"
      >
        {checkoutData && (
          <>
            <MonnifyPaymentButton
              amount={checkoutData.amount}
              email={user.email}
              name={user.name || 'User'}
              onSuccess={() => { clearCart(); setCheckoutData(null); setIsOpen(false); window.location.reload(); }}
              ref={monnifyRef}
              reference={checkoutData.tx_ref}
            />
            <ManualTransfer
              amount={checkoutData.amount}
              cartId={checkoutData.cartId}
              ref={manualRef}
              tx_ref={checkoutData.tx_ref}
              userId={user.id}
            />
          </>
        )}
      </div>
    </div>
  );
}
