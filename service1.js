import express from "express";
import pool from "./db.js";
import cors from "cors";
const app = express();
app.use(express.json());
app.use(cors());
const port = 4001;

let secret;
app.get("/", (req, res) => {
  
  res.send("Respuesta desde el Servicio 1 🤨");
});
app.get("/saludo", (req, res) => {
  res.send("Hola este es el Servicio 1 🤨");
});
app.listen(port, () => {
  console.log(`Servicio 1 escuchando en http://localhost:${port}`);
});
