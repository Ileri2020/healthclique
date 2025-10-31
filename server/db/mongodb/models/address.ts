import mongoose from "mongoose";


const shippingAddressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    address: { type: String},
    city: { type: String},
    state: { type: String},
    zip: { type: String},
    country: { type: String},
  });


const ShippingAddress = mongoose.model("Address", shippingAddressSchema);

export default ShippingAddress;