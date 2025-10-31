"use client"
// import { Button } from "@/components/ui/button"
import { CiShoppingCart, } from "react-icons/ci"
import { useSelector, useDispatch } from "react-redux"
import { cartActions } from "@/store/cart-slice"
import { RootState } from "@/store"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { motion, useInView, useAnimation } from "framer-motion"

const Gallery = () => {

  const ref = useRef(null)
  const isInView = useInView(ref, {once: true})

  useEffect(() => {
    console.log(isInView)
  }, [isInView])

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
  
  const [data, setData] = useState<stockCategory[]>([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // const cartItems = useSelector((state : RootState)=>state.cart.itemsList)
  const dispatch = useDispatch();
  const cart = (name : string, id : string, price : number, img : string) => {
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

  useEffect(() => {
    fetch(`/api/data/stock?limit=10`)
      .then(response => response.json())
      .then(data => data.slice().sort(()=>Math.random()-0.5))
      .then(data => {
        setData(data);
        // data.forEach((obj : any) => {
        //   console.log(obj._id, obj.name, obj.price);
        // });
        setLoading(false);
      })
      .catch(error => {
        setError(error);
        alert("unable to connect to server please check your network connection");
        setLoading(true);
      });
  }, []);

if (loading) {
  return <p>Loading...</p>;
}

// if (error) {
//   return <p>Error: {error}</p>;
// }

  return (
    <section className="w-full max-w-[1000px] overflow-clip">
      <div ref={ref} className="flex flex-col w-full gap-5">
        {data.map((stock, index)=>{
          return (
            <div className="flex flex-col md:flex-row /bg-accent-secondary/5 w-full items-center md:items-start md:justify-between" key={index}>
              <div className={`${(index % 2) ? "md:order-2" : ""} w-[350px] h-[350px] contain-content flex justify-center items-center`}>
                <img src={stock.img} alt="" className="h-full w-auto rounded-sm" />
              </div>
              <div className="flex flex-col flex-1 /justify-between items-center text-center p-5 max-w-md md:self-end">
                <div className="flex flex-1 flex-col justify-center items-center">
                  <div className="text-lg font-semibold text-accent">{stock.name}</div>
                  <div className="text-2xl font-dance max-h-32 md:max-h-none overflow-auto md:overscroll-none hi">{stock.description}</div>
                </div>
                <Button onClick={() => cart(stock.name, stock._id, stock.price, stock.img)} className="relative max-w-[220px] text-3xl //text-accent border-2 font-semibold rounded-md px-20  hover:bg-accent/10 hover:border-2 hover:border-accent hover:text-accent"><CiShoppingCart /></Button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default Gallery
