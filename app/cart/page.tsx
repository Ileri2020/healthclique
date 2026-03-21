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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/stock-pricing";
import { CartDetailsDialog } from "@/components/myComponents/subs/CartDetailsDialog";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

function getWeekNumber(d: Date) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  var weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

function getFirstDayOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
  return new Date(date.setDate(diff));
}

export default function CartPage() {
  const { user } = useAppContext();
  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";

  const [carts, setCarts] = useState<CartSummary[]>([]);
  const [selectedCartId, setSelectedCartId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // System-wide orders for admin
  const [allUserCarts, setAllUserCarts] = useState<any[]>([]);
  const [cartSearch, setCartSearch] = useState("");
  const [selectedAdminCart, setSelectedAdminCart] = useState<any | null>(null);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showAllStatus, setShowAllStatus] = useState(false);

  const fetchCarts = async () => {
    if (!user?.id || user.id === 'nil') return;
    try {
      setLoading(true);
      // Fetches user's cart from MongoDB
      const res = await axios.get(`/api/dbhandler?model=cart&userId=${user.id}`);
      const userCarts = res.data;
      
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

  /* ================= ADMIN ORDER FETCH ================= */
  useEffect(() => {
    if (!isAdmin && !isStaff) return;

    const fetchAllCarts = async () => {
        try {
            const statusFilter = "paid,unconfirmed";
            const res = await axios.get(`/api/dbhandler?model=cart&status=${statusFilter}&search=${cartSearch}`);
            let carts = Array.isArray(res.data) ? res.data : [];
            carts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
            // Weekly grouping
            const finalCarts: any[] = [];
            let currentWeek: number | null = null;
            carts.forEach((c: any) => {
                const deliveryDate = new Date(c.createdAt);
                const weekNum = getWeekNumber(deliveryDate);
                if (currentWeek !== weekNum) {
                    currentWeek = weekNum;
                    const firstDay = getFirstDayOfWeek(new Date(deliveryDate));
                    finalCarts.push({
                        id: `week-${weekNum}`,
                        userName: `WEEK ${weekNum} - Starts ${firstDay.toLocaleDateString()}`,
                        total: 0,
                        status: "separator",
                        createdAt: ""
                    });
                }
                finalCarts.push(c);
            });
            setAllUserCarts(finalCarts);
        } catch (err) {
            console.error("Failed to fetch all user carts", err);
        }
    };

    const debounce = setTimeout(fetchAllCarts, 500);
    return () => clearTimeout(debounce);
  }, [isAdmin, isStaff, cartSearch]);

  const handleAdminCartClick = (row: any) => {
    if (row.status === 'separator') return;
    setSelectedAdminCart(row);
    setAdminDialogOpen(true);
  };

  const handleConfirmOrder = async () => {
    if (!selectedAdminCart) return;
    setIsConfirming(true);
    try {
        const res = await fetch("/api/dbhandler?model=cart", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: selectedAdminCart.id, status: "paid" })
        });
        if (res.ok) {
            toast.success("Order confirmed successfully");
            setAdminDialogOpen(false);
            setCartSearch(prev => prev + " ");
            setTimeout(() => setCartSearch(prev => prev.trim()), 100);
        }
    } catch (err) {
        toast.error("Confirmation failed");
    } finally {
        setIsConfirming(false);
    }
  };

  const adminCartColumns = [
    { accessorKey: "user.name", header: "Customer/Week", cell: ({ row }: any) => {
        if (row.original.status === 'separator') return <Badge className="bg-primary/20 text-primary border-none font-black">{row.original.userName}</Badge>;
        return <span>{row.original.user?.name || "Guest"}</span>;
    }},
    { accessorKey: "total", header: "Total", cell: ({ row }: any) => {
        if (row.original.status === 'separator') return null;
        return <span className="font-bold">₦{formatPrice(row.original.total)}</span>;
    }},
    { accessorKey: "status", header: "Status", cell: ({ row }: any) => {
        if (row.original.status === 'separator') return null;
        return <Badge variant={row.original.status === 'paid' ? 'default' : 'secondary'} className="uppercase font-black">{row.original.status}</Badge>;
    }},
    { accessorKey: "createdAt", header: "Date", cell: ({ row }: any) => row.original.status !== 'separator' ? <span>{new Date(row.original.createdAt).toLocaleDateString()}</span> : null },
  ];

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

        {/* ADMIN SYSTEM-WIDE ORDERS */}
        {(isAdmin || isStaff) && (
            <section className="space-y-4 pt-10 border-t-4 border-dashed">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-primary">System-wide Orders</h2>
                        <p className="text-muted-foreground font-medium">As Admin/Staff, you can process orders from all users here.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                         <Input 
                            placeholder="Search all user carts..." 
                            value={cartSearch}
                            onChange={(e) => setCartSearch(e.target.value)}
                            className="max-w-xs h-12 shadow-sm"
                         />
                    </div>
                </div>

                <Card className="border-2 border-primary/20 shadow-xl overflow-hidden">
                    <CardHeader className="bg-primary/5">
                        <CardTitle className="text-lg">Pending & Paid Carts Queue</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <DataTableDemo
                            data={allUserCarts}
                            columns={adminCartColumns}
                            onRowClick={handleAdminCartClick}
                        />
                    </CardContent>
                </Card>

                <CartDetailsDialog 
                    open={adminDialogOpen}
                    onOpenChange={setAdminDialogOpen}
                    cart={selectedAdminCart}
                    onConfirmPayment={handleConfirmOrder}
                    loading={isConfirming}
                />
            </section>
        )}
      </div>
    </div>
  );
}
