import * as React from "react"

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


export function Booked() {
  const cartItems = useSelector((state : RootState)=>state.cart.itemsList)

  let total = 0

  cartItems.forEach((item)=>{ total = total + item.totalPrice})


  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Booked</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Booked Orders</DrawerTitle>
            <DrawerDescription>click an order to view what it contains</DrawerDescription>
          </DrawerHeader>
          <div>
            list of saved orders from server
          </div>
          <DrawerFooter>
            <Button>Submit</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
