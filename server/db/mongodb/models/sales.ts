import mongoose from "mongoose";
// schema need review especially for product list
const SalesSchema = new mongoose.Schema({
    products: [
        {
          id: { type: mongoose.Schema.Types.ObjectId, ref: 'Stock' },
          quantity: { type: Number, required: true },
          _id: false,
        }
    ],
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
    discount: {type: Number },
    totalCost: {type: Number },//, required: true
    totalSale: {type: Number, required: true },
    totalQty: {type: Number},
    status: { type: String, enum: ['pending', 'shipped', 'delivered', 'cancelled'] },
    paymentMethod: { type: String},
    paymentStatus: { type: String, enum: ['paid', 'unpaid'] },
    //time : { type : Date, default: Date.now },
}, {timestamps: true});

// const Sale = mongoose.model("Sales", SalesSchema);
let Sale

  try {
      // users = mongoose.model('User')  //always make sure that the name of the model is correct and this only works only if the model is already in the database, else redefinine the model and schema
      console.log ("about to get or create sale")
      Sale = mongoose.models.Sales as unknown as null || mongoose.model('Sales', SalesSchema)
      console.log ("sale model now active")
  } catch (error) {
      // users = mongoose.model('users', userSchema)
      console.log("error in getting sale model")
  }


export default Sale;



