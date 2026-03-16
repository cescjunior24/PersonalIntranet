require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const pg = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Pool } = pg;

// Devolver fechas como string "YYYY-MM-DD" sin conversión UTC
pg.types.setTypeParser(1082, (val) => val);

// =========================
// APP
// =========================
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";

// =========================
// MIDDLEWARES
// =========================
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// =========================
// POSTGRESQL
// =========================
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
});

db.connect()
  .then(() => console.log("✅ PostgreSQL conectado"))
  .catch((err) => {
    console.error("❌ Error conectando a PostgreSQL", err);
    process.exit(1);
  });

// =========================
// MULTER (IMÁGENES)
// =========================
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, "uploads/"),
  filename: (_, file, cb) => {
    const unique = Date.now() + path.extname(file.originalname);
    cb(null, unique);
  },
});
const upload = multer({ storage });

// =========================
// AUTH MIDDLEWARE
// =========================
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No autorizado" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

// =========================
// HEALTH CHECK
// =========================
app.get("/api/health", (_, res) => res.json({ status: "ok" }));

// =====================================================
// =================== AUTH =========================
// =====================================================

// REGISTER
app.post("/api/auth/register", async (req, res) => {
  const { username, display_name, password, invite_code } = req.body;

  if (!username || !display_name || !password) {
    return res.status(400).json({ error: "Usuario, nombre y contraseña son obligatorios" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }

  try {
    const existing = await db.query(
      "SELECT id FROM users WHERE username = $1",
      [username.toLowerCase()]
    );
    if (existing.rowCount > 0) {
      return res.status(400).json({ error: "Este nombre de usuario ya existe" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    let couple_id = null;
    if (invite_code && invite_code.trim() !== "") {
      const couple = await db.query(
        "SELECT id FROM couples WHERE invite_code = $1",
        [invite_code.trim().toUpperCase()]
      );
      if (couple.rowCount === 0) {
        return res.status(400).json({ error: "Código de invitación inválido" });
      }
      const members = await db.query(
        "SELECT COUNT(*) FROM users WHERE couple_id = $1",
        [couple.rows[0].id]
      );
      if (parseInt(members.rows[0].count) >= 2) {
        return res.status(400).json({ error: "Esta pareja ya está completa" });
      }
      couple_id = couple.rows[0].id;
    }

    const result = await db.query(
      `INSERT INTO users (username, display_name, password_hash, couple_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, display_name, couple_id`,
      [username.toLowerCase(), display_name, password_hash, couple_id]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, username: user.username, display_name: user.display_name },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(201).json({
      token,
      user: { id: user.id, username: user.username, display_name: user.display_name, couple_id: user.couple_id },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contraseña obligatorios" });
  }

  try {
    const result = await db.query(
      "SELECT * FROM users WHERE username = $1",
      [username.toLowerCase()]
    );
    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, display_name: user.display_name },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, display_name: user.display_name, couple_id: user.couple_id },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

// ME
app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, username, display_name, couple_id FROM users WHERE id = $1",
      [req.user.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error" });
  }
});

// FORGOT PASSWORD
app.post("/api/auth/forgot-password", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Usuario obligatorio" });

  try {
    const result = await db.query(
      "SELECT id FROM users WHERE username = $1",
      [username.toLowerCase()]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const user_id = result.rows[0].id;
    await db.query(
      "UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE",
      [user_id]
    );

    const token = crypto.randomBytes(32).toString("hex");
    const expires_at = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await db.query(
      "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user_id, token, expires_at]
    );

    res.json({ reset_token: token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error generando token" });
  }
});

// RESET PASSWORD
app.post("/api/auth/reset-password", async (req, res) => {
  const { token, new_password } = req.body;

  if (!token || !new_password) {
    return res.status(400).json({ error: "Token y nueva contraseña obligatorios" });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }

  try {
    const result = await db.query(
      `SELECT * FROM password_reset_tokens
       WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
      [token]
    );
    if (result.rowCount === 0) {
      return res.status(400).json({ error: "Token inválido o expirado" });
    }

    const { id, user_id } = result.rows[0];
    const password_hash = await bcrypt.hash(new_password, 10);

    await db.query("UPDATE users SET password_hash = $1 WHERE id = $2", [password_hash, user_id]);
    await db.query("UPDATE password_reset_tokens SET used = TRUE WHERE id = $1", [id]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error restableciendo contraseña" });
  }
});

// =====================================================
// =================== COUPLES ======================
// =====================================================

// Generar código de invitación
app.post("/api/couples/generate-invite", authMiddleware, async (req, res) => {
  try {
    const userResult = await db.query(
      "SELECT couple_id FROM users WHERE id = $1",
      [req.user.id]
    );
    const { couple_id } = userResult.rows[0];

    if (couple_id) {
      const coupleResult = await db.query("SELECT * FROM couples WHERE id = $1", [couple_id]);
      return res.json(coupleResult.rows[0]);
    }

    const invite_code = crypto.randomBytes(4).toString("hex").toUpperCase();
    const coupleResult = await db.query(
      "INSERT INTO couples (invite_code) VALUES ($1) RETURNING *",
      [invite_code]
    );
    const couple = coupleResult.rows[0];

    await db.query("UPDATE users SET couple_id = $1 WHERE id = $2", [couple.id, req.user.id]);

    res.status(201).json(couple);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando pareja" });
  }
});

// Unirse a una pareja
app.post("/api/couples/join", authMiddleware, async (req, res) => {
  const { invite_code } = req.body;
  if (!invite_code) return res.status(400).json({ error: "Código obligatorio" });

  try {
    const coupleResult = await db.query(
      "SELECT * FROM couples WHERE invite_code = $1",
      [invite_code.trim().toUpperCase()]
    );
    if (coupleResult.rowCount === 0) {
      return res.status(404).json({ error: "Código inválido" });
    }

    const couple = coupleResult.rows[0];
    const members = await db.query(
      "SELECT id FROM users WHERE couple_id = $1",
      [couple.id]
    );

    if (members.rows.some((m) => m.id === req.user.id)) {
      return res.status(400).json({ error: "Ya formas parte de esta pareja" });
    }
    if (members.rowCount >= 2) {
      return res.status(400).json({ error: "Esta pareja ya está completa" });
    }

    await db.query("UPDATE users SET couple_id = $1 WHERE id = $2", [couple.id, req.user.id]);
    res.json({ success: true, couple });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error uniéndose a la pareja" });
  }
});

// Info de la pareja
app.get("/api/couples/info", authMiddleware, async (req, res) => {
  try {
    const userResult = await db.query(
      "SELECT couple_id FROM users WHERE id = $1",
      [req.user.id]
    );
    const { couple_id } = userResult.rows[0];

    if (!couple_id) return res.json({ couple: null, members: [] });

    const coupleResult = await db.query("SELECT * FROM couples WHERE id = $1", [couple_id]);
    const membersResult = await db.query(
      "SELECT id, username, display_name FROM users WHERE couple_id = $1",
      [couple_id]
    );

    res.json({ couple: coupleResult.rows[0], members: membersResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo info de pareja" });
  }
});

// =====================================================
// =================== CATEGORIES ====================
// =====================================================

// GET — categorías del usuario/pareja
app.get("/api/categories", authMiddleware, async (req, res) => {
  try {
    const userResult = await db.query(
      "SELECT couple_id FROM users WHERE id = $1",
      [req.user.id]
    );
    const { couple_id } = userResult.rows[0];

    let result;
    if (couple_id) {
      result = await db.query(
        "SELECT * FROM categories WHERE couple_id = $1 ORDER BY name ASC",
        [couple_id]
      );
    } else {
      result = await db.query(
        "SELECT * FROM categories WHERE user_id = $1 AND couple_id IS NULL ORDER BY name ASC",
        [req.user.id]
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo categorías" });
  }
});

// POST — crear categoría
app.post("/api/categories", authMiddleware, async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "El nombre es obligatorio" });
  }

  try {
    const userResult = await db.query(
      "SELECT couple_id FROM users WHERE id = $1",
      [req.user.id]
    );
    const { couple_id } = userResult.rows[0];

    // Comprobar que no exista ya con el mismo nombre
    const existing = couple_id
      ? await db.query(
          "SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND couple_id = $2",
          [name.trim(), couple_id]
        )
      : await db.query(
          "SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND user_id = $2 AND couple_id IS NULL",
          [name.trim(), req.user.id]
        );

    if (existing.rowCount > 0) {
      return res.status(400).json({ error: "Ya existe una categoría con ese nombre" });
    }

    const result = await db.query(
      "INSERT INTO categories (name, couple_id, user_id) VALUES ($1, $2, $3) RETURNING *",
      [name.trim(), couple_id, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando categoría" });
  }
});

// DELETE — eliminar categoría
app.delete("/api/categories/:id", authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      "DELETE FROM categories WHERE id = $1 RETURNING id",
      [req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error eliminando categoría" });
  }
});

// =====================================================
// ===================== EXPENSES =======================
// =====================================================

app.get("/api/expenses", authMiddleware, async (_, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM expenses ORDER BY date DESC, id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo gastos" });
  }
});

app.post("/api/expenses", authMiddleware, async (req, res) => {
  const { title, amount, person, category, date } = req.body;

  if (!title || !amount || !person || !category) {
    return res.status(400).json({ error: "Campos obligatorios" });
  }

  const finalDate = date || new Date().toISOString().split("T")[0];

  try {
    const result = await db.query(
      `INSERT INTO expenses (title, amount, person, category, date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, amount, person, category, finalDate]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando gasto" });
  }
});

app.put("/api/expenses/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, amount, person, category, date } = req.body;

  try {
    const result = await db.query(
      `UPDATE expenses
       SET title = $1, amount = $2, person = $3, category = $4, date = $5
       WHERE id = $6
       RETURNING *`,
      [title, amount, person, category, date, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Gasto no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando gasto" });
  }
});

app.delete("/api/expenses/:id", authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      "DELETE FROM expenses WHERE id = $1",
      [req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Gasto no encontrado" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error eliminando gasto" });
  }
});

// =====================================================
// =================== RESTAURANTS ======================
// =====================================================

app.get("/api/restaurants", authMiddleware, async (_, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM restaurants ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo restaurantes" });
  }
});

app.post("/api/restaurants", authMiddleware, upload.single("image"), async (req, res) => {
  const { name, city, rating, comment, visitDate } = req.body;
  const imagePath = req.file ? `uploads/${req.file.filename}` : null;

  if (!name || !visitDate) {
    return res.status(400).json({ error: "Campos obligatorios" });
  }

  try {
    const result = await db.query(
      `INSERT INTO restaurants (name, city, rating, comment, visit_date, image)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, city, rating, comment, visitDate, imagePath]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando restaurante" });
  }
});

app.put("/api/restaurants/:id", authMiddleware, upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { name, city, rating, comment, visitDate } = req.body;
  const imagePath = req.file ? `uploads/${req.file.filename}` : null;

  try {
    const result = await db.query(
      `UPDATE restaurants
       SET name = $1, city = $2, rating = $3, comment = $4,
           visit_date = $5, image = COALESCE($6, image)
       WHERE id = $7
       RETURNING *`,
      [name, city, rating, comment, visitDate, imagePath, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "No encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando restaurante" });
  }
});

app.delete("/api/restaurants/:id", authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      "DELETE FROM restaurants WHERE id = $1",
      [req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "No encontrado" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error eliminando restaurante" });
  }
});

// =====================================================
// ================= FRONTEND PROD =====================
// =====================================================
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get(/.*/, (_, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// =========================
// START SERVER
// =========================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
