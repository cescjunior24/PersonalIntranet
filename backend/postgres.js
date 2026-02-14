const { Pool } = require("pg");

const pool = new Pool({
  user: "francesc",          // tu usuario de postgres
  host: "localhost",
  database: "gastos_app",    // tu base de datos
  password: "",              // deja vacío si no pusiste password
  port: 5432,
});

async function testConnection() {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("✅ PostgreSQL conectado:", res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error conectando a PostgreSQL:", err.message);
    process.exit(1);
  }
}

testConnection();