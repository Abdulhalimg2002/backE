const prisma = require("../prisma/client");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

// 🔥 helper رفع من buffer
const uploadFromBuffer = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "categories" },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

// 🟢 CREATE CATEGORY
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const file = req.file;

    if (!name || !file || !file.buffer) {
      return res.status(400).json({
        error: "Name and image are required",
      });
    }

    const result = await uploadFromBuffer(file.buffer);

    const category = await prisma.category.create({
      data: {
        name,
        image: result.secure_url,
      },
    });

    res.json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// 🟢 GET ALL
exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { products: true },
    });

    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🟢 GET BY ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: { products: true },
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🟢 UPDATE
exports.updateCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const file = req.file;

    let image;

    // 🔥 إذا رفع صورة جديدة
    if (file && file.buffer) {
      const result = await uploadFromBuffer(file.buffer);
      image = result.secure_url;
    }

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        name,
        ...(image && { image }), // فقط إذا موجودة
      },
    });

    res.json(category);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// 🟢 DELETE
exports.deleteCategory = async (req, res) => {
  try {
    await prisma.category.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};