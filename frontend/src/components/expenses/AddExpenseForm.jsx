import { useEffect, useState } from "react";
import Card from "../common/Card";
import Button from "../ui/Button";
import "./AddExpenseForm.css";
import { API_URL } from "../../config";

function AddExpenseForm({ onAdd, onCancel, expense }) {
  const today = new Date().toISOString().split("T")[0];

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [person, setPerson] = useState("Fran");
  const [category, setCategory] = useState("Comida");
  const [date, setDate] = useState(today);

  // 🔥 PREFILL SI EDITAMOS
  useEffect(() => {
    if (expense) {
      setTitle(expense.title);
      setAmount(expense.amount);
      setPerson(expense.person);
      setCategory(expense.category);
      setDate(expense.date);
    }
  }, [expense]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      title,
      amount: Number(amount),
      person,
      category,
      date,
    };

    const isEditing = Boolean(expense);
    const url = isEditing
      ? `${API_URL}/api/expenses/${expense.id}`
      : `${API_URL}/api/expenses`;

    const method = isEditing ? "PUT" : "POST";

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error guardando gasto");
        return res.json();
      })
      .then((data) => {
        onAdd(data);
      })
      .catch((err) =>
        console.error("Error guardando gasto:", err)
      );
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
            <option value="Fran">Fran</option>
            <option value="Eli">Eli</option>
            <option value="Compartido">Compartido</option>
          </select>
        </div>

        <div className="form-group">
          <label>Categoría</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="Comida">Comida</option>
            <option value="Ocio">Ocio</option>
            <option value="Boticelli">Boticelli</option>
            <option value="Capricho">Capricho</option>
            <option value="Transporte">Transporte</option>
            <option value="Necesidad">Necesidad</option>
          </select>
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
          />
          <Button text="Cancelar" onClick={onCancel} className="btn-secondary" />
        </div>
      </form>
    </Card>
  );
}

export default AddExpenseForm;