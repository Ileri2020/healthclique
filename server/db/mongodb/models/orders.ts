// import mongoose from "mongoose";



// const orderSchema = new mongoose.Schema({
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
//     products: [
//       {
//         productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Products' },
//         quantity: { type: Number},
//         price: { type: Number},
//       },
//     ],
//     total: { type: Number},
//     status: { type: String, enum: ['pending', 'shipped', 'delivered', 'cancelled'] },
//     paymentMethod: { type: String},
//     paymentStatus: { type: String, enum: ['paid', 'unpaid'] },
//   });



// const Order = mongoose.model("Order", orderSchema);

// export default Order;