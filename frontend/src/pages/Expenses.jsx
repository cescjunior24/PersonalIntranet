import { useEffect, useState } from "react";
import Card from "../components/common/Card";
import Button from "../components/ui/Button";
import AddExpenseForm from "../components/expenses/AddExpenseForm";
import CategoriesManager, { categoryColor } from "../components/expenses/CategoriesManager";
import "./Expenses.css";
import { Link } from "react-router-dom";
import { apiFetch } from "../config";

const PAGE_SIZE = 20;

// Colores de persona — azul, rosa, verde
const PERSON_PALETTE = ["#4F8EF7", "#F76497", "#43C59E"];
function personColor(name, members) {
  if (name === "Compartido") return "#43C59E";
  const idx = (members || []).findIndex((m) => m.display_name === name);
  return PERSON_PALETTE[idx >= 0 ? idx : 0];
}

function Expenses() {
  const [expenses,        setExpenses]        = useState([]);
  const [categories,      setCategories]      = useState([]);
  const [members,         setMembers]         = useState([]);
  const [showForm,        setShowForm]        = useState(false);
  const [showCatManager,  setShowCatManager]  = useState(false);
  const [visibleCount,    setVisibleCount]    = useState(PAGE_SIZE);
  const [editingExpense,  setEditingExpense]  = useState(null);
  const [confirmDelete,   setConfirmDelete]   = useState(null);

  const normalizeExpense = (e) => ({ ...e, amount: Number(e.amount) });

  useEffect(() => {
    apiFetch(`/api/expenses`)
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((data) => setExpenses(data.map(normalizeExpense).sort((a, b) => String(b.date).localeCompare(String(a.date)))))
      .catch((err) => console.error("Error cargando gastos:", err));

    apiFetch(`/api/categories`)
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});

    apiFetch(`/api/couples/info`)
      .then((r) => r.json())
      .then((d) => setMembers(d.members || []))
      .catch(() => {});
  }, []);

  const handleAddExpense = (updated) => {
    const n = normalizeExpense(updated);
    setExpenses((prev) => {
      const exists = prev.find((e) => e.id === n.id);
      if (exists) return prev.map((e) => (e.id === n.id ? n : e));
      return [n, ...prev];
    });
    setShowForm(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = (id) => {
    apiFetch(`/api/expenses/${id}`, { method: "DELETE" })
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then(() => { setExpenses((prev) => prev.filter((e) => e.id !== id)); setConfirmDelete(null); })
      .catch((err) => console.error("Error eliminando gasto:", err));
  };

  const visibleExpenses = expenses.slice(0, visibleCount);

  const groupedExpenses = visibleExpenses.reduce((groups, expense) => {
    const [y, m] = String(expense.date).slice(0, 10).split("-").map(Number);
    const key = new Date(y, m - 1, 1).toLocaleString("es-ES", { month: "long", year: "numeric" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(expense);
    return groups;
  }, {});

  return (
    <div className="expenses-page">

      {/* HEADER */}
      <div className="expenses-header">
        <h1>Gastos</h1>
        {!showForm && (
          <div className="expenses-actions">
            <button
              className={`cat-toggle-btn${showCatManager ? " active" : ""}`}
              onClick={() => setShowCatManager(!showCatManager)}
              title="Gestionar categorías"
            >
              ⚙ Categorías
            </button>
            <Button text="+ Añadir" className="btn-primary" onClick={() => setShowForm(true)} />
            <Link to="/stats" className="stats-link">📊 Estadísticas</Link>
          </div>
        )}
      </div>

      {/* CATEGORIES MANAGER */}
      {showCatManager && !showForm && (
        <CategoriesManager
          categories={categories}
          onCategoriesChange={setCategories}
        />
      )}

      {/* FORM */}
      {showForm && (
        <AddExpenseForm
          expense={editingExpense}
          categories={categories}
          members={members}
          onAdd={handleAddExpense}
          onCancel={() => { setShowForm(false); setEditingExpense(null); }}
        />
      )}

      {/* LISTADO */}
      {!showForm && Object.entries(groupedExpenses).map(([month, items]) => {
        const total = items.reduce((s, e) => s + e.amount, 0);
        return (
          <div key={month} className="month-group">
            <div className="month-header">
              <h2 className="month-title">{month}</h2>
              <span className="month-total">{total.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</span>
            </div>

            <div className="expense-list">
              {items.map((expense) => {
                const catColor    = categoryColor(expense.category);
                const persColor   = personColor(expense.person, members);
                const [yr, mo, dy] = String(expense.date).slice(0, 10).split("-");

                return (
                  <div key={expense.id} className="expense-item">
                    <div className="expense-bar" style={{ background: catColor }} />

                    <div className="expense-body">
                      <div className="expense-top-row">
                        <span className="expense-title">{expense.title}</span>
                        <span className="expense-amount">{expense.amount.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</span>
                      </div>
                      <div className="expense-bottom-row">
                        <span
                          className="expense-badge"
                          style={{ background: persColor + "20", color: persColor }}
                        >
                          {expense.person}
                        </span>
                        <span
                          className="expense-badge"
                          style={{ background: catColor + "20", color: catColor }}
                        >
                          {expense.category}
                        </span>
                        <span className="expense-date">{dy}/{mo}/{yr}</span>

                        <div className="expense-actions">
                          <button
                            className="icon-btn edit-btn"
                            title="Editar"
                            onClick={() => { setEditingExpense(expense); setShowForm(true); }}
                          >
                            ✏️
                          </button>
                          <button
                            className="icon-btn delete-btn"
                            title="Eliminar"
                            onClick={() => setConfirmDelete(expense.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* CARGAR MÁS */}
      {!showForm && visibleCount < expenses.length && (
        <div className="load-more">
          <Button
            text="Cargar más"
            className="btn-secondary"
            onClick={() => setVisibleCount((p) => p + PAGE_SIZE)}
          />
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p className="modal-text">¿Eliminar este gasto?</p>
            <div className="modal-actions">
              <button className="btn-secondary modal-btn" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn-danger modal-btn" onClick={() => handleDeleteExpense(confirmDelete)}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Expenses;
