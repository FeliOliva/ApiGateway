import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import pool from "../db.js";

dotenv.config();
const secretKey = process.env.SECRET_KEY;

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Se requieren nombre de usuario y contraseña" });
  }

  const client = await pool.connect();
  try {
    const existingUser = await client.query(
      "SELECT * FROM client WHERE username = $1",
      [username]
    );

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];

      if (password === user.password) {
        const token = generateToken({ username });
        await client.query("UPDATE client SET token = $1 WHERE username = $2", [
          token,
          username,
        ]);
        res.json({ token });
      } else {
        res.status(401).json({ error: "Contraseña incorrecta" });
      }
    } else {
      res.status(401).json({ error: "Usuario no registrado" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al conectar con la base de datos" });
  } finally {
    client.release();
  }
});

//Genera Token
const generateToken = (user) => {
  return jwt.sign(user, secretKey, { expiresIn: "1h" });
};

export default router;
