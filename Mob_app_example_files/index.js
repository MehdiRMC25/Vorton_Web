const path = require("path");
const envPath = path.resolve(__dirname, "..", ".env");
const envCwd = path.resolve(process.cwd(), ".env");
require("dotenv").config({ path: envPath });
require("dotenv").config({ path: envCwd });
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const products = require("./products");

const app = express();
const PORT = process.env.PORT || 3001;

// Email transporter setup
let emailTransporter = null;
if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  emailTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587", 10),
    secure: false, // true for 465, false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  console.log(`Email configured: ${process.env.EMAIL_USER} → ${process.env.EMAIL_TO}`);
} else {
  console.log("Email not configured (missing EMAIL_HOST, EMAIL_USER, or EMAIL_PASS)");
}

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => res.send("Vorton API. Use GET /api/health, GET /api/home-videos, GET /api/products, GET /api/products/:id, POST /api/notify-cart, POST /api/create-payment, GET /api/payment-return"));

// Kapital Bank hosted payment: create session and return payment page URL (iframe/hosted page).
// You will paste KAPITAL_HOSTED_PAYMENT_URL (and optionally other env vars) from Kapital Bank.
app.post("/api/create-payment", (req, res) => {
  try {
    const baseUrl = process.env.KAPITAL_HOSTED_PAYMENT_URL || process.env.PAYMENT_HOSTED_URL || "";
    if (!baseUrl.trim()) {
      return res.status(400).json({ ok: false, error: "Payment not configured. Set KAPITAL_HOSTED_PAYMENT_URL (or PAYMENT_HOSTED_URL) on the server." });
    }
    const { amount, orderId, returnUrl, cancelUrl, description } = req.body || {};
    const orderIdStr = String(orderId || "").trim() || `vorton-${Date.now()}`;
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid amount" });
    }
    const backendUrl = process.env.BACKEND_PUBLIC_URL || process.env.EXPO_PUBLIC_API_URL || `http://localhost:${PORT}`;
    const defaultReturn = `${backendUrl.replace(/\/$/, "")}/api/payment-return?status=success&orderId=${encodeURIComponent(orderIdStr)}`;
    const defaultCancel = `${backendUrl.replace(/\/$/, "")}/api/payment-return?status=cancel&orderId=${encodeURIComponent(orderIdStr)}`;
    const params = new URLSearchParams({
      amount: amountNum.toFixed(2),
      orderId: orderIdStr,
      returnUrl: returnUrl && returnUrl.trim() ? returnUrl.trim() : defaultReturn,
      cancelUrl: cancelUrl && cancelUrl.trim() ? cancelUrl.trim() : defaultCancel,
    });
    if (description && String(description).trim()) params.set("description", String(description).trim());
    const sep = baseUrl.includes("?") ? "&" : "?";
    const paymentUrl = `${baseUrl.replace(/\?$/, "")}${sep}${params.toString()}`;
    res.json({ ok: true, paymentUrl, orderId: orderIdStr });
  } catch (err) {
    console.error("[api/create-payment]", err);
    res.status(500).json({ ok: false, error: err.message || "Server error" });
  }
});

// Return URL after payment: Kapital Bank redirects the user here. Show a simple page so in-app WebView can detect success/cancel.
app.get("/api/payment-return", (req, res) => {
  const status = (req.query.status || "").toLowerCase();
  const orderId = req.query.orderId || "";
  const isSuccess = status === "success";
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(
    `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Payment ${isSuccess ? "success" : "cancelled"}</title></head><body style="font-family:sans-serif;padding:2rem;text-align:center;background:#111;color:#eee;">` +
    `<p style="font-size:1.2rem;">${isSuccess ? "Payment successful." : "Payment was cancelled."}</p>` +
    `<p>Order ID: ${orderId || "—"}</p>` +
    `<p style="margin-top:1.5rem;color:#aaa;">You can close this page and return to the app.</p></body></html>`
  );
});
app.get("/api/home-videos", async (req, res) => {
  try {
    const videoUrls = await products.getHomeVideos();
    res.json({ ok: true, videoUrls });
  } catch (e) {
    res.status(500).json({ ok: false, videoUrls: [] });
  }
});
app.get("/api/health", async (req, res) => {
  let result = { connected: false, error: "Check failed" };
  try {
    result = await products.checkConnection();
  } catch (e) {
    result = { connected: false, error: (e && e.message) || String(e) };
  }
  res.json({
    ok: true,
    message: "Server running",
    mongodbConnected: result.connected,
    mongodbError: result.connected ? undefined : result.error,
  });
});

