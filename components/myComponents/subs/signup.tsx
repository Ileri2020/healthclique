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

const Signup = () => {
  // const [details, setDetails] = useState({
  //   userName : "",
  //   email : "",
  //   password : "",
  // })

  // // const [render, setRender] = useState(0);

  // // useEffect(() => {
  // // }, [render]);

  // interface RefObject<T> {
  //   readonly current: T | null
  // }

  //   const form = useRef<HTMLFormElement>(null);


  //   const handleChange = (e : any)=>{
  //     const { name, value } = e.target;

  //     setDetails((prevFormData) => ({ ...prevFormData, [name]: value }));
  //   }
  
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    avatarUrl: '',
  });
  const [editId, setEditId] = useState(null);

  useEffect(() => {

  }, []);

  const form = useRef<HTMLFormElement>(null);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await axios.put(`/api/dbhandler?model=user&id=${editId}`, formData);
    } else {
      await axios.post('/api/dbhandler?model=user', formData);
    }
    resetForm();
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditId(item.id);
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/dbhandler?model=users&id=${id}`);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      avatarUrl: '',
    });
    setEditId(null);
  };

  return (
    <div className='inline'>
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline">Sign up</Button>
        </DrawerTrigger>
        <DrawerContent className='flex flex-col justify-center items-center py-10 /bg-red-500 max-w-5xl mx-auto'>

          <DrawerHeader>
            <DrawerTitle className='w-full text-center'>Create an account with <span className='text-accent'>Lois Food and Spices</span></DrawerTitle>
            <DrawerDescription></DrawerDescription>
          </DrawerHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-10 bg-secondary rounded-xl max-w-xl"> 
          <Input
              type="text"
              placeholder="Name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            {/* <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department : e.target.value })}
            >
              <option value="member">Member</option>
              <option value="choir">Choir</option>
              <option value="youth">Youth</option>
              <option value="worker">Worker</option>
              <option value="parochial">Parochial</option>
              <option value="elder">Elder</option>
            </select> */}
            {/* <select
              value={formData.sex}
              onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select> */}
            
            <DrawerFooter className="flex flex-row w-full gap-2 mt-2">
              {/* <Button>Submit</Button> */}
              <DrawerClose className='flex-1' asChild>
                <Button className='flex-1' variant="outline">Cancel</Button>
              </DrawerClose>
              <Button type="submit" className="flex-1 before:ani-shadow w-full">{editId ? 'Update' : 'Sign up'} &rarr;</Button>
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

export default Signup


