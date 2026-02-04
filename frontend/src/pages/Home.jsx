import Card from "../components/common/Card";
import "./Home.css";

function Home() {
  return (
    <div className="home-page">
      {/* HERO */}
      <section className="home-hero">
        <h1>Bienvenidos ❤️</h1>
        <p>
          Nuestro pequeño espacio para guardar recuerdos, restaurantes
          y momentos especiales juntos ✨
        </p>
      </section>

      {/* GRID */}
      <section className="home-grid">
        <Card title="Nuestra web">
          <p>
            Un lugar personal donde apuntar cosas random,
            restaurantes que nos encantan y recuerdos que no
            queremos olvidar 😊
          </p>
        </Card>

        <Card title="¿Qué podemos hacer aquí?">
          <ul className="home-list">
            <li>🍽️ Guardar restaurantes</li>
            <li>📝 Apuntar notas</li>
            <li>📸 Recordar momentos</li>
          </ul>
        </Card>

        <Card title="Última actualización">
          <p>Hoy hemos empezado a crear esta web 🚀</p>
        </Card>
      </section>
    </div>
  );
}

export default Home;