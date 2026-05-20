const prisma = require("../prisma/client");
const stripe = require("../utils/stripe");

exports.stripeWebhook = async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"];

    let event;

    // 🟢 Verify Stripe signature
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // 🟢 only success payments
    if (event.type !== "payment_intent.succeeded") {
      return res.json({ received: true });
    }

    const paymentIntent = event.data.object;

    const userId = paymentIntent.metadata.userId;

    if (!userId) {
      return res.json({ received: true });
    }

    // 🔥 CHECK DUPLICATE ORDER (MAIN FIX)
    const existingOrder = await prisma.order.findFirst({
      where: {
        stripePaymentId: paymentIntent.id,
      },
    });

    if (existingOrder) {
      console.log("⚠️ Duplicate webhook ignored");
      return res.json({ received: true });
    }

    // 🟢 Get cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.json({ received: true });
    }

    // 🟢 Create Order (SAFE NOW)
    const order = await prisma.order.create({
      data: {
        userId,
        totalPrice: paymentIntent.amount / 100,
        status: "paid",
        stripePaymentId: paymentIntent.id, // 🔥 IMPORTANT
      },
    });

    // 🟢 Create Order Items + reduce stock
    for (const item of cart.items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
        },
      });

      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    // 🟢 Clear cart
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    

    return res.json({ received: true });

  } catch (err) {
    console.error("WEBHOOK ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};