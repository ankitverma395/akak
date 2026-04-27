const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { isAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Auth routes
router.get("/login", adminController.loginPage);
router.post("/login", adminController.login);
router.get("/logout", adminController.logout);

// Dashboard
router.get("/dashboard", isAdmin, adminController.dashboard);

// Products CRUD
router.get("/products", isAdmin, adminController.productsPage);
router.get("/products/new", isAdmin, adminController.addProductPage);
router.post("/products", isAdmin, upload.single("image"), adminController.addProduct);
router.get("/products/:id/edit", isAdmin, adminController.editProductPage);
router.put("/products/:id", isAdmin, upload.single("image"), adminController.updateProduct);
router.delete("/products/:id", isAdmin, adminController.deleteProduct);

// Inquiries
router.get("/inquiries", isAdmin, adminController.inquiriesPage);
router.put("/inquiries/:id", isAdmin, adminController.updateInquiryStatus);
router.delete("/inquiries/:id", isAdmin, adminController.deleteInquiry);

module.exports = router;
