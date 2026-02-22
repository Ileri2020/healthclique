"use client"
import React, { useEffect, useRef, useState } from 'react'
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
import axios from 'axios'
import { FcGoogle } from 'react-icons/fc'
import { googleSignIn } from './googlesignin'
import Login from './login'

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    avatarUrl: '',
    role: 'customer',
    professionalType: '',
    regNumber: '',
    facilityName: '',
    facilityAddress: '',
    facilityRegNumber: '',
  });
  const [editId, setEditId] = useState(null);

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      avatarUrl: '',
      role: 'customer',
      professionalType: '',
      regNumber: '',
      facilityName: '',
      facilityAddress: '',
      facilityRegNumber: '',
    });
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await axios.put(`/api/dbhandler?model=user&id=${editId}`, formData);
    } else {
      await axios.post('/api/dbhandler?model=user', formData);
    }
    resetForm();
  };

  return (
    <div className='inline w-full'>
      <Drawer>
        <DrawerTrigger asChild className='w-full'>
          <Button variant="outline" className='w-full'>Sign up</Button>
        </DrawerTrigger>
        <DrawerContent className='flex flex-col justify-center items-center py-10 max-w-5xl mx-auto'>

          <DrawerHeader>
            <DrawerTitle className='w-full text-center'>
              Create an account with <span className='text-primary'>Health Clique</span>
            </DrawerTitle>
            <DrawerDescription></DrawerDescription>
          </DrawerHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-10 bg-secondary rounded-xl max-w-xl w-full">
            <Input
              type="text"
              placeholder="Full Name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />

            <div className="space-y-2 py-2">
              <Label className="text-sm font-bold">Account Type</Label>
              <select 
                className="w-full p-2 rounded-md border bg-background"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="customer">Customer</option>
                <option value="professional">Healthcare Professional (Doctor, Pharmacist, Nurse)</option>
                <option value="wholesaler">Wholesaler / Facility Sales Rep</option>
              </select>
            </div>

            {formData.role === 'professional' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-1">
                  <Label>Professional Type</Label>
                  <select 
                    className="w-full p-2 rounded-md border bg-background"
                    value={formData.professionalType}
                    onChange={(e) => setFormData({ ...formData, professionalType: e.target.value })}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="pharmacist">Pharmacist</option>
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                  </select>
                </div>
                <Input
                  placeholder="Professional Registration Number"
                  value={formData.regNumber}
                  onChange={(e) => setFormData({ ...formData, regNumber: e.target.value })}
                  required
                />
              </div>
            )}

            {formData.role === 'wholesaler' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <Input
                  placeholder="Facility / Company Name"
                  value={formData.facilityName}
                  onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })}
                  required
                />
                <Input
                  placeholder="Facility Address"
                  value={formData.facilityAddress}
                  onChange={(e) => setFormData({ ...formData, facilityAddress: e.target.value })}
                  required
                />
                <Input
                  placeholder="Facility Registration Number"
                  value={formData.facilityRegNumber}
                  onChange={(e) => setFormData({ ...formData, facilityRegNumber: e.target.value })}
                  required
                />
              </div>
            )}

            <DrawerFooter className="flex flex-row w-full gap-2 mt-2">
              <DrawerClose className='flex-1' asChild>
                <Button className='flex-1' variant="outline">Cancel</Button>
              </DrawerClose>
              <Button type="submit" className="flex-1 w-full">
                {editId ? 'Update' : 'Sign up'} →
              </Button>
            </DrawerFooter>
          </form>

          <div className="w-full my-2 flex flex-col gap-2">
            <form action={googleSignIn}>
              <Button
                className="border-2 border-primary relative w-full max-w-[300px] mx-auto flex items-center justify-center rounded-md h-10 font-medium gap-2"
                type="submit"
                variant='outline'
              >
                <FcGoogle className="h-4 w-4" />
                <span className="text-sm">Continue with Google</span>
              </Button>
            </form>
            <div className="max-w-[300px] mx-auto w-full my-2 rounded-md font-medium flex justify-center items-center">
              <Login />
            </div>
          </div>

        </DrawerContent>
      </Drawer>
    </div>
  )
}

export default Signup
