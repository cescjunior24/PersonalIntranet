import { Link } from "react-router-dom";
import "./Home.css";

const SECTIONS = [
  {
    to:       "/restaurants",
    icon:     "🍽️",
    title:    "Restaurantes",
    desc:     "Guardad todos los sitios que habéis visitado con fotos, notas y valoraciones.",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    to:       "/expenses",
    icon:     "💸",
    title:    "Gastos",
    desc:     "Apuntad vuestros gastos compartidos y llevad el control fácilmente.",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  },
  {
    to:       "/stats",
    icon:     "📊",
    title:    "Estadísticas",
    desc:     "Visualizad en qué gastáis más y cómo evoluciona vuestro presupuesto.",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  },
  {
    to:       "/peliculas",
    icon:     "🎬",
    title:    "Películas",
    desc:     "Próximamente: guardad las películas que queréis ver juntos.",
    gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    soon:     true,
  },
];

function Home() {
  return (
    <div className="home-page">

      {/* HERO */}
      <section className="home-hero">
        <div className="hero-heart">♥</div>
        <h1 className="hero-title">Our Little World</h1>
        <p className="hero-sub">
          Vuestro espacio personal para guardar recuerdos,<br />
          restaurantes y los momentos que no queréis olvidar ✨
        </p>
      </section>

      {/* CARDS */}
      <section className="home-grid">
        {SECTIONS.map(({ to, icon, title, desc, gradient, soon }) => (
          <Link
            key={to}
            to={to}
            className={`home-card${soon ? " home-card--soon" : ""}`}
            style={{ "--card-gradient": gradient }}
          >
            <div className="hc-icon-wrap" style={{ background: gradient }}>
              <span className="hc-icon">{icon}</span>
            </div>
            <div className="hc-body">
              <div className="hc-title-row">
                <h3 className="hc-title">{title}</h3>
                {soon && <span className="hc-soon-badge">Pronto</span>}
              </div>
              <p className="hc-desc">{desc}</p>
            </div>
            {!soon && <span className="hc-arrow">→</span>}
          </Link>
        ))}
      </section>
    </div>
  );
}

export default Home;
