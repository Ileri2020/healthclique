"use client";

import React, { useEffect, useState } from "react";
import { useAppContext } from "@/hooks/useAppContext";
import { Plus, Pencil, Trash2, Hash } from "lucide-react";
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

  if (loading) return null;

  return (
    <section className="py-16 bg-muted/20 relative group">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center mb-12">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary/60 mb-2">Our Trusted Partners</h3>
          <h2 className="text-3xl font-black text-foreground">Leading Pharmaceutical Brands</h2>
          <div className="w-20 h-1 bg-primary rounded-full mt-4"></div>
        </div>

        {isAdmin && (
          <div className="flex justify-end mb-8">
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
          {brands.map((brand) => (
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
                <div className="text-2xl font-black text-foreground/40 group-hover:text-primary transition-all duration-300 transform group-hover:scale-110 cursor-default">
                  {brand.name}
                </div>
              </div>
            </div>
          ))}

          {brands.length === 0 && !loading && (
            <div className="text-muted-foreground italic text-sm">No pharmaceutical companies added yet.</div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PartnerBrands;
