const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// API endpoint for product search (used by frontend JS)
router.get("/products/search", async (req, res) => {
  try {
    const { q, category } = req.query;
    const filter = { available: true };

    if (q) {
      filter.name = { $regex: q, $options: "i" };
    }
    if (category && category !== "all") {
      filter.category = category;
    }

    const products = await Product.find(filter).sort({ name: 1 }).limit(20);
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: "Search failed" });
  }
});

// API endpoint for categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await Product.distinct("category", { available: true });
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load categories" });
  }
});

module.exports = router;
