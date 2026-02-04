const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Ruta ABSOLUTA al archivo SQLite
const dbPath = path.resolve(__dirname, "database.sqlite");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error al abrir la BD", err);
  } else {
    console.log("Base de datos SQLite conectada ✅");
  }
});


// Crear tabla de restaurantes si no existe
db.run(`
  CREATE TABLE IF NOT EXISTS restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT,
    rating INTEGER,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    person TEXT CHECK(person IN ('Fran', 'Eli', 'Compartido')) NOT NULL,
    category TEXT CHECK(category IN (
      'Ocio',
      'Comida',
      'Boticelli',
      'Capricho',
      'Transporte',
      'Necesidad'
    )) NOT NULL,
    date DATE DEFAULT (DATE('now'))
  )
`);




module.exports = db;