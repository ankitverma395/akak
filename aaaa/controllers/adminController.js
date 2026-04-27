const Product = require("../models/Product");
const Inquiry = require("../models/Inquiry");
const Admin = require("../models/Admin");
const fs = require("fs");
const path = require("path");

// ─── Auth ────────────────────────────────────────────────
module.exports.loginPage = (req, res) => {
  if (req.session.isAdmin) return res.redirect("/admin/dashboard");
  res.render("admin/login", {
    title: "Admin Login - Geeta Traders",
    description: "Admin login page",
  });
};

module.exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username: username.toLowerCase() });

    if (!admin) {
      console.log(`❌ Login failed: User "${username}" not found.`);
      req.flash("error", "Invalid username or password.");
      return res.redirect("/admin/login");
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      console.log(`❌ Login failed: Incorrect password for user "${username}".`);
      req.flash("error", "Invalid username or password.");
      return res.redirect("/admin/login");
    }

    req.session.isAdmin = true;
    req.session.userId = admin._id;
    req.flash("success", "Welcome back, Admin!");
    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error(err);
    req.flash("error", "Login failed. Please try again.");
    res.redirect("/admin/login");
  }
};

module.exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
};

// ─── Dashboard ───────────────────────────────────────────
module.exports.dashboard = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalInquiries = await Inquiry.countDocuments();
    const newInquiries = await Inquiry.countDocuments({ status: "new" });
    const recentInquiries = await Inquiry.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("product");

    // Most requested products
    const topProducts = await Product.find()
      .sort({ inquiryCount: -1 })
      .limit(5);

    // Category breakdown
    const categories = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Inquiry status breakdown
    const inquiryStatuses = await Inquiry.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Monthly inquiry trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyInquiries = await Inquiry.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.render("admin/dashboard", {
      title: "Admin Dashboard - Geeta Traders",
      pageTitle: "Dashboard Overview",
      activePage: "dashboard",
      description: "Admin dashboard",
      totalProducts,
      totalInquiries,
      newInquiries,
      recentInquiries,
      topProducts,
      categories,
      inquiryStatuses,
      monthlyInquiries,
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to load dashboard.");
    res.redirect("/admin/login");
  }
};

// ─── Products CRUD ───────────────────────────────────────
module.exports.productsPage = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = {};
    if (category) filter.category = category;

    const products = await Product.find(filter).sort({ category: 1, sortOrder: 1, name: 1 });
    const categories = await Product.distinct("category");

    res.render("admin/products", {
      title: "Manage Products - Admin",
      pageTitle: "Product Management",
      activePage: "products",
      description: "Manage products",
      products,
      categories,
      selectedCategory: category || "",
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to load products.");
    res.redirect("/admin/dashboard");
  }
};

module.exports.addProductPage = (req, res) => {
  res.render("admin/addProduct", {
    title: "Add Product - Admin",
    pageTitle: "Add New Product",
    activePage: "add-product",
    description: "Add a new product",
  });
};

module.exports.addProduct = async (req, res) => {
  try {
    const { name, description, category, packSizes, featured, available, sortOrder } = req.body;

    const productData = {
      name,
      description,
      category,
      packSizes: packSizes ? packSizes.split(",").map((s) => s.trim()) : ["200g"],
      featured: featured === "on",
      available: available !== "off",
      sortOrder: sortOrder || 0,
    };

    if (req.file) {
      productData.image = `/uploads/products/${req.file.filename}`;
    }

    await Product.create(productData);
    req.flash("success", "Product added successfully!");
    res.redirect("/admin/products");
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to add product: " + err.message);
    res.redirect("/admin/products/new");
  }
};

module.exports.editProductPage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      req.flash("error", "Product not found.");
      return res.redirect("/admin/products");
    }
    res.render("admin/editProduct", {
      title: "Edit Product - Admin",
      pageTitle: "Edit Product",
      activePage: "products",
      description: "Edit product",
      product,
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to load product.");
    res.redirect("/admin/products");
  }
};

module.exports.updateProduct = async (req, res) => {
  try {
    const { name, description, category, packSizes, featured, available, sortOrder } = req.body;

    const updateData = {
      name,
      description,
      category,
      packSizes: packSizes ? packSizes.split(",").map((s) => s.trim()) : ["200g"],
      featured: featured === "on",
      available: available !== "off",
      sortOrder: sortOrder || 0,
    };

    // Regenerate slug
    updateData.slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    if (req.file) {
      // Delete old image if custom
      const oldProduct = await Product.findById(req.params.id);
      if (oldProduct && oldProduct.image && oldProduct.image.startsWith("/uploads/")) {
        const oldPath = path.join(__dirname, "..", oldProduct.image.substring(1));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.image = `/uploads/products/${req.file.filename}`;
    }

    await Product.findByIdAndUpdate(req.params.id, updateData);
    req.flash("success", "Product updated successfully!");
    res.redirect("/admin/products");
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to update product: " + err.message);
    res.redirect(`/admin/products/${req.params.id}/edit`);
  }
};

module.exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product && product.image && product.image.startsWith("/uploads/")) {
      const imgPath = path.join(__dirname, "..", product.image.substring(1));
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    await Product.findByIdAndDelete(req.params.id);
    req.flash("success", "Product deleted successfully!");
    res.redirect("/admin/products");
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to delete product.");
    res.redirect("/admin/products");
  }
};

// ─── Inquiries Management ────────────────────────────────
module.exports.inquiriesPage = async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.inquiryType = type;

    const inquiries = await Inquiry.find(filter)
      .sort({ createdAt: -1 })
      .populate("product");

    res.render("admin/inquiries", {
      title: "Manage Inquiries - Admin",
      pageTitle: "Lead Management",
      activePage: "inquiries",
      description: "Manage inquiries",
      inquiries,
      selectedStatus: status || "",
      selectedType: type || "",
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to load inquiries.");
    res.redirect("/admin/dashboard");
  }
};

module.exports.updateInquiryStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    await Inquiry.findByIdAndUpdate(req.params.id, { status, notes });
    req.flash("success", "Inquiry updated successfully!");
    res.redirect("/admin/inquiries");
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to update inquiry.");
    res.redirect("/admin/inquiries");
  }
};

module.exports.deleteInquiry = async (req, res) => {
  try {
    await Inquiry.findByIdAndDelete(req.params.id);
    req.flash("success", "Inquiry deleted successfully!");
    res.redirect("/admin/inquiries");
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to delete inquiry.");
    res.redirect("/admin/inquiries");
  }
};
