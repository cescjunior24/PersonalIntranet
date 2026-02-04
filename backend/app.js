const express = require("express");
const cors = require("cors");
const db = require("./db/database");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

// =========================
// MIDDLEWARE GLOBAL
// =========================
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// =========================
// MULTER CONFIG
// =========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// =========================
// API ROUTES
// =========================

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// =========================
// RESTAURANTS
// =========================
app.get("/api/restaurants", (req, res) => {
  db.all(
    "SELECT * FROM restaurants ORDER BY created_at DESC",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

app.post("/api/restaurants", upload.single("image"), (req, res) => {
  const { name, city, rating, comment, visitDate } = req.body;
  const imagePath = req.file ? `uploads/${req.file.filename}` : null;

  db.run(
    `
    INSERT INTO restaurants (name, city, rating, comment, visit_date, image)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [name, city, rating, comment, visitDate, imagePath],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        id: this.lastID,
        name,
        city,
        rating,
        comment,
        visit_date: visitDate,
        image: imagePath,
      });
    }
  );
});

app.put("/api/restaurants/:id", upload.single("image"), (req, res) => {
  const { id } = req.params;
  const { name, city, rating, comment, visitDate } = req.body;

  const imagePath = req.file ? `uploads/${req.file.filename}` : null;

  const sql = imagePath
    ? `
      UPDATE restaurants
      SET name = ?, city = ?, rating = ?, comment = ?, visit_date = ?, image = ?
      WHERE id = ?
    `
    : `
      UPDATE restaurants
      SET name = ?, city = ?, rating = ?, comment = ?, visit_date = ?
      WHERE id = ?
    `;

  const params = imagePath
    ? [name, city, rating, comment, visitDate, imagePath, id]
    : [name, city, rating, comment, visitDate, id];

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({
      id,
      name,
      city,
      rating,
      comment,
      visit_date: visitDate,
      image: imagePath,
    });
  });
});

app.delete("/api/restaurants/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM restaurants WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
});

// =========================
// EXPENSES
// =========================
app.get("/api/expenses", (req, res) => {
  db.all(
    "SELECT * FROM expenses ORDER BY date DESC",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

app.post("/api/expenses", (req, res) => {
  const { title, amount, person, category, date } = req.body;

  if (!title || !amount || !person || !category) {
    return res.status(400).json({
      error: "Faltan campos obligatorios",
    });
  }

  const finalDate =
    date || new Date().toISOString().split("T")[0];

  db.run(
    `
    INSERT INTO expenses (title, amount, person, category, date)
    VALUES (?, ?, ?, ?, ?)
    `,
    [title, amount, person, category, finalDate],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        id: this.lastID,
        title,
        amount,
        person,
        category,
        date: finalDate,
      });
    }
  );
});

app.delete("/api/expenses/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM expenses WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({ success: true });
  });
});


app.put("/api/expenses/:id", (req, res) => {
  const { id } = req.params;
  const { title, amount, person, category, date } = req.body;

  if (!title || !amount || !person || !category) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  db.run(
    `
      UPDATE expenses
      SET title = ?, amount = ?, person = ?, category = ?, date = ?
      WHERE id = ?
    `,
    [title, amount, person, category, date, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        id: Number(id),
        title,
        amount,
        person,
        category,
        date,
      });
    }
  );
});

// =========================
// ❗ PROTECCIÓN API (CLAVE)
// =========================
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

// =========================
// SERVIR FRONTEND (PRODUCCIÓN)
// =========================
app.use(
  express.static(
    path.join(__dirname, "../frontend/dist")
  )
);

// React Router fallback — EXPRESS 5 SAFE
app.use((req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/dist/index.html")
  );
});

// =========================
// START SERVER
// =========================
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});