import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import authenticateToken from "./middleware/authMiddleware.js";
import authRouter from "./routes/authroutes.js";
import cors from "cors";
import pool from "./db.js";

const app = express();
const port = 4000;

app.use(express.json());
app.use(cors());

pool.connect();

app.use("/auth", authRouter);

app.use(
  "/service1",
  authenticateToken,
  createProxyMiddleware({
    target: "http://localhost:4001",
    changeOrigin: true,
    pathRewrite: {
      "^/service1": "",
    },
  })
);

// Redirecciona las solicitudes al servicio TOTP
app.use(
  "/totp",
  authenticateToken,
  createProxyMiddleware({
    target: "http://localhost:4002", // URL del servicio TOTP
    changeOrigin: true,
    pathRewrite: {
      "^/totp": "", // Elimina el prefijo '/totp' antes de enviar la solicitud
    },
  })
);

app.listen(port, () => {
  console.log(`API Gateway escuchando en el puerto: ${port}`);
});
