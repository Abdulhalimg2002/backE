const prisma = require("../prisma/client");

// 🟢 CREATE ORDER
exports.createOrder = async (req, res) => {
  try {
    const { items } = req.body; // [{ productId, quantity }]

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "No items" });
    }

    let totalPrice = 0;

    // نحسب السعر
    const orderItems = await Promise.all(
      items.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error("Product not found");
        }

        const price = product.price * item.quantity;
        totalPrice += price;

        return {
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
        };
      })
    );

    // إنشاء الطلب
    const order = await prisma.order.create({
      data: {
        userId: req.user.userId,
        totalPrice,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
      },
    });

    res.json(order);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// 🟢 GET USER ORDERS
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: req.user.userId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json(orders);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json(orders);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// 🟢 UPDATE ORDER STATUS
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status,
      },
    });

    res.json(order);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
