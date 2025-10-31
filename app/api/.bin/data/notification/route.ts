
import { NextRequest, NextResponse } from 'next/server';
import Sale from "@/server/db/mongodb/models/sales";
import connect from "@/server/config/mongodb";
import { Types } from "mongoose";
import { SaleColumns } from "@/server/db/mongodb/forms/sales";
import Notification from "@/server/db/mongodb/models/notifications";
import User from "@/server/db/mongodb/models/users";



export const GET = async (req: Request) => { //, res: NextApiResponse
  try {
    const {searchParams} = new URL(req.url)
    const limit = searchParams.get("limit")
    const category = searchParams.get("category")//advert, all, etc
    const dateFrom = searchParams.get("from") //yet to be used
    const dateTo = searchParams.get("to")

    console.log(limit, category)

  if (!dateFrom && !dateTo || limit){
    return new NextResponse(
      JSON.stringify({ message: "invalid credentials"}),
      { status: 400}
    )
  }

  await connect()

  let message    

  try {
      if(!category){
        message = await Notification.find().limit(parseInt(limit))
      }else{
        message = await Notification.find({ category : category }).limit(parseInt(limit))
      }
  } catch (error) {
      // users = mongoose.model('users', userSchema)
      console.log("unable to get user from database")
  }


    return new NextResponse(JSON.stringify(message), {status: 200});
  } catch (error) {
    return new NextResponse(JSON.stringify({error: error.message}), {status: 500});
  }
};

export const POST = async (req: NextRequest) => {
  try{
    const {email, emailto, category, message, username} = await req.json()
    await connect();
    if (!email && !emailto && !category) {
      return new NextResponse(JSON.stringify({message : "error handling cart items"}), {status: 400})
    }
    const sender = await User.findOne({ email })
    const receiver = await User.findOne({ emailto })
    if (!sender && !receiver) {
      return new NextResponse(JSON.stringify({message : "invalid user or recipient"}), {status: 400})
    }
    // const sale = new Sale(body)
    // await sale.save()
    let newMessage
    const postMessage = async () => {
      console.log("about to create message in database")
      
        try{
          newMessage = await Notification.create({
            from: sender._id,
            to: receiver._id,
            category: category,
            message: message,
            read: false,
          })
        }catch(error){console.log("message creation error :",error)}
        return newMessage
    }

    postMessage()

    console.log(sender, receiver, category, message, newMessage)

    return new NextResponse(JSON.stringify({message : newMessage}), {status: 200})
  } catch (error) {
    return new NextResponse(JSON.stringify({error : error}), {status: 500})
  }
}


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





