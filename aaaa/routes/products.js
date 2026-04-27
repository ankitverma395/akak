const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

router.get("/", productController.catalogPage);
router.get("/:slug", productController.productDetail);

module.exports = router;
