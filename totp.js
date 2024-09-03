import express from "express";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import qrcodeTerminal from "qrcode-terminal";
import pool from "./db.js";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());
const PORT = 4002;

let secret;
app.get("/generate-qr", async (req, res) => {
  const { emailuser, appname } = req.query;

  if (!emailuser || !appname) {
    return res
      .status(400)
      .json({ error: "Faltan parámetros obligatorios: emailuser y appname" });
  }

  const secret = speakeasy.generateSecret({ length: 3 });
  console.log("secret: ", secret);

  const otpauthUrl = speakeasy.otpauthURL({
    secret: secret.base32,
    label: `${appname}:${emailuser}`,
    issuer: "empresa",
    encoding: "base32",
  });
  console.log("otpauthUrl: ", otpauthUrl);

  const client = await pool.connect();
  try {
    const existingUser = await client.query(
      "SELECT * FROM users WHERE emailuser = $1 AND appname = $2",
      [emailuser, appname]
    );

    if (existingUser.rows.length > 0) {
      await client.query(
        "UPDATE users SET secret = $1 WHERE emailuser = $2 AND appname = $3",
        [secret.base32, emailuser, appname]
      );
    } else {
      await client.query(
        "INSERT INTO users (secret, emailuser, appname, create_time) VALUES ($1, $2, $3, NOW())",
        [secret.base32, emailuser, appname]
      );
    }
  } catch (error) {
    console.error("Error al verificar o insertar el TOTP:", error);
    return res.status(500).json({ error: "Error al manejar la base de datos" });
  } finally {
    client.release();
  }

  qrcodeTerminal.generate(otpauthUrl, { small: true }, function (qrcode) {
    console.log("QR");
    console.log(qrcode);
  });

  qrcode.toDataURL(otpauthUrl, (err, data_url) => {
    if (err) {
      return res.status(500).json({ error: "Error generando QR" });
    } else {
      res.json({ secret: secret.base32, qrcode: data_url });
    }
  });
});

app.post("/verify-totp", async (req, res) => {
  const { token, emailuser, appname } = req.body;

  try {
    const result = await pool.query(
      "SELECT secret FROM users WHERE emailuser = $1 AND appname = $2",
      [emailuser, appname]
    );

    if (result.rows.length === 0) {
      return res.status(400).send("Usuario o aplicación no encontrados.");
    }

    const userSecret = result.rows[0].secret;

    const verified = speakeasy.totp.verify({
      secret: userSecret,
      encoding: "base32",
      token: token,
    });

    if (verified) {
      res.send("🤙🏼🤙🏼🤙🏼🤙🏼");
    } else {
      res.status(400).send("👎🏼👎🏼👎🏼👎🏼");
    }
  } catch (error) {
    console.error("Error al verificar el TOTP:", error);
    res.status(500).json({ error: "Error al verificar el TOTP" });
  }
});

app.get("/generate-totp", (req, res) => {
  if (!secret) {
    return res.status(400).send("Secret no definido. Generar QR primero.");
  }
  const token = speakeasy.totp({ secret: secret.base32, encoding: "base32" });
  res.json({ token });
});

app.get("/saludo", (req, res) => {
  res.send("Hola este es el Servicio de totp 😏");
});

app.listen(PORT, () => console.log("Server de totp en port 4002..."));
