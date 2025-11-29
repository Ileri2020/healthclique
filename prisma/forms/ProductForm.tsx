"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { useEffect, useState } from 'react';

export default function ProductForm() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    categoryId: '',
    category: '',
    price: 0,
    images: null,
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  // Fetch products and categories on mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/dbhandler?model=product');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/dbhandler?model=category');
      setCategories(res.data);
      if (res.data.length > 0 && !formData.categoryId) {
        setFormData(prev => ({
          ...prev,
          categoryId: res.data[0].id,
          category: res.data[0].name
        }));
      }
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      categoryId: categories.length > 0 ? categories[0].id : '',
      category: categories.length > 0 ? categories[0].name : '',
      price: 0,
      images: null,
    });
    setFile(null);
    setPreview(null);
    setEditId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.categoryId) {
      alert("Name and category are required.");
      return;
    }

    const pformData = new FormData();
    if (file) pformData.append("file", file);
    pformData.append("name", formData.name.trim());
    pformData.append("description", formData.description || '');
    pformData.append("categoryId", formData.categoryId);
    pformData.append("category", formData.category);
    pformData.append("price", formData.price.toString());

    try {
      const response = editId
        ? await axios.put(`/api/dbhandler?model=product&id=${editId}`, pformData)
        : await axios.post(`/api/dbhandler?model=product`, pformData);

      console.log(response.data);
    } catch (err) {
      console.error(err);
      alert("Failed to save product.");
    }

    resetForm();
    fetchProducts();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 3 * 1024 * 1024) {
      alert("File size greater than 3MB may not upload properly.");
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`/api/dbhandler?model=product&id=${id}`);
      fetchProducts();
    } catch (err) {
      alert('Failed to delete product.');
    }
  };

  const handleEdit = (product: any) => {
    setEditId(product.id);
    setFormData({
      name: product.name,
      description: product.description || '',
      categoryId: product.categoryId,
      category: product.category,
      price: product.price,
      images: product.images,
    });
    if (product.images?.length > 0) setPreview(product.images[0]);
  };

  return (
    <div className="flex flex-col items-center p-4">
      <form onSubmit={handleSubmit} className="flex flex-col w-full max-w-sm gap-3 p-4 border-2 border-secondary-foreground rounded-md">
        <h2 className="text-lg font-semibold">Product Form</h2>

        <label>Product Name</label>
        <Input
          placeholder="Name of product"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        <label>Product Description</label>
        <Input
          placeholder="Description of product"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />

        <label>Product Category</label>
        <select
          value={formData.categoryId}
          onChange={(e) => {
            const selectedCategory = categories.find(cat => cat.id === e.target.value);
            setFormData({
              ...formData,
              categoryId: e.target.value,
              category: selectedCategory ? selectedCategory.name : ''
            });
          }}
        >
          {categories.length > 0 ? categories.map((cat, idx) => (
            <option key={idx} value={cat.id}>{cat.name}</option>
          )) : <option value="">No categories</option>}
        </select>

        <label>Product Price</label>
        <Input
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
        />

        <label>Product Image</label>
        {preview && <img src={preview} alt="Preview" style={{ maxHeight: '200px' }} />}
        <Input type="file" onChange={handleImageChange} />

        <div className="flex gap-2">
          <Button type="submit">{editId ? 'Update' : 'Create'}</Button>
          {editId && <Button type="button" onClick={resetForm}>Cancel</Button>}
        </div>

        <ul className="w-full">
          {products.length > 0 ? products.map((prod, idx) => (
            <li key={idx} className="flex flex-col gap-2 p-2 my-2 bg-secondary rounded-md">
              <div className="flex justify-between">
                <span>{idx + 1}. {prod.name}</span>
                <span>Price: {prod.price || 'N/A'}</span>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => handleEdit(prod)}>Edit</Button>
                <Button className="flex-1 border-2 border-accent" variant="ghost" onClick={() => handleDelete(prod.id)}>Delete</Button>
              </div>
            </li>
          )) : <p>No products available.</p>}
        </ul>
      </form>
    </div>
  );
}
