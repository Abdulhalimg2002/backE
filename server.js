const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();
app.set("trust proxy", 1)
// 🟢 CORS
app.use(
  cors({
    origin: "https://e-commersss.vercel.app",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// 🟢 IMPORTANT FOR STRIPE WEBHOOK
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(cookieParser());

/* ROUTES */
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/checkout", require("./routes/checkout"));
app.use("/api/webhook", require("./routes/stripe"));

/* SERVER */
app.listen(3000, () => {
  console.log("Server running on port 3000 🚀");
});