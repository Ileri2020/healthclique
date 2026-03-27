"use client"

import { useState, useEffect, useRef } from "react"
import { useAppContext } from "@/hooks/useAppContext"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import axios from "axios"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Building,
  Package,
  Tag,
  Pill,
  Heart,
  DollarSign,
  TrendingUp,
  Users,
  Save,
  Undo,
  Plus,
  Search,
  Loader2,
  MoreVertical,
  Trash2,
  ExternalLink,
  ChevronDown,
  Database,
  RefreshCcw
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  name: string
  description: string
  price: number
  categoryId?: string
  category?: { id: string, name: string }
  brandId?: string
  brand?: { id: string, name: string }
  activeIngredientIds?: string[]
  activeIngredients?: { id: string, name: string }[]
  stock?: { id: string, addedQuantity: number, costPerProduct?: number }[]
  bulkPrices?: { id: string, name: string, quantity: number, price: number }[]
  scarce: boolean
  requiresPrescription: boolean
  createdAt: string
}

interface Category {
  id: string
  name: string
  description?: string
  image?: string
  _count?: { products: number }
}

interface Brand {
  id: string
  name: string
  order: number
  _count?: { products: number }
}

interface ActiveIngredient {
  id: string
  name: string
  _count?: { products: number }
}

interface Stock {
  id: string
  productId: string
  product?: { name: string }
  addedQuantity: number
  costPerProduct?: number
  pricePerProduct?: number
  createdAt: string
}

interface BulkPrice {
  id: string
  productId: string
  name: string
  quantity: number
  price: number
  product?: { name: string }
}

