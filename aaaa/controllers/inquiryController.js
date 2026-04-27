const Inquiry = require("../models/Inquiry");
const Product = require("../models/Product");
const { validationResult } = require("express-validator");

module.exports.inquiryPage = async (req, res) => {
  try {
    const products = await Product.find({ available: true }).sort({ name: 1 });
    res.render("pages/inquiry", {
      title: "Bulk Order Inquiry - Geeta Traders | Bikaji Distributor",
      description:
        "Submit a bulk order inquiry for Bikaji products. We offer competitive wholesale pricing for retailers and businesses.",
      products,
      productId: req.query.product || "",
    });
  } catch (err) {
    console.error(err);
    res.render("pages/inquiry", {
      title: "Bulk Order Inquiry - Geeta Traders",
      description: "Submit your bulk order inquiry.",
      products: [],
      productId: "",
    });
  }
};

module.exports.submitInquiry = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash("error", errors.array().map((e) => e.msg).join(", "));
      return res.redirect("/inquiry");
    }

    const { name, phone, email, shopName, location, productRequirement, quantity, inquiryType, productId } = req.body;

    const inquiryData = {
      name,
      phone,
      email,
      shopName,
      location,
      productRequirement,
      quantity,
      inquiryType: inquiryType || "general",
    };

    if (productId) {
      inquiryData.product = productId;
      // Increment inquiry count on product
      await Product.findByIdAndUpdate(productId, { $inc: { inquiryCount: 1 } });
    }

    await Inquiry.create(inquiryData);

    req.flash("success", "Your inquiry has been submitted successfully! We will contact you soon.");
    res.redirect("/inquiry");
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to submit inquiry. Please try again.");
    res.redirect("/inquiry");
  }
};
