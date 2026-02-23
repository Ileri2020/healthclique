"use client";

import React, { useEffect, useState } from 'react';
import Post from './post';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';

interface PostsProps {
  category: string;
}

const Posts = ({ category }: PostsProps) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [types, setTypes] = useState({ video: true, audio: true, image: true });

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/dbhandler', { 
          params: { model: 'post' } // Using 'post' instead of 'posts' as per dbhandler route mapping
        });
        let data = res.data;
        
        if (Array.isArray(data)) {
          // Filter by category
          if (category !== "All") {
            data = data.filter((p: any) => p.category === category);
          }
          
          // Filter by type
          data = data.filter((p: any) => types[p.type as keyof typeof types]);

          // Sort
          data.sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
          });

          setPosts(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [category, sortOrder, types]);

  const toggleType = (type: keyof typeof types) => {
    setTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div className='w-full max-w-2xl mx-auto'>
      <div className="flex flex-wrap items-center justify-between mb-8 gap-4 bg-muted/30 p-4 rounded-2xl border border-dashed border-primary/20">
        <div className="flex gap-4">
          {Object.entries(types).map(([type, active]) => (
            <button
              key={type}
              onClick={() => toggleType(type as any)}
              className={`text-xs font-bold uppercase px-3 py-1 rounded-full transition-all border ${
                active 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-background text-muted-foreground border-border'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        
        <select 
          value={sortOrder} 
          onChange={(e) => setSortOrder(e.target.value as any)}
          className="text-xs font-bold bg-background border rounded-lg p-1"
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-12 w-3/4 rounded-xl" />
              <Skeleton className="h-[300px] w-full rounded-3xl" />
              <Skeleton className="h-8 w-1/2 rounded-xl" />
            </div>
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <Post key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center py-20 text-center opacity-40'>
          <div className="text-6xl mb-4">🩺</div>
          <div className='font-black text-2xl'>No {category} Records Found</div>
          <p className='text-sm mt-2'>Be the first to share clinical insights in this category.</p>
        </div>
      )}
    </div>
  );
};

export default Posts;
