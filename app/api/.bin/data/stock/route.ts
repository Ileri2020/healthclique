// import nc from "next-connect"
// import { createRouter } from "next-connect"
// import { uploadimg } from "@/server/config/multersetup"
import { NextRequest, NextResponse } from 'next/server';
import Stock from "@/server/db/mongodb/models/stocks"
// import { join } from "path";
// import { writeFile } from "fs";
import { buffer } from "stream/consumers";
// import glob from "glob";
import connect from "@/server/config/mongodb";
import { Types } from "mongoose";
import uploadCloudinary from '@/server/config/cloudinary';


export const GET = async (req: Request) => { //, res: NextApiResponse
  try {
    const {searchParams} = new URL(req.url)
    const limit = searchParams.get("limit")
    const category = searchParams.get("category")
    console.log(limit, category)
    // if (!limit || !category){
    //   return new NextResponse(
    //     JSON.stringify({ message: "invalid credentials"}),
    //     { status: 400}
    //   )
    // }

  //   const userData = await fetchUserDataFromDatabase(userId);

  await connect()

  let stocks    

  try {
      if(!category){
        stocks = await Stock.find().limit(parseInt(limit))
      }else{
        stocks = await Stock.find({ category : category }).limit(parseInt(limit))
      }
  } catch (error) {
      // users = mongoose.model('users', userSchema)
      console.log("unable to get user from database")
  }


    return new NextResponse(JSON.stringify(stocks), {status: 200});
  } catch (error) {
    return new NextResponse(JSON.stringify({error: error.message}), {status: 500});
  }
};

export const POST = async (req: NextRequest) => {
  try{
    const form : any =await req.formData()
      const stock_name = form.get("stock_name")
      const cost = form.get("cost")
      const price = form.get("price")
      const quantity = form.get("quantity")
      const category = form.get("category")
      const message = form.get("message")
      const image = form.get("file")

      if (!image) {
      throw {message : "image of stock missing", status : "error"}
    }

    const imageBytes = await image.arrayBuffer()
    const file = Buffer.from(imageBytes)

      if (!stock_name && !cost && !price && !quantity && !category && !message && !file) {
          return new NextResponse(JSON.stringify({message : "incomplete fields inputed"}), {status: 400})
      }

      // const path = join("C:\Users\Ololade\Desktop\portfolio\next-temp-app\app\public","buffer", form.get("file").name)
      // // const path = join("\c","buffer", form.get("file").name)
      // await writeFile(path, file, ()=>{console.log(`file written to ${path}`)})

     const postStock = async () => {
        const uploaded : any = await uploadCloudinary(file, "/succo/img/stocks")
        //const public_id = uploaded.public_id //path to image without extension or format
        const url = uploaded.url
        const newStock = await Stock.create({
            name: stock_name,
            price: Number(price),
            description: message,
            category: category,
            img: url,
            qty: Number(quantity),
            cost: Number(cost),
        })
        return newStock
    }
    const stock = postStock()
    return new NextResponse(JSON.stringify({message : stock}), {status: 200})
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
    const stockArray = Object.fromEntries(
      Object.entries(stock).filter(([key, value]) => value !== undefined)
    );

    // Update user document
    Object.assign(Stock, stockArray);

    const update = await Stock.findById(`${id}`)

    const updatedStock = await Stock.save();

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
    const deletedStock = await Stock.findByIdAndDelete(
      new Types.ObjectId(id)
    )
    if (!deletedStock){
      return new NextResponse(
        JSON.stringify({ message: "stock not found"}),
        { status: 400}
      )
    }
    return new NextResponse(JSON.stringify({message : "stock deleted"}), {status: 200})
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





