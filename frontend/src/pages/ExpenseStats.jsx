import { useEffect, useState } from "react";
import { API_URL } from "../config";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import "./ExpenseStats.css";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#845EC2",
  "#4D8076",
];

function ExpenseStats() {
  // =========================
  // ESTADOS
  // =========================
  const [expenses, setExpenses] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [byPerson, setByPerson] = useState([]);
  const [evolutionData, setEvolutionData] = useState([]);

  const [view, setView] = useState("month");
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth()
  );

  // =========================
  // FETCH GASTOS
  // =========================
  useEffect(() => {
    fetch(`${API_URL}/api/expenses`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Error cargando gastos");
        }
        return res.json();
      })
      .then((data) => setExpenses(data))
      .catch((err) =>
        console.error("Error cargando gastos:", err)
      );
  }, []);

  // =========================
  // POR CATEGORÍA / PERSONA
  // =========================
  useEffect(() => {
    const categoryMap = {};
    const personMap = {};

    expenses.forEach((e) => {
      categoryMap[e.category] =
        (categoryMap[e.category] || 0) + e.amount;

      personMap[e.person] =
        (personMap[e.person] || 0) + e.amount;
    });

    setByCategory(
      Object.entries(categoryMap).map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
      }))
    );

    setByPerson(
      Object.entries(personMap).map(([person, total]) => ({
        person,
        total: Number(total.toFixed(2)),
      }))
    );
  }, [expenses]);

  // =========================
  // EVOLUCIÓN
  // =========================
  useEffect(() => {
    const evolution = {};

    expenses.forEach((e) => {
      const d = new Date(e.date);
      const year = d.getFullYear();
      const month = d.getMonth();
      const day = d.getDate();

      if (view === "year") {
        if (year !== selectedYear) return;
        evolution[month] = (evolution[month] || 0) + e.amount;
      }

      if (view === "month") {
        if (year !== selectedYear || month !== selectedMonth)
          return;
        evolution[day] = (evolution[day] || 0) + e.amount;
      }
    });

    const formatted = Object.entries(evolution)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([key, total]) => ({
        label:
          view === "year"
            ? new Date(0, key).toLocaleString("es-ES", {
                month: "short",
              })
            : key,
        total: Number(total.toFixed(2)),
      }));

    setEvolutionData(formatted);
  }, [expenses, view, selectedYear, selectedMonth]);

  // =========================
  // RENDER
  // =========================
  return (
    <div className="stats-page">
      <h2>Gastos por categoría</h2>

      {byCategory.length === 0 ? (
        <p>No hay datos todavía</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={byCategory}
              dataKey="value"
              nameKey="name"
              outerRadius={110}
              label
            >
              {byCategory.map((_, i) => (
                <Cell
                  key={i}
                  fill={COLORS[i % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )}

      <h2 style={{ marginTop: 40 }}>
        ¿Quién ha gastado más?
      </h2>

      {byPerson.length === 0 ? (
        <p>No hay datos todavía</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={byPerson}>
            <XAxis dataKey="person" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#0088FE" />
          </BarChart>
        </ResponsiveContainer>
      )}

      <h2 style={{ marginTop: 40 }}>
        Evolución de gastos
      </h2>

      <div className="stats-controls">
        <select
          className="stats-select"
          value={view}
          onChange={(e) => setView(e.target.value)}
        >
          <option value="month">Vista mensual</option>
          <option value="year">Vista anual</option>
        </select>

        <select
          className="stats-select"
          value={selectedYear}
          onChange={(e) =>
            setSelectedYear(Number(e.target.value))
          }
        >
          {[2025, 2026, 2027, 2028, 2029, 2030].map(
            (y) => (
              <option key={y} value={y}>
                {y}
              </option>
            )
          )}
        </select>

        {view === "month" && (
          <select
            className="stats-select"
            value={selectedMonth}
            onChange={(e) =>
              setSelectedMonth(Number(e.target.value))
            }
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i}>
                {new Date(0, i).toLocaleString("es-ES", {
                  month: "long",
                })}
              </option>
            ))}
          </select>
        )}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={evolutionData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#00C49F"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ExpenseStats;