import mongoose from "mongoose";

export interface IStock {
    name: string;
    description: string;
    img: string;
    category: 'food' | 'drink' | 'snacks' | 'suplement';
    cost: number;
    price: number;
    qty?: number;
}

const StocksSchema = new mongoose.Schema<IStock>({
    name: { type: String, required: true },
    description: { type: String, required: true },
    img: { type: String, required: true },
    category: { type:String, enum: ['food', 'drink', 'snacks', 'suplement'], required: true },
    cost: {type: Number, required: true },
    price: {type: Number, required: true },
    qty: {type: Number},
}, {timestamps: true});

const Stock: mongoose.Model<IStock> = mongoose.models.Stocks || mongoose.model<IStock>('Stocks', StocksSchema);

export default Stock;


export const updateStockByID = async (id : string, name: string, description: string, img: string, category: string, cost: number, price: number, quantity: number) => {

    try {
        const result = await Stock.updateOne(
            {_id: id},
            {
                name: name,
                description: description,
                img: img,
                category: category,
                cost: cost,
                price: price,
                qty: quantity,
            }
        )
    } catch (errer) {
        console.log("error in updating stock")
    }
}


export const searchStocks = async (name: string, category: string,) => {
    try {
        const users = await Stock.find({ $and: [{name: name}, {category: category}]})
        return users
    }catch (error) {
        console.log("unable to find stock")
    }
}

export const findStocks = async (name: string) => {
    try {
        const stocks = await Stock.find({name: name})
        return stocks
    }catch (error) {
        console.log("unable to find stocks")
    }
}


export const StockAZ = async () => {
    try {
        const result = await Stock.find().sort({ userName: 1 }) //or -1 z-a
        return result
    } catch (error) {
        console.log("unable to get all stocks alphabetically")
    }
}


export const totalStock = async () => {
    try {
        const result = await Stock.find().countDocuments()
        return result
    } catch {
        console.log("unable to get total number of stocks")
    }
}


export const skipLimitStockList = async (start = 0, limit: number) => {
    try {
        const result = await Stock.find().skip(start).limit(limit)
    } catch {
        console.log(`unable to get stocks list of ${limit} limit`)
    }
}


