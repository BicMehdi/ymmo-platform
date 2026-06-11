import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:8000";

const ROLE_CONFIG = {
  super_admin: { label: "Super Admin", cls: "badge-danger"   },
  admin:       { label: "Admin",       cls: "badge-warning"  },
  agent:       { label: "Agent",       cls: "badge-primary"  },
  client:      { label: "Client",      cls: "badge-muted"    },
};

/* Boutons disponibles selon le rôle du connecté */
function getRoleButtons(u, myRole) {
  // super_admin : accès total sur tout le monde
  if (myRole === "super_admin") {
    const btns = [];
    if (u.role !== "client")      btns.push({ role: "client",      label: "→ Client",      bg: "var(--surface-muted)", color: "var(--text)",    border: "var(--border)" });
    if (u.role !== "agent")       btns.push({ role: "agent",       label: "→ Agent",       bg: "#fff3cd",             color: "#856404",         border: "#ffc107" });
    if (u.role !== "admin")       btns.push({ role: "admin",       label: "→ Admin",       bg: "#f8d7da",             color: "#721c24",         border: "#f5c6cb" });
    if (u.role !== "super_admin") btns.push({ role: "super_admin", label: "→ Super Admin", bg: "#e8d5f5",             color: "#4a0072",         border: "#b39ddb" });
    return btns;
  }

  // Admin : ne peut pas toucher aux admins / super_admins
  if (u.role === "super_admin" || u.role === "admin") {
    return <span style={{ fontSize: "0.75rem", color: "var(--text-soft)", fontStyle: "italic" }}>🔒 Protégé</span>;
  }
  const btns = [];
  if (u.role !== "client") btns.push({ role: "client", label: "→ Client", bg: "var(--surface-muted)", color: "var(--text)", border: "var(--border)" });
  if (u.role !== "agent")  btns.push({ role: "agent",  label: "→ Agent",  bg: "#fff3cd",             color: "#856404",     border: "#ffc107" });
  return btns;
}

export function AdminPanel({ token, currentUserRole }) {
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
    setMessage(null);
    const res = await fetch(`${API_URL}/api/v1/auth/users/${userId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role: newRole }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage({ type: "error", msg: data.detail || "Erreur lors du changement de rôle." });
      return;
    }
    setMessage({ type: "success", msg: `✅ Rôle mis à jour → ${newRole}` });
    await loadUsers();
  };

  useEffect(() => { loadUsers(); }, [token]);

  const myRole = currentUserRole;

  return (
    <section className="card">
      <h2>🛡 Gestion des utilisateurs</h2>
      {myRole === "super_admin" && (
        <p style={{ fontSize: "0.8rem", color: "var(--text-soft)", marginBottom: "0.75rem", background: "var(--surface-muted)", padding: "0.5rem 0.75rem", borderRadius: "8px" }}>
          👑 Vous êtes <strong>Super Admin</strong> — accès total, aucune restriction.
        </p>
      )}
      {myRole === "admin" && (
        <p style={{ fontSize: "0.8rem", color: "var(--text-soft)", marginBottom: "0.75rem", background: "var(--surface-muted)", padding: "0.5rem 0.75rem", borderRadius: "8px" }}>
          🛡 Vous êtes <strong>Admin</strong> — vous pouvez promouvoir des clients en agents.
        </p>
      )}

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
            const btns = getRoleButtons(u, myRole);
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
                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
                  {Array.isArray(btns) ? btns.map((b) => (
                    <button
                      key={b.role} type="button"
                      style={{ height: "30px", fontSize: "0.75rem", padding: "0 0.6rem", borderRadius: "7px", background: b.bg, color: b.color, border: `1px solid ${b.border}`, cursor: "pointer" }}
                      onClick={() => changeRole(u.id, b.role)}
                    >
                      {b.label}
                    </button>
                  )) : btns}
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
                  {u.role === "admin" ? (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-soft)", fontStyle: "italic", padding: "0 0.4rem" }}>🔒 Protégé</span>
                  ) : (
                    <>
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
                    </>
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
