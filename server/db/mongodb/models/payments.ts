import mongoose from "mongoose";


const paymentSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' },
    paymentMethod: { type: String},
    paymentStatus: { type: String, enum: ['paid', 'unpaid'] },
    amount: { type: Number},
    transactionId: { type: String},
  }, {timestamps: true});



const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;




