const prisma = require("../prisma/client");

// ================= ADD TO CART =================
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    let cart = await prisma.cart.findUnique({
      where: { userId: req.user.userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: req.user.userId,
        },
      });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    // ================= IF EXISTS =================
    if (existingItem) {
      const newQty = existingItem.quantity + quantity;

      // STOCK VALIDATION
      if (newQty > product.stock) {
        return res.status(400).json({
          error: `Only ${product.stock} items available in stock`,
        });
      }

      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQty,
        },
      });

      return res.json(updatedItem);
    }

    // ================= NEW ITEM =================
    if (quantity > product.stock) {
      return res.status(400).json({
        error: `Only ${product.stock} items available in stock`,
      });
    }

    const newItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
      },
    });

    res.json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= GET CART =================
exports.getCart = async (req, res) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json(cart || { items: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= UPDATE QUANTITY =================
exports.updateQuantity = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({
        error: "Quantity must be at least 1",
      });
    }

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { product: true },
    });

    if (!item) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    // STOCK VALIDATION
    if (quantity > item.product.stock) {
      return res.status(400).json({
        error: `Only ${item.product.stock} items available in stock`,
      });
    }

    const updated = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= REMOVE FROM CART =================
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    res.json({ message: "Item removed from cart" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};