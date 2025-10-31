import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer } from "recharts"

import { Button } from "@/components/ui/button"
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
import { useSelector } from "react-redux"
import { RootState } from "@/store"
import { Input } from "../ui/input"
import { useState } from "react"




export function BookDrawer(props : {cart: any}) {
  let total = 0
  let qty = 0

  props.cart.forEach((item)=>{ total = total + item.totalPrice})
  props.cart.forEach((item)=>{ qty = qty + item.quantity})

  const productsIdQty = props.cart.map(item => ({ _id: item.id, quantity: item.quantity }));

  const cartSale = {
    products : productsIdQty,
    totalSale : total,
    totalQty : qty,
    status : "pending",
    paymentStatus : "unpaid"
  }
  console.log(cartSale)

  const saveCart =async () => {
    //before saving modify the sale data, set it to payment not made, try adding time field to the sale data, set transaction id to null

    const submitToServer =async ()=>{
      await fetch("/api/data/sale", {
        //mode: 'no-cors',  mode: 'no-cores'   mode: 'cores'
        method: "POST",
        // headers: {
        //     "Content-Type": "application/json",
        // },
        body: JSON.stringify(cartSale),
        // body: JSON.stringify(form)
      })
      .then((response) => response.json())
      .then((data) => {
        // emptyCart({
        //   username : "",
        //   email : "",
        //   emailto : "",
        //   category : "",
        //   message : "",
        // }); 
      alert("Cart successfully saved")})
      .catch((error) => console.error(error));
    }
    console.log(`about to send to server ${props.cart}`)
    
    submitToServer()
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Book</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Book your order</DrawerTitle>
            <DrawerDescription>Your order will be saved till when you are ready to make a purchase.</DrawerDescription>
          </DrawerHeader>
          <div>
              <div>Input a name for this cart</div>
              <Input type="text" className="w-40" />
            </div>
          <DrawerFooter>
            {/* <Button>Book</Button> */}
            <DrawerClose asChild>
              <Button variant="outline" onClick={saveCart}>Book</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}


