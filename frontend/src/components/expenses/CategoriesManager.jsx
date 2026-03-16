import { useState } from "react";
import { apiFetch } from "../../config";
import "./CategoriesManager.css";

const CAT_PALETTE = [
  "#f97316","#3b82f6","#8b5cf6","#ec4899",
  "#14b8a6","#22c55e","#ef4444","#f59e0b","#06b6d4","#84cc16",
];

export function categoryColor(name) {
  let h = 0;
  for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return CAT_PALETTE[Math.abs(h) % CAT_PALETTE.length];
}

function CategoriesManager({ categories, onCategoriesChange }) {
  const [newName, setNewName] = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setError("");
    setLoading(true);

    try {
      const res = await apiFetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      onCategoriesChange([...categories, data]);
      setNewName("");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiFetch(`/api/categories/${id}`, { method: "DELETE" });
      onCategoriesChange(categories.filter((c) => c.id !== id));
    } catch {
      setError("Error al eliminar");
    }
  };

  return (
    <div className="cat-manager">
      <div className="cat-manager-header">
        <span className="cat-manager-title">Categorías</span>
        <span className="cat-manager-hint">Visibles para toda la pareja</span>
      </div>

      {/* Lista */}
      <div className="cat-list">
        {categories.length === 0 ? (
          <span className="cat-empty">Aún no hay categorías. ¡Crea la primera!</span>
        ) : (
          categories.map((cat) => {
            const color = categoryColor(cat.name);
            return (
              <div key={cat.id} className="cat-chip">
                <span className="cat-chip-dot" style={{ background: color }} />
                <span className="cat-chip-name">{cat.name}</span>
                <button
                  className="cat-chip-delete"
                  title="Eliminar"
                  onClick={() => handleDelete(cat.id)}
                >
                  ×
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Añadir */}
      <form className="cat-add-form" onSubmit={handleAdd}>
        <input
          className="cat-add-input"
          placeholder="Nueva categoría..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={50}
        />
        <button className="cat-add-btn" type="submit" disabled={loading || !newName.trim()}>
          {loading ? "..." : "Añadir"}
        </button>
      </form>

      {error && <span className="cat-error">{error}</span>}
    </div>
  );
}

export default CategoriesManager;
