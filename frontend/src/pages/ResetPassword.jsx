import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import "./Auth.css";

function ResetPassword() {
  const navigate = useNavigate();

  const [token,    setToken]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error restableciendo contraseña");
        return;
      }

      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch {
      setError("No se pudo conectar al servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">
          <span className="auth-logo-heart">♥</span>
          <span className="auth-logo-name">Our Little World</span>
        </div>

        <h1 className="auth-title">Nueva contraseña</h1>
        <p className="auth-subtitle">Introduce el código que obtuviste y tu nueva contraseña</p>

        {error && <div className="auth-error">{error}</div>}

        {success ? (
          <div className="auth-success" style={{ marginTop: 8 }}>
            ✓ Contraseña actualizada. Redirigiendo al login...
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label>Código de recuperación</label>
              <input
                type="text"
                placeholder="Pega aquí el código"
                value={token}
                onChange={(e) => setToken(e.target.value.trim())}
                required
                autoCapitalize="none"
              />
            </div>

            <div className="auth-field">
              <label>Nueva contraseña</label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label>Confirmar nueva contraseña</label>
              <input
                type="password"
                placeholder="Repite la contraseña"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Cambiar contraseña"}
            </button>
          </form>
        )}

        <div className="auth-footer" style={{ marginTop: 20 }}>
          <Link to="/login">← Volver al login</Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
