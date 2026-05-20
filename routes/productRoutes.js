const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");


// 🔴 ADMIN ONLY (CRUD)
router.post("/", protect, adminOnly, upload.single("image"), createProduct);
router.put("/:id", protect, adminOnly, upload.single("image"), updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

// 🟢 PUBLIC / STORE (READ ONLY)
router.get("/", getProducts);
router.get("/:id", getProductById);

module.exports = router;