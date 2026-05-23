const prisma = require("../prisma/client");
const axios = require("axios");

const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const htmlTemplate = require("../utils/emailTemplate");
const jwt = require("jsonwebtoken");

// 🔐 إنشاء وتخزين التوكن في cookie
const sendToken = (res, user) => {
  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

res.cookie("token", token, {
  httpOnly: true,
  secure: true,
  sameSite: "none", // 🔥 أو none (إذا اشتغل مشاكل)
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

  return token;
};



exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    sendToken(res, user);

    return res.status(200).json({
      user,
      message: "Register success",
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};



exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    sendToken(res, user);

    return res.status(200).json({
      user,
      message: "Login success",
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};



exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    await prisma.user.update({
      where: { email },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const link = `https://e-commersss.vercel.app/reset-password/${resetToken}`;

    await sendEmail(email, "Reset Password", htmlTemplate(link));

    return res.json({ message: "Email sent" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};



exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          gte: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // 🚨 منع Google users
    if (user.password) {
      return res.status(403).json({
        error: "Google accounts cannot reset password.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return res.json({ message: "Password updated" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
exports.googleCallback = async (req, res) => {
  try {
    const code = req.query.code;

    const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const access_token = tokenRes.data.access_token;

    const userRes = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const googleUser = userRes.data;

    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: googleUser.name,
          email: googleUser.email,
          image: googleUser.picture,
          provider: "google",
          providerId: googleUser.id,
        },
      });
    }

    sendToken(res, user);

    if (user.role === "admin") {
      return res.redirect("https://e-commersss.vercel.app/dashboard");
    } else {
      return res.redirect("https://e-commersss.vercel.app/store");
    }

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Google auth failed" });
  }
};
exports.me = async (req, res) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: "No token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    return res.json({ user });
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
exports.logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return res.json({ success: true });
};