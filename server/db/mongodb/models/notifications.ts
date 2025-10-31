import mongoose from "mongoose";


const notificationSchema = new mongoose.Schema({
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    category: { type:String, enum: ['suggestion', 'complaint', 'advertise', 'comment', "reply", "general", "appreciate"], required: true },
    message: { type: String},
    read: { type: Boolean, default: false },
}, {timestamps: true});



let Notification

  try {
      // users = mongoose.model('User')  //always make sure that the name of the model is correct and this only works only if the model is already in the database, else redefinine the model and schema
      console.log ("about to get or create model")
      Notification = mongoose.models.Notifications as unknown as null || mongoose.model("Notifications", notificationSchema)
      console.log ("notification model now active")
  } catch (error) {
      // users = mongoose.model('users', userSchema)
      console.log("error in getting model")
  }

export default Notification;