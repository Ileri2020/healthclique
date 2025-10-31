"use client"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import React, { FormEvent, useEffect, useRef, useState } from 'react'
import {serveraddr} from "@/data/env"
import placeholder from '@/assets/placeholderFemale.webp';
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

import {
  ColumnDef,
} from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const StockForm = (props: {method : string,}) => {
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
      const formData = new FormData();
      formData.append('stock_name', details.stock_name);
      formData.append('cost', `${details.cost}`);
      formData.append('price', `${details.price}`);
      formData.append('quantity', `${details.quantity}`);
      formData.append('category', details.category);
      formData.append('message', details.message);
      formData.append('file', details.file);

      const submitToServer =async ()=>{
        await fetch("/api/data/stock", {
          //mode: 'no-cors',  mode: 'no-cores'   mode: 'cores'
          method:  `${props.method}`,  //'POST',
          // headers: {
          //     "Content-Type": "application/json",
          // },
          body: formData,
          // body: JSON.stringify(form)
        })
        .then((response) => response.json())
        .then((data) => {form.current?.reset();  setRender((prevRender) => (prevRender++)); alert("stock successfully uploaded")})
        .catch((error) => console.error(error));
      }
      console.log(`about to send to server ${details}`)
      for (const [key, value] of formData.entries()) {
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
    <div className='inline'>
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline">{props.method}</Button>
        </DrawerTrigger>
        <DrawerContent className='flex flex-col justify-center items-center py-5 /bg-red-500 max-w-5xl mx-auto'>
          <form ref={form  as RefObject<HTMLFormElement>} onSubmit={addProduct} className="flex flex-col gap-4 p-5 my-1 bg-secondary rounded-xl max-w-xl">
          <DrawerHeader>
            <DrawerTitle className="text-xl /text-accent mb-2 text-center font-semibold">{props.method} Stock from <span className='text-accent'>Succo</span></DrawerTitle>
            <DrawerDescription></DrawerDescription>
          </DrawerHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Input type="text" name='stock_name' onChange={handleChange} placeholder="name" className="rounded-sm bg-background" />
          <Input type="text" name="cost" onChange={handleChange} placeholder="cost" className="rounded-sm bg-background" />
          <Input type="text" name="price" onChange={handleChange} placeholder="price" className="rounded-sm bg-background" />
          <Input type="text" name='quantity' onChange={handleChange} placeholder="quantity" className="rounded-sm bg-background" />
        </div>
        <select name="category" value={details.category} onChange={handleChange} className='bg-secondary border-2 border-border ring-1 rounded-sm ring-accent/30 h-8'>
                <option value="food"> Food </option>
                <option value="drink"> Drink</option>
                <option value="snacks"> Snacks </option>
                <option value="suplement"> Suplement</option>
        </select>
        <Textarea className="h-10" name="message"  onChange={handleChange} placeholder="Enter the product description" />
        <Label htmlFor="img">Product image:</Label>
        <Input name='file' onChange={handleChange} id="img" type="file" className="rounded-sm bg-background h-16" />
        <DrawerFooter className="flex flex-row w-full gap-2 mt-2">
          {/* <Button>Submit</Button> */}
          <DrawerClose className='flex-1' asChild>
            <Button className='flex-1' variant="outline">Cancel</Button>
          </DrawerClose>
          <Button type="submit" className="flex-1 before:ani-shadow w-full">Submit</Button>
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

// const StocksSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   description: { type: String, required: true },
//   img: { type: String, required: true },
//   category: { type:String, enum: ['food', 'drink', 'snacks', 'suplement'], required: true },
//   cost: {type: Number, required: true },
//   price: {type: Number, required: true },
//   qty: {type: Number},
// });

export default StockForm






export type stock = {
  _id: string
  name: string
  description: string
  img: string
  price: number
  cost: number
  category: "food" | "drink" | "snacks" | "suplement"
  qty: number
}

export const StockColumns: ColumnDef<stock>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() 
          // ||
          // (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="lowercase">{row.getValue("name")}</div>,
  },
  // {
  //   accessorKey: "description",
  //   header: "Description",
  //   cell: ({ row }) => (
  //     <div className="capitalize">{row.getValue("description")}</div>
  //   ),
  // },
  {
    accessorKey: "img",
    header: "Image",
    cell: ({ row }) => (
      <img src={row.getValue("img")} className="h-10 /max-w-10" />
    ),
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("price"))

      // Format the amount as a dollar amount
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "cost",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Cost
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("cost"))

      // Format the amount as a dollar amount
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Category
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="lowercase">{row.getValue("category")}</div>,
  },
  {
    accessorKey: "qty",
    header: "Quantity",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("qty")}</div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const stock = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(stock._id)}
            >
              Copy stock ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View stock</DropdownMenuItem>
            <DropdownMenuItem>View stock details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
