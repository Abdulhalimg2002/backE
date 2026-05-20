const jwt = require("jsonwebtoken");


exports.protect = (req, res, next) => {
  
  try {
    const token = req.cookies?.token; // 🔥 حماية إضافية

    if (!token) {
      return res.status(401).json({ error: "Not authorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      error: "Invalid token",
    });
  }
};
exports.adminOnly = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: "Access denied: Admins only",
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};