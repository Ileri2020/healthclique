import mongoose from "mongoose";


export interface INotification {
    from?: mongoose.Types.ObjectId;
    to?: mongoose.Types.ObjectId;
    category: 'suggestion' | 'complaint' | 'advertise' | 'comment' | 'reply' | 'general' | 'appreciate';
    message?: string;
    read: boolean;
}

const notificationSchema = new mongoose.Schema<INotification>({
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    category: { type:String, enum: ['suggestion', 'complaint', 'advertise', 'comment', "reply", "general", "appreciate"], required: true },
    message: { type: String},
    read: { type: Boolean, default: false },
}, {timestamps: true});

const Notification: mongoose.Model<INotification> = mongoose.models.Notifications || mongoose.model<INotification>("Notifications", notificationSchema);

export default Notification;