import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../config";
import "./Header.css";

const NAV_LINKS = [
  { to: "/",            label: "Inicio",       icon: "🏠" },
  { to: "/restaurants", label: "Restaurantes", icon: "🍽️" },
  { to: "/expenses",    label: "Gastos",       icon: "💸" },
  { to: "/peliculas",   label: "Películas",    icon: "🎬" },
];

function Header() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();

  const [open,       setOpen]       = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [userMenu,   setUserMenu]   = useState(false);
  const [coupleInfo, setCoupleInfo] = useState(null);

  const userMenuRef = useRef(null);

  // Shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load couple info when user menu opens
  useEffect(() => {
    if (userMenu && user) {
      apiFetch("/api/couples/info")
        .then((r) => r.json())
        .then((d) => setCoupleInfo(d))
        .catch(() => {});
    }
  }, [userMenu, user]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const partner = coupleInfo?.members?.find((m) => m.id !== user?.id);

  return (
    <header className={`header${scrolled ? " scrolled" : ""}`}>
      <div className="header-inner">

        {/* ── LOGO ── */}
        <Link to="/" className="logo-link">
          <span className="logo-heart">♥</span>
          <span className="logo-text">Our Little World</span>
        </Link>

        {/* ── DESKTOP NAV ── */}
        <nav className="nav-desktop">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`nav-link${location.pathname === to ? " active" : ""}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* ── USER PILL + HAMBURGER ── */}
        <div className="header-right">
          {user && (
            <div className="user-menu-wrap" ref={userMenuRef}>
              <button
                className="user-pill"
                onClick={() => setUserMenu(!userMenu)}
                aria-label="Menú de usuario"
              >
                <span className="user-avatar">
                  {user.display_name.charAt(0).toUpperCase()}
                </span>
                <span className="user-name">{user.display_name}</span>
                <span className="user-caret">{userMenu ? "▲" : "▼"}</span>
              </button>

              {userMenu && (
                <div className="user-dropdown">
                  <div className="user-dropdown-header">
                    <span className="ud-display">{user.display_name}</span>
                    <span className="ud-username">@{user.username}</span>
                  </div>

                  <div className="ud-divider" />

                  {/* Couple info */}
                  <div className="ud-couple-section">
                    {!coupleInfo ? (
                      <span className="ud-loading">Cargando...</span>
                    ) : coupleInfo.couple ? (
                      <>
                        <span className="ud-couple-label">♥ Tu pareja</span>
                        {partner ? (
                          <span className="ud-partner">{partner.display_name}</span>
                        ) : (
                          <CoupleInvite coupleInfo={coupleInfo} />
                        )}
                      </>
                    ) : (
                      <CoupleSetup onDone={() => setUserMenu(false)} />
                    )}
                  </div>

                  <div className="ud-divider" />

                  <button className="ud-logout" onClick={handleLogout}>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── HAMBURGER ── */}
          <button
            className={`burger${open ? " open" : ""}`}
            onClick={() => setOpen(!open)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* ── MOBILE NAV ── */}
      <nav className={`nav-mobile${open ? " open" : ""}`}>
        {NAV_LINKS.map(({ to, label, icon }) => (
          <Link
            key={to}
            to={to}
            className={`nav-mobile-link${location.pathname === to ? " active" : ""}`}
          >
            <span className="nav-icon">{icon}</span>
            <span>{label}</span>
            {location.pathname === to && <span className="nav-active-dot" />}
          </Link>
        ))}
        {user && (
          <button className="nav-mobile-link nav-mobile-logout" onClick={handleLogout}>
            <span className="nav-icon">👋</span>
            <span>Cerrar sesión</span>
          </button>
        )}
      </nav>
    </header>
  );
}

// ── Subcomponent: invite code display ──
function CoupleInvite({ coupleInfo }) {
  const [copied, setCopied] = useState(false);
  const code = coupleInfo?.couple?.invite_code;

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="ud-invite">
      <span className="ud-invite-label">Código para invitar:</span>
      <div className="ud-invite-row">
        <span className="ud-invite-code">{code}</span>
        <button className="ud-invite-copy" onClick={copy}>
          {copied ? "✓" : "Copiar"}
        </button>
      </div>
    </div>
  );
}

// ── Subcomponent: couple setup (generate or join) ──
function CoupleSetup({ onDone }) {
  const [mode,      setMode]      = useState(null); // "create" | "join"
  const [code,      setCode]      = useState("");
  const [loading,   setLoading]   = useState(false);
  const [inviteRes, setInviteRes] = useState(null);
  const [error,     setError]     = useState("");

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/couples/generate-invite", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setInviteRes(data);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/couples/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_code: code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      onDone();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  if (inviteRes) {
    return (
      <div className="ud-invite">
        <span className="ud-invite-label">Tu código de invitación:</span>
        <div className="ud-invite-row">
          <span className="ud-invite-code">{inviteRes.invite_code}</span>
        </div>
        <span style={{ fontSize: 11, color: "var(--text-3)" }}>
          Compártelo con tu pareja
        </span>
      </div>
    );
  }

  if (mode === "create") {
    return (
      <div className="ud-setup">
        {error && <span className="ud-error">{error}</span>}
        <button className="ud-setup-btn primary" onClick={handleCreate} disabled={loading}>
          {loading ? "Creando..." : "Generar código"}
        </button>
        <button className="ud-setup-btn" onClick={() => setMode(null)}>Cancelar</button>
      </div>
    );
  }

  if (mode === "join") {
    return (
      <div className="ud-setup">
        {error && <span className="ud-error">{error}</span>}
        <input
          className="ud-setup-input"
          placeholder="Código de pareja"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          autoCapitalize="characters"
        />
        <button className="ud-setup-btn primary" onClick={handleJoin} disabled={loading || !code}>
          {loading ? "Uniéndose..." : "Unirse"}
        </button>
        <button className="ud-setup-btn" onClick={() => setMode(null)}>Cancelar</button>
      </div>
    );
  }

  return (
    <div className="ud-setup">
      <span className="ud-couple-label" style={{ marginBottom: 6 }}>Sin pareja vinculada</span>
      <button className="ud-setup-btn primary" onClick={() => setMode("create")}>
        Crear código de pareja
      </button>
      <button className="ud-setup-btn" onClick={() => setMode("join")}>
        Unirme con código
      </button>
    </div>
  );
}

export default Header;
