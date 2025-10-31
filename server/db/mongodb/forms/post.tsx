"use client"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import React, { FormEvent, useEffect, useRef, useState } from 'react'
import {serveraddr} from "@/data/env"
import placeholder from '@/assets/placeholderFemale.webp';

const AdminStockForm = (props: {method : string,}) => {
  const [details, setDetails] = useState({
    stock_name : "",
    cost : 0,
    price : 0,
    quantity : 0,
    category : "",
    file : "",
    message : "",
  })

  const [render, setRender] = useState(0);

  useEffect(() => {
  }, [render]);

  interface RefObject<T> {
    readonly current: T | null
  }

    const form = useRef<HTMLFormElement>(null);

    const addProduct =async (e : FormEvent) => {
      e.preventDefault();
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('stock_name', details.stock_name);
      formDataToSubmit.append('cost', `${details.cost}`);
      formDataToSubmit.append('price', `${details.price}`);
      formDataToSubmit.append('quantity', `${details.quantity}`);
      formDataToSubmit.append('category', details.category);
      formDataToSubmit.append('message', details.message);
      formDataToSubmit.append('file', details.file);

      const submitToServer =async ()=>{
        await fetch(`${serveraddr + "/api/v1/post/upload"}`, {
          //mode: 'no-cors',  mode: 'no-cores'   mode: 'cores'
          method: `${props.method}`,
          // headers: {
          //     "Content-Type": "application/json",
          // },
          body: formDataToSubmit,
          // body: JSON.stringify(form)
        })
        .then((response) => response.json())
        .then((data) => {form.current?.reset();  setRender((prevRender) => (prevRender++)); alert("stock successfully uploaded")})
        .catch((error) => console.error(error));
      }
      console.log(`about to send to server ${details}`)
      for (const [key, value] of formDataToSubmit.entries()) {
        console.log(key, value);
        if (key === 'file') {
          console.log('File is present in FormData');
        }
      }
      submitToServer()
    };


    const handleChange = (e : any)=>{
      const { name, value, files } = e.target;

      if (name === 'file') {
        setDetails((prevFormData) => ({ ...prevFormData, file: files[0] }));
      } else {
        setDetails((prevFormData) => ({ ...prevFormData, [name]: value }));
      }
    }

    
  return (
    <form ref={form  as RefObject<HTMLFormElement>} onSubmit={addProduct} className="flex flex-col gap-4 p-10 bg-secondary rounded-xl max-w-xl">
        <h3 className="text-xl text-accent mb-4 text-center font-semibold">Add product</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Input type="text" name='stock_name' onChange={handleChange} placeholder="name" className="rounded-sm bg-background" />
          <Input type="text" name="cost" onChange={handleChange} placeholder="cost" className="rounded-sm bg-background" />
          <Input type="text" name="price" onChange={handleChange} placeholder="price" className="rounded-sm bg-background" />
          <Input type="text" name='quantity' onChange={handleChange} placeholder="quantity" className="rounded-sm bg-background" />
        </div>
        <select name="category" value={details.category} onChange={handleChange} className='bg-secondary border-2 border-accent h-8 ring-1 rounded-sm ring-accent/30'>
                <option value="food"> Food </option>
                <option value="drink"> Drink</option>
                <option value="snacks"> Snacks </option>
                <option value="suplement"> Suplement</option>
        </select>
        <Textarea className="h-10" name="message"  onChange={handleChange} placeholder="Enter the product description" />
        <Label htmlFor="img">Product image:</Label>
        <Input name='file' onChange={handleChange} id="img" type="file" className="rounded-sm bg-background h-16" />
        <Button type="submit" className="before:ani-shadow">Submit</Button>
    </form>
  )
}

// const PostSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   prompt: { type: String, required: true },
//   photo: { type: String, required: true },
// });

export default AdminStockForm