const Sheet = () => {
  const { user } = useAppContext()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("products")
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [ingredients, setIngredients] = useState<ActiveIngredient[]>([])
  const [stocks, setStocks] = useState<Stock[]>([])
  const [bulkPrices, setBulkPrices] = useState<BulkPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCell, setEditingCell] = useState<{ rowId: string, field: string } | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (user.role !== "admin") {
      router.push("/account")
      return
    }
    loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)
    try {
      const [
        productsRes,
        categoriesRes,
        brandsRes,
        ingredientsRes,
        stocksRes,
        bulkPricesRes
      ] = await Promise.all([
        axios.get("/api/sheet?model=product"),
        axios.get("/api/sheet?model=category"),
        axios.get("/api/sheet?model=brand"),
        axios.get("/api/sheet?model=activeIngredient"),
        axios.get("/api/sheet?model=stock"),
        axios.get("/api/sheet?model=bulkPrice")
      ])
      setProducts(productsRes.data)
      setCategories(categoriesRes.data)
      setBrands(brandsRes.data)
      setIngredients(ingredientsRes.data)
      setStocks(stocksRes.data)
      setBulkPrices(bulkPricesRes.data)
    } catch (error) {
      toast.error("Failed to load data")
    }
    setLoading(false)
  }

  const updateCell = async (id: string, field: string, value: any, model: string = "product") => {
    try {
      const response = await axios.put("/api/sheet", { model, id, field, value })
      // Update local state with server response
      if (model === "product") {
        setProducts(prev => prev.map(p => p.id === id ? response.data : p));
      } else if (model === "category") {
        setCategories(prev => prev.map(c => c.id === id ? response.data : c));
      } else if (model === "brand") {
        setBrands(prev => prev.map(b => b.id === id ? response.data : b));
      } else if (model === "activeIngredient") {
        setIngredients(prev => prev.map(i => i.id === id ? response.data : i));
      }
      toast.success("Updated successfully")
    } catch (error) {
      toast.error("Update failed")
      loadData() // Reload on error
    }
  }

  const deleteRow = async (id: string, model: string) => {
    if (!confirm("Are you sure? This is permanent.")) return;
    try {
      await axios.delete(`/api/sheet?model=${model}&id=${id}`);
      toast.success("Deleted");
      loadData();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const createRow = async (model: string) => {
    try {
      await axios.post("/api/sheet", { model, data: {} });
      toast.success("New record created");
      loadData();
    } catch (err) {
      toast.error("Failed to create record");
    }
  };

  const renderCell = (item: any, field: string, model: string) => {
    const isEditing = editingCell?.rowId === item.id && editingCell?.field === field
    const isSaving = saving === `${item.id}-${field}`

    return (
      <div className={cn("relative min-h-[40px] flex items-center px-1", isSaving && "bg-primary/5")}>
        {isSaving && <div className="absolute right-1 top-1"><Loader2 className="h-2 w-2 animate-spin text-primary" /></div>}
        {model === "product" && renderProductCell(item as Product, field, isEditing)}
        {model === "category" && renderCategoryCell(item as Category, field, isEditing)}
        {model === "brand" && renderBrandCell(item as Brand, field, isEditing)}
        {model === "activeIngredient" && renderActiveIngredientCell(item as ActiveIngredient, field, isEditing)}
        {model === "stock" && renderStockCell(item as Stock, field, isEditing)}
        {model === "bulkPrice" && renderBulkPriceCell(item as BulkPrice, field, isEditing)}
      </div>
    )
  }

  const renderProductCell = (product: Product, field: string, isEditing: boolean) => {
    switch (field) {
      case "name":
        return isEditing ? (
          <Input
            defaultValue={product.name}
            className="h-8 text-xs border-primary"
            onBlur={(e) => {
                if (e.target.value !== product.name) updateCell(product.id, field, e.target.value);
                setEditingCell(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && (e.target as any).blur()}
            autoFocus
          />
        ) : (
          <div className="cursor-text w-full text-xs font-bold" onClick={() => setEditingCell({ rowId: product.id, field })}>{product.name || <span className="text-muted-foreground/40 italic">New Product...</span>}</div>
        )

      case "price":
        return isEditing ? (
          <Input
            type="number"
            defaultValue={product.price}
            className="h-8 text-xs font-mono text-right"
            onBlur={(e) => {
                const val = parseFloat(e.target.value);
                if (val !== product.price) updateCell(product.id, field, val);
                setEditingCell(null);
            }}
            autoFocus
          />
        ) : (
          <div className="cursor-text w-full text-xs font-mono text-right font-black" onClick={() => setEditingCell({ rowId: product.id, field })}>₦{product.price.toLocaleString()}</div>
        )

      case "category":
        return (
          <Select
            value={product.categoryId || "none"}
            onValueChange={(value) => updateCell(product.id, "categoryId", value === "none" ? null : value)}
          >
            <SelectTrigger className="h-7 text-[10px] border-none bg-transparent hover:bg-muted/50 transition-colors">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {categories.map(cat => <SelectItem key={cat.id} value={cat.id} className="text-[10px]">{cat.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )

      case "brand":
        return (
          <Select
            value={product.brandId || "none"}
            onValueChange={(value) => updateCell(product.id, "brandId", value === "none" ? null : value)}
          >
            <SelectTrigger className="h-7 text-[10px] border-none bg-transparent hover:bg-muted/50 transition-colors">
              <SelectValue placeholder="Select Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {brands.map(b => <SelectItem key={b.id} value={b.id} className="text-[10px]">{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )

      case "scarce":
      case "requiresPrescription":
        return (
          <div className="flex justify-center w-full">
            <Checkbox
              checked={!!product[field]}
              onCheckedChange={(checked) => updateCell(product.id, field, checked)}
            />
          </div>
        )
      
      case "stock":
        const total = product.stock?.reduce((s, x) => s + x.addedQuantity, 0) || 0;
        return <Badge variant={total > 0 ? "default" : "outline"} className="text-[10px] h-5 font-mono">{total} Units</Badge>

      default: return <div>{(product as any)[field]}</div>
    }
  }

  const renderCategoryCell = (category: Category, field: string, isEditing: boolean) => {
    if (field === "name") {
        return isEditing ? (
            <Input defaultValue={category.name} onBlur={(e) => { updateCell(category.id, field, e.target.value, "category"); setEditingCell(null); }} autoFocus className="h-8 text-xs" />
        ) : <div className="w-full text-xs font-bold" onClick={() => setEditingCell({ rowId: category.id, field })}>{category.name}</div>
    }
    return <div>{(category as any)[field]}</div>
  }

  const renderBrandCell = (brand: Brand, field: string, isEditing: boolean) => {
    if (field === "name") {
        return isEditing ? (
            <Input defaultValue={brand.name} onBlur={(e) => { updateCell(brand.id, field, e.target.value, "brand"); setEditingCell(null); }} autoFocus className="h-8 text-xs" />
        ) : <div className="w-full text-xs font-bold" onClick={() => setEditingCell({ rowId: brand.id, field })}>{brand.name}</div>
    }
    if (field === "order") {
        return isEditing ? (
            <Input type="number" defaultValue={brand.order} onBlur={(e) => { updateCell(brand.id, field, parseInt(e.target.value), "brand"); setEditingCell(null); }} autoFocus className="h-8 text-xs" />
        ) : <div className="w-full text-xs font-mono" onClick={() => setEditingCell({ rowId: brand.id, field })}>{brand.order}</div>
    }
    return <div>{(brand as any)[field]}</div>
  }

  const renderActiveIngredientCell = (ingredient: ActiveIngredient, field: string, isEditing: boolean) => {
    if (field === "name") {
        return isEditing ? (
            <Input defaultValue={ingredient.name} onBlur={(e) => { updateCell(ingredient.id, field, e.target.value, "activeIngredient"); setEditingCell(null); }} autoFocus className="h-8 text-xs" />
        ) : <div className="w-full text-xs font-bold" onClick={() => setEditingCell({ rowId: ingredient.id, field })}>{ingredient.name}</div>
    }
    return <div>{(ingredient as any)[field]}</div>
  }

  const renderStockCell = (stock: Stock, field: string, isEditing: boolean) => {
    switch (field) {
      case "product":
        return <div className="text-xs font-bold text-indigo-600">{stock.product?.name || "—"}</div>
      case "addedQuantity":
        return isEditing ? (
          <Input
            type="number"
            defaultValue={stock.addedQuantity}
            onBlur={(e) => { updateCell(stock.id, field, parseInt(e.target.value) || 0, "stock"); setEditingCell(null); }}
            autoFocus
            className="h-8 text-xs text-center"
          />
        ) : (
          <div className="w-full text-xs font-mono text-center font-bold" onClick={() => setEditingCell({ rowId: stock.id, field })}>
            {stock.addedQuantity}
          </div>
        )
      case "costPerProduct":
        return isEditing ? (
          <Input
            type="number"
            step="0.01"
            defaultValue={stock.costPerProduct || 0}
            onBlur={(e) => { updateCell(stock.id, field, parseFloat(e.target.value) || 0, "stock"); setEditingCell(null); }}
            autoFocus
            className="h-8 text-xs text-right"
          />
        ) : (
          <div className="w-full text-xs font-mono text-right font-bold" onClick={() => setEditingCell({ rowId: stock.id, field })}>
            ₦{(stock.costPerProduct || 0).toLocaleString()}
          </div>
        )
      case "createdAt":
        return <div className="text-xs text-slate-500">{new Date(stock.createdAt).toLocaleDateString()}</div>
      default:
        return <div>{(stock as any)[field]}</div>
    }
  }

  const renderBulkPriceCell = (bulkPrice: BulkPrice, field: string, isEditing: boolean) => {
    switch (field) {
      case "product":
        return <div className="text-xs font-bold text-indigo-600">{bulkPrice.product?.name || "—"}</div>
      case "name":
        return isEditing ? (
          <Input
            defaultValue={bulkPrice.name}
            onBlur={(e) => { updateCell(bulkPrice.id, field, e.target.value, "bulkPrice"); setEditingCell(null); }}
            autoFocus
            className="h-8 text-xs"
          />
        ) : (
          <div className="w-full text-xs font-bold" onClick={() => setEditingCell({ rowId: bulkPrice.id, field })}>
            {bulkPrice.name}
          </div>
        )
      case "quantity":
        return isEditing ? (
          <Input
            type="number"
            defaultValue={bulkPrice.quantity}
            onBlur={(e) => { updateCell(bulkPrice.id, field, parseInt(e.target.value) || 0, "bulkPrice"); setEditingCell(null); }}
            autoFocus
            className="h-8 text-xs text-center"
          />
        ) : (
          <div className="w-full text-xs font-mono text-center font-bold" onClick={() => setEditingCell({ rowId: bulkPrice.id, field })}>
            {bulkPrice.quantity}
          </div>
        )
      case "price":
        return isEditing ? (
          <Input
            type="number"
            step="0.01"
            defaultValue={bulkPrice.price}
            onBlur={(e) => { updateCell(bulkPrice.id, field, parseFloat(e.target.value) || 0, "bulkPrice"); setEditingCell(null); }}
            autoFocus
            className="h-8 text-xs text-right"
          />
        ) : (
          <div className="w-full text-xs font-mono text-right font-bold" onClick={() => setEditingCell({ rowId: bulkPrice.id, field })}>
            ₦{bulkPrice.price.toLocaleString()}
          </div>
        )
      default:
        return <div>{(bulkPrice as any)[field]}</div>
    }
  }

  const filteredProducts = products.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col select-none">
      {/* APP BAR */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Database size={20} />
            </div>
            <div>
                <h1 className="text-xl font-black tracking-tight text-slate-800">CliqueSheet <span className="text-indigo-600">Pro</span></h1>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Database Direct Engine v2.0</p>
            </div>
        </div>

        <div className="flex items-center gap-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input 
                    placeholder="Search records..." 
                    className="pl-9 h-9 w-[300px] bg-slate-50 border-none text-xs font-medium focus:ring-2 ring-indigo-500/20"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Button variant="outline" size="sm" onClick={loadData} className="h-9 gap-2 border-2 text-[11px] font-bold uppercase tracking-wider">
                <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
                Cloud Sync
            </Button>
            <Button size="sm" onClick={() => createRow(activeTab === "products" ? "product" : activeTab === "categories" ? "category" : activeTab === "brands" ? "brand" : activeTab === "ingredients" ? "activeIngredient" : "product")} className="h-9 gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 uppercase text-[11px] font-bold tracking-wider">
                <Plus size={14} />
                New Record
            </Button>
        </div>
      </div>

      {/* DASHBOARD BODY */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="bg-white p-1 border shadow-sm rounded-xl mb-6 w-fit mx-auto">
            <TabsTrigger value="products" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white gap-2 text-xs font-bold px-5">
              <Package size={14} /> Products
            </TabsTrigger>
            <TabsTrigger value="categories" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white gap-2 text-xs font-bold px-5">
              <Tag size={14} /> Categories
            </TabsTrigger>
            <TabsTrigger value="brands" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white gap-2 text-xs font-bold px-5">
              <Building size={14} /> Brands
            </TabsTrigger>
            <TabsTrigger value="ingredients" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white gap-2 text-xs font-bold px-5">
              <Pill size={14} /> Ingredients
            </TabsTrigger>
            <TabsTrigger value="stocks" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white gap-2 text-xs font-bold px-5">
              <TrendingUp size={14} /> Inventory
            </TabsTrigger>
            <TabsTrigger value="bulkprices" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white gap-2 text-xs font-bold px-5">
              <DollarSign size={14} /> Bulk Pricing
            </TabsTrigger>
          </TabsList>

          <Card className="flex-1 border-none shadow-xl rounded-2xl overflow-hidden bg-white">
            <div className="overflow-auto h-[calc(100vh-280px)] scrollbar-thin scrollbar-thumb-indigo-100">
                {loading ? (
                    <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-white/50 animate-pulse">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Restoring Data Pipeline...</span>
                    </div>
                ) : (
                    <Table className="border-collapse">
                        <TableHeader className="bg-slate-50/80 sticky top-0 z-20 backdrop-blur-md">
                            <TableRow className="border-b shadow-none hover:bg-transparent">
                                <TableHead className="w-12 text-center text-[10px] font-black border-r">#</TableHead>
                                {activeTab === "products" && <>
                                    <TableHead className="text-[10px] font-black uppercase border-r px-4 h-12">Product Name</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase border-r px-4 h-12">Category</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase border-r px-4 h-12">Brand</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase border-r px-4 h-12 text-right">Base Price</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase border-r px-4 h-12 text-center">In Stock</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase border-r px-4 h-12 text-center w-20">Scarce</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase border-r px-4 h-12 text-center w-20">Rx Req</TableHead>
                                </>}
                                {activeTab === "categories" && <>
                                    <TableHead className="text-[10px] font-black uppercase border-r px-4 h-12">Category Name</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase border-r px-4 h-12">Total Products</TableHead>
                                </>}
                                {activeTab === "brands" && <>
                                    <TableHead className="text-[10px] font-black uppercase border-r px-4 h-12">Brand Name</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase border-r px-4 h-12">Sort Order</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase border-r px-4 h-12 text-center">Products</TableHead>
                                </>}
                                {activeTab === "ingredients" && <>
                                    <TableHead className="text-[10px] font-black uppercase border-r px-4 h-12">Ingredient Name</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase border-r px-4 h-12 text-center">Products</TableHead>
                                </>}
                                {activeTab === "stocks" && <>
                                    <TableHead className="text-[10px] font-black uppercase border-r px-4 h-12">Linked Product</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase border-r px-4 h-12 text-center">Qty</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase border-r px-4 h-12 text-right">Cost</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase border-r px-4 h-12 text-center">Added Date</TableHead>
                                </>}
                                {activeTab === "bulkprices" && <>
                                    <TableHead className="text-[10px] font-black uppercase border-r px-4 h-12">Product</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase border-r px-4 h-12">Unit Name</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase border-r px-4 h-12 text-center">Qty</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase border-r px-4 h-12 text-right">Price</TableHead>
                                </>}
                                <TableHead className="w-14 bg-slate-50/50"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(activeTab === "products" ? filteredProducts : activeTab === "categories" ? categories : activeTab === "brands" ? brands : activeTab === "ingredients" ? ingredients : activeTab === "stocks" ? stocks : bulkPrices).map((item, i) => (
                                <TableRow key={item.id} className="group hover:bg-indigo-50/20 transition-all even:bg-slate-50/30">
                                    <TableCell className="text-[10px] font-mono text-center border-r text-slate-400 group-hover:text-indigo-600 transition-colors">
                                        {String(i + 1).padStart(3, '0')}
                                    </TableCell>
                                    
                                    {activeTab === "products" && <>
                                        <TableCell className="p-0 border-r">{renderCell(item, "name", "product")}</TableCell>
                                        <TableCell className="p-0 border-r">{renderCell(item, "category", "product")}</TableCell>
                                        <TableCell className="p-0 border-r">{renderCell(item, "brand", "product")}</TableCell>
                                        <TableCell className="p-0 border-r">{renderCell(item, "price", "product")}</TableCell>
                                        <TableCell className="p-0 border-r text-center">{renderCell(item, "stock", "product")}</TableCell>
                                        <TableCell className="p-0 border-r text-center">{renderCell(item, "scarce", "product")}</TableCell>
                                        <TableCell className="p-0 border-r text-center">{renderCell(item, "requiresPrescription", "product")}</TableCell>
                                    </>}

                                    {activeTab === "categories" && <>
                                        <TableCell className="p-0 border-r">{renderCell(item, "name", "category")}</TableCell>
                                        <TableCell className="p-0 border-r text-center text-xs font-bold text-indigo-600">{(item as any)._count?.products || 0}</TableCell>
                                    </>}

                                    {activeTab === "brands" && <>
                                        <TableCell className="p-0 border-r">{renderCell(item, "name", "brand")}</TableCell>
                                        <TableCell className="p-0 border-r">{renderCell(item, "order", "brand")}</TableCell>
                                        <TableCell className="p-0 border-r text-center text-xs font-bold text-indigo-600">{(item as any)._count?.products || 0}</TableCell>
                                    </>}

                                    {activeTab === "ingredients" && <>
                                        <TableCell className="p-0 border-r">{renderCell(item, "name", "activeIngredient")}</TableCell>
                                        <TableCell className="p-0 border-r text-center text-xs font-bold text-indigo-600">{(item as any)._count?.products || 0}</TableCell>
                                    </>}

                                    {activeTab === "stocks" && <>
                                        <TableCell className="p-0 border-r">{renderCell(item, "product", "stock")}</TableCell>
                                        <TableCell className="p-0 border-r">{renderCell(item, "addedQuantity", "stock")}</TableCell>
                                        <TableCell className="p-0 border-r">{renderCell(item, "costPerProduct", "stock")}</TableCell>
                                        <TableCell className="p-0 border-r">{renderCell(item, "createdAt", "stock")}</TableCell>
                                    </>}

                                    {activeTab === "bulkprices" && <>
                                        <TableCell className="p-0 border-r">{renderCell(item, "product", "bulkPrice")}</TableCell>
                                        <TableCell className="p-0 border-r">{renderCell(item, "name", "bulkPrice")}</TableCell>
                                        <TableCell className="p-0 border-r">{renderCell(item, "quantity", "bulkPrice")}</TableCell>
                                        <TableCell className="p-0 border-r">{renderCell(item, "price", "bulkPrice")}</TableCell>
                                    </>}

                                    <TableCell className="text-center p-0">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical size={14} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="text-[11px] font-bold uppercase tracking-wider">
                                                <DropdownMenuItem className="gap-2" onClick={() => window.open(`/products/${item.id || (item as any).productId}`)}><ExternalLink size={12} /> View Page</DropdownMenuItem>
                                                <DropdownMenuItem className="gap-2 text-rose-600" onClick={() => deleteRow(item.id, activeTab === "products" ? "product" : activeTab === "categories" ? "category" : activeTab === "brands" ? "brand" : activeTab === "ingredients" ? "activeIngredient" : "product")}>
                                                    <Trash2 size={12} /> Delete Record
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
          </Card>
        </Tabs>
      </div>

      {/* FOOTER BAR */}
      <div className="bg-white border-t px-6 h-10 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
          <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-sm shadow-green-200" /> Database Live</span>
              <span className="text-indigo-600/60">Session Admin: {user.name}</span>
          </div>
          <div className="flex items-center gap-4">
              <span>Environment: Production</span>
              <span className="text-slate-200">|</span>
              <span>CliqueEngine Proxy v4.2.1</span>
          </div>
      </div>
    </div>
  )
}

export default Sheet