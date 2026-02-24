"use client";

import React, { useEffect, useState } from "react";
import { useAppContext } from "@/hooks/useAppContext";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Pencil, Trash2, Hash, ArrowUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Brand {
  id: string;
  name: string;
  order: number;
}

const PartnerBrands = () => {
  const { user } = useAppContext();
  const isAdmin = user?.role === "admin";
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({ name: "", order: 0 });

  const [isBulkOrderOpen, setIsBulkOrderOpen] = useState(false);
  const [bulkBrands, setBulkBrands] = useState<Brand[]>([]);
  const [bulkSearch, setBulkSearch] = useState("");

  const fetchBrands = async () => {
    try {
      const res = await fetch("/api/dbhandler?model=brand");
      const data = await res.json();
      if (Array.isArray(data)) {
        // Sort by order alphabetically if order is same
        const sorted = data.sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name));
        setBrands(sorted);
      }
    } catch (error) {
      console.error("Failed to fetch brands", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleCreateOrUpdate = async () => {
    if (!formData.name) return toast.error("Brand name is required");
    
    try {
      const method = editingBrand ? "PUT" : "POST";
      const url = editingBrand 
        ? `/api/dbhandler?model=brand&id=${editingBrand.id}` 
        : "/api/dbhandler?model=brand";

      const res = await fetch(url, {
        method,
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingBrand ? "Brand updated" : "Brand added");
        setIsDialogOpen(false);
        setEditingBrand(null);
        setFormData({ name: "", order: 0 });
        fetchBrands();
      } else {
        toast.error("Operation failed");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this brand?")) return;

    try {
      const res = await fetch(`/api/dbhandler?model=brand&id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Brand deleted");
        fetchBrands();
      } else {
        toast.error("Failed to delete");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const openEditDialog = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({ name: brand.name, order: brand.order });
    setIsDialogOpen(true);
  };

  const handleBulkUpdate = async () => {
    try {
      const res = await fetch("/api/dbhandler?model=brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bulkBrands),
      });

      if (res.ok) {
        toast.success("All rankings updated");
        setIsBulkOrderOpen(false);
        fetchBrands();
      } else {
        toast.error("Failed to update rankings");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const swapOrder = (brandId: string, newOrder: number) => {
    if (isNaN(newOrder)) return;
    setBulkBrands(prev => {
      const currentBrand = prev.find(b => b.id === brandId);
      if (!currentBrand) return prev;
      
      const oldOrder = currentBrand.order;
      const brandToSwap = prev.find(b => b.order === newOrder);
      
      const updated = prev.map(b => {
        if (b.id === brandId) return { ...b, order: newOrder };
        if (brandToSwap && b.id === brandToSwap.id) return { ...b, order: oldOrder };
        return b;
      });
      
      return updated.sort((a,b) => (a.order - b.order) || a.name.localeCompare(b.name));
    });
  };

  const [showAll, setShowAll] = useState(false);

  if (loading) return null;

  const displayedBrands = showAll ? brands : brands.slice(0, 10);

  return (
    <section className="py-16 bg-muted/20 relative group">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center mb-12">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary/60 mb-2">Our Trusted Partners</h3>
          <h2 className="text-3xl font-black text-foreground">Leading Pharmaceutical Brands</h2>
          <div className="w-20 h-1 bg-primary rounded-full mt-4"></div>
        </div>

        {isAdmin && (
          <div className="flex justify-end mb-8 gap-4">
            <Dialog open={isBulkOrderOpen} onOpenChange={(open) => {
              if (open) setBulkBrands([...brands]);
              setIsBulkOrderOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 rounded-full border-primary/20 hover:border-primary">
                  <ArrowUpDown className="h-4 w-4" /> Bulk Reorder
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                  <DialogTitle>Management: Global Brand Ranking</DialogTitle>
                  <DialogDescription>
                    Update brand display order. Changing an index will swap it with the existing brand at that position.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="px-6 py-2 relative">
                  <Search className="absolute left-9 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search brands to reorder..." 
                    className="pl-10"
                    value={bulkSearch}
                    onChange={(e) => setBulkSearch(e.target.value)}
                  />
                </div>

                <ScrollArea className="flex-1 px-6">
                  <div className="space-y-2 py-4">
                    {bulkBrands
                      .filter(b => b.name.toLowerCase().includes(bulkSearch.toLowerCase()))
                      .map((brand) => (
                      <div key={brand.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-transparent hover:border-primary/20 transition-all">
                        <span className="font-semibold text-sm">{brand.name}</span>
                        <div className="flex items-center gap-3">
                          <Label className="text-xs text-muted-foreground">Order:</Label>
                          <Input 
                            type="number" 
                            value={brand.order}
                            onChange={(e) => swapOrder(brand.id, parseInt(e.target.value))}
                            className="w-20 h-8 text-center font-bold"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <DialogFooter className="p-6 pt-2 border-t mt-auto">
                  <Button variant="ghost" onClick={() => setIsBulkOrderOpen(false)}>Cancel</Button>
                  <Button onClick={handleBulkUpdate}>Save All Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    setEditingBrand(null);
                    setFormData({ name: "", order: brands.length + 1 });
                  }}
                  className="gap-2 rounded-full shadow-lg hover:shadow-primary/20 transition-all"
                >
                  <Plus className="h-4 w-4" /> Add Company
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingBrand ? "Edit Brand" : "Add New Brand"}</DialogTitle>
                  <DialogDescription>
                    Fill in the details below to manage pharmaceutical partners.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="col-span-3"
                      placeholder="e.g. Pfizer"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="order" className="text-right">Ranking</Label>
                    <Input
                      id="order"
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleCreateOrUpdate}>
                    {editingBrand ? "Save Changes" : "Save Brand"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
        
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
          {displayedBrands.map((brand) => (
            <div 
              key={brand.id} 
              className="relative group/card flex items-center justify-center p-4 min-w-[120px]"
            >
              <div className="flex flex-col items-center gap-1 group">
                {isAdmin && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-background border shadow-md rounded-full px-2 py-1 opacity-0 group-hover/card:opacity-100 transition-opacity z-10 scale-90 group-hover/card:scale-100 duration-200">
                    <button 
                      onClick={() => openEditDialog(brand)}
                      className="p-1 hover:text-primary transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <div className="w-[1px] h-3 bg-muted"></div>
                    <button 
                      onClick={() => handleDelete(brand.id)}
                      className="p-1 hover:text-destructive transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    <div className="w-[1px] h-3 bg-muted"></div>
                    <span className="text-[10px] font-bold px-1 text-muted-foreground flex items-center gap-1">
                      <Hash className="h-2 w-2" />{brand.order}
                    </span>
                  </div>
                )}
                <Link 
                  href={`/store?brand=${encodeURIComponent(brand.name)}`}
                  className="text-2xl font-black text-foreground/40 hover:text-primary transition-all duration-300 transform hover:scale-110 cursor-pointer text-center"
                >
                  {brand.name}
                </Link>
              </div>
            </div>
          ))}

          {brands.length === 0 && !loading && (
            <div className="text-muted-foreground italic text-sm">No pharmaceutical companies added yet.</div>
          )}
        </div>

        {brands.length > 10 && (
          <div className="flex justify-center mt-12">
            <Button 
              variant="outline" 
              onClick={() => setShowAll(!showAll)}
              className="rounded-full px-8 hover:bg-primary hover:text-primary-foreground transition-all"
            >
              {showAll ? "Show Less" : `Show All Brands (${brands.length})`}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default PartnerBrands;
