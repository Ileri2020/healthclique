// MinistryForm.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StockTable from './stockdatatable';




export default function StockForm() {
  const [stocks, setStocks] = useState([])
  const [products, setProducts] = useState<any>([]);
  const [formData, setFormData] = useState({
    productId: '',
    addedQuantity: 0,
    product: '',
  });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchStocks();
    fetchProducts()
  }, []);

  const fetchStocks = async () => {
    const res = await axios.get('/api/stock');
    console.log("stocks :", res.data)
    setStocks(res.data);
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/dbhandler?model=product');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productId || formData.addedQuantity <= 0) {
      console.error('Invalid form data:', formData);
      return;
    }

    try {
      if (editId) {
        await axios.put('/api/stock', {
          stockId: editId,
          addedQuantity: formData.addedQuantity,
        });
      } else {
        await axios.post('/api/stock', {
          productId: formData.productId,
          addedQuantity: formData.addedQuantity,
        });
        // Reload the page after successful stock creation
        window.location.reload();
      }
      resetForm();
      fetchStocks();
      fetchProducts();
    } catch (err) {
      console.error('Failed to submit stock:', err);
    }
  };



  const handleEdit = (item) => {
  if (!item?.id || !item?.addedQuantity || !item?.product) {
    console.error('Invalid stock item for edit:', item);
    return;
  }
  setFormData({
    productId: item.productId,
    product: item.product,
    addedQuantity: item.addedQuantity,
  });
  setEditId(item.id);
};

  const handleProductInput = (item) => {
    if (!item) return;

    // Use the actual key your products have
    const productId = item.id || item._id;
    const productName = item.name || item.title;

    if (!productId || !productName) {
      console.error('Invalid product selected:', item);
      return;
    }

    setFormData({
      ...formData,
      productId: String(productId),
      product: productName,
    });
  };


  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/stock?stockId=${id}`);
      fetchStocks();
    } catch (err) {
      console.error('Failed to delete stock:', err);
    }
  };


  const resetForm = () => {
    setFormData({
      productId: '',
      addedQuantity: 0,
      product: '',
    });
    setEditId(null);
  };





  return (
    <div>
      
      <form onSubmit={handleSubmit} className='flex flex-col w-full max-w-sm gap-2 justify-center items-center p-3 border-2 border-secondary-foreground rounded-sm m-2'>
      <h2 className='font-semibold text-lg'>Manage Products Stock</h2>
      
      <ul className='w-full'>
        <div>Products To Stock</div>
        {products.length > 0 ? (
          products.map((item , index) => (
            <li key={index} className="flex flex-col justify-center items-center gap-2 my-2 bg-secondary rounded-md w-full p-2">
              <div className="flex flex-row gap-2">
                <span>{(index + 1)}. Name : </span>
                <span>{item.name}</span>
              </div>
              <p>Price : {item.price || <em>No price tag</em>}</p>
              <div className='flex flex-row gap-2 p-1 w-full'>
                <Button type="button" onClick={() => handleProductInput(item)} className='flex-1'>
                  Stock
                </Button>
                {/* <Button onClick={() => handleDelete(item.id)} variant='ghost' className='flex-1 border-2 border-accent'>Delete</Button> */}
              </div>
            </li>
          ))
        ) : (
          <p>No available product.</p>
        )}
      </ul>
      
      <Input
          type="text"
          placeholder="Product Name"
          value={formData.product}
          onChange={(e) => setFormData({ ...formData, product: e.target.value })}
          disabled={true}
        />
        <Input
          type="text"
          placeholder="Product ID"
          value={formData.productId}
          onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
          disabled={true}
        />
        <Input
          type="number"
          placeholder="Quantity of Product to Add to Stock"
          value={formData.addedQuantity}
          onChange={(e) => setFormData({ ...formData, addedQuantity: Number(e.target.value) })}
        />
        <Button type="submit">{editId ? 'Update' : 'Create'}</Button>
        {editId && <button onClick={resetForm}>Cancel</button>}

        <ul className='w-full'>
          <div>Added Stocks</div>
          {stocks.length > 0 ? (
            // stocks.map((item , index) => (
            //   <li key={index} className="flex flex-col justify-center items-center gap-2 my-2 bg-secondary rounded-md w-full p-2">
            //     <div className="flex flex-row gap-2">
            //       <span>{(index + 1)}. Stocked Product : </span>
            //       <span>{item.product}</span>
            //     </div>
            //     <p>Added Quantity : {item.addedQuantity || <em>No price tag</em>}</p>
            //     <div className='flex flex-row gap-2 p-1 w-full'>
            //       <Button onClick={() => handleEdit(item)} className='flex-1'>Edit</Button>
            //       <Button onClick={() => handleDelete(item.id)} variant='ghost' className='flex-1 border-2 border-accent'>Delete</Button>
            //     </div>
            //   </li>
            // ))
            <StockTable />
          ) : (
            <p>No available stock.</p>
          )}
        </ul>
      </form>
    </div>
  );
}