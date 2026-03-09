import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./productCard";
import Autoplay from "embla-carousel-autoplay";
import { useAppContext } from "@/hooks/useAppContext";
import { Skeleton } from "@/components/ui/skeleton";

export function HeavilyDiscountedCarousel() {
  const { user } = useAppContext();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminView, setAdminView] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const url = `/api/heavily-discounted?admin=${user?.role === "admin"}&userId=${user?.id || ""}`;
      const res = await fetch(url);
      setProducts(await res.json());
      setLoading(false);
    };
    fetchProducts();
  }, [user]);

  // Carousel split
  const [topRow, bottomRow] = React.useMemo(() => {
    const top: any[] = [];
    const bottom: any[] = [];
    products.forEach((p, i) => {
      if (i % 2 === 0) top.push(p);
      else bottom.push(p);
    });
    return [top, bottom];
  }, [products]);

  // Inline admin actions
  const handleApprove = async (id: string, approved: boolean) => {
    await fetch(`/api/heavily-discounted`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, approved }),
    });
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, approved } : p));
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/heavily-discounted?id=${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Add new product (inline form)
  // ...existing code for add form...

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <section className="py-12">
      <h2 className="text-2xl font-bold mb-6">Heavily Discounted Products</h2>
      <div className="space-y-8">
        {[topRow, bottomRow].map((row, rowIdx) => (
          <div key={rowIdx} className="flex gap-4 overflow-x-auto pb-2">
            {row.map((item) => (
              <div key={item.id} className="relative">
                <ProductCard product={item.product} orientation="vertical" />
                {/* Inline admin/professional controls */}
                {(user?.role === "admin" || user?.id === item.creatorId) && (
                  <div className="absolute top-2 right-2 flex flex-col gap-2 z-20">
                    {user?.role === "admin" && (
                      <Button size="sm" variant={item.approved ? "outline" : "default"} onClick={() => handleApprove(item.id, !item.approved)}>
                        {item.approved ? "Disapprove" : "Approve"}
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* Inline add form for professionals/admins */}
      {/* ...add form implementation here... */}
    </section>
  );
}
