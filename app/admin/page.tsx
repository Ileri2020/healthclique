"use client";

import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { DataTableDemo } from "@/components/myComponents/subs/datatable";

import UserForm from "@/prisma/forms/UserForm";
import ProductForm from "@/prisma/forms/ProductForm";
import CategoryForm from "@/prisma/forms/CategoryForm";
import StockForm from "@/prisma/forms/StockForm";
import FeaturedProductForm from "@/prisma/forms/FeaturedProductForm";
import ReviewForm from "@/prisma/forms/ReviewForm";
import NotificationForm from "@/prisma/forms/NotificationForm";
import PaymentForm from "@/prisma/forms/PaymentForm";
import RefundForm from "@/prisma/forms/RefundForm";
import CartForm from "@/prisma/forms/CartForm";
import CouponForm from "@/prisma/forms/CouponForm";
import ShippingAddressForm from "@/prisma/forms/ShippingAddressForm";
import PostForm from "@/prisma/forms/PostForm";
import DeliveryFeeForm from "@/prisma/forms/DeliveryFeeForm";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart } from "lucide-react";
import { AccountUpgrade } from "@/components/myComponents/subs/AccountUpgrade";
import { AdminUserManager } from "@/components/myComponents/subs/AdminUserManager";
import { useAppContext } from "@/hooks/useAppContext";
import { CartDetailsDialog } from "@/components/myComponents/subs/CartDetailsDialog";
import { useEffect } from "react";
import { formatPrice } from "@/lib/stock-pricing";
import { toast } from "sonner";

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

const forms = [
  { name: "User", component: UserForm },
  { name: "Product", component: ProductForm },
  { name: "Category", component: CategoryForm },
  { name: "Stock", component: StockForm },
  { name: "FeaturedProduct", component: FeaturedProductForm },
  { name: "Review", component: ReviewForm },
  { name: "Notification", component: NotificationForm },
  { name: "Payment", component: PaymentForm },
  { name: "Refund", component: RefundForm },
  { name: "Cart", component: CartForm },
  { name: "Coupon", component: CouponForm },
  { name: "DeliveryFee", component: DeliveryFeeForm },
  { name: "ShippingAddress", component: ShippingAddressForm },
  { name: "Post", component: PostForm },
];

