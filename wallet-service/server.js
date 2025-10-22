// wallet_service/server.js
// =====================================================
// Servicio de Wallet - ComproYa
// =====================================================

// === Cargar variables de entorno desde la raíz ===
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

// === Datos simulados en memoria ===
// Cada usuario tiene una lista de cupones
const WALLET = new Map();

// Datos precargados para pruebas
WALLET.set("guest", [
  { code: "SAVE10", status: "active", expiresAt: "2025-12-31" },
]);

WALLET.set("jp", [
  { code: "SAVE10", status: "active", expiresAt: "2025-12-31" },
  { code: "WELCOME5", status: "active", expiresAt: "2026-01-01" },
]);

// === Endpoints ===

// Obtener cupones del usuario
app.get("/api/wallet", (req, res) => {
  const user = req.header("x-user") || "guest";
  res.json({ user, coupons: WALLET.get(user) || [] });
});

// Agregar un cupón manualmente (para pruebas)
app.post("/api/wallet/add", (req, res) => {
  const user = req.header("x-user") || "guest";
  const { code } = req.body;

  if (!code) return res.status(400).json({ ok: false, reason: "missing_code" });

  const list = WALLET.get(user) || [];
  if (list.find((c) => c.code === code)) {
    return res.json({ ok: false, reason: "already_exists" });
  }

  list.push({
    code,
    status: "active",
    expiresAt: "2025-12-31",
  });

  WALLET.set(user, list);
  res.status(201).json({ ok: true, coupons: list });
});

// Endpoint de salud
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "wallet-service",
    users: WALLET.size,
    time: new Date().toISOString(),
  });
});

// === Puerto (Cloud Run usa PORT) ===
const PORT = Number(process.env.PORT || process.env.WALLET_PORT || 8080);

app.listen(PORT, () =>
  console.log(`🎟️ wallet-service corriendo en puerto :${PORT}`)
);
