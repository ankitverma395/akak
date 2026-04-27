const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const inquiryController = require("../controllers/inquiryController");
const { rateLimiter } = require("../middleware/auth");

// Validation rules
const inquiryValidation = [
  body("name").trim().notEmpty().withMessage("Name is required").escape(),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[0-9+\-\s()]{7,15}$/)
    .withMessage("Please enter a valid phone number"),
  body("productRequirement")
    .trim()
    .notEmpty()
    .withMessage("Product requirement is required")
    .escape(),
  body("email").optional({ checkFalsy: true }).isEmail().withMessage("Invalid email").normalizeEmail(),
  body("shopName").optional().trim().escape(),
  body("location").optional().trim().escape(),
  body("quantity").optional().trim().escape(),
];

router.get("/", inquiryController.inquiryPage);
router.post("/", rateLimiter, inquiryValidation, inquiryController.submitInquiry);

module.exports = router;
