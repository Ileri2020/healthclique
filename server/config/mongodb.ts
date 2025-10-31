"use server"
import mongoose from "mongoose";


const connect =async () => {
    mongoose.set("strictQuery", true);

    // console.log(`mongodb uri ${process.env.MONGODB_URL}`)

    if (mongoose.connection.readyState === 1) {
        console.log("already connected to database");
        return;
      }


      if (mongoose.connection.readyState === 2) {
        console.log("connecting to database");
        return;
      }

    await mongoose.connect(process.env.MONGODB_URL,
      // {
      //   dbName:"succo",
      //   bufferCommands: true,
      // }
    )
        // .then(() => console.log("MongoDB connected"))
        .catch((err) => console.log(err))
}

export default connect;

//db super user and pword; useradepojuololade2020 pword:j0k2iy9xXcraCpHn
