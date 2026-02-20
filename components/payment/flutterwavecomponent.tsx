// ts-nocheck
'use client'
import { FlutterWaveButton, closePaymentModal } from 'flutterwave-react-v3';
import async from './flutterwavehook';

type FlutterwavePaymentProps = {
  amount: number;
  currency: string;
  email: string;
  phonenumber: string;
  name: string;
};

export default async function FlutterwavePaymentButton({
  amount,
  currency,
  email,
  phonenumber,
  name,
}: FlutterwavePaymentProps) {
  const config = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY as string,
    tx_ref: Date.now().toString(),
    amount,
    currency,
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email,
      phonenumber,
      name,
    },
    customizations: {
      title: 'Loyz Food and Spices',
      description: 'Payment for items in cart using Flutterwave',
      logo: 'https://res.cloudinary.com/dc5khnuiu/image/upload/v1765733238/j8jw0lwd79tuhofhpao9.png',
    },
  };

  const fwConfig = {
    ...config,
    text: 'Pay with Flutterwave!',
    callback: (response: any) => {
      console.log(response);
      closePaymentModal(); // close modal programmatically
    },
    onClose: () => {},
  };

  return (
    <div>
      <FlutterWaveButton {...fwConfig} />
    </div>
  );
}
