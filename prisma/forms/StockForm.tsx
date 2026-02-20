"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import StockTable from './stockdatatable';
import { Trash2, Plus } from 'lucide-react';

export default function StockForm() {
  const [stocks, setStocks] = useState([]);
  const [products, setProducts] = useState<any>([]);
  const [stockQueue, setStockQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStocks();
    fetchProducts();
  }, []);

  const fetchStocks = async () => {
    try {
      const res = await axios.get('/api/stock');
      setStocks(res.data);
    } catch (err) {
      console.error("Failed to fetch stocks:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/dbhandler?model=product');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const addToQueue = (product: any) => {
    if (stockQueue.find(item => item.productId === product.id)) {
      toast.warning("Product already in stocking queue");
      return;
    }

    setStockQueue([...stockQueue, {
      productId: product.id,
      name: product.name,
      addedQuantity: 1,
      costPerProduct: 0,
      pricePerProduct: product.price || 0
    }]);
    toast.success(`${product.name} added to queue`);
  };

  const removeFromQueue = (index: number) => {
    const newQueue = [...stockQueue];
    newQueue.splice(index, 1);
    setStockQueue(newQueue);
  };

  const updateQueueItem = (index: number, field: string, value: any) => {
    const newQueue = [...stockQueue];
    newQueue[index][field] = value;
    setStockQueue(newQueue);
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (stockQueue.length === 0) {
      toast.error("Stocking queue is empty");
      return;
    }

    // Validation
    for (const item of stockQueue) {
      if (item.addedQuantity <= 0) {
        toast.error(`Invalid quantity for ${item.name}`);
        return;
      }
    }

    setLoading(true);
    try {
      const promises = stockQueue.map(item => 
        axios.post('/api/stock', {
          productId: item.productId,
          addedQuantity: item.addedQuantity,
          costPerProduct: item.costPerProduct,
          pricePerProduct: item.pricePerProduct
        })
      );

      await Promise.all(promises);
      toast.success(`Successfully stocked ${stockQueue.length} products`);
      setStockQueue([]);
      fetchStocks();
      // Optional: window.location.reload() if needed for other components to update
    } catch (err) {
      console.error("Batch stocking failed:", err);
      toast.error("Failed to stock some products");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex flex-col gap-6 p-4 max-w-5xl mx-auto'>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Side: Product List to Select From */}
        <div className='border rounded-lg p-4 bg-card shadow-sm'>
          <h2 className='font-bold text-xl mb-4 border-b pb-2'>Available Products</h2>
          <div className='max-h-[600px] overflow-y-auto space-y-3 pr-2'>
            {products.length > 0 ? (
              products.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className='flex-1'>
                    <p className='font-semibold'>{item.name}</p>
                    <p className='text-sm text-muted-foreground'>Current Price: ₦{item.price}</p>
                  </div>
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={() => addToQueue(item)}
                    className='gap-1'
                  >
                    <Plus className='h-4 w-4' />
                    Add
                  </Button>
                </div>
              ))
            ) : (
              <p className='text-center text-muted-foreground py-10'>No products found.</p>
            )}
          </div>
        </div>

        {/* Right Side: Stocking Queue with Separate Inputs */}
        <div className='border rounded-lg p-4 bg-card shadow-sm flex flex-col'>
          <h2 className='font-bold text-xl mb-4 border-b pb-2 flex justify-between items-center'>
            Stocking Queue
            <span className='text-sm font-normal text-muted-foreground'>{stockQueue.length} items</span>
          </h2>

          <form onSubmit={handleBatchSubmit} className='flex-1 flex flex-col'>
            <div className='flex-1 overflow-y-auto max-h-[500px] space-y-6 pr-2 mb-6'>
              {stockQueue.length > 0 ? (
                stockQueue.map((item, index) => (
                  <div key={item.productId} className='p-4 border-2 border-secondary rounded-xl bg-secondary/10 relative group'>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className='absolute -top-3 -right-3 h-8 w-8 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive shadow-md opacity-0 group-hover:opacity-100 transition-opacity'
                      onClick={() => removeFromQueue(index)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                    
                    <h3 className='font-bold text-primary mb-3 truncate pr-6'>{index + 1}. {item.name}</h3>
                    
                    <div className='grid grid-cols-1 gap-4'>
                      <div className='space-y-1.5'>
                        <Label htmlFor={`qty-${index}`} className='text-xs'>Stock Quantity</Label>
                        <Input 
                          id={`qty-${index}`}
                          type="number" 
                          min="1"
                          value={item.addedQuantity}
                          onChange={(e) => updateQueueItem(index, 'addedQuantity', Number(e.target.value))}
                        />
                      </div>
                      
                      <div className='grid grid-cols-2 gap-3'>
                        <div className='space-y-1.5'>
                          <Label htmlFor={`cost-${index}`} className='text-xs'>Cost Price (₦)</Label>
                          <Input 
                            id={`cost-${index}`}
                            type="number" 
                            value={item.costPerProduct}
                            onChange={(e) => updateQueueItem(index, 'costPerProduct', Number(e.target.value))}
                          />
                        </div>
                        <div className='space-y-1.5'>
                          <Label htmlFor={`price-${index}`} className='text-xs'>Selling Price (₦)</Label>
                          <Input 
                            id={`price-${index}`}
                            type="number" 
                            value={item.pricePerProduct}
                            onChange={(e) => updateQueueItem(index, 'pricePerProduct', Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className='flex flex-col items-center justify-center py-20 text-muted-foreground text-center border-2 border-dashed rounded-xl'>
                  <Plus className='h-10 w-10 mb-2 opacity-20' />
                  <p>Your stocking queue is empty.<br/>Select products from the left to start.</p>
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className='w-full h-12 text-lg font-bold' 
              disabled={loading || stockQueue.length === 0}
            >
              {loading ? "Processing..." : `Stock ${stockQueue.length} Products`}
            </Button>
          </form>
        </div>
      </div>

      <div className='mt-8'>
        <h2 className='font-bold text-2xl mb-4'>Existing Stock Records</h2>
        {stocks.length > 0 ? (
          <StockTable />
        ) : (
          <p className='text-muted-foreground bg-secondary/20 p-8 text-center rounded-lg border'> No stock available.</p>
        )}
      </div>
    </div>
  );
}