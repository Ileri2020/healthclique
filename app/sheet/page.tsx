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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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

interface ColumnFilter {
  field: string;
  operator: 'contains' | 'equals' | 'greaterThan' | 'lessThan';
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
  const [ingredients, setIngredients] = useState<ActiveIngredient[]>([])
  const [stocks, setStocks] = useState<Stock[]>([])
  const [bulkPrices, setBulkPrices] = useState<BulkPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCell, setEditingCell] = useState<{ rowId: string, field: string } | null>(null)
  const [focusedCell, setFocusedCell] = useState<{ rowId: string, field: string } | null>(null)
  const [columnOrderByTab, setColumnOrderByTab] = useState<Record<string, string[]>>({
    products: ["name", "category", "brand", "price", "stock", "scarce", "requiresPrescription", "bulkPrices"],
    categories: ["name", "products"],
    brands: ["name", "order", "products"],
    ingredients: ["name", "products"],
    stocks: ["product", "addedQuantity", "costPerProduct", "createdAt"],
    bulkprices: ["product", "name", "quantity", "price"]
  })
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    name: 200,
    category: 140,
    brand: 140,
    price: 100,
    stock: 100,
    scarce: 80,
    requiresPrescription: 90,
    bulkPrices: 120,
    products: 120,
    order: 80,
    product: 140,
    addedQuantity: 100,
    costPerProduct: 120,
    createdAt: 140,
    quantity: 90
  })
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
  const [pendingChanges, setPendingChanges] = useState<Record<string, { id: string, model: string, field: string, value: any }>>({})
  const tableContainerRef = useRef<HTMLDivElement>(null)
  
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
        ingredients: 'activeIngredient',
        stocks: 'stock',
        bulkprices: 'bulkPrice'
      };
      
      const apiModel = modelMap[activeTab as keyof typeof modelMap];
      res = await axios.get(`/api/sheet?model=${apiModel}&limit=${limit}&offset=${currentPage * limit}&search=${encodeURIComponent(debouncedSearchQuery)}`, config);
      
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
        case 'ingredients':
          setIngredients(data);
          break;
        case 'stocks':
          setStocks(data);
          break;
        case 'bulkprices':
          setBulkPrices(data);
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

  const exportToCSV = () => {
    let data;
    switch (activeTab) {
      case 'products': data = products; break;
      case 'categories': data = categories; break;
      case 'brands': data = brands; break;
      case 'ingredients': data = ingredients; break;
      case 'stocks': data = stocks; break;
      case 'bulkprices': data = bulkPrices; break;
      default: return;
    }

    if (data.length === 0) return;

    // Define custom columns based on active tab to include nested data
    let headers: string[] = [];
    let getRowData: (row: any) => string[] = (row) => [];

    if (activeTab === 'products') {
      headers = ["ID", "Name", "Price", "Category", "Brand", "Scarce", "Rx Req", "Created At"];
      getRowData = (p) => [
        p.id,
        p.name,
        p.price,
        p.category?.name || "N/A",
        p.brand?.name || "N/A",
        p.scarce ? "YES" : "NO",
        p.requiresPrescription ? "YES" : "NO",
        p.createdAt
      ];
    } else if (activeTab === 'stocks') {
      headers = ["ID", "Product", "Quantity", "Cost", "Date"];
      getRowData = (s) => [
        s.id,
        s.product?.name || "N/A",
        s.addedQuantity,
        s.costPerProduct || 0,
        s.createdAt
      ];
    } else if (activeTab === 'bulkprices') {
      headers = ["ID", "Product", "Unit Label", "Threshold Qty", "Price"];
      getRowData = (bp) => [
        bp.id,
        bp.product?.name || "N/A",
        bp.name,
        bp.quantity,
        bp.price
      ];
    } else {
        // Fallback for simple tables
        headers = Object.keys(data[0]);
        getRowData = (row) => headers.map(h => row[h]);
    }

    const csvContent = [
      headers.join(','),
      ...data.map((row: any) => getRowData(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredData = useMemo(() => {
    let data: any[] = [];
    switch (activeTab) {
      case 'products': data = products; break;
      case 'categories': data = categories; break;
      case 'brands': data = brands; break;
      case 'ingredients': data = ingredients; break;
      case 'stocks': data = stocks; break;
      case 'bulkprices': data = bulkPrices; break;
      default: data = [];
    }

    return data.filter(row =>
      filters.every(filter => {
        const cellValue = row[filter.field];
        switch (filter.operator) {
          case 'contains': return cellValue?.toString().toLowerCase().includes(filter.value.toLowerCase());
          case 'equals': return cellValue === filter.value;
          case 'greaterThan': return cellValue > filter.value;
          case 'lessThan': return cellValue < filter.value;
          default: return true;
        }
      })
    );
  }, [activeTab, products, categories, brands, ingredients, stocks, bulkPrices, filters]);

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
    ingredients: "activeIngredient",
    stocks: "stock",
    bulkprices: "bulkPrice"
  };

  const columnLabelByField: Record<string, string> = {
    name: "Name",
    category: "Category",
    brand: "Brand",
    price: "Base Price",
    stock: "In Stock",
    scarce: "Scarce",
    requiresPrescription: "Rx Req",
    bulkPrices: "Bulk",
    products: "Products",
    order: "Order",
    product: "Product",
    addedQuantity: "Quantity",
    costPerProduct: "Cost",
    createdAt: "Added Date",
    quantity: "Bulk Qty"
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
      toast.success("Bulk price added");
      setBulkPriceDialogOpen(false);
      setNewBulkPrice({ name: '', quantity: 1, price: 0 });
      loadData();
    } catch (err) {
      toast.error("Failed to add bulk price");
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
          {model === "activeIngredient" && renderActiveIngredientCell(item as ActiveIngredient, field, isEditing)}
          {model === "stock" && renderStockCell(item as Stock, field, isEditing)}
          {model === "bulkPrice" && renderBulkPriceCell(item as BulkPrice, field, isEditing)}
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
          <div className="cursor-text w-full text-xs font-mono text-right font-black focus:outline-none focus:ring-2 focus:ring-blue-500 px-1" tabIndex={0} onClick={() => setEditingCell({ rowId: product.id, field })}>₦{product.price.toLocaleString()}</div>
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
      
      case "stock":
        const total = product.stock?.reduce((s, x) => s + x.addedQuantity, 0) || 0;
        return <Badge variant={total > 0 ? "default" : "outline"} className="text-[10px] h-5 font-mono">{total} Units</Badge>

      case "bulkPrices":
        return (
          <Button
            variant="outline"
            size="sm"
            className="text-[10px] h-6 px-2"
            onClick={() => {
              setSelectedProductForBulk(product);
              setBulkPriceDialogOpen(true);
            }}
          >
            🔍 View Bulk
          </Button>
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
              onClick={exportToCSV}
              className="h-9 gap-2 border-2 text-[11px] font-bold uppercase tracking-wider"
            >
                <ExternalLink size={14} />
                Export CSV
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
            <div ref={tableContainerRef} className="overflow-auto h-[calc(100vh-280px)] scrollbar-thin scrollbar-thumb-indigo-100">
                {loading ? (
                    <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-white/50 animate-pulse">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Restoring Data Pipeline...</span>
                    </div>
                ) : (
                    <Table className="border-collapse border border-slate-200 bg-white">
                        <TableHeader className="bg-slate-50/80 sticky top-0 z-20 backdrop-blur-md">
                            <TableRow className="border-b shadow-none hover:bg-transparent">
                                <TableHead className="w-12 text-center text-[10px] font-black border-r sticky left-0 bg-slate-100/90 z-40 shadow-[1px_0_0_rgba(0,0,0,0.1)] backdrop-blur-sm">
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
                                <TableHead className="w-12 text-center text-[10px] font-black border-r sticky left-12 bg-slate-100/90 z-30 shadow-[1px_0_0_rgba(0,0,0,0.1)] backdrop-blur-sm">#</TableHead>
                                {(columnOrderByTab[activeTab] || []).map((field) => (
                                  <TableHead
                                    key={field}
                                    draggable
                                    onDragStart={() => onColumnDragStart(field)}
                                    onDragOver={(e: React.DragEvent) => e.preventDefault()}
                                    onDrop={() => onColumnDrop(field)}
                                    className="text-[10px] font-black uppercase border-r px-4 h-12 relative"
                                    style={{ width: columnWidths[field] ? `${columnWidths[field]}px` : 'auto', minWidth: '80px' }}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="truncate cursor-pointer" onClick={() => setSortConfig(prev => prev?.field === field ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { field, direction: 'asc' })}>
                                        {columnLabelByField[field] || field}
                                        {sortConfig?.field === field ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                                      </span>
                                      <div
                                        onMouseDown={(e) => startColumnResize(field, e)}
                                        className="h-full w-1 cursor-col-resize absolute right-0 top-0"
                                      />
                                    </div>
                                  </TableHead>
                                ))}
                                <TableHead className="w-14 bg-slate-50/50"></TableHead>
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
                                        <TableCell className="text-center border-r sticky left-0 bg-white/95 z-10 group-hover:bg-indigo-50/50 transition-colors shadow-[1px_0_0_rgba(0,0,0,0.05)]">
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
                                        <TableCell className="text-[10px] font-mono text-center border-r sticky left-12 bg-white/95 z-10 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50/50 transition-all shadow-[1px_0_0_rgba(0,0,0,0.05)]">
                                            {String(virtualItem.index + 1).padStart(3, '0')}
                                        </TableCell>
                                        
                                        {(columnOrderByTab[activeTab] || []).map((field) => (
                                          <TableCell
                                            key={`${item.id}-${field}`}
                                            className="p-0 border-r"
                                            style={{ width: columnWidths[field] ? `${columnWidths[field]}px` : 'auto', minWidth: '80px' }}
                                          >
                                            {renderCell(item, field, tabToModel[activeTab])}
                                          </TableCell>
                                        ))}

                                        <TableCell className="text-center p-0">
                                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingCell({ rowId: item.id, field: (columnOrderByTab[activeTab] || [])[0] })} aria-label="Edit row">
                                                ✏️
                                              </Button>
                                              {activeTab === "products" && (
                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                                                  setSelectedProductForBulk(item as Product);
                                                  setBulkPriceDialogOpen(true);
                                                }} aria-label="Bulk options">📦</Button>
                                              )}
                                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteRow(item.id, tabToModel[activeTab])} aria-label="Delete row">
                                                🗑
                                              </Button>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
    </div>
  )
}

export default Sheet