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
  { name: "ShippingAddress", component: ShippingAddressForm },
  { name: "Post", component: PostForm },
];

const Admin = () => {
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

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
    [selectedForms, searchQuery, filteredForms]
  );

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

      <div className="mt-8">charts of current sales/revenue</div>
      <div>charts of current profit</div>
      <div>charts of current cost</div>
      <div>profit</div>
      <div>total revenue</div>
    </motion.section>
  );
};

export default Admin;
