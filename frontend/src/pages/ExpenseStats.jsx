import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "../config";
import { categoryColor } from "../components/expenses/CategoriesManager";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from "recharts";
import "./ExpenseStats.css";

// Paleta de colores para personas
const PERSON_PALETTE = ["#4F8EF7", "#F76497", "#43C59E"];

const PERIODS = [
  { key: "month",   label: "Este mes" },
  { key: "3months", label: "3 meses"  },
  { key: "year",    label: "Este año" },
  { key: "all",     label: "Todo"     },
];

function parseDate(dateStr) {
  const s = String(dateStr).slice(0, 10);
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatEur(n) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.06) return null;
  const R = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * R);
  const y = cy + r * Math.sin(-midAngle * R);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={12} fontWeight="700">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function ExpenseStats() {
  const [expenses, setExpenses] = useState([]);
  const [members,  setMembers]  = useState([]);
  const [period,   setPeriod]   = useState("month");

  useEffect(() => {
    apiFetch(`/api/expenses`)
      .then((res) => res.json())
      .then((data) => setExpenses(data.map((e) => ({ ...e, amount: Number(e.amount) }))))
      .catch((err) => console.error("Error cargando gastos:", err));

    apiFetch(`/api/couples/info`)
      .then((r) => r.json())
      .then((d) => setMembers(d.members || []))
      .catch(() => {});
  }, []);

  // Mapa nombre → color para personas
  const personColors = useMemo(() => {
    const map = { Compartido: "#43C59E" };
    members.forEach((m, i) => {
      map[m.display_name] = PERSON_PALETTE[i] ?? "#9ca3af";
    });
    return map;
  }, [members]);

  // ── FILTRO POR PERÍODO ──────────────────────
  const filtered = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return expenses.filter((e) => {
      const d = parseDate(e.date);
      if (period === "month")   return d.getFullYear() === y && d.getMonth() === m;
      if (period === "3months") return d >= new Date(y, m - 2, 1);
      if (period === "year")    return d.getFullYear() === y;
      return true;
    });
  }, [expenses, period]);

  // ── RESUMEN TOTAL ────────────────────────────
  const totalAmount = useMemo(
    () => filtered.reduce((s, e) => s + e.amount, 0),
    [filtered]
  );

  // ── RESUMEN POR PERSONA (dinámico) ───────────
  const summaryByPerson = useMemo(() => {
    const map = {};
    filtered.forEach((e) => {
      map[e.person] = (map[e.person] || 0) + e.amount;
    });
    return map;
  }, [filtered]);

  // Personas que aparecen en el resumen: miembros + Compartido (si hay gastos)
  const summaryPersons = useMemo(() => {
    const people = [
      ...members.map((m) => m.display_name),
      "Compartido",
    ];
    return people;
  }, [members]);

  // ── POR CATEGORÍA ────────────────────────────
  const byCategory = useMemo(() => {
    const map = {};
    filtered.forEach((e) => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  // ── POR PERSONA ──────────────────────────────
  const byPerson = useMemo(() => {
    const map = {};
    filtered.forEach((e) => { map[e.person] = (map[e.person] || 0) + e.amount; });
    return Object.entries(map).map(([person, total]) => ({
      person,
      total: Number(total.toFixed(2)),
    }));
  }, [filtered]);

  // ── EVOLUCIÓN ────────────────────────────────
  const evolutionData = useMemo(() => {
    const byDay = period === "month";
    const map = {};
    filtered.forEach((e) => {
      const d = parseDate(e.date);
      const key = byDay
        ? String(d.getDate()).padStart(2, "0")
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = (map[key] || 0) + e.amount;
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, total]) => ({
        label: byDay
          ? `${parseInt(key, 10)}`
          : new Date(Number(key.split("-")[0]), Number(key.split("-")[1]) - 1)
              .toLocaleString("es-ES", { month: "short", year: "2-digit" }),
        total: Number(total.toFixed(2)),
      }));
  }, [filtered, period]);

  // ── TOP GASTOS ───────────────────────────────
  const topExpenses = useMemo(
    () => [...filtered].sort((a, b) => b.amount - a.amount).slice(0, 5),
    [filtered]
  );

  const isEmpty = filtered.length === 0;

  // Clase CSS para la tarjeta de persona según índice
  const personCardClass = (name) => {
    if (name === "Compartido") return "summary-card compartido";
    const idx = members.findIndex((m) => m.display_name === name);
    return idx === 0 ? "summary-card fran" : "summary-card eli";
  };

  return (
    <div className="stats-page">

      {/* HEADER */}
      <div className="stats-header">
        <h1>Estadísticas</h1>
        <div className="period-tabs">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              className={`period-tab${period === p.key ? " active" : ""}`}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* TARJETAS RESUMEN */}
      <div className="summary-cards">
        <div className="summary-card total">
          <span className="summary-label">Total</span>
          <span className="summary-value">{formatEur(totalAmount)}</span>
        </div>
        {summaryPersons.map((name) => (
          <div key={name} className={personCardClass(name)}>
            <span className="summary-label">{name}</span>
            <span className="summary-value">{formatEur(summaryByPerson[name] || 0)}</span>
          </div>
        ))}
      </div>

      {isEmpty ? (
        <div className="stats-empty">Sin gastos en este período 🌿</div>
      ) : (
        <>
          {/* FILA DE GRÁFICOS */}
          <div className="charts-row">
            <div className="chart-card">
              <h3>Por categoría</h3>
              <ResponsiveContainer width="100%" height={270}>
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={105}
                    labelLine={false}
                    label={PieLabel}
                  >
                    {byCategory.map((entry, i) => (
                      <Cell key={i} fill={categoryColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatEur(v)} />
                  <Legend iconType="circle" iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Por persona</h3>
              <ResponsiveContainer width="100%" height={270}>
                <BarChart data={byPerson} barSize={54}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="person" axisLine={false} tickLine={false} tick={{ fontSize: 13 }} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => v + "€"} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => formatEur(v)} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                    {byPerson.map((entry, i) => (
                      <Cell key={i} fill={personColors[entry.person] || "#9ca3af"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* EVOLUCIÓN */}
          <div className="chart-card chart-full">
            <h3>Evolución del gasto{period === "month" ? " (días)" : ""}</h3>
            {evolutionData.length === 0 ? (
              <p className="chart-empty">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={evolutionData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => v + "€"} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => formatEur(v)} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#areaGrad)"
                    dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* TOP GASTOS */}
          <div className="chart-card chart-full">
            <h3>Top gastos del período</h3>
            <div className="top-list">
              {topExpenses.map((e, i) => {
                const [yr, mo, dy] = String(e.date).slice(0, 10).split("-");
                const pColor = personColors[e.person] || "#9ca3af";
                const cColor = categoryColor(e.category);
                return (
                  <div key={e.id} className="top-row">
                    <span className="top-rank">#{i + 1}</span>
                    <div className="top-info">
                      <span className="top-title">{e.title}</span>
                      <span className="top-meta">
                        <span className="top-badge" style={{ background: pColor + "20", color: pColor }}>
                          {e.person}
                        </span>
                        <span className="top-badge" style={{ background: cColor + "20", color: cColor }}>
                          {e.category}
                        </span>
                        <span className="top-date">{dy}/{mo}/{yr}</span>
                      </span>
                    </div>
                    <span className="top-amount">{formatEur(e.amount)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ExpenseStats;
