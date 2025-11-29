import { useEffect, useState } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Product {
  id: string;
  name: string;
  price?: number;
  description?: string;
}

interface FeaturedProduct {
  id: string;
  productId: string;
  product: Product;
}

export default function FeaturedProductForm() {
  const [featuredProduct, setFeaturedProduct] = useState<FeaturedProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
  });
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    fetchFeaturedProduct();
    fetchProducts();
  }, []);

  const fetchFeaturedProduct = async () => {
    try {
      const res = await axios.get('/api/dbhandler?model=featuredProduct');
      setFeaturedProduct(res.data);
    } catch (err) {
      console.error('Failed to fetch featured products', err);
    }
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
    if (!formData.productId) {
      alert("Please select a product to feature.");
      return;
    }

    try {
      if (editId) {
        await axios.put(`/api/dbhandler?model=featuredProduct&id=${editId}`, {
          productId: formData.productId,
        });
      } else {
        await axios.post('/api/dbhandler?model=featuredProduct', {
          productId: formData.productId,
        });
      }
      resetForm();
      fetchFeaturedProduct();
    } catch (err) {
      console.error("Failed to submit form:", err);
    }
  };

  const handleEdit = (item: FeaturedProduct) => {
    setFormData({
      productId: item.productId,
      productName: item.product?.name || '',
    });
    setEditId(item.id);
  };

  const handleProductSelect = (item: Product) => {
    setFormData({
      productId: item.id,
      productName: item.name,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/dbhandler?model=featuredProduct&id=${id}`);
      fetchFeaturedProduct();
    } catch (err) {
      console.error('Failed to delete featured product', err);
    }
  };

  const resetForm = () => {
    setFormData({ productId: '', productName: '' });
    setEditId(null);
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Manage Home Page Featured Products</h2>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-full max-w-md gap-2 p-3 border-2 border-secondary-foreground rounded-md"
      >
        <h3 className="font-semibold">Select Product to Feature</h3>
        <ul className="mb-2">
          {products.length > 0 ? (
            products.map((item, index) => (
              <li
                key={item.id}
                className="flex flex-col justify-center items-start gap-1 my-2 bg-secondary rounded-md p-2 w-full"
              >
                <div className="flex justify-between w-full">
                  <span>{index + 1}. {item.name}</span>
                  <span>Price: {item.price ?? <em>No price</em>}</span>
                </div>
                <Button onClick={() => handleProductSelect(item)} className="mt-1">
                  Feature
                </Button>
              </li>
            ))
          ) : (
            <p>No available products.</p>
          )}
        </ul>

        <Input
          type="text"
          placeholder="Product Name"
          value={formData.productName}
          disabled
        />
        <Input
          type="text"
          placeholder="Product ID"
          value={formData.productId}
          disabled
        />
        <Button type="submit">{editId ? 'Update' : 'Create'}</Button>
        {editId && <Button onClick={resetForm} variant="ghost">Cancel</Button>}
      </form>

      <h3 className="mt-4 font-semibold">Added Featured Products</h3>
      <ul>
        {featuredProduct.length > 0 ? (
          featuredProduct.map((item, index) => (
            <li
              key={item.id}
              className="flex flex-col justify-start items-start gap-1 my-2 bg-secondary rounded-md p-2 w-full"
            >
              <div className="flex justify-between w-full">
                <span>{index + 1}. {item.product?.name ?? 'Unnamed Product'}</span>
                <span>Price: {item.product?.price ?? <em>No price</em>}</span>
              </div>
              <div className="flex gap-2 mt-1">
                <Button onClick={() => handleEdit(item)}>Edit</Button>
                <Button onClick={() => handleDelete(item.id)} variant="ghost" className="border-2 border-accent">
                  Delete
                </Button>
              </div>
            </li>
          ))
        ) : (
          <p>No featured products added yet.</p>
        )}
      </ul>
    </div>
  );
}
