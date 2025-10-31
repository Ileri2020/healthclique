"use client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useParams } from "next/navigation"
// import { useRouter } from 'next/router'
import { useEffect, useState } from "react"
import stocks from "@/data/stocks"
import { useDispatch } from 'react-redux';
import { cartActions } from "@/store/cart-slice"
import Similar from "@/components/myComponents/subs/similar"

const Description = () => {
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
  const [stock, setStock] = useState<stockCategory | null>(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  let { id } = useParams()

  useEffect(() => {
    fetch(`/api/data/stock?limit=10`)
      .then(response => response.json())
      .then(data => data.slice().sort(()=>Math.random()-0.5))
      .then(data => {
        setData(data);
        setStock(data.find((item : stockCategory)=>{return(`${item._id}` == id)}))
        setLoading(false);
      })
      .catch(error => {
        alert(`unable to connect to server please check your network connection`);
        console.log(error)
        setLoading(false);
        setError(error);
      });
  }, []);

if (loading) {
  return (<div>Loading...</div>);
}

// if (error) {
//   return (<div>Error: {error}</div>);
// }

  //const cartItems = useSelector((state : RootState)=>state.cart.itemsList)
  const dispatch = useDispatch();

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
  
  return (
    <motion.section
      initial = {{ opacity: 0 }}
      animate = {{
        opacity : 1,
        transition : { delay: 0.5, duration: 0.6, ease: "easeIn"}
      }}
      className="w-[100vw] overflow-clip"
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-col md:flex-row w-full max-w-4xl mx-auto md:h-[320px]">
          <div className="w-[100%] h-[100vw] max-w-[320px] max-h-[320px] flex justify-center items-center mx-auto"><img className="h-full w-auto" src={stock?.img!} alt="" /></div>
          <div className="h-full flex flex-none md:flex-1 flex-col justify-end m-5">
            <div className="text-xl md:text-2xl font-semibold text-center md:text-start">{stock?.name}</div>
            <div className="flex flex-col md:flex-row md:justify-between">
              <div className="text-xl text-foreground/80 text-end md:text-start">₦ {stock?.price}</div>
              <div className="flex flex-row mb-5 /mx-5"><Button onClick={()=>cart(stock?.name!, stock?._id!, stock?.price!, stock?.img!)} className="rounded-md text-lg font-semibold w-64 md:w-20">cart</Button></div>
            </div>
            <div className="px-2 text-center md:text-start">{stock?.description}</div>
          </div>
        </div>
        {/* send data object to similar carousel as props */}
        <div>
          <div><Similar similar={data} /></div>
        </div>
      </div>
    </motion.section>
  )
}

export default Description
