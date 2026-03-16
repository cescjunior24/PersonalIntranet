import { useState, useEffect } from "react";
import Button from "../components/ui/Button";
import AddRestaurantForm from "../components/restaurants/AddRestaurantForm";
import "./Restaurants.css";
import { API_URL, apiFetch } from "../config";

// Gradient covers when there's no photo
const COVER_GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
];

function Stars({ rating }) {
  const n = Number(rating) || 0;
  return (
    <div className="stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < n ? "star filled" : "star"}>★</span>
      ))}
    </div>
  );
}

function Restaurants() {
  const [restaurants,       setRestaurants]       = useState([]);
  const [showForm,          setShowForm]          = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [confirmDelete,     setConfirmDelete]     = useState(null);

  useEffect(() => {
    apiFetch(`/api/restaurants`)
      .then((res) => res.json())
      .then((data) => setRestaurants(data))
      .catch((err) => console.error("Error cargando restaurantes", err));
  }, []);

  const handleAddRestaurant = (updated) => {
    const n = { ...updated, id: Number(updated.id) };
    setRestaurants((prev) => {
      const exists = prev.find((r) => r.id === n.id);
      if (exists) return prev.map((r) => r.id === n.id ? { ...r, ...n, image: n.image ?? r.image } : r);
      return [n, ...prev];
    });
    setShowForm(false);
    setEditingRestaurant(null);
  };

  const handleDeleteRestaurant = (id) => {
    apiFetch(`/api/restaurants/${id}`, { method: "DELETE" }).then(() => {
      setRestaurants((prev) => prev.filter((r) => r.id !== id));
      setConfirmDelete(null);
    });
  };

  return (
    <div className="restaurants-page">

      {/* HEADER */}
      <div className="restaurants-header">
        <h1>Restaurantes</h1>
        {!showForm && (
          <Button
            text="+ Añadir"
            className="btn-primary"
            onClick={() => { setEditingRestaurant(null); setShowForm(true); }}
          />
        )}
      </div>

      {/* FORM */}
      {showForm && (
        <AddRestaurantForm
          restaurant={editingRestaurant}
          onAdd={handleAddRestaurant}
          onCancel={() => { setShowForm(false); setEditingRestaurant(null); }}
        />
      )}

      {/* GRID */}
      {!showForm && (
        <>
          {restaurants.length === 0 ? (
            <div className="restaurants-empty">
              <span className="empty-icon">🍽️</span>
              <p>Todavía no hay restaurantes guardados</p>
              <Button text="Añadir el primero" className="btn-primary" onClick={() => setShowForm(true)} />
            </div>
          ) : (
            <div className="restaurants-grid">
              {restaurants.map((r, idx) => {
                const gradient = COVER_GRADIENTS[idx % COVER_GRADIENTS.length];
                const [yr, mo, dy] = String(r.visit_date || "").slice(0, 10).split("-");
                const dateStr = dy ? `${dy}/${mo}/${yr}` : "";

                return (
                  <div key={r.id} className="restaurant-card">
                    {/* COVER */}
                    <div
                      className="rc-cover"
                      style={r.image
                        ? { backgroundImage: `url(${API_URL}/${r.image})` }
                        : { background: gradient }
                      }
                    >
                      {!r.image && (
                        <span className="rc-cover-icon">🍽️</span>
                      )}
                      {/* Buttons overlay */}
                      <div className="rc-overlay">
                        <button
                          className="rc-icon-btn"
                          title="Editar"
                          onClick={() => { setEditingRestaurant(r); setShowForm(true); }}
                        >
                          ✏️
                        </button>
                        <button
                          className="rc-icon-btn rc-delete-btn"
                          title="Eliminar"
                          onClick={() => setConfirmDelete(r.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* BODY */}
                    <div className="rc-body">
                      <div className="rc-top">
                        <div>
                          <h3 className="rc-name">{r.name}</h3>
                          {r.city && <span className="rc-city">📍 {r.city}</span>}
                        </div>
                        <Stars rating={r.rating} />
                      </div>

                      {r.comment && <p className="rc-comment">{r.comment}</p>}

                      {dateStr && (
                        <div className="rc-date">
                          <span>📅 {dateStr}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* CONFIRM DELETE */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p className="modal-text">¿Eliminar este restaurante?</p>
            <div className="modal-actions">
              <button className="btn-secondary modal-btn" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn-danger modal-btn" onClick={() => handleDeleteRestaurant(confirmDelete)}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Restaurants;
