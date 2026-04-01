"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useVirtualizer } from '@tanstack/react-virtual'
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
import Papa from "papaparse"
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
  RefreshCcw,
  Filter,
  XCircle,
  Hash
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Label } from "@/components/ui/label"

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
  vendors?: { id: string, vendor: { id: string, name: string }, costPrice: number, isDefault: boolean }[]
  scarce: boolean
  requiresPrescription: boolean
  numberPcs?: string
  form?: string
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

interface Vendor {
  id: string
  name: string
  address?: string
  _count?: { products: number }
}

interface ProductVendor {
  id: string
  productId: string
  vendorId: string
  costPrice: number
  isDefault: boolean
  vendor?: { id: string, name: string }
  product?: { id: string, name: string }
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

interface ColumnFilter {
  field: string;
  operator: 'contains' | 'equals' | 'greaterThan' | 'lessThan' | 'in';
  value: any;
}

const Sheet = () => {
  const { user } = useAppContext()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("products")
  const [currentPage, setCurrentPage] = useState(0)
  const [limit, setLimit] = useState(50)
  const [totalItems, setTotalItems] = useState(0)
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [productVendors, setProductVendors] = useState<ProductVendor[]>([])
  const [ingredients, setIngredients] = useState<ActiveIngredient[]>([])
  const [stocks, setStocks] = useState<Stock[]>([])
  const [bulkPrices, setBulkPrices] = useState<BulkPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCell, setEditingCell] = useState<{ rowId: string, field: string } | null>(null)
  const [focusedCell, setFocusedCell] = useState<{ rowId: string, field: string } | null>(null)
  const [columnOrderByTab, setColumnOrderByTab] = useState<Record<string, string[]>>({
    products: ["name", "category", "brand", "vendor", "price", "stock", "numberPcs", "form", "bulkName", "bulkQty", "bulkPrice", "scarce", "requiresPrescription"],
    categories: ["name", "products"],
    brands: ["name", "order", "products"],
    vendors: ["name", "address", "products"],
    ingredients: ["name", "products"],
    stocks: ["product", "addedQuantity", "costPerProduct", "createdAt"],
    bulkprices: ["product", "name", "quantity", "price"],
    productvendors: ["product", "vendor", "costPrice", "isDefault"]
  })
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    name: 200,
    category: 140,
    brand: 140,
    vendor: 140,
    price: 100,
    stock: 100,
    numberPcs: 120,
    form: 100,
    scarce: 80,
    requiresPrescription: 90,
    bulkName: 140,
    bulkQty: 100,
    bulkPrice: 120,
    products: 120,
    order: 80,
    product: 140,
    addedQuantity: 100,
    costPerProduct: 120,
    costPrice: 100,
    isDefault: 80,
    address: 200,
    createdAt: 140,
    quantity: 90
  })
  const [activeBulkIds, setActiveBulkIds] = useState<Record<string, string>>({})
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [resizeStartX, setResizeStartX] = useState<number>(0)
  const [startWidth, setStartWidth] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [history, setHistory] = useState<any[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [filters, setFilters] = useState<ColumnFilter[]>([])
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [bulkPriceDialogOpen, setBulkPriceDialogOpen] = useState(false)
  const [selectedProductForBulk, setSelectedProductForBulk] = useState<Product | null>(null)
  const [newBulkPrice, setNewBulkPrice] = useState({ name: '', quantity: 1, price: 0 })
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false)
  const [selectedProductForVendor, setSelectedProductForVendor] = useState<Product | null>(null)
  const [newVendor, setNewVendor] = useState({ name: '', address: '', costPrice: 0 })
  const [pendingChanges, setPendingChanges] = useState<Record<string, { id: string, model: string, field: string, value: any }>>({})
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  useEffect(() => {
    // Reset page when tab changes or search changes
    setCurrentPage(0)
  }, [activeTab, debouncedSearchQuery])

  useEffect(() => {
    // Only proceed once user data is loaded from context
    if (user.loading) return;
    
    if (!user || user.role !== "admin") {
      router.push("/account")
      return
    }
    loadData()
  }, [user.id, user.role, user.loading, router, activeTab, currentPage, limit])

  // Auto-save logic: every minute (60s) if there are changes
  useEffect(() => {
    if (Object.keys(pendingChanges).length === 0) return;

    const timer = setInterval(() => {
      saveAllChanges(true); // Internal call for auto-save
    }, 60000);

    return () => clearInterval(timer);
  }, [pendingChanges]);

  // Copy/paste functionality
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (editingCell) {
        const text = e.clipboardData?.getData('text');
        if (text) {
          // Parse tabular data and update multiple cells if it's CSV-like
          const lines = text.split('\n').map(line => line.split('\t'));
          if (lines.length > 1 && lines[0].length > 1) {
            // Multi-cell paste
            e.preventDefault();
            // For now, just paste the first cell
            updateCell(editingCell.rowId, editingCell.field, text.trim());
          } else {
            // Single cell paste
            updateCell(editingCell.rowId, editingCell.field, text.trim());
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [editingCell, historyIndex, history]); // Added missing dependencies

  const loadData = async () => {
    setLoading(true)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const config = { signal: controller.signal };
      
      // Only load the active tab data
      let res;
      const modelMap = {
        products: 'product',
        categories: 'category', 
        brands: 'brand',
        vendors: 'vendor',
        ingredients: 'activeIngredient',
        stocks: 'stock',
        bulkprices: 'bulkPrice',
        productvendors: 'productVendor'
      };
      
      const apiModel = modelMap[activeTab as keyof typeof modelMap];
      res = await axios.get(`/api/sheet?model=${apiModel}&limit=${limit}&offset=${currentPage * limit}&search=${encodeURIComponent(debouncedSearchQuery)}&details=true`, config);
      
      // Handle lookup data fetching for products tab (non-blocking)
      if (activeTab === 'products' && (categories.length === 0 || brands.length === 0 || vendors.length === 0)) {
        Promise.all([
          axios.get('/api/sheet?model=category&limit=500', config),
          axios.get('/api/sheet?model=brand&limit=500', config),
          axios.get('/api/sheet?model=vendor&limit=500', config)
        ]).then(([catsRes, brandsRes, vendorsRes]) => {
          setCategories(catsRes.data.data);
          setBrands(brandsRes.data.data);
          setVendors(vendorsRes.data.data);
        }).catch(err => console.error("Lookup data fetch failed:", err));
      }
      
      const data = res.data.data;
      const total = res.data.total;
      
      // Update the appropriate state based on active tab
      switch(activeTab) {
        case 'products':
          setProducts(data);
          break;
        case 'categories':
          setCategories(data);
          break;
        case 'brands':
          setBrands(data);
          break;
        case 'vendors':
          setVendors(data);
          break;
        case 'ingredients':
          setIngredients(data);
          break;
        case 'stocks':
          setStocks(data);
          break;
        case 'bulkprices':
          setBulkPrices(data);
          break;
        case 'productvendors':
          setProductVendors(data);
          break;
      }
      
      setTotalItems(total);
    } catch (error) {
      if (axios.isCancel(error)) {
        toast.error("Cloud Sync Timed Out - DB Connection Slow")
      } else {
        console.error("Critical Data Load Error:", error)
        toast.error("Failed to sync data")
      }
    } finally {
      setLoading(false)
    }
  }

  const updateCell = async (id: string, field: string, value: any, model: string = "product") => {
    // Validate cell value
    const validationError = validateCell(model, field, value);
    if (validationError) {
      setValidationErrors(prev => ({ ...prev, [`${id}-${field}`]: validationError }));
      return;
    }

    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${id}-${field}`];
      return newErrors;
    });

    // Update LOCAL state immediately for snappy UI
    const updateLocalState = (data: any[], setter: (val: any) => void) => {
        setter(data.map(item => item.id === id ? { ...item, [field]: value } : item));
    }

    if (model === "product") updateLocalState(products, setProducts);
    else if (model === "category") updateLocalState(categories, setCategories);
    else if (model === "brand") updateLocalState(brands, setBrands);
    else if (model === "activeIngredient") updateLocalState(ingredients, setIngredients);
    else if (model === "stock") updateLocalState(stocks, setStocks);
    else if (model === "bulkPrice") {
        updateLocalState(bulkPrices, setBulkPrices);
        // Bulk prices often nested in products too
        setProducts(prev => prev.map(p => ({
            ...p,
            bulkPrices: p.bulkPrices?.map(bp => bp.id === id ? { ...bp, [field]: value } : bp)
        })));
    }

    // Add to pending changes instead of saving to DB immediately
    setPendingChanges(prev => ({
        ...prev,
        [`${model}-${id}-${field}`]: { id, model, field, value }
    }));
  }

  const saveAllChanges = async (isAutoSave: boolean = false) => {
    const changeList = Object.values(pendingChanges);
    if (changeList.length === 0) return;

    setSaving("Saving all changes...");
    try {
      // Group changes by model
      const groupedByModel: Record<string, any[]> = {};
      changeList.forEach(change => {
        if (!groupedByModel[change.model]) groupedByModel[change.model] = [];
        
        // Find if this specific record update is already partially built
        const existingOp = groupedByModel[change.model].find(op => op.id === change.id);
        if (existingOp) {
          existingOp.data[change.field] = change.value;
        } else {
          groupedByModel[change.model].push({
            type: 'update',
            id: change.id,
            data: { [change.field]: change.value }
          });
        }
      });

      // Execute batch updates for each model
      await Promise.all(
        Object.entries(groupedByModel).map(([model, operations]) =>
          axios.post("/api/sheet/batch", { model, operations })
        )
      );

      setPendingChanges({}); // Clear buffer
      setLastAutoSave(new Date());
      toast.success(isAutoSave ? "Autosave successful" : "All changes saved successfully");
    } catch (err) {
      console.error("Batch save failed:", err);
      toast.error("Failed to save some changes. Syncing with database...");
      loadData(); // Re-sync to ensure consistency if something failed
    } finally {
      setSaving(null);
    }
  }

  const discardChanges = () => {
    if (confirm(`Discard ${Object.keys(pendingChanges).length} unsaved changes?`)) {
        setPendingChanges({});
        loadData(); // Reload from DB to clear local dirty state
    }
  }

  const validateCell = (model: string, field: string, value: any): string | null => {
    if (model === 'product') {
      if (field === 'price' && (isNaN(value) || value < 0)) {
        return 'Price must be a positive number';
      }
      if (field === 'name' && (!value || value.length < 3)) {
        return 'Name must be at least 3 characters';
      }
    } else if (model === 'stock') {
      if (field === 'addedQuantity' && (isNaN(value) || value < 0)) {
        return 'Quantity must be a positive number';
      }
      if (field === 'costPerProduct' && (isNaN(value) || value < 0)) {
        return 'Cost must be a positive number';
      }
    } else if (model === 'bulkPrice') {
      if (field === 'quantity' && (isNaN(value) || value < 1)) {
        return 'Quantity must be at least 1';
      }
      if (field === 'price' && (isNaN(value) || value < 0)) {
        return 'Price must be a positive number';
      }
    }
    return null;
  }

  const getCurrentValue = (id: string, field: string, model: string) => {
    let data;
    switch (model) {
      case 'product': data = products; break;
      case 'category': data = categories; break;
      case 'brand': data = brands; break;
      case 'activeIngredient': data = ingredients; break;
      case 'stock': data = stocks; break;
      case 'bulkPrice': data = bulkPrices; break;
      default: return null;
    }
    return (data as any[]).find(item => item.id === id)?.[field];
  }

  const undo = () => {
    if (historyIndex >= 0) {
      const change = history[historyIndex];
      updateCell(change.id, change.field, change.previousValue, change.model);
      setHistoryIndex(prev => prev - 1);
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const change = history[historyIndex + 1];
      updateCell(change.id, change.field, change.newValue, change.model);
      setHistoryIndex(prev => prev + 1);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, rowId: string, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      moveToCell(rowId, field, 'down');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      moveToCell(rowId, field, e.shiftKey ? 'left' : 'right');
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  }

  const moveToCell = (rowId: string, field: string, direction: 'up' | 'down' | 'left' | 'right') => {
    const currentFields = columnOrderByTab[activeTab] || [];
    const currentIndex = sortedData.findIndex(item => item.id === rowId);
    if (currentIndex === -1) return;

    let nextRowId = rowId;
    let nextField = field;

    if (direction === 'down' && currentIndex < sortedData.length - 1) {
      nextRowId = sortedData[currentIndex + 1].id;
    } else if (direction === 'up' && currentIndex > 0) {
      nextRowId = sortedData[currentIndex - 1].id;
    } else if (direction === 'right') {
      const fieldIndex = currentFields.indexOf(field);
      if (fieldIndex < currentFields.length - 1) {
        nextField = currentFields[fieldIndex + 1];
      } else if (currentIndex < sortedData.length - 1) {
        nextRowId = sortedData[currentIndex + 1].id;
        nextField = currentFields[0];
      }
    } else if (direction === 'left') {
      const fieldIndex = currentFields.indexOf(field);
      if (fieldIndex > 0) {
        nextField = currentFields[fieldIndex - 1];
      } else if (currentIndex > 0) {
        nextRowId = sortedData[currentIndex - 1].id;
        nextField = currentFields[currentFields.length - 1];
      }
    }

    if (nextRowId !== rowId || nextField !== field) {
      setEditingCell({ rowId: nextRowId, field: nextField });
    }
  }

  const handleViewModeKeyDown = (e: React.KeyboardEvent, rowId: string, field: string) => {
    if (e.key === 'Enter' || e.key === 'F2') {
      e.preventDefault();
      setEditingCell({ rowId, field });
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      moveToCell(rowId, field, e.shiftKey ? 'left' : 'right');
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveToCell(rowId, field, 'down');
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveToCell(rowId, field, 'up');
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveToCell(rowId, field, 'left');
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveToCell(rowId, field, 'right');
      return;
    }
  }

  const startColumnResize = (field: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(field);
    setResizeStartX(e.clientX);
    setStartWidth(columnWidths[field] || 120);
  }

  const stopColumnResize = () => {
    setResizingColumn(null);
  }

  const onColumnResize = (e: MouseEvent) => {
    if (!resizingColumn) return;
    const delta = e.clientX - resizeStartX;
    const nextWidth = Math.max(60, startWidth + delta);
    setColumnWidths(prev => ({ ...prev, [resizingColumn]: nextWidth }));
  }

  useEffect(() => {
    if (!resizingColumn) return;
    window.addEventListener('mousemove', onColumnResize);
    window.addEventListener('mouseup', stopColumnResize);
    return () => {
      window.removeEventListener('mousemove', onColumnResize);
      window.removeEventListener('mouseup', stopColumnResize);
    };
  }, [resizingColumn, resizeStartX, startWidth]);

  const onColumnDragStart = (field: string) => {
    setDraggedColumn(field);
  }

  const onColumnDrop = (targetField: string) => {
    if (!draggedColumn || targetField === draggedColumn) return;
    const order = [...(columnOrderByTab[activeTab] || [])];
    const sourceIndex = order.indexOf(draggedColumn);
    const targetIndex = order.indexOf(targetField);
    if (sourceIndex < 0 || targetIndex < 0) return;
    order.splice(sourceIndex, 1);
    order.splice(targetIndex, 0, draggedColumn);
    setColumnOrderByTab(prev => ({ ...prev, [activeTab]: order }));
    setDraggedColumn(null);
  }

  const bulkDelete = async () => {
    if (selectedRows.size === 0) return;
    if (!confirm(`Delete ${selectedRows.size} records?`)) return;

    try {
      await Promise.all(
        Array.from(selectedRows).map(id =>
          axios.delete(`/api/sheet?model=${activeTab}&id=${id}`)
        )
      );
      setSelectedRows(new Set());
      loadData();
      toast.success(`Deleted ${selectedRows.size} records`);
    } catch (error) {
      toast.error("Bulk delete failed");
    }
  }

  const toggleFilter = (field: string, operator: ColumnFilter['operator'], value: any) => {
    setFilters(prev => {
      const idx = prev.findIndex(f => f.field === field);
      if (idx > -1) {
        if (value === "" || (Array.isArray(value) && value.length === 0)) {
          const next = [...prev];
          next.splice(idx, 1);
          return next;
        }
        const next = [...prev];
        next[idx] = { field, operator, value };
        return next;
      }
      if (value === "" || (Array.isArray(value) && value.length === 0)) return prev;
      return [...prev, { field, operator, value }];
    });
    setCurrentPage(0);
  }

  const applyFiltersToData = (data: any[]) => {
    return data.filter(row =>
      filters.every(filter => {
        let cellValue = row[filter.field];
        
        // Handle nested logic and objects
        if (cellValue && typeof cellValue === 'object') {
           if (Array.isArray(cellValue)) {
              // Special case for stock array in products
              if (filter.field === 'stock') cellValue = cellValue.reduce((acc: number, s: any) => acc + (s.addedQuantity || 0), 0);
           } else if (cellValue.name) {
              cellValue = cellValue.name;
           } else if (cellValue.id) {
              cellValue = cellValue.id;
           }
        }

        if (filter.value === undefined || filter.value === null || filter.value === "") return true;

        switch (filter.operator) {
          case 'contains': 
            return cellValue?.toString().toLowerCase().includes(filter.value.toString().toLowerCase());
          case 'equals': 
            return cellValue?.toString().toLowerCase() === filter.value.toString().toLowerCase();
          case 'in':
            return Array.isArray(filter.value) ? filter.value.includes(cellValue?.toString()) : false;
          case 'greaterThan': 
            return parseFloat(cellValue) > parseFloat(filter.value);
          case 'lessThan': 
            return parseFloat(cellValue) < parseFloat(filter.value);
          default: return true;
        }
      })
    );
  }

  const exportToCSV = async (scope: 'page' | 'all') => {
    let data: any[] = [];
    if (scope === 'all') {
      try {
        setLoading(true);
        const res = await axios.get(`/api/sheet?model=${tabToModel[activeTab]}&limit=2000&details=true`);
        data = applyFiltersToData(res.data.data);
      } catch (err) {
        toast.error("Failed to fetch all data for export");
        return;
      } finally {
        setLoading(false);
      }
    } else {
      data = sortedData;
    }

    if (!data.length) {
      toast.error("No data to export");
      return;
    }

    const csvData = data.map((row: any) => {
      const flatRow: any = { id: row.id };
      (columnOrderByTab[activeTab] || []).forEach(field => {
        let value = row[field];
        if (field === 'vendor') {
          const defaultVendor = row.vendors?.find((v: any) => v.isDefault);
          value = defaultVendor ? defaultVendor.vendor?.name : (row.vendors?.[0]?.vendor?.name || '');
        } else if (field === 'category') {
          value = row.category?.name || '';
        } else if (field === 'brand') {
          value = row.brand?.name || '';
        } else if (field === 'stock') {
          value = row.stock?.reduce((acc: number, s: any) => acc + s.addedQuantity, 0) || 0;
        } else if (field === 'bulkName') {
          value = row.bulkPrices?.[0]?.name || '';
        } else if (field === 'bulkQty') {
          value = row.bulkPrices?.[0]?.quantity || '';
        } else if (field === 'bulkPrice') {
          value = typeof row.bulkPrices?.[0]?.price === 'number' ? row.bulkPrices[0].price.toFixed(3) : '';
        } else if (field === 'price' && typeof value === 'number') {
          value = value.toFixed(3);
        }
        flatRow[columnLabelByField[field] || field] = value;
      });
      return flatRow;
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeTab}_${scope}_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        const newChanges = { ...pendingChanges };
        let count = 0;

        rows.forEach((row: any) => {
          const id = row.id || row.ID || row._id;
          if (!id) return;

          Object.entries(row).forEach(([label, value]) => {
            if (label.toLowerCase() === 'id') return;
            
            // Try to find the field key from label, restricted to current tab's columns to avoid conflicts
            const activeDbFields = columnOrderByTab[activeTab] || [];
            const field = Object.keys(columnLabelByField).find(k => columnLabelByField[k] === label && activeDbFields.includes(k)) || label;
            
            newChanges[`${tabToModel[activeTab]}-${id}-${field}`] = {
              id,
              model: tabToModel[activeTab],
              field,
              value: value === "true" ? true : value === "false" ? false : value
            };
            count++;
          });
        });

        setPendingChanges(newChanges);
        toast.success(`Staged ${count} changes from CSV. Click Save to commit.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: (err) => {
        toast.error("CSV Parse Error: " + err.message);
      }
    });
  }

  const filteredData = useMemo(() => {
    let data: any[] = [];
    switch (activeTab) {
      case 'products': data = products; break;
      case 'categories': data = categories; break;
      case 'brands': data = brands; break;
      case 'vendors': data = vendors; break;
      case 'ingredients': data = ingredients; break;
      case 'stocks': data = stocks; break;
      case 'bulkprices': data = bulkPrices; break;
      case 'productvendors': data = productVendors; break;
      default: data = [];
    }

    // First apply local filtering
    return applyFiltersToData(data);
  }, [activeTab, products, categories, brands, vendors, ingredients, stocks, bulkPrices, productVendors, filters]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    return [...filteredData].sort((a: any, b: any) => {
      const aVal = a[sortConfig.field];
      const bVal = b[sortConfig.field];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Virtualization setup
  const rowVirtualizer = useVirtualizer({
    count: sortedData.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 48, // Estimated row height
    overscan: 5, // Render 5 extra rows outside visible area
  });

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

  const tabToModel: Record<string, string> = {
    products: "product",
    categories: "category",
    brands: "brand",
    vendors: "vendor",
    ingredients: "activeIngredient",
    stocks: "stock",
    bulkprices: "bulkPrice",
    productvendors: "productVendor"
  };

  const columnLabelByField: Record<string, string> = {
    name: "Name",
    category: "Category",
    brand: "Brand",
    vendor: "Vendor",
    price: "Cost Price",
    stock: "In Stock",
    numberPcs: "Pack Size",
    form: "Form",
    scarce: "Scarce",
    requiresPrescription: "Rx Req",
    bulkPrices: "Bulk",
    products: "Products",
    order: "Order",
    product: "Product",
    addedQuantity: "Quantity",
    costPerProduct: "Cost",
    costPrice: "Cost Price",
    isDefault: "Default",
    address: "Address",
    createdAt: "Added Date",
    quantity: "Bulk Qty",
    bulkName: "Bulk Name",
    bulkQty: "Unit Qty",
    bulkPrice: "Bulk Price"
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

  const handleAddVendor = async () => {
    if (!selectedProductForVendor) return;
    try {
      setLoading(true);
      
      // First create the vendor
      const vendorRes = await axios.post("/api/sheet", { 
        model: "vendor", 
        data: {
          name: newVendor.name,
          address: newVendor.address || null
        }
      });
      
      const newVendorData = vendorRes.data;
      
      // Then create the product-vendor relationship
      await axios.post("/api/sheet", { 
        model: "productVendor", 
        data: {
          productId: selectedProductForVendor.id,
          vendorId: newVendorData.id,
          costPrice: newVendor.costPrice,
          isDefault: true // Make this the default vendor
        }
      });
      
      toast.success("Vendor added successfully");
      setVendorDialogOpen(false);
      setNewVendor({ name: '', address: '', costPrice: 0 });
      setSelectedProductForVendor(null);
      loadData();
    } catch (err) {
      toast.error("Failed to add vendor");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBulkPrice = async () => {
    if (!selectedProductForBulk) return;
    try {
      setLoading(true);
      await axios.post("/api/sheet", {
        model: "bulkPrice",
        data: {
          productId: selectedProductForBulk.id,
          name: newBulkPrice.name,
          quantity: newBulkPrice.quantity,
          price: newBulkPrice.price
        }
      });
      toast.success("Bulk option added successfully");
      setNewBulkPrice({ name: '', quantity: 1, price: 0 });
      loadData();
    } catch (err) {
      toast.error("Failed to add bulk option");
    } finally {
      setLoading(false);
    }
  };

  const renderCell = (item: any, field: string, model: string) => {
    const isEditing = editingCell?.rowId === item.id && editingCell?.field === field
    const validationError = validationErrors[`${item.id}-${field}`]
    const isDirty = pendingChanges[`${model}-${item.id}-${field}`]

    return (
      <div
        className={cn(
          "relative min-h-[40px] flex flex-col px-2 transition-all",
          focusedCell?.rowId === item.id && focusedCell?.field === field ? "ring-2 ring-indigo-500/50 bg-indigo-50/10 z-10" : "hover:bg-slate-50/50",
          isDirty ? "bg-amber-50/40 relative before:content-[''] before:absolute before:top-0 before:right-0 before:border-r-[6px] before:border-r-amber-400 before:border-b-[6px] before:border-b-transparent" : ""
        )}
        tabIndex={0}
        onFocus={() => setFocusedCell({ rowId: item.id, field })}
        onKeyDown={(e) => handleViewModeKeyDown(e, item.id, field)}
      >
        <div className="flex items-center w-full">
          {model === "product" && renderProductCell(item as Product, field, isEditing)}
          {model === "category" && renderCategoryCell(item as Category, field, isEditing)}
          {model === "brand" && renderBrandCell(item as Brand, field, isEditing)}
          {model === "vendor" && renderVendorCell(item as Vendor, field, isEditing)}
          {model === "activeIngredient" && renderActiveIngredientCell(item as ActiveIngredient, field, isEditing)}
          {model === "stock" && renderStockCell(item as Stock, field, isEditing)}
          {model === "bulkPrice" && renderBulkPriceCell(item as BulkPrice, field, isEditing)}
          {model === "productVendor" && renderProductVendorCell(item as ProductVendor, field, isEditing)}
        </div>
        {validationError && (
          <div className="absolute -bottom-6 left-0 text-[10px] text-destructive bg-white px-1 rounded shadow-sm border">
            {validationError}
          </div>
        )}
      </div>
    )
  }

  const renderProductCell = (product: Product, field: string, isEditing: boolean) => {
    switch (field) {
      case "name":
        return isEditing ? (
          <Input
            defaultValue={product.name}
            id={`cell-${product.id}-name`}
            className="h-8 text-xs border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                if (e.target.value !== product.name) updateCell(product.id, field, e.target.value);
                setEditingCell(null);
            }}
            onKeyDown={(e: React.KeyboardEvent) => handleKeyDown(e, product.id, field)}
            autoFocus
          />
        ) : (
          <div className="cursor-text w-full text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 px-1" tabIndex={0} onClick={() => setEditingCell({ rowId: product.id, field })}>{product.name || <span className="text-muted-foreground/40 italic">New Product...</span>}</div>
        )

      case "price":
        return isEditing ? (
          <Input
            type="number"
            step="0.001"
            id={`cell-${product.id}-price`}
            defaultValue={product.price}
            className="h-8 text-xs font-mono text-right border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                const val = parseFloat(e.target.value);
                if (val !== product.price) updateCell(product.id, field, val);
                setEditingCell(null);
            }}
            onKeyDown={(e: React.KeyboardEvent) => handleKeyDown(e, product.id, field)}
            autoFocus
          />
        ) : (
          <div className="group cursor-text w-full text-xs font-mono text-right font-black focus:outline-none focus:ring-2 focus:ring-blue-500 px-1 hover:bg-slate-50 transition-colors" tabIndex={0} onClick={() => setEditingCell({ rowId: product.id, field })}>
            <span className="text-[9px] text-slate-400 mr-1 uppercase font-black">Cost</span>
            ₦{product.price.toFixed(3)}
          </div>
        )

      case "category":
        return (
          <Select
            value={product.categoryId || "none"}
            onValueChange={(value: string) => updateCell(product.id, "categoryId", value === "none" ? null : value)}
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
            onValueChange={(value: string) => updateCell(product.id, "brandId", value === "none" ? null : value)}
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
              checked={!!(product as any)[field]}
              onCheckedChange={(checked: boolean) => updateCell(product.id, field, checked)}
            />
          </div>
        )
      
      case "stock": {
        const total = product.stock?.reduce((s: any, x: any) => s + x.addedQuantity, 0) || 0;
        return <Badge variant={total > 0 ? "default" : "outline"} className="text-[10px] h-5 font-mono">{total} Units</Badge>
      }

      case "vendor": {
        const productVendors = product.vendors || [];
        const defaultVendor = productVendors.find(pv => pv.isDefault);
        
        if (productVendors.length === 0) {
          return (
            <Select
              value=""
              onValueChange={(value: string) => {
                if (value === "create") {
                  // Open create vendor dialog
                  setVendorDialogOpen(true);
                  setSelectedProductForVendor(product);
                  return;
                }
                // This shouldn't happen for empty vendors
              }}
            >
              <SelectTrigger className="h-7 text-[10px] border-none bg-transparent hover:bg-muted/50 transition-colors">
                <SelectValue placeholder="Add Vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="create" className="text-[10px] font-black text-indigo-600 bg-indigo-50">+ Create New Vendor</SelectItem>
              </SelectContent>
            </Select>
          );
        }

        return (
          <div className="flex items-center gap-1 w-full px-1">
            <Select 
              value={defaultVendor?.vendor?.id || productVendors[0]?.vendor?.id || ""}
              onValueChange={(val) => {
                if (val === "create") {
                  setVendorDialogOpen(true);
                  setSelectedProductForVendor(product);
                  return;
                }
                // Update default vendor
                const currentDefault = productVendors.find(pv => pv.isDefault);
                if (currentDefault && currentDefault.vendor?.id !== val) {
                  updateCell(currentDefault.id, "isDefault", false, "productVendor");
                }
                const newDefault = productVendors.find(pv => pv.vendor?.id === val);
                if (newDefault) {
                  updateCell(newDefault.id, "isDefault", true, "productVendor");
                }
              }}
            >
              <SelectTrigger className="h-7 text-[10px] border-none bg-green-50/50 hover:bg-green-100 transition-all font-bold">
                <SelectValue placeholder="Select Vendor" />
              </SelectTrigger>
              <SelectContent>
                {productVendors.map(pv => (
                  <SelectItem key={pv.id} value={pv.vendor?.id || pv.id} className="text-[10px] font-bold">
                    {pv.vendor?.name} - ₦{pv.costPrice.toLocaleString()} {pv.isDefault ? "(Default)" : ""}
                  </SelectItem>
                ))}
                <SelectItem value="create" className="text-[10px] font-black text-indigo-600 bg-indigo-50">+ Create New Vendor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      }

      case "bulkName": {
        const bulks = product.bulkPrices || [];
        const activeId = activeBulkIds[product.id] || bulks[0]?.id;
        const currentBulk = bulks.find(b => b.id === activeId);

        return (
          <div className="flex items-center gap-1 w-full px-1">
            <Select 
              value={activeId || "none"} 
              onValueChange={(val) => {
                if (val === "create") {
                  setSelectedProductForBulk(product);
                  setBulkPriceDialogOpen(true);
                  return;
                }
                setActiveBulkIds(prev => ({ ...prev, [product.id]: val }));
              }}
            >
              <SelectTrigger className="h-7 text-[10px] border-none bg-indigo-50/50 hover:bg-indigo-100 transition-all font-bold">
                <SelectValue placeholder="Add Bulk" />
              </SelectTrigger>
              <SelectContent>
                {bulks.map(b => (
                  <SelectItem key={b.id} value={b.id} className="text-[10px] font-bold">
                    {b.name} ({b.quantity}x)
                  </SelectItem>
                ))}
                <SelectItem value="create" className="text-[10px] font-black text-indigo-600 bg-indigo-50">+ Add New Option</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )
      }

      case "bulkQty": {
        const bulks = product.bulkPrices || [];
        const activeId = activeBulkIds[product.id] || bulks[0]?.id;
        const currentBulk = bulks.find(b => b.id === activeId);
        if (!currentBulk) return <div className="text-muted-foreground/30 text-center">—</div>;

        return isEditing ? (
          <Input 
            type="number"
            defaultValue={currentBulk.quantity}
            onBlur={(e) => {
              const val = parseInt(e.target.value);
              if (val !== currentBulk.quantity) updateCell(currentBulk.id, "quantity", val, "bulkPrice");
              setEditingCell(null);
            }}
            className="h-7 text-[10px] text-center font-mono"
            autoFocus
          />
        ) : (
          <div className="w-full text-center text-[10px] font-mono font-bold" onClick={() => setEditingCell({ rowId: product.id, field })}>{currentBulk.quantity} Units</div>
        )
      }

      case "bulkPrice": {
        const bulks = product.bulkPrices || [];
        const activeId = activeBulkIds[product.id] || bulks[0]?.id;
        const currentBulk = bulks.find(b => b.id === activeId);
        if (!currentBulk) return <div className="text-muted-foreground/30 text-center">—</div>;

        return isEditing ? (
          <Input 
            type="number"
            step="0.001"
            defaultValue={currentBulk.price}
            onBlur={(e) => {
              const val = parseFloat(e.target.value);
              if (val !== currentBulk.price) updateCell(currentBulk.id, "price", val, "bulkPrice");
              setEditingCell(null);
            }}
            className="h-7 text-[10px] text-right font-mono"
            autoFocus
          />
        ) : (
          <div className="w-full text-right text-[10px] font-mono font-bold text-emerald-600" onClick={() => setEditingCell({ rowId: product.id, field })}>₦{currentBulk.price.toFixed(3)}</div>
        )
      }

      case "numberPcs":
        return isEditing ? (
          <Input
            defaultValue={product.numberPcs || ""}
            id={`cell-${product.id}-numberPcs`}
            className="h-8 text-xs border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                if (e.target.value !== (product.numberPcs || "")) updateCell(product.id, field, e.target.value || null);
                setEditingCell(null);
            }}
            onKeyDown={(e: React.KeyboardEvent) => handleKeyDown(e, product.id, field)}
            autoFocus
          />
        ) : (
          <div className="cursor-text w-full text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 px-1" tabIndex={0} onClick={() => setEditingCell({ rowId: product.id, field })}>
            {product.numberPcs || <span className="text-muted-foreground/40 italic">e.g. 60 (capsules)</span>}
          </div>
        )

      case "form":
        return isEditing ? (
          <Select
            value={product.form || ""}
            onValueChange={(value: string) => {
              updateCell(product.id, field, value || null);
              setEditingCell(null);
            }}
          >
            <SelectTrigger className="h-7 text-[10px] border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <SelectValue placeholder="Select form" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              <SelectItem value="capsule">Capsule</SelectItem>
              <SelectItem value="liquid">Liquid</SelectItem>
              <SelectItem value="powder">Powder</SelectItem>
              <SelectItem value="tablet">Tablet</SelectItem>
              <SelectItem value="cream">Cream</SelectItem>
              <SelectItem value="ointment">Ointment</SelectItem>
              <SelectItem value="syrup">Syrup</SelectItem>
              <SelectItem value="injection">Injection</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <div className="cursor-text w-full text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 px-1" tabIndex={0} onClick={() => setEditingCell({ rowId: product.id, field })}>
            {product.form || <span className="text-muted-foreground/40 italic">Select form</span>}
          </div>
        )

      default: return <div>{(product as any)[field]}</div>
    }
  }

  const renderCategoryCell = (category: Category, field: string, isEditing: boolean) => {
    if (field === "name") {
        return isEditing ? (
            <Input defaultValue={category.name} onBlur={(e: React.FocusEvent<HTMLInputElement>) => { updateCell(category.id, field, e.target.value, "category"); setEditingCell(null); }} autoFocus className="h-8 text-xs" />
        ) : <div className="w-full text-xs font-bold" onClick={() => setEditingCell({ rowId: category.id, field })}>{category.name}</div>
    }
    return <div>{(category as any)[field]}</div>
  }

  const renderBrandCell = (brand: Brand, field: string, isEditing: boolean) => {
    if (field === "name") {
        return isEditing ? (
            <Input defaultValue={brand.name} onBlur={(e: React.FocusEvent<HTMLInputElement>) => { updateCell(brand.id, field, e.target.value, "brand"); setEditingCell(null); }} autoFocus className="h-8 text-xs" />
        ) : <div className="w-full text-xs font-bold" onClick={() => setEditingCell({ rowId: brand.id, field })}>{brand.name}</div>
    }
    if (field === "order") {
        return isEditing ? (
            <Input type="number" defaultValue={brand.order} onBlur={(e: React.FocusEvent<HTMLInputElement>) => { updateCell(brand.id, field, parseInt(e.target.value), "brand"); setEditingCell(null); }} autoFocus className="h-8 text-xs" />
        ) : <div className="w-full text-xs font-mono" onClick={() => setEditingCell({ rowId: brand.id, field })}>{brand.order}</div>
    }
    return <div>{(brand as any)[field]}</div>
  }

  const renderActiveIngredientCell = (ingredient: ActiveIngredient, field: string, isEditing: boolean) => {
    if (field === "name") {
        return isEditing ? (
            <Input defaultValue={ingredient.name} onBlur={(e: React.FocusEvent<HTMLInputElement>) => { updateCell(ingredient.id, field, e.target.value, "activeIngredient"); setEditingCell(null); }} autoFocus className="h-8 text-xs" />
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
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => { updateCell(stock.id, field, parseInt(e.target.value) || 0, "stock"); setEditingCell(null); }}
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
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => { updateCell(stock.id, field, parseFloat(e.target.value) || 0, "stock"); setEditingCell(null); }}
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
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => { updateCell(bulkPrice.id, field, e.target.value, "bulkPrice"); setEditingCell(null); }}
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
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => { updateCell(bulkPrice.id, field, parseInt(e.target.value) || 0, "bulkPrice"); setEditingCell(null); }}
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
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => { updateCell(bulkPrice.id, field, parseFloat(e.target.value) || 0, "bulkPrice"); setEditingCell(null); }}
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

  const renderVendorCell = (vendor: Vendor, field: string, isEditing: boolean) => {
    switch (field) {
      case "name":
        return isEditing ? (
          <Input
            defaultValue={vendor.name}
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => { updateCell(vendor.id, field, e.target.value, "vendor"); setEditingCell(null); }}
            autoFocus
            className="h-8 text-xs"
          />
        ) : (
          <div className="w-full text-xs font-bold" onClick={() => setEditingCell({ rowId: vendor.id, field })}>
            {vendor.name}
          </div>
        )
      case "address":
        return isEditing ? (
          <Input
            defaultValue={vendor.address || ""}
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => { updateCell(vendor.id, field, e.target.value || null, "vendor"); setEditingCell(null); }}
            autoFocus
            className="h-8 text-xs"
          />
        ) : (
          <div className="w-full text-xs" onClick={() => setEditingCell({ rowId: vendor.id, field })}>
            {vendor.address || <span className="text-muted-foreground/40 italic">No address</span>}
          </div>
        )
      case "products":
        return <div className="text-xs font-mono text-center">{vendor._count?.products || 0}</div>
      default:
        return <div>{(vendor as any)[field]}</div>
    }
  }

  const renderProductVendorCell = (productVendor: ProductVendor, field: string, isEditing: boolean) => {
    switch (field) {
      case "product":
        return <div className="text-xs font-bold text-indigo-600">{productVendor.product?.name || "—"}</div>
      case "vendor":
        return <div className="text-xs font-bold text-green-600">{productVendor.vendor?.name || "—"}</div>
      case "costPrice":
        return isEditing ? (
          <Input
            type="number"
            step="0.01"
            defaultValue={productVendor.costPrice}
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => { updateCell(productVendor.id, field, parseFloat(e.target.value) || 0, "productVendor"); setEditingCell(null); }}
            autoFocus
            className="h-8 text-xs text-right"
          />
        ) : (
          <div className="w-full text-xs font-mono text-right font-bold" onClick={() => setEditingCell({ rowId: productVendor.id, field })}>
            ₦{productVendor.costPrice.toLocaleString()}
          </div>
        )
      case "isDefault":
        return (
          <div className="flex justify-center w-full">
            <Checkbox
              checked={productVendor.isDefault}
              onCheckedChange={(checked: boolean) => updateCell(productVendor.id, field, checked, "productVendor")}
            />
          </div>
        )
      default:
        return <div>{(productVendor as any)[field]}</div>
    }
  }

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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={undo} 
              disabled={historyIndex < 0}
              className="h-9 gap-2 border-2 text-[11px] font-bold uppercase tracking-wider"
            >
                <Undo size={14} />
                Undo
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={redo} 
              disabled={historyIndex >= history.length - 1}
              className="h-9 gap-2 border-2 text-[11px] font-bold uppercase tracking-wider"
            >
                <RefreshCcw size={14} />
                Redo
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={bulkDelete} 
              disabled={selectedRows.size === 0}
              className="h-9 gap-2 border-2 text-[11px] font-bold uppercase tracking-wider text-destructive hover:bg-destructive hover:text-white"
            >
                <Trash2 size={14} />
                Delete ({selectedRows.size})
            </Button>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={discardChanges} 
                className="h-9 gap-2 border-2 border-dashed text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-rose-500"
                disabled={Object.keys(pendingChanges).length === 0}
            >
                Discard
            </Button>

            <Button 
              size="sm" 
              onClick={() => saveAllChanges()} 
              disabled={Object.keys(pendingChanges).length === 0 || !!saving}
              className={cn(
                "h-9 gap-2 uppercase text-[11px] font-bold tracking-wider transition-all",
                Object.keys(pendingChanges).length > 0 
                  ? "bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-100 text-white" 
                  : "bg-slate-100 text-slate-400 border border-slate-200"
              )}
            >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {Object.keys(pendingChanges).length > 0 ? `Save ${Object.keys(pendingChanges).length} Changes` : 'All Saved'}
            </Button>

            <Button variant="outline" size="sm" onClick={loadData} className="h-9 gap-2 border-2 text-[11px] font-bold uppercase tracking-wider">
                <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
                Cloud Sync
            </Button>
            <Button size="sm" onClick={() => createRow(activeTab === "products" ? "product" : activeTab === "categories" ? "category" : activeTab === "brands" ? "brand" : activeTab === "vendors" ? "vendor" : activeTab === "ingredients" ? "activeIngredient" : "product")} className="h-9 gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 uppercase text-[11px] font-bold tracking-wider">
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
            <TabsTrigger value="vendors" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white gap-2 text-xs font-bold px-5">
              <Users size={14} /> Vendors
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 border-2 text-[11px] font-bold uppercase tracking-wider">
                  <Database size={14} /> 
                  Data Ops
                  <ChevronDown size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="text-[11px] font-bold uppercase tracking-wider p-2 w-56">
                <div className="px-2 py-1.5 text-xs text-slate-400 font-black">Export Data</div>
                <DropdownMenuItem onClick={() => exportToCSV('page')} className="gap-2 cursor-pointer">
                  📄 Current Page CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportToCSV('all')} className="gap-2 cursor-pointer">
                  🌐 Full Database CSV
                </DropdownMenuItem>
                <div className="h-px bg-slate-100 my-2" />
                <div className="px-2 py-1.5 text-xs text-slate-400 font-black">Import Data</div>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="gap-2 cursor-pointer bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                  📥 Upload CSV File
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".csv" 
              onChange={handleImportCSV} 
            />
          </TabsList>

          <Card className="flex-1 border-none shadow-xl rounded-2xl overflow-hidden bg-white">
            <div ref={tableContainerRef} className="overflow-auto h-[calc(100vh-280px)] scrollbar-thin scrollbar-thumb-indigo-100">
                {loading ? (
                    <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-white/50 animate-pulse">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Restoring Data Pipeline...</span>
                    </div>
                ) : (
                    <Table className="border-collapse border border-slate-200 bg-white">
                        <TableHeader className="bg-slate-50/90 sticky top-0 z-[100] backdrop-blur-md border-b-2 shadow-sm">
                            <TableRow className="border-b shadow-none hover:bg-transparent">
                                <TableHead className="w-[48px] min-w-[48px] text-center text-[10px] font-black border-r sticky left-0 top-0 bg-slate-100 z-[110] shadow-[2px_0_0_rgba(0,0,0,0.05)]">
                                  <Checkbox
                                    checked={selectedRows.size > 0 && selectedRows.size === sortedData.length}
                                    onCheckedChange={(checked: boolean) => {
                                      if (checked) {
                                        setSelectedRows(new Set(sortedData.map((item: any) => item.id)));
                                      } else {
                                        setSelectedRows(new Set());
                                      }
                                    }}
                                  />
                                </TableHead>
                                <TableHead className="w-[48px] min-w-[48px] text-center text-[10px] font-black border-r sticky left-[48px] top-0 bg-slate-100 z-[110] shadow-[2px_0_0_rgba(0,0,0,0.05)] font-mono text-slate-400">#</TableHead>
                                {(columnOrderByTab[activeTab] || []).map((field) => (
                                  <TableHead
                                    key={field}
                                    style={{ width: columnWidths[field] ? `${columnWidths[field]}px` : 'auto', minWidth: '80px' }}
                                    className={cn(
                                      "text-[10px] font-black uppercase tracking-wider relative group border-t border-r bg-slate-50/50 p-0",
                                      field === "name" && "sticky left-[96px] z-[110] bg-slate-50 shadow-[2px_0_0_rgba(0,0,0,0.05)] border-r-slate-300"
                                    )}
                                  >
                                    <div className="flex flex-col w-full h-full p-2 gap-1 px-3">
                                      <div className="flex items-center justify-between w-full">
                                        <span className="truncate flex-1">{columnLabelByField[field] || field}</span>
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className={cn("h-5 w-5 rounded-md transition-all shadow-sm", filters.some(f => f.field === field) ? "bg-indigo-600 text-white hover:bg-indigo-700" : "text-slate-400 hover:bg-slate-200")}>
                                              <Filter size={10} />
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-64 p-4 shadow-2xl border-2 border-indigo-100 z-[1000] bg-white rounded-xl">
                                             <div className="flex flex-col gap-4">
                                               <div className="flex items-center justify-between border-b pb-2">
                                                 <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-indigo-50 rounded-lg"><Filter size={12} className="text-indigo-600" /></div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{columnLabelByField[field] || field}</span>
                                                 </div>
                                                 {filters.some(f => f.field === field) && (
                                                   <Button variant="ghost" size="sm" onClick={() => toggleFilter(field, 'contains', '')} className="h-5 px-2 text-[9px] text-rose-500 font-black hover:bg-rose-50 rounded-full border border-rose-100">RESET</Button>
                                                 )}
                                               </div>
                                               <div className="flex flex-col gap-3">
                                                  <div className="flex flex-col gap-1.5">
                                                     <Label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Logic</Label>
                                                     <Select 
                                                       defaultValue={filters.find(f => f.field === field)?.operator || (['price', 'addedQuantity', 'quantity', 'stock'].includes(field) ? 'greaterThan' : 'contains')}
                                                       onValueChange={(op: ColumnFilter['operator']) => toggleFilter(field, op, filters.find(f => f.field === field)?.value || '')}
                                                     >
                                                       <SelectTrigger className="h-9 text-[11px] font-bold bg-slate-50 border-slate-200">
                                                         <SelectValue placeholder="Operator" />
                                                       </SelectTrigger>
                                                       <SelectContent className="z-[1100]">
                                                         <SelectItem value="contains">Contains</SelectItem>
                                                         <SelectItem value="equals">Exact Match</SelectItem>
                                                         <SelectItem value="greaterThan">Greater Than</SelectItem>
                                                         <SelectItem value="lessThan">Less Than</SelectItem>
                                                       </SelectContent>
                                                     </Select>
                                                  </div>
                                                  <div className="flex flex-col gap-1.5">
                                                     <Label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Search Term</Label>
                                                     <div className="relative">
                                                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                                                        <Input 
                                                          placeholder="Search value..."
                                                          className="h-9 text-[11px] font-mono pl-8 bg-slate-50 border-slate-200"
                                                          defaultValue={filters.find(f => f.field === field)?.value || ''}
                                                          onChange={(e) => toggleFilter(field, filters.find(f => f.field === field)?.operator || 'contains', e.target.value)}
                                                        />
                                                     </div>
                                                  </div>
                                               </div>
                                             </div>
                                          </PopoverContent>
                                        </Popover>
                                      </div>
                                    </div>
                                    <div
                                        onMouseDown={(e) => startColumnResize(field, e)}
                                        className="h-full w-1 cursor-col-resize absolute right-0 top-0 group-hover:bg-indigo-400/30 transition-colors z-20"
                                      />
                                  </TableHead>
                                ))}
                                <TableHead className="w-[60px] min-w-[60px] bg-slate-100 text-[10px] font-black text-center sticky right-0 top-0 z-[110] border-l shadow-[-2px_0_0_rgba(0,0,0,0.05)] uppercase">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                                const item = sortedData[virtualItem.index];
                                return (
                                    <TableRow 
                                        key={item.id} 
                                        className={cn("group hover:bg-indigo-50/20 transition-all even:bg-slate-50/30", selectedRows.has(item.id) && "bg-indigo-100/50")}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: `${virtualItem.size}px`,
                                            transform: `translateY(${virtualItem.start}px)`,
                                        }}
                                    >
                                        <TableCell className="w-[48px] min-w-[48px] text-center border-r sticky left-0 bg-white z-[40] group-hover:bg-indigo-50/80 transition-colors shadow-[2px_0_0_rgba(0,0,0,0.05)] border-r-indigo-100/50">
                                          <Checkbox
                                            checked={selectedRows.has(item.id)}
                                            onCheckedChange={(checked: boolean) => {
                                              if (checked) {
                                                setSelectedRows(prev => new Set([...prev, item.id]));
                                              } else {
                                                setSelectedRows(prev => {
                                                  const newSet = new Set(prev);
                                                  newSet.delete(item.id);
                                                  return newSet;
                                                });
                                              }
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell className="w-[48px] min-w-[48px] text-[10px] font-mono text-center border-r sticky left-[48px] bg-white z-[40] text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50/80 transition-all shadow-[2px_0_0_rgba(0,0,0,0.05)] border-r-indigo-100/50">
                                            {String(virtualItem.index + 1).padStart(3, '0')}
                                        </TableCell>
                                        
                                        {(columnOrderByTab[activeTab] || []).map((field) => (
                                          <TableCell
                                            key={`${item.id}-${field}`}
                                            className={cn(
                                              "p-0 border-r group-hover:bg-indigo-50/10 transition-colors",
                                              field === "name" && "sticky left-[96px] bg-white z-[40] group-hover:bg-indigo-50/80 shadow-[2px_0_0_rgba(0,0,0,0.05)] border-r-2 border-r-indigo-100/50"
                                            )}
                                            style={{ width: columnWidths[field] ? `${columnWidths[field]}px` : 'auto', minWidth: '80px' }}
                                          >
                                            {renderCell(item, field, tabToModel[activeTab])}
                                          </TableCell>
                                        ))}

                                        <TableCell className="text-center p-0 w-[60px] min-w-[60px] border-l bg-slate-50/50 sticky right-0 z-[40] shadow-[-2px_0_0_rgba(0,0,0,0.05)]">
                                            <div className="flex items-center justify-center gap-1.5 py-1">
                                              <TooltipProvider>
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-indigo-600 hover:bg-indigo-100" onClick={() => setEditingCell({ rowId: item.id, field: (columnOrderByTab[activeTab] || [])[0] })}>
                                                      ✏️
                                                    </Button>
                                                  </TooltipTrigger>
                                                  <TooltipContent>Edit Record</TooltipContent>
                                                </Tooltip>

                                                {activeTab === "products" && (
                                                  <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      <Button size="icon" variant="ghost" className="h-7 w-7 text-amber-600 hover:bg-amber-100" onClick={() => {
                                                        setSelectedProductForBulk(item as Product);
                                                        setBulkPriceDialogOpen(true);
                                                      }}>📦</Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Manage Bulk Prices</TooltipContent>
                                                  </Tooltip>
                                                )}

                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-600 hover:bg-rose-100" onClick={() => deleteRow(item.id, tabToModel[activeTab])}>
                                                      🗑
                                                    </Button>
                                                  </TooltipTrigger>
                                                  <TooltipContent>Delete Record</TooltipContent>
                                                </Tooltip>
                                              </TooltipProvider>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreVertical size={14} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="text-[11px] font-bold uppercase tracking-wider">
                                                    <DropdownMenuItem className="gap-2" onClick={() => window.open(`/products/${item.id || (item as any).productId}`)}><ExternalLink size={12} /> View Page</DropdownMenuItem>
                                                    {activeTab === "products" && (
                                                        <DropdownMenuItem 
                                                            className="gap-2" 
                                                            onClick={() => {
                                                                setSelectedProductForBulk(item as Product);
                                                                setBulkPriceDialogOpen(true);
                                                            }}
                                                        >
                                                            <Plus size={12} /> Add Bulk Pricing
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem className="gap-2 text-rose-600" onClick={() => deleteRow(item.id, tabToModel[activeTab])}>
                                                        <Trash2 size={12} /> Delete Record
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </div>
          </Card>
        </Tabs>
      </div>

      {/* FOOTER BAR */}
      <div className="bg-white border-t px-6 h-12 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
          <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5"><div className={cn("h-1.5 w-1.5 rounded-full transition-all shadow-sm", Object.keys(pendingChanges).length > 0 ? "bg-amber-500 animate-pulse" : "bg-green-500")} /> Database {Object.keys(pendingChanges).length > 0 ? 'Dirty (Unsaved Changes)' : 'Live & Synced'}</span>
              {lastAutoSave && <span className="text-[8px] opacity-70 italic lowercase tracking-normal">Last Saved: {lastAutoSave.toLocaleTimeString()}</span>}
              <span className="text-indigo-600/60 ml-auto">Session Admin: {user.name}</span>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 px-4 py-1 rounded-full border border-slate-100 shadow-sm">
              <span className="text-slate-500">Items: {totalItems}</span>
              <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    disabled={currentPage === 0} 
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="h-6 px-2 text-[10px] hover:bg-indigo-100"
                  >
                    Prev
                  </Button>
                  <span className="text-indigo-600 font-black">Page {currentPage + 1} / {Math.max(1, Math.ceil(totalItems / limit))}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    disabled={totalItems <= (currentPage + 1) * limit} 
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="h-6 px-2 text-[10px] hover:bg-indigo-100"
                  >
                    Next
                  </Button>
              </div>
              <Select value={String(limit)} onValueChange={(v: string) => { setLimit(Number(v)); setCurrentPage(0); }}>
                  <SelectTrigger className="h-6 w-20 text-[10px] bg-transparent border-none">
                      <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="70" className="text-[10px]">70 / page</SelectItem>
                      <SelectItem value="150" className="text-[10px]">150 / page</SelectItem>
                      <SelectItem value="250" className="text-[10px]">250 / page</SelectItem>
                      <SelectItem value="500" className="text-[10px]">500 / page</SelectItem>
                  </SelectContent>
              </Select>
          </div>

          <div className="flex items-center gap-4">
              <span>Environment: Production</span>
              <span className="text-slate-200">|</span>
              <span>CliqueEngine Proxy v4.2.1</span>
          </div>
      </div>

      <Dialog open={bulkPriceDialogOpen} onOpenChange={setBulkPriceDialogOpen}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-none shadow-2xl rounded-3xl">
          <DialogHeader className="p-8 pb-4 bg-indigo-600 text-white rounded-t-3xl">
            <DialogTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tight">
              <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                <DollarSign size={20} />
              </div>
              Bulk Pricing Manager
            </DialogTitle>
            <DialogDescription className="text-indigo-100 font-medium">
              Managing wholesale tiers for <span className="text-white font-bold decoration-white/30 underline underline-offset-4">{selectedProductForBulk?.name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-8 py-6 bg-slate-50/50">
            <div className="space-y-8">
              {/* CURRENT TIERS SECTION */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-indigo-400 shadow-sm shadow-indigo-200" />
                    Live Pricing Matrix
                  </h3>
                  <Badge variant="outline" className="bg-white text-indigo-600 border-indigo-100 px-2.5 py-0.5 text-[9px] font-bold">
                    {selectedProductForBulk?.bulkPrices?.length || 0} TIERS ACTIVE
                  </Badge>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50/80">
                      <TableRow className="hover:bg-transparent border-b">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-10 px-4">Unit Label</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-10 px-4 text-center">Threshold Qty</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 h-10 px-4 text-right">Wholesale Price</TableHead>
                        <TableHead className="w-[80px] h-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProductForBulk?.bulkPrices && selectedProductForBulk.bulkPrices.length > 0 ? (
                        selectedProductForBulk.bulkPrices.map((bp) => (
                          <TableRow key={bp.id} className="group hover:bg-slate-50 transition-colors">
                            <TableCell className="p-0 border-r border-slate-100">
                              <Input 
                                value={bp.name} 
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCell(bp.id, "name", e.target.value, "bulkPrice")}
                                className="border-none bg-transparent h-12 text-xs font-black text-slate-800 focus-visible:ring-0 focus-visible:bg-indigo-50/30 rounded-none w-full px-4"
                                placeholder="e.g. Pack"
                              />
                            </TableCell>
                            <TableCell className="p-0 border-r border-slate-100">
                              <Input 
                                type="number"
                                value={bp.quantity} 
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCell(bp.id, "quantity", parseInt(e.target.value) || 0, "bulkPrice")}
                                className="border-none bg-transparent h-12 text-xs text-center font-mono font-bold text-slate-600 focus-visible:ring-0 focus-visible:bg-indigo-50/30 rounded-none w-full"
                              />
                            </TableCell>
                            <TableCell className="p-0 border-r border-slate-100">
                              <div className="relative flex items-center">
                                <span className="absolute left-3 text-slate-400 text-[10px] font-bold">₦</span>
                                <Input 
                                  type="number"
                                  value={bp.price} 
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCell(bp.id, "price", parseFloat(e.target.value) || 0, "bulkPrice")}
                                  className="border-none bg-transparent h-12 text-xs text-right font-mono font-black text-indigo-600 focus-visible:ring-0 focus-visible:bg-indigo-50/30 rounded-none w-full pr-4 pl-8"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center p-0">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                onClick={() => deleteRow(bp.id, "bulkPrice")}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-32 text-center">
                            <div className="flex flex-col items-center justify-center gap-2 opacity-40">
                              <Package size={24} className="text-slate-300" />
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No active pricing tiers</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </section>

              {/* ADD NEW TIER SECTION */}
              <section>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-200" />
                  Forge New Tier
                </h3>
                
                <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 border-dashed grid grid-cols-3 gap-6 relative overflow-hidden group/add">
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase font-black tracking-widest text-slate-500 ml-1">Tier Identity</Label>
                    <Input
                      placeholder="e.g. Wholesale Pack"
                      className="h-10 text-xs bg-white border-slate-200 focus:ring-indigo-500 rounded-xl font-bold"
                      value={newBulkPrice.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBulkPrice(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase font-black tracking-widest text-slate-500 ml-1">Min. Units</Label>
                    <Input
                      type="number"
                      min="1"
                      className="h-10 text-xs bg-white border-slate-200 focus:ring-indigo-500 rounded-xl font-mono font-bold"
                      value={newBulkPrice.quantity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBulkPrice(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase font-black tracking-widest text-slate-500 ml-1">Landing Price</Label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">₦</span>
                        <Input
                          type="number"
                          step="0.01"
                          className="h-10 text-xs bg-white border-slate-200 focus:ring-indigo-500 pr-4 pl-7 rounded-xl font-mono font-black text-indigo-600"
                          value={newBulkPrice.price}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBulkPrice(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      <Button 
                        onClick={handleAddBulkPrice}
                        size="icon"
                        disabled={!newBulkPrice.name || newBulkPrice.quantity < 1 || newBulkPrice.price < 0}
                        className="h-10 w-12 bg-indigo-600 hover:bg-indigo-700 shrink-0 shadow-lg shadow-indigo-100 rounded-xl transition-all active:scale-95"
                      >
                        <Plus size={18} />
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <DialogFooter className="p-8 bg-white border-t border-slate-100 rounded-b-3xl">
            <Button 
              variant="outline" 
              onClick={() => setBulkPriceDialogOpen(false)} 
              className="h-12 w-full text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-50 border-2"
            >
              Finalize & Exit Manager
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={vendorDialogOpen} onOpenChange={setVendorDialogOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 gap-0 border-none shadow-2xl rounded-3xl">
          <DialogHeader className="p-8 pb-4 bg-green-600 text-white rounded-t-3xl">
            <DialogTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tight">
              <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                <Users size={20} />
              </div>
              Add New Vendor
            </DialogTitle>
            <DialogDescription className="text-green-100 font-medium">
              Creating vendor relationship for <span className="text-white font-bold decoration-white/30 underline underline-offset-4">{selectedProductForVendor?.name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 bg-slate-50/50">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Vendor Name *</Label>
                <Input
                  placeholder="Enter vendor company name"
                  value={newVendor.name}
                  onChange={(e) => setNewVendor(prev => ({ ...prev, name: e.target.value }))}
                  className="h-12 text-sm border-2 border-slate-200 focus:border-green-400 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Address</Label>
                <Input
                  placeholder="Vendor address (optional)"
                  value={newVendor.address}
                  onChange={(e) => setNewVendor(prev => ({ ...prev, address: e.target.value }))}
                  className="h-12 text-sm border-2 border-slate-200 focus:border-green-400 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Cost Price (₦) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter cost price from this vendor"
                  value={newVendor.costPrice || ''}
                  onChange={(e) => setNewVendor(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                  className="h-12 text-sm border-2 border-slate-200 focus:border-green-400 rounded-xl"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-white border-t border-slate-100 rounded-b-3xl gap-3">
            <Button 
              variant="outline" 
              onClick={() => setVendorDialogOpen(false)} 
              className="h-12 flex-1 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-50 border-2"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddVendor}
              disabled={!newVendor.name || newVendor.costPrice <= 0}
              className="h-12 flex-1 bg-green-600 hover:bg-green-700 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-green-100"
            >
              Create Vendor & Link Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Sheet