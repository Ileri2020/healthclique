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

const SaleForm = (props: {method : string,}) => {
  const [details, setDetails] = useState({
    product : "",
    coupon : "",
    paymentStatus : "",
    paymentMethod : "",
    status : "",
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

      const sale = {}

      const submitToServer =async ()=>{
        await fetch(`${serveraddr + "/api/v1/post/upload"}`, {
          //mode: 'no-cors',  mode: 'no-cores'   mode: 'cores'
          method: `${props.method}`,
          // headers: {
          //     "Content-Type": "application/json",
          // },
          body: JSON.stringify(sale),
          // body: JSON.stringify(form)
        })
        .then((response) => response.json())
        .then((data) => {form.current?.reset();  setRender((prevRender) => (prevRender++)); alert("stock successfully uploaded")})
        .catch((error) => console.error(error));
      }
      console.log(`about to send to server ${details}`)
      
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
            <DrawerTitle className="text-xl /text-accent mb-4 text-center font-semibold">{props.method} Sale from <span className='text-accent'>Succo</span></DrawerTitle>
            <DrawerDescription></DrawerDescription>
          </DrawerHeader>
        <div className="flex flex-col gap-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input type="text" id='product' name='product' onChange={handleChange} placeholder="add item" className="rounded-sm bg-background w-56" />
              
                <Input type="text" id="coupon" name="coupon" onChange={handleChange} placeholder="coupon code" className="rounded-sm bg-background w-56" />
            </div> 
            <select name="paymentStatus" value={details.paymentStatus} onChange={handleChange} className='bg-secondary border-2 border-border ring-1 rounded-sm ring-accent/30 h-8'>
                <option value="paid"> Paid </option>
                <option value="unpaid"> Unpaid</option>
          </select>
          <select name="paymentMethod" value={details.paymentMethod} onChange={handleChange} className='bg-secondary border-2 border-border h-8 ring-1 rounded-sm ring-accent/30'>
                  <option value="gateway"> Gateway </option>
                  <option value="Transfer"> Transfer</option>
                  <option value="Cash"> Cash </option>
                  <option value="Expense">Expense</option>
          </select>
          <select name="status" value={details.status} onChange={handleChange} className='bg-secondary border-2 border-border ring-1 rounded-sm ring-accent/30 h-8'>
                  <option value="pending"> Pending </option>
                  <option value="shipped"> Shipped</option>
                  <option value="delivered"> Delivered </option>
                  <option value="cancelled"> Cancelled'</option>
          </select>
          <DrawerFooter className="flex flex-row w-full gap-2 mt-2">
            {/* <Button>Submit</Button> */}
            <DrawerClose className='flex-1' asChild>
              <Button className='flex-1' variant="outline">Cancel</Button>
            </DrawerClose>
            <Button type="submit" className="flex-1 before:ani-shadow w-full">Submit</Button>
          </DrawerFooter>
        </div>
        <div className="flex flex-col">
          <div>map of chosen products quantity and price</div>
          <div>total cost</div>
          <div>cost after discount</div>
        </div>
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

// const SalesSchema = new mongoose.Schema({
//   products: [
//       {
//         productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Products' },
//         productQuantity: { type: Number, required: true },
//         productPrice: { type: Number, required: true },
//         productCost: {type: Number, required: true },
//       }
//   ],
    // coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
    // discount: {type: Number, required: true },
//   totalCost: {type: Number, required: true },
//   totalSale: {type: Number, required: true },
//   totalQty: {type: Number},
//      status: { type: String, enum: ['pending', 'shipped', 'delivered', 'cancelled'] },
//     paymentMethod: { type: String},
//     paymentStatus: { type: String, enum: ['paid', 'unpaid'] },
// });

export default SaleForm





export type sale = {
  _id: string
  totalCost: number
  totalSale: number
  totalQty: number
  status: "pending" | "shipped" | "delivered" | "cancelled"
  paymentMethod: string
  paymentStatus: "paid" | "unpaid"
}

export const SaleColumns: ColumnDef<sale>[] = [
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
    accessorKey: "totalCost",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total Cost
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("totalCost"))

      // Format the amount as a dollar amount
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "totalSale",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total Sale
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("totalSale"))

      // Format the amount as a dollar amount
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "totalQty",
    header: "Total Quantity",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("totalQty")}</div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="/lowercase">{row.getValue("status")}</div>,
  },
  {
    accessorKey: "paymentMethod",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Payment Method
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="/lowercase">{row.getValue("paymentMethod")}</div>,
  },
  {
    accessorKey: "paymentStatus",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Payment Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="/lowercase">{row.getValue("paymentStatus")}</div>,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const sale = row.original

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
              onClick={() => navigator.clipboard.writeText(sale._id)}
            >
              Copy Sale ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View Sale</DropdownMenuItem>
            <DropdownMenuItem>View Sale details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
