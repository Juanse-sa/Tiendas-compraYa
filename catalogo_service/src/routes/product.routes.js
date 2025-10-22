import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Cargar .env desde la raíz del servicio
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

// Importar rutas
import productRoutes from "./src/routes/product.routes.js";
import orderRoutes from "./src/routes/order.routes.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Rutas principales
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

const PORT = Number(process.env.PORT || 8080);

app.listen(PORT, () => {
  console.log(`🛒 catalogo-service corriendo en el puerto :${PORT}`);
});
