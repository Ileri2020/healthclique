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
      const { tx_ref, method } = body;
      if (!tx_ref) return NextResponse.json({ error: "tx_ref is required" }, { status: 400 });

      // In a real app, you'd verify with the provider API here.
      // For this flow, we'll mark as paid upon client-side confirmation.
      const payment = await prisma.payment.findUnique({ where: { tx_ref } });
      if (payment) {
        await prisma.cart.update({
          where: { id: payment.cartId },
          data: { status: "paid" },
        });
        return NextResponse.json({ success: true, message: "Payment confirmed" });
      }
      return NextResponse.json({ success: false, message: "Transaction not found" });
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

    const total = subtotal + Number(deliveryFee);

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
    await prisma.payment.create({
      data: {
        cartId: cart.id,
        tx_ref,
        method: "online", // Will be updated by client selection if needed
        amount: total,
      }
    });

    return NextResponse.json({ cartId: cart.id, tx_ref, amount: total, currency: "NGN" });
  } catch (error) {
    console.error("Payment API Error:", error);
    return NextResponse.json({ error: "Checkout initiation failed" }, { status: 500 });
  }
}
