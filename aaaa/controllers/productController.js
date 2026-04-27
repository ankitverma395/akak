const Product = require("../models/Product");

module.exports.catalogPage = async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    const filter = { available: true };

    if (category && category !== "all") {
      filter.category = category;
    }

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    let sortOption = { sortOrder: 1, name: 1 };
    if (sort === "newest") sortOption = { createdAt: -1 };
    if (sort === "popular") sortOption = { inquiryCount: -1 };
    if (sort === "name-asc") sortOption = { name: 1 };
    if (sort === "name-desc") sortOption = { name: -1 };

    const products = await Product.find(filter).sort(sortOption);
    const categories = await Product.distinct("category", { available: true });

    res.render("pages/catalog", {
      title: "Product Catalog - Geeta Traders | Bikaji Products",
      description:
        "Browse our complete catalog of Bikaji products including Namkeen, Sweets, Snacks, Gift Packs & Papad. Available for bulk and retail orders.",
      products,
      categories,
      selectedCategory: category || "all",
      searchQuery: search || "",
      selectedSort: sort || "default",
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Unable to load products. Please try again.");
    res.redirect("/");
  }
};

module.exports.productDetail = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, available: true });
    if (!product) {
      req.flash("error", "Product not found.");
      return res.redirect("/products");
    }

    // Get related products
    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      available: true,
    }).limit(4);

    res.render("pages/productDetail", {
      title: `${product.name} - Bikaji | Geeta Traders`,
      description: `Buy ${product.name} from Geeta Traders, authorized Bikaji distributor. Available in pack sizes: ${product.packSizes.join(", ")}. Enquire for bulk pricing.`,
      product,
      relatedProducts,
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Unable to load product details.");
    res.redirect("/products");
  }
};
