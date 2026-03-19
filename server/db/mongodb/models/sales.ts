import mongoose from "mongoose";
// schema need review especially for product list
export interface ISale {
    products: Array<{
        id: mongoose.Types.ObjectId;
        quantity: number;
    }>;
    coupon?: mongoose.Types.ObjectId;
    discount?: number;
    totalCost?: number;
    totalSale: number;
    totalQty?: number;
    status?: 'pending' | 'shipped' | 'delivered' | 'cancelled';
    paymentMethod?: string;
    paymentStatus?: 'paid' | 'unpaid';
}

const SalesSchema = new mongoose.Schema<ISale>({
    products: [
        {
          id: { type: mongoose.Schema.Types.ObjectId, ref: 'Stock' },
          quantity: { type: Number, required: true },
          _id: false,
        }
    ],
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
    discount: {type: Number },
    totalCost: {type: Number },
    totalSale: {type: Number, required: true },
    totalQty: {type: Number},
    status: { type: String, enum: ['pending', 'shipped', 'delivered', 'cancelled'] },
    paymentMethod: { type: String},
    paymentStatus: { type: String, enum: ['paid', 'unpaid'] },
}, {timestamps: true});

const Sale: mongoose.Model<ISale> = mongoose.models.Sales || mongoose.model<ISale>('Sales', SalesSchema);

export default Sale;



