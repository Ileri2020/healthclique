import mongoose from "mongoose";


export interface IUser {
    userName: string;
    email: string;
    password?: string;
    role?: 'admin' | 'user' | 'staff';
    address?: mongoose.Types.ObjectId;
    image?: string;
    authProviderId?: string;
}

export const userSchema = new mongoose.Schema<IUser>({
    userName: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String},
    role: { type: String, enum: ['admin', 'user', "staff"] },
    address: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
    image: { type: String},
    authProviderId: { type: String},
  }, {timestamps: true});

const User: mongoose.Model<IUser> = mongoose.models.Users || mongoose.model<IUser>('Users', userSchema);

export default User;


export const updateUserByID = async (id : string, firstName, lastName, userName, email, password, address, image) => {

    const encryptedPword = password

    try {
        const result = await User.updateOne(
            {_id: id},
            {
                firstName: firstName,
                lastName: lastName,
                userName: userName,
                email: email,
                password: encryptedPword,
                address: address,
                image: image,
            }
        )
    } catch (errer) {
        console.log("error in updating user account")
    }
}


export const searchUsers = async (userName: string, email: string,) => {
    try {
        const users = await User.find({ $and: [{userName: userName}, {email: email}]})
        return users
    }catch (error) {
        console.log("unable to find user")
    }
}

export const findUsers = async (userName: string) => {
    try {
        const users = await User.find({userName: userName})
        return users
    }catch (error) {
        console.log("unable to find user")
    }
}


export const usersAZ = async () => {
    try {
        const result = await User.find().sort({ userName: 1 }) //or -1 z-a
        return result
    } catch (error) {
        console.log("unable to get all users alphabetically")
    }
}


export const totalUsers = async () => {
    try {
        const result = await User.find().countDocuments()
        return result
    } catch {
        console.log("unable to get total users")
    }
}


export const skipLimitUserList = async (start = 0, limit: number) => {
    try {
        const result = await User.find().skip(start).limit(limit)
    } catch {
        console.log(`unable to get users list of ${limit} limit`)
    }
}

// const limitUserList = async () => {}
