import mongoose from "mongoose";


const couponSchema = new mongoose.Schema({
    code: { type: String},
    discount: { type: Number},
    expiry: { type: Date, default: Date.now},
  }, {timestamps: true});



const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;

