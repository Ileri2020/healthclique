
import { NextRequest, NextResponse } from 'next/server';
import Sale from "@/server/db/mongodb/models/sales";
import connect from "@/server/config/mongodb";
import { Types } from "mongoose";
import { SaleColumns } from "@/server/db/mongodb/forms/sales";


export const GET = async (req: Request) => { //, res: NextApiResponse
  try {
    const {searchParams} = new URL(req.url)
    const limit = searchParams.get("limit")
    const dateFrom = searchParams.get("from")
    const dateTo = searchParams.get("to")
    const id = searchParams.get("id")

    console.log(limit, dateFrom, dateTo, id)
    // if (!limit || !category){
    //   return new NextResponse(
    //     JSON.stringify({ message: "invalid credentials"}),
    //     { status: 400}
    //   )
    // }

  //   const userData = await fetchUserDataFromDatabase(userId);

  await connect()

  let sales    

  try {
      if(!id){
        sales = await Sale.find().limit(parseInt(limit))
      }else{
        sales = await Sale.find({ dateFrom : dateFrom }).limit(parseInt(limit))//date to use ai for the query
      }
  } catch (error) {
      // users = mongoose.model('users', userSchema)
      console.log("unable to get user from database")
  }


    return new NextResponse(JSON.stringify(sales), {status: 200});
  } catch (error) {
    return new NextResponse(JSON.stringify({error: error.message}), {status: 500});
  }
};

export const POST = async (req: NextRequest) => {
  try{
    const body =await req.json()
    await connect();
    if (!body.products && !body.status && !body.paymentStatus) {
      return new NextResponse(JSON.stringify({message : "error handling cart items"}), {status: 400})
  }
    // const sale = new Sale(body)
    // await sale.save()

     const postSale = async () => {
      let newSale
        try{
            newSale = await Sale.create({
            products: body.products,
            totalSale: body.totalSale,
            totalQty: body.totalQty,
            status: body.status,
            paymentStatus: body.paymentStatus,
          })
        }catch(error){console.log(error)}
        return newSale
    }
    const sale = postSale()
    console.log(body)
    return new NextResponse(JSON.stringify({message : sale}), {status: 200})
  } catch (error) {
    return new NextResponse(JSON.stringify({error : error}), {status: 500})
  }
}

// {
//   id: '6721e30e01905a916e1ac3b4',
//   price: 600,
//   quantity: 1,
//   totalPrice: 600,
//   name: 'Malta Guinness',
//   img: 'https://res.cloudinary.com/dc5khnuiu/image/upload/v1730274064/succo/img/stocks/uiyelqtw8ohmzcgxpjh3.jpg'
// }

export const PATCH = async (req: Request) => {
  try{
    const body =await req.json()
    const { name, cost, price, quantity, id, image, category, description } = body
    await connect();
    if (!id){
      return new NextResponse(
        JSON.stringify({ message: "invalid credentials"}),
        { status: 400}
      )
    }
    if (!Types.ObjectId.isValid(id)){
      return new NextResponse(
        JSON.stringify({ message: "invalid id"}),
        { status: 400}
      )
    }
    const stock = {
      name: name,
      description: description,
      img: image,
      category: category,
      cost: cost,
      price: price,
      qty: quantity,
    }

    // Remove undefined fields from updates
    const saleArray = Object.fromEntries(
      Object.entries(stock).filter(([key, value]) => value !== undefined)
    );

    // Update user document
    let sale = new Sale()
    // Object.assign(Sale, saleArray);
    Object.assign(sale, saleArray);

    // const update = await SaleColumns.findById(`${id}`)

    const updatedStock = await sale.save();

    // const updatedUser = await Stock.findOneAndUpdate(
    //   {_id: new Types.ObjectId(id)},  //new ObjectId(userId)
    //   {username: newUsername},
    //   {new: true},
    // )

    if(!updatedStock){
      return new NextResponse(JSON.stringify({message : "stock not found"}), {status: 400})
    }
    return new NextResponse(JSON.stringify({message : "stock updated", stockr: updatedStock}), {status: 200})
  } catch (error) {
    return new NextResponse(JSON.stringify({error : error}), {status: 500})
  }
}

export const DELETE = async (req: Request) => {
  try{
    const {searchParams} = new URL(req.url)
    const id = searchParams.get("id")
    if (!id){
      return new NextResponse(
        JSON.stringify({ message: "input your user id"}),
        { status: 400}
      )
    }
    if (!Types.ObjectId.isValid(id)){
      return new NextResponse(
        JSON.stringify({ message: "invalid id"}),
        { status: 400}
      )
    }
    await connect();
    const deletedSale = await Sale.findByIdAndDelete(
      new Types.ObjectId(id)
    )
    if (!deletedSale){
      return new NextResponse(
        JSON.stringify({ message: "stock not found"}),
        { status: 400}
      )
    }
    return new NextResponse(JSON.stringify({message : "sale deleted"}), {status: 200})
  } catch (error) {
    return new NextResponse(JSON.stringify({error : error}), {status: 500})
  }
}


















// export const config = {
//     api : {
//         bodyParser : false,
//     }
// }



// const router = nc({ //{ attachParams: true }
//     onError(error: { message: any }, req: NextApiRequest, res: NextApiResponse) {
//       res
//         .status(501)
//         .json({ error: `Sorry something Happened! ${error.message}` });
//     },
//     onNoMatch(req: NextApiRequest, res: NextApiResponse) {
//       res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
//     }
//   })

// export const router = createRouter()

// const multerMiddleWare = uploadimg.single("file")

// router.use(multerMiddleWare)

// router.post(async (req : Request, res ) => { // req: NextApiRequest & { url: string }, res: NextApiResponse
//     console.log("file", req.file)
//     console.log("body", req.body)
//     return new NextResponse(
//         JSON.stringify({ message: "file uploaded"}),
//         { status: 200}
//       )
// })





