import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:8000";

const ROLE_CONFIG = {
  admin:  { label: "Admin",  cls: "badge-danger"   },
  agent:  { label: "Agent",  cls: "badge-warning"  },
  client: { label: "Client", cls: "badge-primary"  },
};

export function AdminPanel({ token }) {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (userId, newRole) => {
    const res = await fetch(`${API_URL}/api/v1/auth/users/${userId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role: newRole }),
    });
    if (!res.ok) {
      setMessage({ type: "error", msg: "Erreur lors du changement de rôle." });
      return;
    }
    setMessage({ type: "success", msg: `Rôle mis à jour → ${newRole}` });
    await loadUsers();
  };

  useEffect(() => { loadUsers(); }, [token]);

  return (
    <section className="card">
      <h2>🛡 Gestion des utilisateurs</h2>

      {loading && <p className="loading-text">Chargement...</p>}

      {!loading && users.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <p>Aucun utilisateur.</p>
        </div>
      )}

      {users.length > 0 && (
        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {users.map((u) => {
            const rc = ROLE_CONFIG[u.role] || ROLE_CONFIG.client;
            return (
              <li key={u.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: "0.5rem", padding: "0.65rem 0.8rem",
                border: "1px solid var(--border)", borderRadius: "10px",
                flexWrap: "wrap",
              }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem", flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.email}
                  </span>
                  <span className={`badge ${rc.cls}`} style={{ alignSelf: "flex-start" }}>{rc.label}</span>
                </div>
                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                  {u.role !== "client" && (
                    <button type="button" style={{ height: "30px", fontSize: "0.75rem", padding: "0 0.6rem", borderRadius: "7px", background: "var(--surface-muted)", color: "var(--text)", border: "1px solid var(--border)" }}
                      onClick={() => changeRole(u.id, "client")}>
                      → Client
                    </button>
                  )}
                  {u.role !== "agent" && (
                    <button type="button" style={{ height: "30px", fontSize: "0.75rem", padding: "0 0.6rem", borderRadius: "7px", background: "#fff3cd", color: "#856404", border: "1px solid #ffc107" }}
                      onClick={() => changeRole(u.id, "agent")}>
                      → Agent
                    </button>
                  )}
                  {u.role !== "admin" && (
                    <button type="button" style={{ height: "30px", fontSize: "0.75rem", padding: "0 0.6rem", borderRadius: "7px", background: "#f8d7da", color: "#721c24", border: "1px solid #f5c6cb" }}
                      onClick={() => changeRole(u.id, "admin")}>
                      → Admin
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {message && (
        <p className={`status-bar ${message.type === "success" ? "success" : "error"}`} role="alert" style={{ marginTop: "0.75rem" }}>
          {message.msg}
        </p>
      )}
    </section>
  );
}
