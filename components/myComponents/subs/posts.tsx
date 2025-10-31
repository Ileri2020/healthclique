"use client";
import React, { useEffect, useState } from 'react';
import Post from './post';
import axios from 'axios';

const Posts = ({ page }) => {
  const [allpost, setallpost] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [postTypes, setPostTypes] = useState({ video: true, audio: true, image: true, });

  const fetchallpost = () =>{
    axios.get('/api/dbhandler', { params: { model: 'posts', } })
      .then(response => {
        const posts = response.data;
        let filteredPosts = posts.filter(post => post.for === page && postTypes[post.type]);
        filteredPosts = filteredPosts.sort((a, b) => sortOrder === 'asc' ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime() : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setallpost(filteredPosts);
      })
      .catch(error => {
        console.error(error);
      });
  }

  useEffect(() => {
    fetchallpost();
  }, [sortOrder, postTypes, page]);

  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
  }

  const handlePostTypeChange = (e) => {
    setPostTypes({ ...postTypes, [e.target.name]: e.target.checked, });
  }

  if (!allpost) return <div>Loading...</div>;

  return (
    <div className='flex flex-col w-fit mx-auto'>
      <div className="/absolute w-[360px] flex flex-row justify-between">
        <select value={sortOrder} onChange={handleSortChange} className="mb-4 w-20">
          <option value="asc">Asc</option>
          <option value="desc">Dsc</option>
        </select>
        <div className="mb-4">
          <label>
            <input type="checkbox" name="video" checked={postTypes.video} onChange={handlePostTypeChange} />
            Video
          </label>
          <label className="ml-4">
            <input type="checkbox" name="audio" checked={postTypes.audio} onChange={handlePostTypeChange} />
            Audio
          </label>
          <label className="ml-4">
            <input type="checkbox" name="image" checked={postTypes.image} onChange={handlePostTypeChange} />
            Image
          </label>
        </div>
      </div>
      {allpost && allpost.length > 0 ? (
        allpost.map((post, index)=>{
          //console.log('post', index, 'post id', post.id)
          return(
            <Post 
              key={index} 
              url={post.url} 
              ownerurl={(post?.user?.avatarUrl==undefined) ? 'https://res.cloudinary.com/dc5khnuiu/image/upload/v1752627019/uxokaq0djttd7gsslwj9.png' : post.user.avatarUrl}
              time={post.updatedAt} 
              owner={post?.user?.name == undefined ? "Engr Adepoju" : post.user.name} 
              event={post.event} 
              post={post.description} 
              type={post.type} 
              id={post.id} 
              for={post.for} 
              title={post.title}
            />
          )
        })
      ) : (
        <div className='w-full mt-20 justify-center items-center font-bold text-xl'>No {page}s available.</div>
      )}
    </div>
  )
}

export default Posts;
