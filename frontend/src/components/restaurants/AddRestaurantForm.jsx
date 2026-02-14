import { useState, useEffect } from "react";
import Button from "../ui/Button";
import Card from "../common/Card";
import "./AddRestaurantForm.css";
import { API_URL } from "../../config";

function AddRestaurantForm({ onAdd, onCancel, restaurant }) {
  const today = new Date().toISOString().split("T")[0];

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [visitDate, setVisitDate] = useState(today);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);

  // =========================
  // PREFILL / RESET
  // =========================
useEffect(() => {
  if (restaurant) {
    setName(restaurant.name || "");
    setCity(restaurant.city || "");

    // 🔥 NORMALIZAR FECHA PARA INPUT DATE
    const formattedDate = restaurant.visit_date
      ? restaurant.visit_date.split("T")[0]
      : today;

    setVisitDate(formattedDate);

    setRating(restaurant.rating || 5);
    setComment(restaurant.comment || "");
    setImage(null);
  } else {
    // reset al crear
    setName("");
    setCity("");
    setVisitDate(today);
    setRating(5);
    setComment("");
    setImage(null);
  }
}, [restaurant, today]);

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = (e) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("city", city);
    formData.append("rating", rating);
    formData.append("comment", comment);
    formData.append("visitDate", visitDate);

    if (image) {
      formData.append("image", image);
    }

    const isEditing = Boolean(restaurant);
    const url = isEditing
      ? `${API_URL}/api/restaurants/${restaurant.id}`
      : `${API_URL}/api/restaurants`;

    const method = isEditing ? "PUT" : "POST";

    fetch(url, {
      method,
      body: formData,
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Error guardando restaurante");
        }
        return res.json();
      })
      .then((data) => {
        onAdd(data);
      })
      .catch((err) => {
        console.error("Error guardando restaurante:", err);
        alert("No se pudo guardar el restaurante 😕");
      })
      .finally(() => {
        setSaving(false);
      });
  };

  return (
    <Card title={restaurant ? "Editar restaurante" : "Añadir restaurante"}>
      <form className="restaurant-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nombre</label>
          <input
            placeholder="Ej. La Pizzería"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Fecha de visita</label>
          <input
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Ciudad</label>
          <input
            placeholder="Ej. Barcelona"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Puntuación</label>
          <input
            type="number"
            min="1"
            max="5"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          />
        </div>

        <div className="form-group">
          <label>Comentario</label>
          <textarea
            placeholder="¿Qué os pareció?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows="3"
          />
        </div>

        <div className="form-group">
          <label>
            Foto del restaurante{" "}
            {restaurant && (
              <span style={{ fontSize: 12 }}>(opcional)</span>
            )}
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
          />
        </div>

        <div className="form-actions">
          <Button
            text={saving ? "Guardando..." : restaurant ? "Guardar cambios" : "Guardar"}
            type="submit"
            className="btn-primary"
          />
          <Button
            text="Cancelar"
            onClick={onCancel}
            className="btn-secondary"
          />
        </div>
      </form>
    </Card>
  );
}

export default AddRestaurantForm;