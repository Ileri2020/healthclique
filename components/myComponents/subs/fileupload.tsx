"use client"
import React, { FormEvent, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from '@/components/ui/input'
import axios from 'axios'
import { useAppContext } from '@/hooks/useAppContext'
import { CldUploadWidget } from 'next-cloudinary'
// import {cloudUpload, uploadCloudinary} from '@/server/config/cloudinary'
import { CiCamera, CiCirclePlus } from 'react-icons/ci'
import { BiPlus } from 'react-icons/bi'


















export const ProfileImg = () => {
  const { selectedVideo, setSelectedVideo, useMock, user, setUser } = useAppContext();
  const [formData, setFormData] = useState({
    description: '',
    type: 'image',
    userId: user.id,
    title: 'profile image',
    for: 'post',
  });

  const [preview, setPreview] = useState(null);
  const [uploadStatus , setUploadStatus] = useState("");

  const [file, setFile] = useState(null);


  const form = useRef<HTMLFormElement>(null);

//   const fetchUsers = async () => {
//     const res = await axios('/api/dbhandler?model=users');
//     setUsers(res.data);
//   };


  const handleSubmit = async (e) => {
    e.preventDefault();
    const pformData = new FormData();
    pformData.append("file", file);
    pformData.append("description", formData.description)
    pformData.append("type", formData.type)
    pformData.append("userId", user.id)
    pformData.append("title", formData.title)
    pformData.append("profileImage", "true")
    pformData.append('for', formData.for)
    
    try {
      const response = await axios.post(`/api/file/image`, pformData);
      if (response.status === 200) {
        const data = response.data;
        // do something with the data
        console.log(data)
        setUser({...user, avatarUrl : data.url});
      } else {
        alert("wrong input or connection error")
      }
    } catch (error) {
      // handle error
      console.error(error);
    }
    resetForm();
    // fetchUsers();
  };

  // const handleDelete = async (id) => {
  //   await axios.delete(`/api/dbhandler?model=users&id=${id}`);
  //   fetchUsers();
  // };

  const resetForm = () => {
    setPreview(null)
    setFormData({
    description: '',
    type: 'image',
    userId: user.id,
    title: 'profile image',
    for: 'post',
  });
  };

  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile.size > 3 * 1024){
      alert("file size greater than 300kb file may not upload")
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  }
  

  useEffect(() => {
    // if (file) {
    //     setPreview(URL.createObjectURL(file))
    // }
  }, [preview,]);

  

  return (
    <div className='absolute inline z-10 translate-x-[140px] translate-y-[140px]'>
      <Drawer>
        <DrawerTrigger asChild className='w-12 h-12 flex items-center rounded-full font-bold text-accent text-2xl border-2 border-accent p-2 hover:text-primary hover:bg-accent/40 place-self-end self-end z-10'>
            <CiCamera />
        </DrawerTrigger>
        <DrawerContent className='flex flex-col justify-center items-center py-10 /bg-red-500 max-w-5xl mx-auto'>

          <DrawerHeader>
            <DrawerTitle className='w-full text-center'>Edit your profile image (300kb max)</DrawerTitle>
            <DrawerDescription></DrawerDescription>
          </DrawerHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-10 bg-secondary rounded-xl max-w-xl"> 
            
            {preview && (
              <div style={{ marginTop: '1rem' }}>
                <img src={preview} alt="Selected preview" style={{ maxHeight: '300px' }} />
              </div>
            )}
            <div>{user.id}</div>
            <Input
              type="file"
              name='image'
              id='image'
              placeholder="Avatar URL"
              // value={formData.avatarUrl || ''}
              // onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
              onChange={handleImageChange}
            />
            
            <DrawerFooter className="flex flex-row w-full gap-2 mt-2">
              {/* <Button>Submit</Button> */}
              <DrawerClose className='flex-1' asChild>
                <Button className='flex-1' variant="outline">Cancel</Button>
              </DrawerClose>
              <Button type="submit" className="flex-1 before:ani-shadow w-full">Upload &rarr;</Button>
            </DrawerFooter>
          </form>
          {/* <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter> */}
        </DrawerContent>
      </Drawer>
    </div>
  )
}











