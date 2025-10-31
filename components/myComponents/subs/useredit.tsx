"use client"
import React, { FormEvent, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
// const AlertDialog = dynamic(() => import('@/components/ui/alert-dialog').then((e) => e.AlertDialog),{ssr: false,})
// const AlertDialogAction = dynamic(() => import('@/components/ui/alert-dialog').then((e) => e.AlertDialogAction),{ssr: false,})
// const AlertDialogCancel = dynamic(() => import('@/components/ui/alert-dialog').then((e) => e.AlertDialogCancel),{ssr: false,})
// const AlertDialogContent = dynamic(() => import('@/components/ui/alert-dialog').then((e) => e.AlertDialogContent),{ssr: false,})
// const AlertDialogDescription = dynamic(() => import('@/components/ui/alert-dialog').then((e) => e.AlertDialogDescription),{ssr: false,})
// const AlertDialogFooter = dynamic(() => import('@/components/ui/alert-dialog').then((e) => e.AlertDialogFooter),{ssr: false,})
// const AlertDialogHeader = dynamic(() => import('@/components/ui/alert-dialog').then((e) => e.AlertDialogHeader),{ssr: false,})
// const AlertDialogTitle = dynamic(() => import('@/components/ui/alert-dialog').then((e) => e.AlertDialogTitle),{ssr: false,})
// const AlertDialogTrigger = dynamic(() => import('@/components/ui/alert-dialog').then((e) => e.AlertDialogTrigger),{ssr: false,})
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
import { Label } from '@/components/ui/label'
import { register } from '@/server/action/signup'
import axios from 'axios'
import { useAppContext } from '@/hooks/useAppContext'
import { CldUploadWidget } from 'next-cloudinary'
// import {cloudUpload, uploadCloudinary} from '@/server/config/cloudinary'

const EditUser = () => {
  const { user, setUser } = useAppContext();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    username: '',
    contact: '',
    department: 'member',
    ministry: "684f74ca135dd6d0efeab37d",
    role: 'user',
  });
  const [editId, setEditId] = useState(true);

  useEffect(() => {
    handleEdit(user)
  }, []);

  const fetchUser = async () => {
    const res = await axios.get(`/api/dbhandler?model=users&id=${user.id}`);
    setUser(res.data);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("about to update edit data")
    const response = await axios.put(`/api/dbhandler?model=users&id=${editId}`, formData);
    if(response.status = 200){
      fetchUser();
      resetForm();
    }
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditId(item.id);
  };

  // const handleDelete = async (id) => {
  //   await axios.delete(`/api/dbhandler?model=users&id=${id}`);
  //   fetchUsers();
  // };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      username: '',
      contact: '',
      department: 'member',
      ministry: "684f74ca135dd6d0efeab37d",
      role: 'user',
    });
    setEditId(null);
  };

  

  return (
    <div className='inline'>
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline">edit</Button>
        </DrawerTrigger>
        <DrawerContent className='flex flex-col justify-center items-center py-10 /bg-red-500 max-w-5xl mx-auto'>

          <DrawerHeader>
            <DrawerTitle className='w-full text-center'>Edit your profile <span className='text-accent'>Succo</span></DrawerTitle>
            <DrawerDescription></DrawerDescription>
          </DrawerHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-10 bg-secondary rounded-xl max-w-xl"> 
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              type="text"
              placeholder="Name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              type="text"
              placeholder="Username"
              value={formData.username || ''}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
            <Input
              type="text"
              placeholder="Contact"
              value={formData.contact || ''}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
            />
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            >
              <option value="member">Member</option>
              <option value="choir">Choir</option>
              <option value="side men">Side Men</option>
              <option value="prophet">Prophet and Prophetess</option>
              <option value="minister">Minister</option>
            </select>
            
            <DrawerFooter className="flex flex-row w-full gap-2 mt-2">
              {/* <Button>Submit</Button> */}
              <DrawerClose className='flex-1' asChild>
                <Button className='flex-1' variant="outline">Cancel</Button>
              </DrawerClose>
              <Button type="submit" className="flex-1 before:ani-shadow w-full">Update &rarr;</Button>
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

export default EditUser


