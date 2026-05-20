const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");


// 🔴 ADMIN ONLY
router.post("/", protect, adminOnly, upload.single("image"), createCategory);
router.put("/:id", protect, adminOnly, upload.single("image"), updateCategory);
router.delete("/:id", protect, adminOnly, deleteCategory);

// 🟢 PUBLIC
router.get("/", getCategories);
router.get("/:id", getCategoryById);

module.exports = router;