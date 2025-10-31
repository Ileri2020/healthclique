// MinistryForm.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';




export default function StockForm() {
  const [stocks, setStocks] = useState([])
  const [products, setProducts] = useState<any>([]);
  const [formData, setFormData] = useState({
    productId: '',
    QuantityToAdd: 0,
    product: '',
  });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchStocks();
    fetchProducts()
  }, []);

  const fetchStocks = async () => {
    const res = await axios.get('/api/dbhandler?model=stock');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("about to send to db",formData)
    if (editId) {
      await axios.put(`/api/dbhandler?model=stock&id=${editId}`, formData);
    } else {
      const { status, data, statusText } = await axios.post(
        '/api/dbhandler?model=stock',
        formData
      );
      console.log('Status:', status, 'Data:', data, 'Status Text:', statusText);
    }
    resetForm();
    fetchStocks();
    fetchProducts()
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditId(item.id);
  };

  const handleProductInput = (item) => {
    setFormData({
      ...formData,
      product: item.name || '',
      productId: item.id || '',
    });
  };  

  const handleDelete = async (id) => {
    await axios.delete(`/api/dbhandler?model=stock&id=${id}`);
    fetchStocks();
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      QuantityToAdd: 0,
      product: '',
    });
    setEditId(null);
  };





  return (
    <div>
      
      <form onSubmit={handleSubmit} className='flex flex-col w-full max-w-sm gap-2 justify-center items-center p-3 border-2 border-secondary-foreground rounded-sm m-2'>
      <h2>Manage Products Stock</h2>
      
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
                <Button onClick={() => handleProductInput(item)} className='flex-1'>Stock</Button>
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
          value={formData.QuantityToAdd}
          onChange={(e) => setFormData({ ...formData, QuantityToAdd: Number(e.target.value) })}
        />
        <Button type="submit">{editId ? 'Update' : 'Create'}</Button>
        {editId && <button onClick={resetForm}>Cancel</button>}

        <ul className='w-full'>
          <div>Added Stocks</div>
          {stocks.length > 0 ? (
            stocks.map((item , index) => (
              <li key={index} className="flex flex-col justify-center items-center gap-2 my-2 bg-secondary rounded-md w-full p-2">
                <div className="flex flex-row gap-2">
                  <span>{(index + 1)}. Stocked Product : </span>
                  <span>{item.product}</span>
                </div>
                <p>Added Quantity : {item.addedQuantity || <em>No price tag</em>}</p>
                <div className='flex flex-row gap-2 p-1 w-full'>
                  <Button onClick={() => handleEdit(item)} className='flex-1'>Edit</Button>
                  <Button onClick={() => handleDelete(item.id)} variant='ghost' className='flex-1 border-2 border-accent'>Delete</Button>
                </div>
              </li>
            ))
          ) : (
            <p>No available stock.</p>
          )}
        </ul>
      </form>
    </div>
  );
}