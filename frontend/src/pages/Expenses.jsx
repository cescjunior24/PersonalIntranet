import { useEffect, useState } from "react";
import Card from "../components/common/Card";
import Button from "../components/ui/Button";
import AddExpenseForm from "../components/expenses/AddExpenseForm";
import "./Expenses.css";
import { Link } from "react-router-dom";
import { API_URL } from "../config";

const PAGE_SIZE = 20;

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [editingExpense, setEditingExpense] = useState(null);

  // =========================
  // CARGAR GASTOS
  // =========================
  useEffect(() => {
    fetch(`${API_URL}/api/expenses`)
      .then((res) => {
        if (!res.ok) throw new Error("Error cargando gastos");
        return res.json();
      })
      .then((data) => {
        const sorted = [...data].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setExpenses(sorted);
      })
      .catch((err) =>
        console.error("Error cargando gastos:", err)
      );
  }, []);

  // =========================
  // AÑADIR GASTO
  // =========================
  const handleAddExpense = (updatedExpense) => {
    setExpenses((prev) => {
      const exists = prev.find((e) => e.id === updatedExpense.id);

      if (exists) {
        // ✏️ EDIT
        return prev.map((e) =>
          e.id === updatedExpense.id ? updatedExpense : e
        );
      }

      // ➕ CREATE
      return [updatedExpense, ...prev];
    });

  setShowForm(false);
  setEditingExpense(null);
};
  // =========================
  // ELIMINAR GASTO
  // =========================
  const handleDeleteExpense = (id) => {
    fetch(`${API_URL}/api/expenses/${id}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Error al eliminar gasto");
        }
        return res.json();
      })
      .then(() => {
        setExpenses((prev) =>
          prev.filter((expense) => expense.id !== id)
        );
      })
      .catch((err) =>
        console.error("Error eliminando gasto:", err)
      );
  };

  // =========================
  // PAGINACIÓN
  // =========================
  const visibleExpenses = expenses.slice(0, visibleCount);

  // =========================
  // AGRUPAR POR MES
  // =========================
  const groupedExpenses = visibleExpenses.reduce(
    (groups, expense) => {
      const date = new Date(expense.date);
      const key = date.toLocaleString("es-ES", {
        month: "long",
        year: "numeric",
      });

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(expense);
      return groups;
    },
    {}
  );

  return (
    <div className="expenses-page">
      {/* HEADER */}
      <div className="expenses-header">
        <h1>Gastos</h1>

        {!showForm && (
          <div className="expenses-actions">
            <Button
              text="➕ Añadir gasto"
              className="btn-primary"
              onClick={() => setShowForm(true)}
            />

            <Link to="/stats" className="stats-link">
              📊 Estadísticas
            </Link>
          </div>
        )}
      </div>

      {showForm && (
        <AddExpenseForm
          expense={editingExpense}
          onAdd={handleAddExpense}
          onCancel={() => {
            setShowForm(false);
            setEditingExpense(null);
          }}
        />
      )}

      {/* LISTADO */}
      {!showForm &&
        Object.entries(groupedExpenses).map(
          ([month, items]) => {
            const total = items.reduce(
              (sum, expense) => sum + expense.amount,
              0
            );

            return (
              <div key={month} className="month-group">
                <h2 className="month-title">
                  {month}
                  <span className="month-total">
                    — Total: {total.toFixed(2)} €
                  </span>
                </h2>

                {items.map((expense) => (
                  <Card key={expense.id}>
                    <div className="expense-row">
                      <div>
                        <strong>{expense.title}</strong>

                        <div className="expense-meta">
                          {expense.person} · {expense.category}
                          <span className="expense-date">
                            ·{" "}
                            {new Date(expense.date).toLocaleDateString("es-ES")}
                          </span>
                        </div>
                      </div>

                      <div className="expense-actions">
                        <div className="expense-amount">
                          {expense.amount.toFixed(2)} €
                        </div>
                        <Button
                          text="✏️"
                          className="btn-edit"
                          onClick={() => {
                            setEditingExpense(expense);
                            setShowForm(true);
                          }}
                        />
                        <Button
                          text="🗑️"
                          className="btn-delete"
                          onClick={() =>
                            handleDeleteExpense(expense.id)
                          }
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            );
          }
        )}

      {/* CARGAR MÁS */}
      {!showForm && visibleCount < expenses.length && (
        <div className="load-more">
          <Button
            text="Cargar más gastos"
            className="btn-secondary"
            onClick={() =>
              setVisibleCount((prev) => prev + PAGE_SIZE)
            }
          />
        </div>
      )}
    </div>
  );
}

export default Expenses;