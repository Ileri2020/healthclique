"use client"
import { Button } from "@/components/ui/button"
import { cartActions } from "@/store/cart-slice"
import { useDispatch } from "react-redux"
import { Minus, Plus } from "lucide-react"


const Cartitem = (props:{name: string, price: number, qty: number, totalPrice: number, id: string, img: string}) => {
    // const img = stocks.stocks.find((stock)=>{
    //     return (stock.id = props.id)
    // })
    const dispatch = useDispatch()
    const subFromCart = (name : string, id : string, price : number) => {
      dispatch(
        cartActions.subFromCart({
          name,
          id,
          price,
        })
      )
    }

    const removeFromCart = (name : string, id : string, price : number) => {
      dispatch(
        cartActions.removeFromCart({
          name,
          id,
          price,
        })
      )
    }

    const cart = (name : string, id : string, price : number) => {
      dispatch(
        cartActions.addToCart({
          name,
          id,
          price,
        })
      )
    }

  return (
    <div className="h-36 flex flex-row w-full max-w-4xl /px-1 gap-2 bg-secondary rounded-sm mb-2">
      <div className="w-36 h-36 overflow-clip flex justify-center items-center"><img src={props.img} className="h-full" alt="" /></div>
      <div className="flex flex-col h-full w-full flex-1">
        <div className="flex flex-1 flex-row justify-between">
          <div className="h-full flex flex-col justify-between">
              <div className="text-2xl md:text-3xl font-semibold text-accent text-nowrap whitespace-nowrap /font-dance">{props.name}</div>
              <div>
                <div className="">Price: <span className="text-xl font-semibold text-foreground/80">₦ {props.price}</span></div>
                <div>Qty : <span className="text-xl">{props.qty}</span></div>
              </div>
              <div className="w-[130px] flex md:hidden flex-row justify-between mt-2 pb-2">
                <Button size="icon" className="text-3xl font-bold w-10 h-10 rounded-full" onClick={()=>cart(props.name, props.id, props.price)}><Plus className="h-4 w-4" /></Button>
                <Button size="icon" className="text-3xl font-bold w-10 h-10 rounded-full" onClick={()=>subFromCart(props.name, props.id, props.price)}><Minus className="h-4 w-4" /></Button>
                <Button size="icon" variant={"outline"} className="text-accent bg-transparent text-3xl font-bold w-10 h-10 rounded-full" onClick={()=>removeFromCart(props.name, props.id, props.price)}>x</Button></div>
          </div>
          <div className="h-full flex flex-col p-2 gap-1 justify-end relative">
            <div className="text-xl font-semibold text-center absolute top-2 right-3 whitespace-nowrap bg-secondary">₦ {props.totalPrice}</div>
            <div className="w-[130px] hidden md:flex flex-row justify-between mt-2">
              <Button size="icon" className="text-3xl font-bold w-10 h-10 rounded-full" onClick={()=>cart(props.name, props.id, props.price)}><Plus className="h-4 w-4" /></Button>
              <Button size="icon" className="text-3xl font-bold w-10 h-10 rounded-full" onClick={()=>subFromCart(props.name, props.id, props.price)}><Minus className="h-4 w-4" /></Button>
              <Button size="icon" variant={"outline"} className="text-accent bg-transparent text-3xl font-bold w-10 h-10 rounded-full" onClick={()=>removeFromCart(props.name, props.id, props.price)}>x</Button></div>
          </div>
        </div>
        <div>

        </div>
      </div>
    </div>
  )
}

export default Cartitem
