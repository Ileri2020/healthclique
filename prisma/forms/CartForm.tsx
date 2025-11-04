
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function CartForm() {
  const [carts, setCarts] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    userId: '',
    productId: '',
    quantity: 0,
    total: 0,
  });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchCarts();
    fetchUsers();
    fetchProducts();
  }, []);

  const fetchCarts = async () => {
    const res = await axios.get('/api/dbhandler?model=cart');
    setCarts(res.data);
  };

  const fetchUsers = async () => {
    const res = await axios.get('/api/dbhandler?model=user');
    setUsers(res.data);
  };

  const fetchProducts = async () => {
    const res = await axios.get('/api/dbhandler?model=product');
    setProducts(res.data);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  const newFormData = {
    ...formData,
    quantity: +formData.quantity,
    total: +formData.total,
  };
  if (editId) {
    await axios.put(`/api/dbhandler?model=cart&id=${editId}`, newFormData);
  } else {
    await axios.post('/api/dbhandler?model=cart', newFormData);
  }
  resetForm();
  fetchCarts();
};

  const handleEdit = (item) => {
    setFormData(item);
    setEditId(item.id);
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/dbhandler?model=cart&id=${id}`);
    fetchCarts();
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      productId: '',
      quantity: 0,
      total: 0,
    });
    setEditId(null);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className='flex flex-col w-full max-w-sm gap-2 justify-center items-center p-3 border-2 border-secondary-foreground rounded-sm m-2'>
        <h2 className='font-semibold text-lg'>Manage Carts</h2>
        <select value={formData.userId} onChange={(e) => setFormData({ ...formData, userId: e.target.value })}>
          {users.length > 0 ? (
            users.map((user, index) => (
              <option key={index} value={user.id}>
                {user.name}
              </option>
            ))
          ) : (
            <option value="">No users</option>
          )}
        </select>
        <select value={formData.productId} onChange={(e) => setFormData({ ...formData, productId: e.target.value })}>
          {products.length > 0 ? (
            products.map((product, index) => (
              <option key={index} value={product.id}>
                {product.name}
              </option>
            ))
          ) : (
            <option value="">No products</option>
          )}
        </select>
        <Input placeholder="Quantity" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: +e.target.value })}  type="number" />
        <Input placeholder="Total" value={formData.total} onChange={(e) => setFormData({ ...formData, total: +e.target.value })}  type="number" />
        <Button type="submit">{editId ? 'Update' : 'Create'}</Button>
        {editId && <Button type="button" onClick={resetForm}>Cancel</Button>}
        <ul className='w-full'>
          {carts.length > 0 ? (
            carts.map((item, index) => (
              <li key={index} className="flex flex-col justify-center items-center gap-2 my-2 bg-secondary rounded-md w-full p-2">
                <p>User: {users.find((user) => user.id === item.userId)?.name}</p>
                <p>Product: {products.find((product) => product.id === item.productId)?.name}</p>
                <p>Quantity: {item.quantity}</p>
                <p>Total: {item.total}</p>
                <div className='flex flex-row gap-2 p-1 w-full'>
                  <Button onClick={() => handleEdit(item)} className='flex-1'>Edit</Button>
                  <Button onClick={() => handleDelete(item.id)} variant='ghost' className='flex-1 border-2 border-accent'>Delete</Button>
                </div>
              </li>
            ))
          ) : (
            <p>No carts.</p>
          )}
        </ul>
      </form>
    </div>
  );
}

