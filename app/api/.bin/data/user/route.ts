import { NextApiRequest, NextApiResponse } from 'next';
import connect from '@/server/config/mongodb';
import User from '@/server/db/mongodb/models/users';
import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { redirect } from 'next/navigation';
import { hashSync } from 'bcrypt-edge';

export const GET = async (req: Request) => { //, res: NextApiResponse
  try {
    const {searchParams} = new URL(req.url)
    const limit = searchParams.get("limit")
    const useremail = searchParams.get("email")
    const username = searchParams.get("username")
    const category = searchParams.get("category")//admin, staff, user, all
    
    console.log(useremail, username)
    
    if (!useremail || username || limit){
      return new NextResponse(
        JSON.stringify({ message: "invalid credentials"}),
        { status: 400}
      )
    }

  //   const userData = await fetchUserDataFromDatabase(userId);

  await connect()

  let user 
  
  if (useremail){
    try {
        user = await User.findOne({ email : useremail }).select("+password +role")
        return new NextResponse(JSON.stringify(user), {status: 200});
    } catch (error) {
        // users = mongoose.model('users', userSchema)
        console.log("unable to get user from database")
    }
  }
  if (username){
    try {
        user = await User.findOne({ username : username }).select("+password +role")
        return new NextResponse(JSON.stringify(user), {status: 200});
    } catch (error) {
        // users = mongoose.model('users', userSchema)
        console.log("unable to get user from database")
    }
  }
  if (limit && category){
    try {
        user = await User.find({ category : category }).limit(parseInt(limit))
        return new NextResponse(JSON.stringify(user), {status: 200});
    } catch (error) {
        // users = mongoose.model('users', userSchema)
        console.log("unable to get user from database")
    }
  }else{
    {
      try {
          user = await User.find().limit(parseInt(limit))
          return new NextResponse(JSON.stringify(user), {status: 200});
      } catch (error) {
          // users = mongoose.model('users', userSchema)
          console.log("unable to get user from database")
      }
    }
  }

    return new NextResponse(JSON.stringify(user), {status: 200});
  } catch (error) {
    return new NextResponse(JSON.stringify({error: error.message}), {status: 500});
  }
};

// const fetchUserDataFromDatabase = async (userId: string) => {
//   // Replace this with your actual database query
//   // For example, using Mongoose:
//   // const User = mongoose.model('User');
//   // const user = await User.findById(userId).select('+password');
//   // return user;

//   // For demonstration purposes, return a mock user object
//   return {
//     id: userId,
//     name: 'John Doe',
//     email: 'john.doe@example.com',
//   };
// };




export const POST = async (req: Request) => {
  try{
    const {userName, email, password, formRole} =await req.json()
    if (!userName && !email && !password) {
      return new NextResponse(JSON.stringify({message : "invalid credentials"}), {status: 400})
    }
    await connect();
    const existingUser = await User.findOne({ email })

    if (existingUser) {console.log("user already exist"); redirect("account") ; return; } 
    let role
    if (!formRole) {
      if ( email == "adepojuololade2020@gmail.com" || email == "adepojuololade2020@gmail.com"){
        role = "admin"
    } 
    if ( email == "staff@gmail.com" || email == "rep@gmail.com"){
        role = "staff"
    }else{
      role = "user"
    } 
    }else{
      role = formRole
    }
    // const sale = new Sale(body)
    // await sale.save()
    const hashedPassword = await hashSync(password, 10)

     const postMessage = async () => {
      let newUser
        try{
            newUser = await User.create({
              userName: userName,
              email: email,
              password: hashedPassword,
              role: role,
              authProviderId: "system",
            })
        }catch(error){console.log(error)}
        return newUser
    }
    const user = postMessage()
    console.log(user)
    return new NextResponse(JSON.stringify({message : user}), {status: 200})
  } catch (error) {
    return new NextResponse(JSON.stringify({error : error}), {status: 500})
  }
}


export const PATCH = async (req: Request) => {
  try{
    const body =await req.json()
    const { userId, newUsername } = body
    await connect();
    if (!userId || !newUsername){
      return new NextResponse(
        JSON.stringify({ message: "invalid credentials"}),
        { status: 400}
      )
    }
    if (!Types.ObjectId.isValid(userId)){
      return new NextResponse(
        JSON.stringify({ message: "invalid id"}),
        { status: 400}
      )
    }
    const updatedUser = await User.findOneAndUpdate(
      {_id: new Types.ObjectId(userId)},  //new ObjectId(userId)
      {username: newUsername},
      {new: true},
    )
    if(!updatedUser){
      return new NextResponse(JSON.stringify({message : "user not found"}), {status: 400})
    }
    return new NextResponse(JSON.stringify({message : "user updated", user: updatedUser}), {status: 200})
  } catch (error) {
    return new NextResponse(JSON.stringify({error : error}), {status: 500})
  }
}


export const DELETE = async (req: Request) => {
  try{
    const {searchParams} = new URL(req.url)
    const userId = searchParams.get("userId")
    if (!userId){
      return new NextResponse(
        JSON.stringify({ message: "input your user id"}),
        { status: 400}
      )
    }
    if (!Types.ObjectId.isValid(userId)){
      return new NextResponse(
        JSON.stringify({ message: "invalid id"}),
        { status: 400}
      )
    }
    await connect();
    const deletedUser = await User.findByIdAndDelete(
      new Types.ObjectId(userId)
    )
    if (!deletedUser){
      return new NextResponse(
        JSON.stringify({ message: "user not found"}),
        { status: 400}
      )
    }
    return new NextResponse(JSON.stringify({message : "user deleted"}), {status: 200})
  } catch (error) {
    return new NextResponse(JSON.stringify({error : error}), {status: 500})
  }
}