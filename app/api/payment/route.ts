import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

function generateTxRef() {
  return `HC-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
}

const PRICE_MARKUPS: Record<string, number> = {
  customer: 1.3,
  professional: 1.2,
  wholesaler: 1.1,
  admin: 1.0,
  staff: 1.0,
};

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const body = await req.json();

    // ---------------- CONFIRM PAYMENT ----------------
    if (action === "confirm") {
      const { tx_ref: confirm_tx_ref, method } = body;
      if (!confirm_tx_ref) return NextResponse.json({ error: "tx_ref is required" }, { status: 400 });

      // Verification Logic
      let isVerified = false;

      if (method === 'monnify') {
        try {
          const apiKey = process.env.NEXT_PUBLIC_MONNIFY_API_KEY;
          const secretKey = process.env.MONNIFY_SECRET_KEY;
          
          if (apiKey && secretKey) {
            // Get Access Token
            const authRes = await axios.post("https://api.monnify.com/api/v1/auth/login", {}, {
              headers: {
                Authorization: `Basic ${Buffer.from(`${apiKey}:${secretKey}`).toString("base64")}`
              }
            });
            const token = authRes.data.responseBody.accessToken;

            // Verify Transaction
            const verifyRes = await axios.get(`https://api.monnify.com/api/v2/transactions/verify/${confirm_tx_ref}`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (verifyRes.data.responseBody.paymentStatus === 'PAID') {
              isVerified = true;
            }
          } else {
            // Fallback for dev if keys missing
            console.warn("Monnify keys missing, skipping server-side verification");
            isVerified = true; 
          }
        } catch (err) {
          console.error("Monnify verification error:", err);
          // Return failure if verification fails
          return NextResponse.json({ success: false, message: "Verification failed" });
        }
      } else if (method === 'flutterwave') {
        // Flutterwave verification would go here (requires FLW_SECRET_KEY)
        isVerified = true; // Placeholder
      } else if (method === 'manual_transfer') {
        const payment = await prisma.payment.findUnique({ where: { tx_ref: confirm_tx_ref } });
        if (payment) {
          await prisma.cart.update({
            where: { id: payment.cartId },
            data: { status: "pending_verification" },
          });
          await prisma.payment.update({
            where: { tx_ref: confirm_tx_ref },
            data: { method: "manual_transfer" }
          });
          return NextResponse.json({ success: true, message: "Manual transfer noted" });
        }
      }

      if (isVerified) {
        const payment = await prisma.payment.findUnique({ where: { tx_ref: confirm_tx_ref } });
        if (payment) {
          await prisma.cart.update({
            where: { id: payment.cartId },
            data: { status: "paid" },
          });
          await prisma.payment.update({
            where: { tx_ref: confirm_tx_ref },
            data: { method: method || "online" }
          });
          return NextResponse.json({ success: true, message: "Payment confirmed" });
        }
      }
      
      return NextResponse.json({ success: false, message: "Transaction not found or unverified" });
    }

    // ---------------- INITIATE CHECKOUT ----------------
    const { userId, items, cartId, deliveryFee = 0, deliveryAddressId } = body;

    if (!userId || !items?.length) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Server-side total calculation
    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i: any) => i.productId) } },
      include: { bulkPrices: true }
    });

    const markup = PRICE_MARKUPS[user.role] || 1.3;
    
    let subtotal = 0;
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) continue;

      let price = product.price;
      if (item.bulkPriceId) {
        const bulk = product.bulkPrices.find(b => b.id === item.bulkPriceId);
        if (bulk) price = bulk.price;
      } else if (item.isSpecial && item.customPrice) {
        price = item.customPrice;
      }
      
      subtotal += (price * markup) * item.quantity;
    }

    let total = subtotal + Number(deliveryFee);
    
    // Support for admin test payments
    if (user.role === 'admin' && body.forcedAmount) {
      total = Number(body.forcedAmount);
    }

    let cart;
    if (cartId) {
      // Re-initiate existing cart
      await prisma.cartItem.deleteMany({ where: { cartId } });
      cart = await prisma.cart.update({
        where: { id: cartId },
        data: {
          total,
          deliveryFee: Number(deliveryFee),
          deliveryAddressId,
          products: {
            create: items.map((i: any) => ({
              productId: i.productId,
              quantity: i.quantity,
              bulkPriceId: i.bulkPriceId,
              customName: i.customName,
              customPrice: i.customPrice,
              isSpecial: !!i.isSpecial,
            }))
          }
        }
      });
    } else {
      // Create new cart
      cart = await prisma.cart.create({
        data: {
          userId,
          total,
          deliveryFee: Number(deliveryFee),
          deliveryAddressId,
          status: "pending",
          products: {
            create: items.map((i: any) => ({
              productId: i.productId,
              quantity: i.quantity,
              bulkPriceId: i.bulkPriceId,
              customName: i.customName,
              customPrice: i.customPrice,
              isSpecial: !!i.isSpecial,
            }))
          }
        }
      });
    }

    const tx_ref = generateTxRef();
    await prisma.payment.upsert({
      where: { cartId: cart.id },
      update: {
        tx_ref,
        method: "online",
        amount: total,
      },
      create: {
        cartId: cart.id,
        tx_ref,
        method: "online",
        amount: total,
      }
    });

    return NextResponse.json({ cartId: cart.id, tx_ref, amount: total, currency: "NGN" });
  } catch (error) {
    console.error("Payment API Error:", error);
    return NextResponse.json({ error: "Checkout initiation failed" }, { status: 500 });
  }
}
