import mongoose from "mongoose";


const refundSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Orders' },
    amount: { type: Number},
    reason: { type: String},
    status: { type: String, enum: ['pending', 'approved', 'rejected'] },
  });


const Refund = mongoose.model("Refund", refundSchema);

export default Refund;




