if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// Fix for MongoDB Atlas DNS issue in Node.js v22+
const dns = require('node:dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const methodOverride = require("method-override");

const indexRoutes = require("./routes/index");
const productRoutes = require("./routes/products");
const inquiryRoutes = require("./routes/inquiry");
const adminRoutes = require("./routes/admin");
const apiRoutes = require("./routes/api");

const app = express();

// ─── Database Connection ─────────────────────────────────
const dbUrl = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/geeta-traders";

mongoose.connect(dbUrl)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ─── Engine & Middleware ─────────────────────────────────
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── Session Config ──────────────────────────────────────
const sessionSecret = process.env.SESSION_SECRET || "geeta_traders_default_secret_123";

const store = MongoStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 3600,
});

store.on("error", (e) => console.log("SESSION STORE ERROR:", e));

const sessionConfig = {
  store,
  name: "gt_session",
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  },
};

app.use(session(sessionConfig));
app.use(flash());

// ─── Global Locals ───────────────────────────────────────
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.session.userId || null;
  res.locals.isAdmin = req.session.isAdmin || false;
  res.locals.whatsappNumber = process.env.WHATSAPP_NUMBER || "919876543210";
  res.locals.businessPhone = process.env.BUSINESS_PHONE || "+91 98765 43210";
  res.locals.businessEmail = process.env.BUSINESS_EMAIL || "geetatraders@gmail.com";
  res.locals.businessAddress = process.env.BUSINESS_ADDRESS || "Main Market Road, Bikaner, Rajasthan 334001";
  next();
});

// ─── Routes ──────────────────────────────────────────────
app.use("/", indexRoutes);
app.use("/products", productRoutes);
app.use("/inquiry", inquiryRoutes);
app.use("/admin", adminRoutes);
app.use("/api", apiRoutes);

// ─── 404 Handler ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render("pages/404", {
    title: "Page Not Found - Geeta Traders",
    description: "The page you're looking for doesn't exist.",
  });
});

// ─── Error Handler ───────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  const { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).render("pages/error", {
    title: "Error - Geeta Traders",
    description: "An error occurred.",
    message,
    statusCode,
  });
});

// ─── Start Server ────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Geeta Traders server running on http://localhost:${PORT}`);
});
