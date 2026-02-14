import { Link } from "react-router-dom";
import { useState } from "react";
import "./Header.css";

function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="header">
      <div className="header-top">
        <h2 className="logo">Our Little World</h2>

        {/* Botón hamburguesa (solo móvil) */}
        <button
          className="menu-btn"
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>
      </div>

      <nav className={`nav ${open ? "open" : ""}`}>
        <Link to="/" onClick={() => setOpen(false)}>Inicio</Link>
        <Link to="/restaurants" onClick={() => setOpen(false)}>Restaurantes</Link>
        <Link to="/expenses" onClick={() => setOpen(false)}>Gastos</Link>
        <Link to="/peliculas" onClick={() => setOpen(false)}>Películas</Link>
      </nav>
    </header>
  );
}

export default Header;