const Admin = () => {
    const { user } = useAppContext();
    const isAdmin = user?.role === "admin";
    const isStaff = user?.role === "staff";

    const [selectedForms, setSelectedForms] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Order Management State
    const [cartData, setCartData] = useState<any[]>([]);
    const [cartSearch, setCartSearch] = useState("");
    const [selectedCart, setSelectedCart] = useState<any | null>(null);
    const [cartDialogOpen, setCartDialogOpen] = useState(false);
    const [loadingCart, setLoadingCart] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [showAllStatus, setShowAllStatus] = useState(false);

  const toggleForm = (name: string) => {
    setSelectedForms((prev) =>
      prev.includes(name) ? prev.filter((f) => f !== name) : [...prev, name]
    );
  };

  const filteredForms = useMemo(
    () =>
      forms.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery]
  );

  const toggleAll = () => {
    if (selectedForms.length === filteredForms.length) {
      setSelectedForms([]);
    } else {
      setSelectedForms(filteredForms.map((f) => f.name));
    }
  };

  const allSelected = selectedForms.length === filteredForms.length && filteredForms.length > 0;
  const partiallySelected = selectedForms.length > 0 && selectedForms.length < filteredForms.length;

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ table }: any) => (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
                className={partiallySelected ? "bg-gray-400" : ""}
              />
              <span>Form Name</span>
            </div>
            <Input
              placeholder="Search forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-1"
            />
          </div>
        ),
      },
      {
        accessorKey: "select",
        header: "Select",
        cell: ({ row }: any) => (
          <Checkbox
            checked={selectedForms.includes(row.original.name)}
            onCheckedChange={() => toggleForm(row.original.name)}
          />
        ),
      },
    ],
    [selectedForms, searchQuery, filteredForms, allSelected, toggleAll, partiallySelected, toggleForm]
  );

  const cartColumns = useMemo(
    () => [
      { accessorKey: "userName", header: "Customer/Week" },
      { 
        accessorKey: "total", 
        header: "Total",
        cell: ({ row }: any) => {
            if (row.original.status === 'separator') return null;
            return <span className="font-bold">₦{formatPrice(row.original.total || 0)}</span>;
        }
      },
      { 
        accessorKey: "status", 
        header: "Status",
        cell: ({ row }: any) => {
            if (row.original.status === 'separator') return <Badge className="bg-primary/20 text-primary border-none font-black">{row.original.userName}</Badge>;
            return (
                <Badge variant={row.original.status === 'paid' ? "default" : "secondary"} className="uppercase font-black">
                    {row.original.status}
                </Badge>
            );
        }
      },
      { accessorKey: "createdAt", header: "Created At" },
    ],
    []
  );

  /* ================= DATA FETCH (CARTS) ================= */
  useEffect(() => {
    if (!isAdmin && !isStaff) return;

    const fetchCarts = async () => {
        try {
            const statusFilter = showAllStatus ? "paid,unconfirmed,pending,saved" : "paid,unconfirmed";
            const res = await fetch(`/api/dbhandler?model=cart&status=${statusFilter}&search=${cartSearch}`);
            let carts = await res.json();
            if (!Array.isArray(carts)) carts = [];

            // Sort by most recent first
            carts.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
                        createdAt: "",
                        fullData: null
                    });
                }

                finalCarts.push({
                    id: c.id,
                    userName: c.user?.name || "Guest",
                    total: c.total,
                    status: c.status,
                    createdAt: new Date(c.createdAt).toLocaleString(),
                    fullData: c
                });
            });

            setCartData(finalCarts);
        } catch (err) {
            console.error("Cart fetch failed", err);
        }
    };

    const debounce = setTimeout(fetchCarts, 500);
    return () => clearTimeout(debounce);
  }, [isAdmin, isStaff, cartSearch, showAllStatus]);

  const handleCartRowClick = (row: any) => {
    if (row.status === 'separator') return;
    setSelectedCart(row.fullData);
    setCartDialogOpen(true);
  };

  const handleConfirmOrder = async () => {
    if (!selectedCart) return;
    setIsConfirming(true);
    try {
        const res = await fetch("/api/dbhandler?model=cart", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: selectedCart.id,
                status: "paid"
            })
        });

        if (res.ok) {
            toast.success("Order payment confirmed successfully");
            setCartDialogOpen(false);
            // Refresh data
            setCartSearch(prev => prev + " "); // Trigger re-fetch briefly
            setTimeout(() => setCartSearch(prev => prev.trim()), 100);
        } else {
            throw new Error("Failed to confirm");
        }
    } catch (err) {
        console.error(err);
        toast.error("Could not confirm order status");
    } finally {
        setIsConfirming(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        transition: { delay: 0.5, duration: 0.6, ease: "easeIn" },
      }}
      className="w-[100vw] p-4"
    >
      <div className="text-4xl font-semibold w-full text-center mb-6">
        Admin Dashboard
      </div>

      <div className="max-w-sm mx-auto mb-10 flex flex-col gap-3">
        <AdminUserManager />
        <AccountUpgrade />
      </div>

      {/* Render selected forms */}
      <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-5">
        {/* DataTable for form selection */}
        <div className="mb-6 max-w-md">
          <DataTableDemo columns={columns} data={filteredForms} />
        </div>

        {selectedForms.map((name) => {
          const FormComponent = forms.find((f) => f.name === name)?.component;
          return FormComponent ? <FormComponent key={name} /> : null;
        })}
      </div>

      {/* ORDER MANAGEMENT SECTION */}
      <div className="mt-12 bg-card p-6 rounded-2xl border shadow-sm col-span-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-primary" /> Active Orders
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Manage processing, paid, and unconfirmed customer carts</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <div className="flex items-center space-x-2 bg-muted/50 px-3 py-1 rounded-lg border">
                <label htmlFor="show-all" className="text-xs font-bold cursor-pointer">Show Drafts/Saved</label>
                <Checkbox id="show-all" checked={showAllStatus} onCheckedChange={(val: boolean) => setShowAllStatus(val)} />
             </div>
             <Input 
                placeholder="Search customer orders..." 
                value={cartSearch}
                onChange={(e) => setCartSearch(e.target.value)}
                className="max-w-xs h-10 rounded-lg shadow-sm"
             />
          </div>
        </div>
        
        <DataTableDemo
          columns={cartColumns}
          data={cartData}
          onRowClick={handleCartRowClick}
        />
      </div>

      <CartDetailsDialog 
        open={cartDialogOpen}
        onOpenChange={setCartDialogOpen}
        cart={selectedCart}
        onConfirmPayment={handleConfirmOrder}
        loading={isConfirming}
      />

      <Separator className="my-10" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
        <div className="p-4 rounded-xl border bg-muted/20">
            <p className="text-xs font-black uppercase text-muted-foreground">Sales Revenue</p>
            <p className="text-2xl font-black mt-1">₦0.00</p>
        </div>
        <div className="p-4 rounded-xl border bg-muted/20">
            <p className="text-xs font-black uppercase text-muted-foreground">Estimated Profit</p>
            <p className="text-2xl font-black mt-1 text-emerald-600">₦0.00</p>
        </div>
        <div className="p-4 rounded-xl border bg-muted/20">
            <p className="text-xs font-black uppercase text-muted-foreground">Total Cost</p>
            <p className="text-2xl font-black mt-1 text-red-600">₦0.00</p>
        </div>
        <div className="p-4 rounded-xl border bg-muted/20">
            <p className="text-xs font-black uppercase text-muted-foreground">Active Carts</p>
            <p className="text-2xl font-black mt-1">{cartData.length}</p>
        </div>
      </div>
    </motion.section>
  );
};

export default Admin;
