import { useEffect, useState } from "react";
import Card from "../common/Card";
import Button from "../ui/Button";
import "./AddExpenseForm.css";
import { apiFetch } from "../../config";

function AddExpenseForm({ onAdd, onCancel, expense, categories, members }) {
  const today = new Date().toISOString().split("T")[0];

  const [title,    setTitle]    = useState("");
  const [amount,   setAmount]   = useState("");
  const [person,   setPerson]   = useState("");
  const [category, setCategory] = useState("");
  const [date,     setDate]     = useState(today);

  // Personas disponibles: miembros de la pareja + Compartido
  const personOptions = [
    ...(members || []).map((m) => m.display_name),
    "Compartido",
  ];

  // Prefill al editar
  useEffect(() => {
    if (expense) {
      setTitle(expense.title);
      setAmount(expense.amount);
      setPerson(expense.person);
      setCategory(expense.category);
      setDate(String(expense.date).slice(0, 10));
    } else {
      // Valores por defecto: primera persona, primera categoría
      if (personOptions.length > 0) setPerson(personOptions[0]);
      if (categories && categories.length > 0) setCategory(categories[0].name);
    }
  }, [expense, members, categories]);  // eslint-disable-line

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = { title, amount: Number(amount), person, category, date };
    const isEditing = Boolean(expense);
    const url    = isEditing ? `/api/expenses/${expense.id}` : `/api/expenses`;
    const method = isEditing ? "PUT" : "POST";

    apiFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error guardando gasto");
        return res.json();
      })
      .then((data) => onAdd(data))
      .catch((err) => console.error("Error guardando gasto:", err));
  };

  return (
    <Card title={expense ? "Editar gasto" : "Añadir gasto"}>
      <form className="expense-form" onSubmit={handleSubmit}>

        <div className="form-group">
          <label>Título</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label>Precio (€)</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Persona</label>
          <select value={person} onChange={(e) => setPerson(e.target.value)}>
            {personOptions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Categoría</label>
          {categories && categories.length > 0 ? (
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          ) : (
            <div className="no-categories-hint">
              Aún no hay categorías. Créalas con el botón <strong>⚙ Categorías</strong>.
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Fecha</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="form-actions">
          <Button
            text={expense ? "Guardar cambios" : "Guardar"}
            type="submit"
            className="btn-primary"
            disabled={!category}
          />
          <Button text="Cancelar" onClick={onCancel} className="btn-secondary" />
        </div>
      </form>
    </Card>
  );
}

export default AddExpenseForm;