app.post("/api/notify-cart", async (req, res) => {
  try {
    const { cart } = req.body;
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.json({ ok: true, message: "Empty cart, no email sent" });
    }
    
    // Build email content
    const items = cart.map((item, i) => 
      `${i + 1}. ${item.name} (SKU: ${item.sku})\n   Color: ${item.color}, Size: ${item.size}, Qty: ${item.quantity}\n   Price: ₼${item.price}${item.discountedPrice ? ` → ₼${item.discountedPrice}` : ""}`
    ).join("\n\n");
    
    const subtotal = cart.reduce((sum, item) => {
      const price = item.discountedPrice && item.discountedPrice < item.price ? item.discountedPrice : item.price;
      return sum + (price * item.quantity);
    }, 0);
    
    const emailBody = `New Order from VortonApp\n\n${items}\n\nSubtotal: ₼${subtotal.toFixed(2)}\nShipping: ₼10.00\nTotal: ₼${(subtotal + 10).toFixed(2)}`;
    
    console.log("[Order received]\n", emailBody);
    
    // Send email if configured
    if (emailTransporter && process.env.EMAIL_TO) {
      try {
        await emailTransporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: process.env.EMAIL_TO,
          subject: "New Order from VortonApp",
          text: emailBody,
        });
        console.log(`Email sent to ${process.env.EMAIL_TO}`);
        res.json({ ok: true, message: "Order placed and email sent" });
      } catch (emailErr) {
        console.error("[Email error]", emailErr);
        res.json({ ok: true, message: "Order received but email failed to send" });
      }
    } else {
      res.json({ ok: true, message: "Order received (email not configured)" });
    }
  } catch (err) {
    console.error("[api/notify-cart]", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/product-variants/:baseSku", async (req, res) => {
  try {
    const baseSku = req.params.baseSku;
    if (!baseSku) return res.status(400).json({ ok: false, error: "baseSku required" });
    const variants = await products.getVariantsByBaseSku(baseSku);
    res.set("Cache-Control", "public, max-age=300, s-maxage=300");
    res.json({ ok: true, variants });
  } catch (err) {
    console.error("[api/product-variants]", err);
    const msg = toUserMessage(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const category = req.query.category;
    const categories = req.query.categories; // e.g. "men,unisex"
    let list;
    let fromFallback = false;
    if (categories) {
      const valid = ["men", "women", "unisex"];
      const cats = String(categories).toLowerCase().split(",").map(c => c.trim()).filter(c => valid.includes(c));
      if (cats.length > 0) {
        const results = await Promise.all(cats.map(c => products.getProductsByCategory(c)));
        const seen = new Set();
        list = [];
        for (const arr of results) {
          for (const p of arr) {
            if (!seen.has(p.id)) { seen.add(p.id); list.push(p); }
          }
        }
        list.sort((a, b) => (a.sku || "").localeCompare(b.sku || "") || (a.id || "").localeCompare(b.id || ""));
      } else {
        const result = await products.getAllProducts();
        list = result.list || result;
        fromFallback = result.fromFallback || false;
      }
    } else if (category && ["men", "women", "unisex"].includes(String(category).toLowerCase())) {
      list = await products.getProductsByCategory(String(category).toLowerCase());
    } else {
      const result = await products.getAllProducts();
      list = result.list || result;
      fromFallback = result.fromFallback || false;
    }
    const onePerModel = req.query.onePerModel === "1" || req.query.onePerModel === "true" || req.query.listView === "1";
    if (onePerModel && list && list.length > 0) {
      list = products.oneProductPerBaseSku(list);
    }
    res.set("Cache-Control", "public, max-age=300, s-maxage=300");
    res.json({ ok: true, products: list, fromFallback });
  } catch (err) {
    console.error("[api/products]", err);
    const msg = toUserMessage(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await products.getProductById(req.params.id);
    if (!product) return res.status(404).json({ ok: false, error: "Product not found" });
    res.set("Cache-Control", "public, max-age=300, s-maxage=300");
    res.json({ ok: true, product });
  } catch (err) {
    console.error("[api/products/:id]", err);
    const msg = toUserMessage(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

function toUserMessage(err) {
  const m = (err && err.message) ? String(err.message) : "";
  if (/authentication failed|bad auth|credentials/i.test(m)) {
    return "Database login failed. In .env check MONGODB_URI: use the database username and password from Atlas → Database Access. If the password has special characters (@ # : / ?), run: node scripts/encodePassword.js YOUR_PASSWORD and put the result in the URI.";
  }
  if (/ENOTFOUND|getaddrinfo|ECONNREFUSED/i.test(m)) {
    return "Cannot reach MongoDB. Check MONGODB_URI host and Atlas → Network Access (allow your IP or 0.0.0.0/0).";
  }
  return m || "Server error.";
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`LAN: use http://YOUR_PC_IP:${PORT} from phone (same Wi-Fi)`);
  const hasUri = !!process.env.MONGODB_URI;
  console.log(`MONGODB_URI: ${hasUri ? "set" : "NOT SET (using fallback data)"}`);
  if (hasUri) {
    products.checkConnection().then((r) => {
      if (r.connected) console.log("MongoDB: connected");
      else console.warn("MongoDB: failed -", r.error);
    }).catch((e) => console.warn("MongoDB: check failed -", e && e.message));
  }
});
