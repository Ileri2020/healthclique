
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function CouponForm() {
  const [coupons, setCoupons] = useState([]);
  const [formData, setFormData] = useState({
    code: '',
    discount: '',
    expiresAt: '',
  });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    const res = await axios.get('/api/dbhandler?model=coupon');
    setCoupons(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await axios.put(`/api/dbhandler?model=coupon&id=${editId}`, formData);
    } else {
      await axios.post('/api/dbhandler?model=coupon', formData);
    }
    resetForm();
    fetchCoupons();
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditId(item.id);
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/dbhandler?model=coupon&id=${id}`);
    fetchCoupons();
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount: '',
      expiresAt: '',
    });
    setEditId(null);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className='flex flex-col w-full max-w-sm gap-2 justify-center items-center p-3 border-2 border-secondary-foreground rounded-sm m-2'>
        <h2 className='font-semibold text-lg'>Manage Coupons</h2>
        <Input type="text" placeholder="Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
        <Input type="number" placeholder="Discount" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: e.target.value })} />
        <Input type="datetime-local" placeholder="Expires At" value={formData.expiresAt} onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })} />
        <Button type="submit">{editId ? 'Update' : 'Create'}</Button>
        {editId && <button onClick={resetForm}>Cancel</button>}
        <ul className='w-full'>
          {coupons.length > 0 ? (
            coupons.map((item , index) => (
              <li key={index} className="flex flex-col justify-center items-center gap-2 my-2 bg-secondary rounded-md w-full p-2">
                <div className="flex flex-row gap-2">
                  <span>{(index + 1)}. Code : </span>
                  <span>{item.code}</span>
                </div>
                <p>Discount : {item.discount || <em>No discount</em>}</p>
                <p>Expires At : {item.expiresAt || <em>No expiry date</em>}</p>
                <div className='flex flex-row gap-2 p-1 w-full'>
                  <Button onClick={() => handleEdit(item)} className='flex-1'>Edit</Button>
                  <Button onClick={() => handleDelete(item.id)} variant='ghost' className='flex-1 border-2 border-accent'>Delete</Button>
                </div>
              </li>
            ))
          ) : (
            <p>No coupons available.</p>
          )}
        </ul>
      </form>
    </div>
  );
}

