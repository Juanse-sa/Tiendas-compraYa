// pricing_service/server.js
// =====================================================
// Servicio de Precios y Cupones - ComproYa
// =====================================================

// === Cargar variables de entorno ===
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

// === Dependencias ===
import express from "express";
import cors from "cors";
import morgan from "morgan";

// === Inicialización de Express ===
const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// === Datos simulados ===
const PRICES = new Map([
  ["SKU-001", 100],
  ["SKU-002", 50],
  ["SKU-003", 75],
]);

const COUPONS = {
  SAVE10: { type: "percent", value: 10, active: true },
  SAVE20: { type: "percent", value: 20, active: false },
};

// === Endpoints ===

// Obtener el precio de un producto
app.get("/api/pricing/price", (req, res) => {
  const sku = req.query.sku;
  const price = PRICES.get(sku);

  if (!price) return res.status(404).json({ ok: false, reason: "no_price" });

  res.json({ ok: true, sku, price });
});

// Validar un cupón
app.post("/api/pricing/coupons/validate", (req, res) => {
  const { code, itemsTotal } = req.body;

  const coupon = COUPONS[code];
  if (!coupon || !coupon.active)
    return res.json({ valid: false, reason: "invalid" });

  const discount =
    coupon.type === "percent"
      ? (itemsTotal * coupon.value) / 100
      : coupon.value;

  res.json({
    valid: true,
    discount,
    final: Math.max(0, itemsTotal - discount),
  });
});

// Endpoint de salud
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "pricing-coupons-service",
    pricesCount: PRICES.size,
    couponsCount: Object.keys(COUPONS).length,
    time: new Date().toISOString(),
  });
});

// === Puerto dinámico (Cloud Run usa PORT) ===
const PORT = Number(process.env.PORT || process.env.PRICING_PORT || 8080);

app.listen(PORT, () => {
  console.log(`💰 pricing-coupons-service corriendo en puerto :${PORT}`);
});
