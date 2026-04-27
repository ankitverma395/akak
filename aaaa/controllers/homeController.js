const Product = require("../models/Product");

module.exports.homePage = async (req, res) => {
  try {
    const featuredProducts = await Product.find({ featured: true, available: true })
      .sort({ sortOrder: 1 })
      .limit(8);

    const categories = await Product.distinct("category", { available: true });

    // Get product counts per category
    const categoryCounts = {};
    for (const cat of categories) {
      categoryCounts[cat] = await Product.countDocuments({ category: cat, available: true });
    }

    res.render("pages/home", {
      title: "Geeta Traders - Authorized Bikaji Distributor | Namkeen, Sweets & Snacks",
      description:
        "Geeta Traders is an authorized distributor of Bikaji Foods. We supply premium Namkeen, Sweets, Snacks, Gift Packs & Papad to retailers and customers across the region.",
      featuredProducts,
      categories,
      categoryCounts,
    });
  } catch (err) {
    console.error(err);
    res.render("pages/home", {
      title: "Geeta Traders - Authorized Bikaji Distributor",
      description: "Authorized distributor of Bikaji Foods International Ltd.",
      featuredProducts: [],
      categories: [],
      categoryCounts: {},
    });
  }
};

module.exports.aboutPage = (req, res) => {
  res.render("pages/about", {
    title: "About Us - Geeta Traders | Authorized Bikaji Agency",
    description:
      "Learn about Geeta Traders, an authorized Bikaji distributor with years of experience serving retailers and customers with premium quality snacks and sweets.",
  });
};

module.exports.contactPage = (req, res) => {
  res.render("pages/contact", {
    title: "Contact Us - Geeta Traders | Bikaji Distributor",
    description:
      "Get in touch with Geeta Traders for bulk orders, retail inquiries, and Bikaji product distribution. Located in Bikaner, Rajasthan.",
  });
};
