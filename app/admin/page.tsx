"use client"
import { motion } from "framer-motion"
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { cartActions } from "@/store/cart-slice";
import  { UserColumns } from "@/server/db/mongodb/forms/user";
// import StockForm, { StockColumns } from "@/server/db/mongodb/forms/stock";
import SaleForm, { SaleColumns } from "@/server/db/mongodb/forms/sales";
// import { Button} from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Textarea } from "@/components/ui/textarea"
// import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { useRef } from "react";
// import { Label } from "@/components/ui/label"
import ReviewForm from '../../server/db/mongodb/forms/review';
import RefundForm from '../../server/db/mongodb/forms/refund';
import PaymentForm from '../../server/db/mongodb/forms/payment';
import NotificationForm from '../../server/db/mongodb/forms/notification';
import CouponForm from '../../server/db/mongodb/forms/coupon';
import CartForm from '../../server/db/mongodb/forms/cart';
import AddressForm from '../../server/db/mongodb/forms/address';
import { DataTableDemo } from "@/components/myComponents/subs/datatable";
// import { forms } from "@/server/db/mongodb/forms/index.tsx";
import { ChartComponent } from '../../components/myUI/charts';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ArrowUp, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import UserForm from "@/prisma/forms/UserForm";
import ProductForm from "@/prisma/forms/ProductForm";
import CategoryForm from "@/prisma/forms/CategoryForm";
import StockForm from "@/prisma/forms/StockForm";
import FeaturedProductForm from "@/prisma/forms/FeaturedProductForm";

// const forms = [
//   {
//       model : "User",
//       form : UserForm,
//       column : UserColumns,
//   },
//   {
//       model : "Stock",
//       form : StockForm,
//       column : StockColumns,
//   },
//   {
//       model : "Sale",
//       form : SaleForm,
//       column : SaleColumns,
//   },
//   {
//       model : "Review",
//       form : ReviewForm,
//       column : "",
//   },
//   {
//       model : "Refund",
//       form : RefundForm,
//       column : "",
//   },
//   {
//       model : "Payment",
//       form : PaymentForm,
//       column : "",
//   },
//   {
//       model : "Notification",
//       form : NotificationForm,
//       column : "",
//   },
//   {
//       model : "Coupon",
//       form : CouponForm,
//       column : "",
//   },
//   {
//       model : "Cart",
//       form : CartForm,
//       column : "",
//   },
//   {
//       model : "Address",
//       form : AddressForm,
//       column : "",
//   },
// ]

const Admin = () => {
  const [data, setData] = useState<any[]>([]);
  // const [columns, setColumns] = useState<any[]>(StockColumns );
  // const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // useEffect(() => {
  //   fetch(`/api/data/stock?limit=10}`)
  //     .then(response => response.json())
  //     .then(data => data.slice().sort(()=>Math.random()-0.5))
  //     .then(data => {
  //       setData(data);
  //       // data.forEach((obj : any) => {
  //       //   console.log(obj._id, obj.name, obj.price);
  //       // });
  //       setLoading(false);
  //     })
  //     .catch(error => {
  //       // setError(error);
  //       alert("unable to connect to server please check your network connection");
  //       setLoading(true);
  //     });
  // }, [columns]);//data, 

  // const cartItems = useSelector((state : RootState)=>state.cart.itemsList)
  // const dispatch = useDispatch();
  // const cart = (name : string, id : number, price : number) => {
  //   dispatch(
  //     cartActions.addToCart({
  //       name,
  //       id,
  //       price,
  //     })
  //   )
  //   console.log(cartItems)
  // }

  // const Model = (props : { name: string, formComponent: any, dataColumn: any}) => {
  //   return(
  //     <div onClick={()=>{setColumns(props.dataColumn)}} className={`${props.dataColumn === columns && "border-accent border-2 bg-secondary/60"} bg-secondary max-w-full rounded-sm my-1 p-2 flex flex-col gap-2 transition-all`}>
  //       <div className="flex flex-row justify-between items-center w-full">
  //         <div className="text-xl text-blue-600 font-semibold">{props.name}</div>
  //         <div className="/flex-1 text-5xl font-semibold text-outline-positive text-background /text-nowrap whitespace-nowrap px-2">20 <span className="text-green-500 inline font-extrabold whitespace-nowrap text-outline-none">+</span></div>
  //       </div>
  //       <div className="flex flex-row justify-between items-center gap-2">
  //         <div className="flex flex-row gap-3">
  //           <div className="bg-blue-400 rounded-full">{<props.formComponent method="GET" />}</div>
  //           <div className="bg-green-500 rounded-full">{<props.formComponent method="POST" />}</div>
  //           <div className="bg-yellow-300 rounded-full">{<props.formComponent method="PUT" />}</div>
  //           <div className="bg-red-500 rounded-full">{<props.formComponent method="DELETE" />}</div>
  //         </div>
  //         {/* <div className="text-sm">placeholder</div> */}
  //       </div>
  //     </div>
  //   )
  // }


  return (
    <motion.section
      initial = {{ opacity: 0 }}
      animate = {{
        opacity : 1,
        transition : { delay: 0.5, duration: 0.6, ease: "easeIn"}
      }}
      className="w-[100vw] overflow-clip gap-3"
    >
      <div className="text-4xl font-semibold w-full text-center">Admin Dashboard</div>

      {/* <ResizablePanelGroup
        direction="horizontal"
        className="w-full max-w-5xl mx-auto rounded-lg border"
      >
        <ResizablePanel defaultSize={50}>
          <div className="flex flex-col gap-2 /mx-auto p-2 max-w-xl">
            {forms.map((item, key) => {
              return(<Model key={key} name={item.model} formComponent={item.form} dataColumn={item.column} />)
            })}
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={100}>
          <div className="flex-col flex-1 justify-center items-center gap-5">
            { loading ? <p>Loading...</p> : <DataTableDemo data={data} columns={columns} />}
            <ChartComponent />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup> */}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-5">
        <UserForm />
        <ProductForm />
        <CategoryForm />
        <StockForm />
        <FeaturedProductForm />
      </div>
      
    <div>place the models list in a sidebar ,forms for stocks, coupons, notification, reviews and users</div>
      <div>List of database tables entries and their form on click</div>
      <div>charts of current sales/revenue</div>
      <div>charts of current profit</div>
      <div>charts of current cost</div>
      <div>profit</div>
      <div>total revenue</div>
    </motion.section>
  )
}

export default Admin
