import { useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../config";
import "./Auth.css";

function ForgotPassword() {
  const [username,   setUsername]   = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [copied,     setCopied]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResetToken("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error generando token");
        return;
      }

      setResetToken(data.reset_token);
    } catch {
      setError("No se pudo conectar al servidor");
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(resetToken).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">
          <span className="auth-logo-heart">♥</span>
          <span className="auth-logo-name">Our Little World</span>
        </div>

        <h1 className="auth-title">Restablecer contraseña</h1>
        <p className="auth-subtitle">
          Introduce tu usuario y te daremos un código para cambiar la contraseña
        </p>

        {error && <div className="auth-error">{error}</div>}

        {!resetToken ? (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label>Usuario</label>
              <input
                type="text"
                placeholder="tu_usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
                autoCapitalize="none"
              />
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "Generando..." : "Obtener código"}
            </button>
          </form>
        ) : (
          <div className="auth-form">
            <div className="auth-success">
              ¡Código generado! Cópialo y úsalo en la siguiente pantalla.
            </div>

            <div className="token-box">
              <p className="token-box-label">Tu código de recuperación</p>
              <p className="token-value">{resetToken}</p>
              <button className="token-copy-btn" onClick={copyToken}>
                {copied ? "¡Copiado! ✓" : "Copiar código"}
              </button>
            </div>

            <Link to="/reset-password" className="auth-btn" style={{ textAlign: "center", textDecoration: "none", display: "block" }}>
              Ir a cambiar contraseña →
            </Link>
          </div>
        )}

        <div className="auth-footer" style={{ marginTop: 20 }}>
          <Link to="/login">← Volver al login</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
