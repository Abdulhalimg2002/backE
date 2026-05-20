const express = require("express");
const router = express.Router();

const {
  addToCart,
  getCart,
  removeFromCart,
  updateQuantity
} = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, addToCart);
router.get("/", protect, getCart);
router.delete("/:itemId", protect, removeFromCart);

// 🔄 update quantity
router.put("/:itemId", protect, updateQuantity);

module.exports = router;