export const PostButton = () => {
  const { user, setUser } = useAppContext();
  const isAdminOrModerator = user.role === "admin" || user.role === "moderator";

  
  const [formData, setFormData] = useState({
    description: '',
    type: 'image',
    userId: user.id,
    title: isAdminOrModerator ? 'Title, Event, etc' : 'post',

    for: 'post',
  });

  const [preview, setPreview] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [file, setFile] = useState(null);


  const form = useRef<HTMLFormElement>(null);

//   const fetchUsers = async () => {
//     const res = await axios('/api/dbhandler?model=users');
//     setUsers(res.data);
//   };


  const handleSubmit = async (e) => {
    if (user.name === "visitor" && user.email === "nil"){
      alert("login or create an account to make a post")
      return
    }
    e.preventDefault();
    const pformData = new FormData();
    pformData.append("file", file);
    pformData.append("description", formData.description)
    pformData.append("type", formData.type)
    pformData.append("userId", user.id)
    pformData.append("title", formData.title)
    pformData.append("for", formData.for)
    pformData.append("profileImage", "false")
    
    try {
      const response = await axios.post(`/api/file/image`, pformData);
      if (response.status === 200) {
        const data = response.data;
        // do something with the data
        console.log(data)
        // setUser({...user, avatarUrl : data.url});
      } else {
        alert("wrong input or connection error")
      }
    } catch (error) {
      // handle error
      console.error(error);
    }
    resetForm();
    // fetchUsers();
  };

  // const handleDelete = async (id) => {
  //   await axios.delete(`/api/dbhandler?model=users&id=${id}`);
  //   fetchUsers();
  // };

  const resetForm = () => {
    setPreview(null)
    setFormData({
    description: '',
    type: 'image',
    userId: user.id,
    title: isAdminOrModerator ? 'Title, event, etc' : 'post',
    for: 'post',
  });
  };

  // const handleImageChange = (e) => {
  //   const selectedFile = e.target.files[0];
  //   setFile(selectedFile);
  //   setPreview(URL.createObjectURL(selectedFile));
  // }

  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  
    const fileType = selectedFile.type.split('/')[0];
    switch (fileType) {
      case 'image':
        setFormData({ ...formData, type: 'image' });
        break;
      case 'video':
        setFormData({ ...formData, type: 'video' });
        break;
      case 'audio':
        setFormData({ ...formData, type: 'audio' });
        break;
      default:
        setFormData({ ...formData, type: 'document' });
        break;
    }
  }
  
  

  useEffect(() => {
    // if (file) {
    //     setPreview(URL.createObjectURL(file))
    // }
  }, [preview,]);

  

  return (
    <div className='z-10 w-full'>
      <Drawer>
        <DrawerTrigger asChild className='w-full h-10 border-2 border-accent flex items-center rounded-full font-bold text-accent text-2xl hover:text-accent hover:bg-accent/40 z-10'>
          <BiPlus />
        </DrawerTrigger>
        <DrawerContent className='flex flex-col justify-center items-center py-10 /bg-red-500 max-w-5xl mx-auto'>
          <DrawerHeader>
            <DrawerTitle className='w-full text-center'>
              {isAdminOrModerator ? 'Create a new content as an Administrator' : 'Create a new post'}
            </DrawerTitle>
            <DrawerDescription></DrawerDescription>
          </DrawerHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-10 bg-secondary rounded-xl max-w-xl">
            {preview && (
              <div style={{ marginTop: '1rem' }}>
                {formData.type === 'image' && (
                  <img src={preview} alt="Selected preview" style={{ maxHeight: '300px' }} />
                )}
                {formData.type === 'video' && (
                  <video src={preview} controls style={{ maxHeight: '300px' }} />
                )}
                {formData.type === 'audio' && (
                  <audio src={preview} controls />
                )}
                {formData.type === 'document' && (
                  <p>Selected document: {file.name}</p>
                )}
              </div>
            )}
            <div>{user.name}</div>
            <Input type="file" name='image' id='image' placeholder="Avatar URL" onChange={handleImageChange} />
            {isAdminOrModerator && (
              <Input type="text" placeholder="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            )}
            <Input type="text" placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            {isAdminOrModerator && (
              <select value={formData.for} onChange={(e) => setFormData({ ...formData, for: e.target.value })}>
                <option value="event">event</option>
                <option value="project">project</option>
                <option value="testimony">testimony</option>
                <option value="post">post</option>
                <option value="service">service</option>
                <option value="preaching">preaching</option>
              </select>
            )}
            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
              <option value="image">image</option>
              <option value="video">video</option>
              <option value="audio">audio</option>
              <option value="document">document</option>
            </select>
            <DrawerFooter className="flex flex-row w-full gap-2 mt-2">
              <DrawerClose className='flex-1' asChild>
                <Button className='flex-1' variant="outline">Cancel</Button>
              </DrawerClose>
              <Button type="submit" className="flex-1 before:ani-shadow w-full">Upload &rarr;</Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    </div>
  );
}





