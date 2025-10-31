import mongoose from "mongoose";


const cartSchema = new mongoose.Schema({
  products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Products' },
        productQuantity: { type: Number, required: true },
        productPrice: { type: Number, required: true },
        productCost: {type: Number, required: true },
      }
  ],
  coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
  discount: {type: Number, required: true },
  totalCost: {type: Number, required: true },
  totalSale: {type: Number, required: true },
  totalQty: {type: Number},
});



const Cart = mongoose.model("Cart", cartSchema);

export default Cart;

