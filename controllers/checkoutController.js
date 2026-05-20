const prisma = require("../prisma/client");
const stripe = require("../utils/stripe");

exports.checkout = async (req, res) => {
  try {
    const userId = req.user.userId;

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
      return res.status(400).json({ error: "Cart is empty" });
    }

    let total = 0;

    for (const item of cart.items) {
      if (item.quantity > item.product.stock) {
        return res.status(400).json({
          error: `Product ${item.product.name} out of stock`,
        });
      }

      total += item.product.price * item.quantity;
    }

    const amount = Math.round(total * 100);

    // 🟢 PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "try",
      metadata: {
        userId,
        cartId: cart.id,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};