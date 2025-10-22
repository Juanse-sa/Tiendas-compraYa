// catalog_service/server.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

// ======== Carga .env ========
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carga variables desde .env raíz (por si se ejecuta desde Cloud Run)
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ======== CONFIG DB ========
const DB = {
  host: process.env.MYSQL_HOST || "127.0.0.1",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "retailBD",
};

let pool = null;
let dbReady = false;
let queryUsed = null;

// ======== Consultas candidatas (auto-detecta tu tabla) ========
const CANDIDATE_QUERIES = [
  `SELECT id_producto, nom_producto, pre_producto, cat_producto, imagen FROM productos`,
  `SELECT id AS id_producto, nombre AS nom_producto, precio AS pre_producto, categoria AS cat_producto, imagen FROM productos`,
  `SELECT id AS id_producto, nombre AS nom_producto, precio AS pre_producto, categoria AS cat_producto, imagen FROM producto`,
  `SELECT id AS id_producto, title AS nom_producto, price AS pre_producto, category AS cat_producto, image AS imagen FROM productos`,
  `SELECT id AS id_producto, nombre AS nom_producto, precio AS pre_producto, categoria AS cat_producto, imagen FROM items`,
];

const oneLine = (s) => s.replace(/\s+/g, " ").trim();

// ======== Inicializa conexión a MySQL ========
async function initDB() {
  try {
    pool = mysql.createPool({
      host: DB.host,
      port: DB.port,
      user: DB.user,
      password: DB.password,
      database: DB.database,
      waitForConnections: true,
      connectionLimit: 5,
      timezone: "Z"
    });

    for (const q of CANDIDATE_QUERIES) {
      try {
        const [rows] = await pool.query(q + " LIMIT 1");
        if (Array.isArray(rows)) {
          queryUsed = q;
          break;
        }
      } catch (_) { /* intenta la siguiente */ }
    }

    if (!queryUsed) {
      console.warn("⚠️ No se encontró una tabla compatible. Se usará MOCK.");
      dbReady = false;
    } else {
      console.log("✅ Catálogo leerá con query:", oneLine(queryUsed));
      dbReady = true;
    }
  } catch (err) {
    console.error("❌ Error creando pool MySQL:", err.message);
    dbReady = false;
  }
}

// ======== Productos mock si DB no funciona ========
const mockProducts = [
  { id_producto: 1, nom_producto: "Televisor 50\"", pre_producto: 1499000, cat_producto: "Electrodomésticos", imagen: "/uploads/tv.jpg" },
  { id_producto: 2, nom_producto: "Cafetera", pre_producto: 189000, cat_producto: "Hogar", imagen: "/uploads/cafetera.jpg" },
  { id_producto: 3, nom_producto: "Camiseta básica", pre_producto: 35000, cat_producto: "Ropa", imagen: "/uploads/shirt.jpg" },
  { id_producto: 4, nom_producto: "Pizza familiar", pre_producto: 45000, cat_producto: "Comida", imagen: "/uploads/pizza.jpg" },
];

// ======== Archivos estáticos ========
const uploadsDir = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsDir));

// ======== Health check ========
app.get("/health", async (_req, res) => {
  res.json({
    ok: true,
    db: dbReady ? "ok" : "mock",
    mysql: { ...DB, password: DB.password ? "****" : "" },
    queryUsed: queryUsed ? oneLine(queryUsed) : null,
    time: new Date().toISOString()
  });
});

// ======== Endpoint principal ========
app.get("/api/catalog", async (_req, res) => {
  try {
    if (dbReady && pool && queryUsed) {
      const [rows] = await pool.query(queryUsed);
      return res.json(rows);
    }
    return res.json(mockProducts);
  } catch (e) {
    console.error("Error /api/catalog:", e.message);
    res.status(500).json({ message: "Error al leer catálogo" });
  }
});

// Accesos alternativos
app.get("/catalog", (req, res) => res.json(mockProducts));
app.get("/productos", (req, res) => res.json(mockProducts));

// ======== Puerto ========
const PORT = Number(process.env.PORT || process.env.CATALOG_PORT || 8080);
app.listen(PORT, () => console.log(`📦 Catalog service en puerto :${PORT}`));

// ======== Inicializa DB ========
initDB();

