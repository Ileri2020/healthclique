// DepartmentForm.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function CategoriesForm() {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    // products: [],   //to be added later
    description: ''
  });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const res = await axios.get('/api/dbhandler?model=category');
    setCategories(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await axios.put(`/api/dbhandler?model=category&id=${editId}`, formData);
    } else {
      await axios.post('/api/dbhandler?model=category', formData);
    }
    resetForm();
    fetchCategories();
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditId(item.id);
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/dbhandler?model=category&id=${id}`);
    fetchCategories();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      // products: [],   //to be added later
      description: ''
    });
    setEditId(null);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className='flex flex-col w-full max-w-sm gap-2 justify-center items-center p-3 border-2 border-secondary-foreground rounded-sm m-2'>
        <h2>Manage Product Categories</h2>
        <Input
          type="text"
          placeholder="Category Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        {/* <select
          value={formData.products}
          onChange={(e) => setFormData({ ...formData, products: e.target.value })}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
        </select> */}
        <Input
          type="text"
          placeholder="Description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
        <Button type="submit">{editId ? 'Update' : 'Create'}</Button>
        {editId && <button onClick={resetForm}>Cancel</button>}

        <ul className='w-full'>
          {categories.length > 0 ? (
            categories.map((item , index) => (
              <li key={index} className="flex flex-col justify-center items-center gap-2 my-2 bg-secondary rounded-md w-full p-2">
                <div className="flex flex-row gap-2">
                  <span>{(index + 1)}. Name : </span>
                  <span>{item.name}</span>
                </div>
                {/* <p>Price : {item.price || <em>No price tag</em>}</p> */}
                <div className='flex flex-row gap-2 p-1 w-full'>
                  <Button onClick={() => handleEdit(item)} className='flex-1'>Edit</Button>
                  <Button onClick={() => handleDelete(item.id)} variant='ghost' className='flex-1 border-2 border-accent'>Delete</Button>
                </div>
              </li>
            ))
          ) : (
            <p>No available category.</p>
          )}
        </ul>
      </form>
    </div>
  );
}