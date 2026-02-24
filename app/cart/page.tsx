"use client";

import { CartClient } from "@/components/myComponents/subs/cart-client";
import { CartDetails } from "@/components/myComponents/subs/CartDetails";
import { DataTableDemo } from "@/components/myComponents/subs/datatable";
import { useAppContext } from "@/hooks/useAppContext";
import axios from "axios";
import { ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { CartSummary, getColumns } from "./columns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CartPage() {
  const { user } = useAppContext();
  const [carts, setCarts] = useState<CartSummary[]>([]);
  const [selectedCartId, setSelectedCartId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCarts = async () => {
    if (!user?.id || user.id === 'nil') return;
    try {
      setLoading(true);
      // Fetches user's cart from MongoDB
      const res = await axios.get(`/api/dbhandler?model=cart`);
      const allCarts = res.data;
      
      // Filter for this user's carts explicitly if user-specific query is not built in dbhandler
      const userCarts = allCarts.filter((c: any) => c.userId === user.id);
      
      // Compute lengths if needed by columns (like _count.products limit to length)
      const modeledCarts = userCarts.map((c: any) => ({
        ...c,
        _count: {
            products: c.products?.length || 0,
        }
      }));

      // Sort recent first
      modeledCarts.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setCarts(modeledCarts);
    } catch (error) {
      console.error("Failed to fetch carts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarts();
  }, [user?.id]);

  const handleViewDetails = (id: string) => {
    setSelectedCartId(id);
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        document.getElementById('cart-details-view')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const columns = getColumns();

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col gap-8">
        <section className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Shopping Cart</h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Current Session
                  </CardTitle>
                  <CardDescription>
                    Manage items currently in your cart ready for checkout.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 bg-secondary/20 p-4 rounded-lg">
                    {/* Reusing cart side drawer trigger */}
                    <CartClient cart={{}} />
                    <div className="text-sm text-muted-foreground">
                      Click the icon to view and edit your current active checkout cart.
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* History Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>
                    View your previous carts and their status. Multiple checkouts tracked here.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-4">Loading history...</div>
                  ) : carts.length > 0 ? (
                    <DataTableDemo
                      data={carts}
                      columns={columns}
                      onRowClick={(row) => handleViewDetails(row.id)}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No cart history found. Checkout a cart to see it here!
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Panel: Selected Cart Details */}
            <div id="cart-details-view" className="lg:col-span-1">
              {selectedCartId ? (
                <div className="sticky top-4 h-[calc(100vh-2rem)]">
                  <CartDetails
                    cartId={selectedCartId}
                    onPaymentSuccess={() => {
                      fetchCarts(); 
                    }}
                  />
                </div>
              ) : (
                <div className="h-full min-h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground bg-muted/10">
                  Select an order history cart to view details
                </div>
              )}
            </div>

          </div>
        </section>
      </div>
    </div>
  );
}
