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

app.use(
  "/totp",
  createProxyMiddleware({
    target: "http://localhost:4002", 
    changeOrigin: true,
    pathRewrite: {
      "^/totp": "", 
    },
  })
);

app.listen(port, () => {
  console.log(`API Gateway escuchando en el puerto: ${port}`);
});
