const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  updateUser,
  deleteUser,

} = require("../controllers/userController");
const { me } = require("../controllers/authController");

const { protect, adminOnly } = require("../middleware/authMiddleware");
router.get("/me", protect, me);
// 🔥 Admin only
router.get("/", protect, adminOnly, getAllUsers);
router.put("/:id", protect, adminOnly, updateUser);
router.delete("/:id", protect, adminOnly, deleteUser);


module.exports = router;