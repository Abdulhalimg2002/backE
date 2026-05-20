const prisma = require("../prisma/client");
const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");


// 🟢 CREATE PRODUCT
exports.createProduct = async (req, res) => {
  try {
    const { name, price, description, categoryId, stock } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Image is required" });
    }

    const uploadImage = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "products" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

    const uploadResult = await uploadImage();

    const product = await prisma.product.create({
      data: {
        name,
        price: Number(price),
        description,
        image: uploadResult.secure_url,
        stock: Number(stock || 0),
        categoryId,
      },
    });

    // 🔥 IMPORTANT FIX
    const fullProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: { category: true },
    });

    res.json({ data: fullProduct });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// 🟢 GET ALL PRODUCTS
// 🟢 GET ALL PRODUCTS
exports.getProducts = async (req, res) => {
  try {
    const {
      search,
      categoryId,
      minPrice,
      maxPrice,
      page = 1,
      limit = 200,
    } = req.query;

    const filters = {};

    if (search) {
      filters.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (categoryId) {
      filters.categoryId = categoryId;
    }

    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.gte = Number(minPrice);
      if (maxPrice) filters.price.lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const total = await prisma.product.count({
      where: filters,
    });

    const products = await prisma.product.findMany({
      where: filters,
      include: { category: true },

      // 🔥 IMPORTANT FIX
      orderBy: {
        createdAt: "desc",
      },

      skip,
      take: Number(limit),
    });

    res.json({
      data: products,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// 🟢 GET ONE PRODUCT
exports.getProductById = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// 🟢 UPDATE PRODUCT
exports.updateProduct = async (req, res) => {
  console.log("BODY:", req.body);
  console.log("FILE:", req.file);

  try {
    const {
      name,
      price,
      categoryId,
      description,
      stock
    } = req.body || {};

    let imageUrl;

    if (req.file) {
      const uploadImage = () =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "products" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );

          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });

      const uploadResult = await uploadImage();
      imageUrl = uploadResult.secure_url;
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name,
        price: price ? Number(price) : undefined,
        description,
        stock: stock !== undefined ? Number(stock) : undefined,
        categoryId,
        ...(imageUrl && { image: imageUrl }),
      },
      include: {
        category: true,
      },
    });

    res.json({ data: product });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


// 🟢 DELETE PRODUCT
exports.deleteProduct = async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "Product deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};