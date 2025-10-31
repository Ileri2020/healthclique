import * as React from "react"
import Autoplay from "embla-carousel-autoplay"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Cartitem from './cartitem';
import { Button } from "@/components/ui/button";
import { useDispatch } from "react-redux";
import { cartActions } from "@/store/cart-slice";
import Link from "next/link";
// import { useRouter } from "next/router";
import { CiShoppingCart, } from "react-icons/ci"

type stockCategory = {
  _id: string;
  name: string;
  description: string;
  img: string;
  price: number;
  cost: number;
  qty: number;
  __v: number;
};

export default function Similar(props: {similar : stockCategory[]}) {
  const plugin = React.useRef(
    Autoplay({ delay: 2000, stopOnInteraction: true })
  )

  const dispatch = useDispatch()
  // const navigate = useRouter()

  const cart = (name : string, id : string, price : number, img : any) => {
    dispatch(
      cartActions.addToCart({
        name,
        id,
        price,
        img,
      })
    )
   // console.log(cartItems)
  }
  
  const similar = props.similar.slice().sort(()=>Math.random()-0.5)

  React.useEffect(()=>{}, [similar])

  return (
    <Carousel
      plugins={[plugin.current]}
      className="w-full max-w-[600px] lg:max-w-[850px] xl:max-w-[1000px] /max-h-[70vh] mx-auto mt-10"
      //onMouseEnter={plugin.current.stop}
      //onMouseLeave={plugin.current.reset}
      opts={{loop : true}}
      orientation="horizontal"
    >
      <CarouselContent className="">
      {similar.map((stock, index)=>{
          return(
            <CarouselItem key={index} className="basis-1/3 md:basis-1/5 lg:basis-1/7 flex flex-col overflow-clip justify-center items-center w-full ml-2 /bg-green-500">
            {/* <div className="flex flex-col text-nowrap items-center max-w-[240px] justify-between">
              <div className="w-full aspect-square"><img src={item.uri} alt="" /></div>
              <div className="text-base /xl:text-lg text-wrap text-center my-5 max-h-[100px] overflow-hidden">{item.testimony}</div>
              <div className="text-lg font-semibold">{item.name}</div>
              <div className="font-semibold text-secondary-foreground mb-5">{item.salutation}</div>
            </div> */}
              <Link href={`/store/${stock._id}`}>
                <div className="h-[100px] w-full mx-2 md:mx-0 flex justify-center items-center">
                    <img src={stock.img} alt="" className="h-full rounded-sm"/>
                </div>
              </Link>
              
              <div className="flex flex-1 flex-col text-center justify-center items-center w-full /bg-red-500">
                  <Link href={`/store/${stock._id}`}>
                    <div className="w-full text-center flex flex-col justify-center items-center">
                      <div className="font-semibold text-sm">{stock.name}</div>
                      <div className="font-semibold text-foreground/80 text-sm">₦ {stock.price}</div>
                    </div>
                  </Link>
                  <div className="flex flex-row w-full max-w-[100px] gap-1">
                      {/* <Link to={`/store/${stock.id}`}><Button className="rounded-lg flex-1 w-full font-semibold text-background hover:bg-accent/10 hover:border-2 hover:border-accent hover:text-accent">view</Button></Link> */}
                      <Button onClick={() => cart(stock.name, stock._id, stock.price, stock.img)} variant={"outline"} className="rounded-lg flex-1 w-full h-6 font-semibold text-accent-secondary border-accent-secondary hover:bg-accent-secondary/60 hover:text-background border-2"><CiShoppingCart /></Button>
                  </div>
              </div>
            </CarouselItem>
          )
        })}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}
