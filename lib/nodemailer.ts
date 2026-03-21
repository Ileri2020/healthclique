import nodemailer from 'nodemailer';

const email = process.env.GOOGLE_EMAIL ?? 'adepojuololade2020@gmail.com';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL,
        pass: process.env.GOOGLE_APP_PASSWORD, 
    },
});

export const sendOrderNotification = async (to: string, orderDetails: any) => {
    try {
        console.log('Sending order notification email to:', to);
        const isUnconfirmed = orderDetails.status === 'unconfirmed';
        const subject = isUnconfirmed ? '[HEALTH CLIQUE] Action Required: Confirm Bank Transfer' : '[HEALTH CLIQUE] New Order Notification';
        
        const mailOptions = {
            from: `"Health Clique" <${email}>`,
            to,
            subject,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
            <div style="background: #4f46e5; padding: 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px;">${subject}</h1>
            </div>
            <div style="padding: 30px;">
                <p style="font-size: 16px; color: #374151;">${isUnconfirmed ? 'A bank transfer checkout has been submitted and is awaiting confirmation.' : 'A new order has been successfully placed on Health Clique.'}</p>
                
                <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0;">
                    <h3 style="margin-top: 0; color: #111827; font-size: 18px;">Transaction Summary</h3>
                    <p style="margin: 8px 0;"><strong>Reference:</strong> ${orderDetails.tx_ref}</p>
                    <p style="margin: 8px 0;"><strong>Total Amount:</strong> ₦${(orderDetails.amount || 0).toLocaleString()}</p>
                    <p style="margin: 8px 0;"><strong>Method:</strong> ${orderDetails.method || 'Online'}</p>
                    ${orderDetails.payeeName ? `<p style="margin: 8px 0;"><strong>Payee Name:</strong> ${orderDetails.payeeName}</p>` : ''}
                    ${orderDetails.receiptUrl ? `<p style="margin: 8px 0; margin-top: 15px;"><strong>Payment Proof:</strong> <a href="${orderDetails.receiptUrl}" style="color: #4f46e5; text-decoration: underline;">View Uploaded Receipt</a></p>` : ''}
                </div>

                <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                    Date: ${new Date().toLocaleString()}<br>
                    Order Status: <span style="text-transform: uppercase; font-weight: bold; color: ${isUnconfirmed ? '#f59e0b' : '#10b981'};">${orderDetails.status}</span>
                </p>
            </div>
            <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
                © 2026 Health Clique Pharmacy. All rights reserved.
            </div>
        </div>
      `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Order notification email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending order notification email:', error);
        return null;
    }
};

export const sendPaymentConfirmationEmail = async (to: string, data: {
    customerName: string;
    contact: string;
    address: string;
    products: any[];
    total: number;
    deliveryFee: number;
    orderId: string;
}) => {
    try {
        console.log('Sending payment confirmation email to:', to);
        const productRows = data.products.map((item: any) => {
            const p = item.product || item;
            return `
            <tr>
                <td style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #374151;">
                    ${p.name} ${item.bulkName ? `<br><span style="font-size: 11px; color: #4f46e5; font-weight: bold;">(${item.bulkName})</span>` : ''}
                </td>
                <td style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; text-align: center; color: #6b7280;">${item.quantity}</td>
                <td style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: bold; color: #111827;">₦${(item.price || p.price || 0).toLocaleString()}</td>
            </tr>
        `;}).join('');

        const mailOptions = {
            from: `"Health Clique" <${email}>`,
            to,
            subject: `Health Clique: Order Confirmation - #${data.orderId.slice(-6).toUpperCase()}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                    <div style="background: #10b981; padding: 25px; text-align: center; color: white;">
                        <h1 style="margin: 0; font-size: 24px;">Order Confirmed!</h1>
                        <p style="margin: 5px 0 0; opacity: 0.9;">Thank you for your purchase</p>
                    </div>
                    
                    <div style="padding: 30px;">
                        <p style="font-size: 16px; color: #374151;">Hi ${data.customerName},</p>
                        <p style="font-size: 16px; color: #374151; line-height: 1.5;">Your payment has been successfully confirmed. We are currently preparing your items for delivery.</p>
                        
                        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px dashed #d1d5db;">
                            <h3 style="margin-top: 0; color: #111827; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Delivery Information</h3>
                            <p style="margin: 8px 0; font-size: 14px;"><strong>Order ID:</strong> #${data.orderId.toUpperCase()}</p>
                            <p style="margin: 8px 0; font-size: 14px;"><strong>Address:</strong> ${data.address}</p>
                            <p style="margin: 8px 0; font-size: 14px;"><strong>Contact:</strong> ${data.contact}</p>
                        </div>

                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                            <thead>
                                <tr style="text-align: left; background: #f3f4f6;">
                                    <th style="padding: 12px 8px; font-size: 12px; text-transform: uppercase; color: #6b7280;">Product</th>
                                    <th style="padding: 12px 8px; font-size: 12px; text-transform: uppercase; color: #6b7280; text-align: center;">Qty</th>
                                    <th style="padding: 12px 8px; font-size: 12px; text-transform: uppercase; color: #6b7280; text-align: right;">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${productRows}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="2" style="padding: 15px 8px 5px; text-align: right; font-size: 14px; color: #6b7280;">Subtotal:</td>
                                    <td style="padding: 15px 8px 5px; text-align: right; font-size: 14px; font-weight: bold; color: #111827;">₦${(data.total - data.deliveryFee).toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="padding: 5px 8px; text-align: right; font-size: 14px; color: #6b7280;">Delivery Fee:</td>
                                    <td style="padding: 5px 8px; text-align: right; font-size: 14px; font-weight: bold; color: #111827;">₦${data.deliveryFee.toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="padding: 15px 8px; text-align: right; font-size: 18px; font-weight: bold; color: #111827;">Total:</td>
                                    <td style="padding: 15px 8px; text-align: right; font-size: 18px; font-weight: bold; color: #10b981;">₦${data.total.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>

                        <div style="text-align: center; margin-top: 40px;">
                            <p style="color: #6b7280; font-size: 14px;">If you have any questions, please contact our support team.</p>
                            <p style="font-weight: bold; color: #10b981; font-size: 16px;">Healthy Living, Better Life!</p>
                        </div>
                    </div>
                    <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
                        Health Clique Pharmacy & Healthcare Services<br>
                        © 2026 Health Clique. All rights reserved.
                    </div>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Payment confirmation email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending payment confirmation email:', error);
        return null;
    }
};
