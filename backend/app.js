const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const { Pool } = require("pg");

// =========================
// APP
// =========================
const app = express();
const PORT = process.env.PORT || 3001;

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
  host: process.env.DB_HOST || "localhost",
  port: 5432,
  user: process.env.DB_USER || "francesc",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "gastos_app",
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
// HEALTH CHECK
// =========================
app.get("/api/health", (_, res) => {
  res.json({ status: "ok" });
});

// =====================================================
// ===================== EXPENSES =======================
// =====================================================

// GET all expenses
app.get("/api/expenses", async (_, res) => {
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

// CREATE expense
app.post("/api/expenses", async (req, res) => {
  const { title, amount, person, category, date } = req.body;

  if (!title || !amount || !person || !category) {
    return res.status(400).json({ error: "Campos obligatorios" });
  }

  const finalDate =
    date || new Date().toISOString().split("T")[0];

  try {
    const result = await db.query(
      `
      INSERT INTO expenses (title, amount, person, category, date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [title, amount, person, category, finalDate]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando gasto" });
  }
});

// UPDATE expense
app.put("/api/expenses/:id", async (req, res) => {
  const { id } = req.params;
  const { title, amount, person, category, date } = req.body;

  try {
    const result = await db.query(
      `
      UPDATE expenses
      SET title = $1,
          amount = $2,
          person = $3,
          category = $4,
          date = $5
      WHERE id = $6
      RETURNING *
      `,
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

// DELETE expense
app.delete("/api/expenses/:id", async (req, res) => {
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

// GET restaurants
app.get("/api/restaurants", async (_, res) => {
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

// CREATE restaurant
app.post(
  "/api/restaurants",
  upload.single("image"),
  async (req, res) => {
    const { name, city, rating, comment, visitDate } = req.body;
    const imagePath = req.file
      ? `uploads/${req.file.filename}`
      : null;

    if (!name || !visitDate) {
      return res.status(400).json({ error: "Campos obligatorios" });
    }

    try {
      const result = await db.query(
        `
        INSERT INTO restaurants
        (name, city, rating, comment, visit_date, image)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [name, city, rating, comment, visitDate, imagePath]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error creando restaurante" });
    }
  }
);

// UPDATE restaurant
app.put(
  "/api/restaurants/:id",
  upload.single("image"),
  async (req, res) => {
    const { id } = req.params;
    const { name, city, rating, comment, visitDate } = req.body;

    const imagePath = req.file
      ? `uploads/${req.file.filename}`
      : null;

    try {
      const result = await db.query(
        `
        UPDATE restaurants
        SET name = $1,
            city = $2,
            rating = $3,
            comment = $4,
            visit_date = $5,
            image = COALESCE($6, image)
        WHERE id = $7
        RETURNING *
        `,
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
  }
);

// DELETE restaurant
app.delete("/api/restaurants/:id", async (req, res) => {
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
  res.sendFile(
    path.join(__dirname, "../frontend/dist/index.html")
  );
});

// =========================
// START SERVER
// =========================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});