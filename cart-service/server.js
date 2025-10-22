import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import fetch from "node-fetch";

// === Cargar archivo .env local (solo si existe) ===
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// === Variables de entorno ===
const PRICING_PORT = process.env.PRICING_PORT || 8080;
const PRICING_URL = process.env.PRICING_URL || `http://localhost:${PRICING_PORT}`;

const CARTS = new Map();
const getUser = (req) => req.header("x-user") || "guest";

// === Añadir item al carrito ===
app.post("/api/cart/items", async (req, res) => {
  try {
    const { sku, qty } = req.body;
    const r = await fetch(`${PRICING_URL}/api/pricing/price?sku=${encodeURIComponent(sku)}`);
    if (!r.ok) return res.status(400).json({ ok: false, reason: "no_price" });

    const { price } = await r.json();

    const user = getUser(req);
    const cart = CARTS.get(user) || { items: [], total: 0 };
    const existing = cart.items.find((i) => i.sku === sku);
    if (existing) existing.qty += qty;
    else cart.items.push({ sku, qty, price });

    cart.total = cart.items.reduce((s, i) => s + i.qty * i.price, 0);
    delete cart.final;
    delete cart.coupon;

    CARTS.set(user, cart);
    res.status(201).json(cart);
  } catch (err) {
    console.error("❌ Error en /api/cart/items:", err);
    res.status(500).json({ ok: false, reason: "internal_error" });
  }
});

// === Aplicar cupón ===
app.post("/api/cart/apply-coupon", async (req, res) => {
  try {
    const user = getUser(req);
    const cart = CARTS.get(user);
    if (!cart) return res.status(404).json({ ok: false, reason: "empty" });

    const r = await fetch(`${PRICING_URL}/api/pricing/coupons/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: req.body.code, itemsTotal: cart.total }),
    });
    const data = await r.json();
    if (!data.valid) return res.json({ ok: false, reason: "invalid_coupon" });

    cart.coupon = { code: req.body.code, discount: data.discount };
    cart.final = data.final;
    CARTS.set(user, cart);
    res.json(cart);
  } catch (err) {
    console.error("❌ Error en /api/cart/apply-coupon:", err);
    res.status(500).json({ ok: false, reason: "internal_error" });
  }
});

// === Puerto de escucha ===
// Cloud Run define process.env.PORT automáticamente
const PORT = Number(process.env.PORT || 8080);
app.listen(PORT, "0.0.0.0", () => console.log(`🛒 cart-service escuchando en :${PORT}`));
