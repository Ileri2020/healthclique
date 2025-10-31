// MinistryForm.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';




export default function FeaturedProductForm() {
  const [featuredProduct, setFeaturedProduct] = useState([])
  const [products, setProducts] = useState<any>([]);
  const [formData, setFormData] = useState({
    productId: '',
    product: '',
  });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchFeaturedProduct();
    fetchProducts()
  }, []);

  const fetchFeaturedProduct = async () => {
    const res = await axios.get('/api/dbhandler?model=featuredProduct');
    console.log("featured product :", res.data)
    setFeaturedProduct(res.data);
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
      await axios.put(`/api/dbhandler?model=featuredProduct&id=${editId}`, formData);
    } else {
      const { status, data, statusText } = await axios.post(
        '/api/dbhandler?model=featuredProduct',
        formData
      );
      console.log('Status:', status, 'Data:', data, 'Status Text:', statusText);
    }
    resetForm();
    fetchFeaturedProduct();
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
    await axios.delete(`/api/dbhandler?model=featuredProduct&id=${id}`);
    fetchFeaturedProduct();
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      product: '',
    });
    setEditId(null);
  };





  return (
    <div>
      
      <form onSubmit={handleSubmit} className='flex flex-col w-full max-w-sm gap-2 justify-center items-center p-3 border-2 border-secondary-foreground rounded-sm m-2'>
      <h2>Manage Home Page Featured Products</h2>
      
      <ul className='w-full'>
        <div>Products To Feature</div>
        {products.length > 0 ? (
          products.map((item , index) => (
            <li key={index} className="flex flex-col justify-center items-center gap-2 my-2 bg-secondary rounded-md w-full p-2">
              <div className="flex flex-row gap-2">
                <span>{(index + 1)}. Name : </span>
                <span>{item.name}</span>
              </div>
              <p>Price : {item.price || <em>No price tag</em>}</p>
              <div className='flex flex-row gap-2 p-1 w-full'>
                <Button onClick={() => handleProductInput(item)} className='flex-1'>Feature</Button>
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
        <Button type="submit">{editId ? 'Update' : 'Create'}</Button>
        {editId && <button onClick={resetForm}>Cancel</button>}

        <ul className='w-full'>
          <div>Added Product Features</div>
          {featuredProduct.length > 0 ? (
            featuredProduct.map((item , index) => (
              <li key={index} className="flex flex-col justify-center items-center gap-2 my-2 bg-secondary rounded-md w-full p-2">
                <div className="flex flex-row gap-2">
                  <span>{(index + 1)}. Featured Product : </span>
                  <span>{item.product}</span>
                </div>
                {/* <p>Added Quantity : {item.addedQuantity || <em>No price tag</em>}</p> */}
                <div className='flex flex-row gap-2 p-1 w-full'>
                  <Button onClick={() => handleEdit(item)} className='flex-1'>Edit</Button>
                  <Button onClick={() => handleDelete(item.id)} variant='ghost' className='flex-1 border-2 border-accent'>Delete</Button>
                </div>
              </li>
            ))
          ) : (
            <p>No available product features.</p>
          )}
        </ul>
      </form>
    </div>
  );
}