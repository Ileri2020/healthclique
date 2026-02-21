// components/ProductForm.tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

// All 8 health concerns — must match concern-grid.tsx exactly
export const HEALTH_CONCERNS = [
  "Pain Relief",
  "Cough, Cold & Flu",
  "Mother & Kids",
  "Gut Health",
  "Vitamins",
  "His Health",
  "Her Health",
  "Mental Wellness",
];

export default function ProductForm({ initialProduct, hideList = false }: { initialProduct?: any, hideList?: boolean }) {
  const [products, setProducts] = useState<any>([]);
  const [formData, setFormData] = useState<any>({ 
    name: initialProduct?.name || '',
    description: initialProduct?.description || '',
    categoryId: initialProduct?.categoryId || '',
    price: initialProduct?.price || 0,
    costPrice: initialProduct?.costPrice || 0,
    images: initialProduct?.images || null,
    healthConcerns: initialProduct?.healthConcerns || [],
    activeIngredients: initialProduct?.activeIngredients?.join(", ") || '',
    brand: initialProduct?.brand || '',
    scarce: initialProduct?.scarce || false,
  });
  const [file, setFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [preview, setPreview] = useState(null);
  const [uploadStatus , setUploadStatus] = useState("");

  const [editId, setEditId] = useState<string | null>(initialProduct?.id || null);

  // Pagination, Search, and Sort State
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "none">("none");
  const [sortBy, setSortBy] = useState<"name" | "price">("name");

  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get('/api/dbhandler?model=product&include=category');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    const res = await axios.get('/api/dbhandler?model=category');
    setCategories(res.data);
    if (res.data.length > 0 && !formData.categoryId) {
      setFormData(prev => ({
        ...prev,
        categoryId: res.data[0].id,
        category: res.data[0].name
      }));
    }
  }, [formData.categoryId]);

  useEffect(() => {
    if (initialProduct) {
      setFormData({
        name: initialProduct.name || '',
        description: initialProduct.description || '',
        categoryId: initialProduct.categoryId || '',
        price: initialProduct.price || 0,
        costPrice: initialProduct.costPrice || 0,
        images: initialProduct.images || null,
        healthConcerns: initialProduct.healthConcerns || [],
        activeIngredients: initialProduct.activeIngredients?.join(", ") || '',
        brand: initialProduct.brand || '',
        scarce: initialProduct.scarce || false,
      });
      setEditId(initialProduct.id);
    }
  }, [initialProduct]);

  useEffect(() => {
    if (!hideList) fetchProducts();
    fetchCategories();
  }, [hideList, fetchProducts, fetchCategories]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      categoryId: categories.length > 0 ? (categories[0] as any).id : '',
      category: categories.length > 0 ? (categories[0] as any).name : '',
      price: 0,
      costPrice: 0,
      images: null,
      healthConcerns: [],
      activeIngredients: '',
      brand: '',
      scarce: false,
    });
    setEditId(null);
    setFile(null);
    setPreview(null);
  };

  const toggleConcern = (concern: string) => {
    setFormData(prev => ({
      ...prev,
      healthConcerns: prev.healthConcerns.includes(concern)
        ? prev.healthConcerns.filter((c: string) => c !== concern)
        : [...prev.healthConcerns, concern],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const pformData = new FormData();

    if (file) {
      pformData.append("file", file);
    }

    pformData.append("name", formData.name);
    pformData.append("description", formData.description);
    pformData.append("categoryId", formData.categoryId);
    pformData.append("price", String(formData.price));
    pformData.append("brand", formData.brand);
    pformData.append("scarce", String(formData.scarce));
    pformData.append("activeIngredients", formData.activeIngredients);
    
    if (formData.costPrice) {
      pformData.append("costPrice", String(formData.costPrice));
    }
    // Send healthConcerns as a comma-separated string in FormData
    pformData.append("healthConcerns", formData.healthConcerns.join(","));

    try {
      if (editId) {
        // For PUT (update) send JSON body
        await axios.put(
          `/api/dbhandler?model=product&id=${editId}`,
          {
            name: formData.name,
            description: formData.description,
            categoryId: formData.categoryId,
            price: Number(formData.price),
            healthConcerns: formData.healthConcerns,
            brand: formData.brand,
            scarce: formData.scarce,
            activeIngredients: formData.activeIngredients.split(",").map(i => i.trim()).filter(Boolean),
          }
        );
      } else {
        await axios.post(`/api/product`, pformData);
      }
      setUploadStatus("Product saved successfully");
      toast.success(editId ? "Product updated successfully" : "Product created successfully");
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save product.");
    }
  };

  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile.size > 300 * 1024){
      toast.warning("File size greater than 300kb. Upload might fail.");
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleDelete = async (product : any) => {
    if (!confirm(`Are you sure you want to delete ${product.name}?`)) return;
    try {
      const res = await axios.delete(`/api/dbhandler?model=product&id=${product.id}`);
      if (res.status === 200  || res.status === 201) {
        toast.success('Product deleted successfully.');
      }
      fetchProducts();
    } catch (err) {
      toast.error('Failed to delete product.');
    }
  };

  const handleEdit = (product: any) => {
    setEditId(product.id);
    setFile(null);
    setPreview(null);

    setFormData({
      name: product.name ?? '',
      description: product.description ?? '',
      categoryId: product.categoryId ?? '',
      price: product.price ?? 0,
      costPrice: product.costPrice ?? 0,
      images: product.images ?? [],
      healthConcerns: product.healthConcerns ?? [],
      activeIngredients: product.activeIngredients?.join(", ") || '',
      brand: product.brand || '',
      scarce: product.scarce || false,
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ✅ Search and Filter Logic
  const filteredProducts = useMemo(() => {
    let result = products.filter((p: any) => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      HEALTH_CONCERNS.some(c => p.healthConcerns?.includes(c) && c.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.brand?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (sortOrder !== "none") {
      result = [...result].sort((a, b) => {
        if (sortBy === "name") {
          return sortOrder === "asc" 
            ? a.name.localeCompare(b.name) 
            : b.name.localeCompare(a.name);
        } else {
          return sortOrder === "asc" 
            ? (a.price || 0) - (b.price || 0) 
            : (b.price || 0) - (a.price || 0);
        }
      });
    }

    return result;
  }, [products, searchTerm, sortOrder, sortBy]);

  // ✅ Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const toggleSort = (type: "name" | "price") => {
    if (sortBy === type) {
      setSortOrder(prev => prev === "none" ? "asc" : prev === "asc" ? "desc" : "none");
    } else {
      setSortBy(type);
      setSortOrder("asc");
    }
  };

  // Reset page when searching or sorting
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortOrder, sortBy]);

  return (
    <div>
      <form onSubmit={handleSubmit} className='flex flex-col w-full max-w-sm gap-2 justify-center items-center p-3 border-2 border-secondary-foreground rounded-sm m-2 shadow-md bg-card'>
        <h2 className='font-bold text-xl mb-2 text-primary'>Product Management</h2>

        <div className="w-full space-y-1">
          <Label htmlFor="product-name">Product Name</Label>
          <Input
            id="product-name"
            placeholder="Name of product"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="border-primary/20 focus:border-primary"
          />
        </div>

        <div className="w-full space-y-1">
          <Label htmlFor="product-desc">Product Description</Label>
          <Input
            id="product-desc"
            placeholder="Description of product"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="border-primary/20 focus:border-primary"
          />
        </div>

        <div className="w-full space-y-1">
          <Label htmlFor="product-brand">Brand</Label>
          <Input
            id="product-brand"
            placeholder="Brand name"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            className="border-primary/20 focus:border-primary"
          />
        </div>

        <div className="w-full space-y-1">
          <Label htmlFor="product-ingredients">Active Ingredients</Label>
          <Input
            id="product-ingredients"
            placeholder="Ingredient 1, Ingredient 2..."
            value={formData.activeIngredients}
            onChange={(e) => setFormData({ ...formData, activeIngredients: e.target.value })}
            className="border-primary/20 focus:border-primary"
          />
          <p className="text-[10px] text-muted-foreground">Separate with commas</p>
        </div>

        <div className="w-full space-y-1 text-center flex flex-col items-center">
          <Label htmlFor="product-category" className='mb-2'>Product Category</Label>
          <Select 
            value={formData.categoryId} 
            onValueChange={(value) => {
              const selectedCategory = categories.find((cat: any) => cat.id === value);
              setFormData({ 
                ...formData, 
                categoryId: value, 
                category: selectedCategory ? (selectedCategory as any).name : ''
              });
            }}
          >
            <SelectTrigger id="product-category" className="w-full border-primary/20">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.length > 0 ? categories.map((category: any) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              )) : <SelectItem value="none" disabled>No categories</SelectItem>}
            </SelectContent>
          </Select>
        </div>

        {/* ✅ Health Concerns Multi-Select Checkboxes */}
        <div className="w-full space-y-2">
          <Label className="text-sm font-semibold">
            Health Concerns
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              ({formData.healthConcerns.length} selected)
            </span>
          </Label>
          <div className="grid grid-cols-2 gap-2 p-3 border rounded-md bg-muted/30">
            {HEALTH_CONCERNS.map((concern) => (
              <div key={concern} className="flex items-center gap-2">
                <Checkbox
                  id={`concern-${concern}`}
                  checked={formData.healthConcerns.includes(concern)}
                  onCheckedChange={() => toggleConcern(concern)}
                />
                <Label htmlFor={`concern-${concern}`} className="text-xs font-normal cursor-pointer">
                  {concern}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full space-y-1">
          <Label htmlFor="product-price">Product Price (₦)</Label>
          <Input
            id="product-price"
            placeholder="Price of product"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            type="number"
            className="border-primary/20 focus:border-primary"
          />
        </div>

        <div className="w-full flex items-center gap-2 border p-2 rounded-md bg-secondary/10">
          <Checkbox 
            id="product-scarce" 
            checked={formData.scarce}
            onCheckedChange={(checked) => setFormData({...formData, scarce: !!checked})}
          />
          <Label htmlFor="product-scarce" className="text-sm font-semibold cursor-pointer">Mark as Scarce Product</Label>
        </div>

        <div className="w-full space-y-1">
          <Label htmlFor="product-image">Product Image</Label>
          {!preview && formData?.images?.length > 0 && (
            <img
              src={formData.images[0]}
              alt="Current product"
              className="rounded-md object-cover"
              style={{ maxHeight: '200px', width: '100%', marginTop: '1rem' }}
            />
          )}
          {(preview) && (
            <div style={{ marginTop: '1rem', width: '100%' }}>
              <img src={preview} alt="Selected preview" className="rounded-md object-cover" style={{ maxHeight: '200px', width: '100%' }} />
            </div>
          )}
          <Input
            type="file"
            name='image'
            id='product-image'
            onChange={handleImageChange}
            className="border-primary/20 focus:border-primary mt-2"
          />
        </div>
        <div className="flex w-full gap-2 mt-4">
          <Button type="submit" className="flex-1 font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]">{editId ? 'Update Product' : 'Create Product'}</Button>
          {editId && <Button type="button" variant="outline" onClick={resetForm} className="flex-1 border-primary text-primary">Cancel</Button>}
        </div>

        {!hideList && (
          <div className="w-full mt-10 border-t pt-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              Our Products
              <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{filteredProducts.length}</span>
            </h2>

            {/* ✅ Search and Sort Controls */}
            <div className="flex flex-col gap-2 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, category, brand..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-secondary/20 h-9 text-xs"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className={`flex-1 text-[10px] h-8 gap-2 ${sortBy === "name" && sortOrder !== "none" ? "bg-primary/20 border-primary" : ""}`}
                  onClick={() => toggleSort("name")}
                >
                  <ArrowUpDown className="h-3 w-3" /> Sort Name {sortBy === "name" && sortOrder !== "none" ? `(${sortOrder})` : ""}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className={`flex-1 text-[10px] h-8 gap-2 ${sortBy === "price" && sortOrder !== "none" ? "bg-primary/20 border-primary" : ""}`}
                  onClick={() => toggleSort("price")}
                >
                  <ArrowUpDown className="h-3 w-3" /> Sort Price {sortBy === "price" && sortOrder !== "none" ? `(${sortOrder})` : ""}
                </Button>
              </div>
            </div>

            <ul className='w-full space-y-3'>
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((item: any) => (
                  <li key={item.id} className="flex flex-col gap-2 bg-secondary/10 border-2 border-secondary rounded-lg w-full p-4 hover:border-primary/30 transition-colors shadow-sm">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-sm block truncate uppercase tracking-tight">
                          {item.scarce && <span className="text-destructive mr-1">⚠️</span>}
                          {item.name}
                        </span>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-primary">₦{item.price}</p>
                            {item.brand && <span className="text-[10px] text-muted-foreground">| {item.brand}</span>}
                          </div>
                          {item.category?.name && (
                            <span className="text-[10px] text-muted-foreground italic truncate">in {item.category.name}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button type='button' size="sm" onClick={() => handleEdit(item)} className='h-8 w-12 text-[10px] font-bold'>EDIT</Button>
                        <Button type='button' size="sm" onClick={() => handleDelete(item)} variant='outline' className='h-8 w-12 text-[10px] font-bold border-destructive text-destructive hover:bg-destructive hover:text-white'>DEL</Button>
                      </div>
                    </div>
                    {item.healthConcerns?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.healthConcerns.map((hc: string) => (
                          <span key={hc} className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase">
                            {hc}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.activeIngredients?.length > 0 && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        <strong>Ingredients:</strong> {item.activeIngredients.join(", ")}
                      </p>
                    )}
                  </li>
                ))
              ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg bg-muted/10">
                  <p className="text-sm text-muted-foreground font-medium italic">No results found.</p>
                </div>
              )}
            </ul>

            {/* ✅ Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center gap-2 mt-8">
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-9 w-9"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <span className="text-sm font-black text-primary">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-9 w-9"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}