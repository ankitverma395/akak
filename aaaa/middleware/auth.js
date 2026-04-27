// Auth middleware for admin routes
module.exports.isAdmin = (req, res, next) => {
  if (req.session.isAdmin) {
    return next();
  }
  req.flash("error", "You must be logged in as admin to access that page.");
  res.redirect("/admin/login");
};

// Rate limiting middleware (simple in-memory)
const requestCounts = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // per window

module.exports.rateLimiter = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return next();
  }

  const record = requestCounts.get(ip);
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + WINDOW_MS;
    return next();
  }

  if (record.count >= MAX_REQUESTS) {
    req.flash("error", "Too many requests. Please try again later.");
    return res.redirect("back");
  }

  record.count++;
  next();
};
