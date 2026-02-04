const db = require("./db/database");

const people = ["Fran", "Eli", "Compartido"];
const categories = [
  "Ocio",
  "Comida",
  "Boticelli",
  "Capricho",
  "Transporte",
  "Necesidad",
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAmount() {
  return Number((Math.random() * 80 + 5).toFixed(2)); // 5€ - 85€
}

function randomDate(start, end) {
  const d = new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
  return d.toISOString().split("T")[0];
}

// 👉 rango de fechas (últimos 6 meses)
const startDate = new Date();
startDate.setMonth(startDate.getMonth() - 6);
const endDate = new Date();

const TOTAL = 120; // 👈 cambia este número si quieres más o menos

let inserted = 0;

for (let i = 0; i < TOTAL; i++) {
  const title = `Gasto ${i + 1}`;
  const amount = randomAmount();
  const person = randomItem(people);
  const category = randomItem(categories);
  const date = randomDate(startDate, endDate);

  db.run(
    `
    INSERT INTO expenses (title, amount, person, category, date)
    VALUES (?, ?, ?, ?, ?)
    `,
    [title, amount, person, category, date],
    (err) => {
      if (err) {
        console.error("Error insertando gasto:", err.message);
      } else {
        inserted++;
        if (inserted === TOTAL) {
          console.log(`✅ ${TOTAL} gastos insertados`);
          process.exit(0);
        }
      }
    }
  );
}