import { useState, useEffect } from "react";
import Card from "../components/common/Card";
import Button from "../components/ui/Button";
import AddRestaurantForm from "../components/restaurants/AddRestaurantForm";
import "./Restaurants.css";
import { API_URL } from "../config";

function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);

  // =========================
  // CARGAR RESTAURANTES
  // =========================
  useEffect(() => {
    fetch(`${API_URL}/api/restaurants`)
      .then((res) => res.json())
      .then((data) => setRestaurants(data))
      .catch((err) =>
        console.error("Error cargando restaurantes", err)
      );
  }, []);

  // =========================
  // CREAR O EDITAR (POST / PUT)
  // =========================
  const handleAddRestaurant = (updatedRestaurant) => {
    const normalized = {
      ...updatedRestaurant,
      id: Number(updatedRestaurant.id),
    };

    setRestaurants((prev) => {
      const exists = prev.find(
        (r) => r.id === normalized.id
      );

      if (exists) {
        // ✏️ EDITAR
        return prev.map((r) =>
          r.id === normalized.id
            ? {
                ...r,
                ...normalized,
                image:
                  normalized.image !== null
                    ? normalized.image
                    : r.image,
              }
            : r
        );
      }

      // ➕ CREAR
      return [normalized, ...prev];
    });

    setShowForm(false);
    setEditingRestaurant(null);
  };

  // =========================
  // ELIMINAR
  // =========================
  const handleDeleteRestaurant = (id) => {
    fetch(`${API_URL}/api/restaurants/${id}`, {
      method: "DELETE",
    }).then(() => {
      setRestaurants((prev) =>
        prev.filter((r) => r.id !== id)
      );
    });
  };

  // =========================
  // CANCELAR FORM
  // =========================
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingRestaurant(null);
  };

  return (
    <div className="restaurants-page">
      <div className="restaurants-header">
        <h1>Restaurantes</h1>

        {!showForm && (
          <Button
            text="➕ Añadir"
            className="btn-primary"
            onClick={() => {
              setEditingRestaurant(null);
              setShowForm(true);
            }}
          />
        )}
      </div>

      {/* FORMULARIO */}
      {showForm && (
        <AddRestaurantForm
          restaurant={editingRestaurant}
          onAdd={handleAddRestaurant}
          onCancel={handleCancelForm}
        />
      )}

      {/* LISTADO */}
      {!showForm && (
        <div className="restaurants-grid">
          {restaurants.map((r) => (
            <Card
              key={r.id}
              title={`${r.name} · ${r.city}`}
              footer={`⭐ ${r.rating} / 5`}
            >
              {r.image && (
                <img
                  src={`${API_URL}/${r.image}`}
                  alt={r.name}
                  className="restaurant-image"
                />
              )}

              <p>{r.comment}</p>
              <p className="date">📅 {r.visit_date}</p>

              <div className="card-actions">
                <Button
                  text="✏️ Editar"
                  className="btn-edit"
                  onClick={() => {
                    setEditingRestaurant(r);
                    setShowForm(true);
                  }}
                />

                <Button
                  text="🗑️ Eliminar"
                  className="btn-delete"
                  onClick={() =>
                    handleDeleteRestaurant(r.id)
                  }
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default Restaurants;