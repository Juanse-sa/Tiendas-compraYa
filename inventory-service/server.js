// inventory_service/server.js
// ==============================================
// Servicio de Inventario - Tiendas ComproYa
// ==============================================

// === Cargar variables de entorno ===
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

// === Dependencias principales ===
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { Sequelize, DataTypes } from "sequelize";

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// === Conexión a MySQL ===
const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    dialect: "mysql",
    logging: false,
  }
);

// === Modelo: Stock por tienda ===
const Stock = sequelize.define(
  "Stock",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    store_id: { type: DataTypes.STRING(20), allowNull: false },
    sku: { type: DataTypes.STRING(50), allowNull: false },
    available: { type: DataTypes.INTEGER, defaultValue: 0 },
    reserved: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  { tableName: "store_stock" }
);

// === Endpoint: Cargar datos de ejemplo ===
app.post("/api/inventory/seed", async (_req, res) => {
  try {
    await Stock.bulkCreate(
      [
        { store_id: "S001", sku: "SKU-001", available: 10, reserved: 0 },
        { store_id: "S001", sku: "SKU-002", available: 5, reserved: 0 },
      ],
      { ignoreDuplicates: true }
    );
    res.json({ ok: true, message: "Datos de inventario cargados." });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// === Endpoint: Consultar stock ===
app.get("/api/inventory/stock", async (req, res) => {
  const { store, sku } = req.query;
  const where = {};
  if (store) where.store_id = store;
  if (sku) where.sku = sku;

  try {
    const rows = await Stock.findAll({ where });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// === Endpoint: Reservar productos ===
app.post("/api/inventory/reservations", async (req, res) => {
  const { store_id, sku, qty } = req.body;

  try {
    const row = await Stock.findOne({ where: { store_id, sku } });
    if (!row || row.available < qty)
      return res.status(409).json({ ok: false, reason: "no_stock" });

    row.available -= qty;
    row.reserved += qty;
    await row.save();
    res.status(201).json({ ok: true, message: "Reserva creada" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// === Endpoint: Confirmar reservas ===
app.post("/api/inventory/confirm", async (req, res) => {
  const { store_id, sku, qty } = req.body;

  try {
    const row = await Stock.findOne({ where: { store_id, sku } });
    if (!row || row.reserved < qty)
      return res.status(409).json({ ok: false, reason: "no_reserved" });

    row.reserved -= qty;
    await row.save();
    res.json({ ok: true, message: "Reserva confirmada" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// === Puerto y arranque del servicio ===
const PORT = Number(process.env.PORT || process.env.INVENTORY_PORT || 8080);

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // crea la tabla si no existe
    app.listen(PORT, () =>
      console.log(`🏪 inventory-service escuchando en :${PORT}`)
    );
  } catch (e) {
    console.error("❌ Error arrancando inventory:", e.message);
    process.exit(1);
  }
})();

