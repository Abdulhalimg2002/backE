const prisma = require("../prisma/client");

// 🟢 GET ALL USERS (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
      },
    });

    res.json(users);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// 🟢 UPDATE USER (Admin)
exports.updateUser = async (req, res) => {
  try {
    const { name, role, image } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        name,
        role,
        image,
      },
    });

    res.json(user);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// 🟢 DELETE USER (Admin)
exports.deleteUser = async (req, res) => {
  try {
    // 🛡️ منع الأدمن يحذف نفسه
    if (req.user.id === req.params.id) {
      return res.status(400).json({
        error: "You cannot delete yourself",
      });
    }

    await prisma.user.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "User deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

