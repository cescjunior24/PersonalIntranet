import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "var(--bg)",
      }}>
        <div style={{
          fontSize: 32,
          animation: "heartbeat 1.4s ease-in-out infinite",
          background: "linear-gradient(135deg, #6366f1, #f43f5e)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>♥</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return children;
}

export default ProtectedRoute;
