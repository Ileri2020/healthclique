// ts-nocheck
'use client';

import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { Button } from '@/components/ui/button';

type FlutterwaveButtonHookProps = {
  amount: number;
  currency: string;
  email: string;
  phonenumber: string;
  name: string;
  disabled?: boolean;
  onSuccess: (response: any) => void;
  onFailure?: (response: any) => void;
};

export default function FlutterWaveButtonHook({
  amount,
  currency,
  email,
  phonenumber,
  name,
  disabled = false,
  onSuccess,
  onFailure,
}: FlutterwaveButtonHookProps) {
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

  const handleFlutterPayment = useFlutterwave(config);

  return (
    <Button
      disabled={disabled}
      onClick={() => {
        if (disabled) return;

        handleFlutterPayment({
          callback: (response: any) => {
            if (response?.status === 'successful') {
              onSuccess(response);
            } else {
              onFailure?.(response);
            }

            closePaymentModal();
          },
          onClose: () => {},
        });
      }}
    >
      Checkout
    </Button>
  );
}
