import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:8000";

const fmtPrice = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n ?? 0);

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
  const [users, setUsers]           = useState([]);
  const [reservations, setReservations] = useState([]);
  const [message, setMessage]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const [expandedUsers, setExpandedUsers] = useState(new Set());

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [usersRes, resRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/auth/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/v1/reservations`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (usersRes.ok) setUsers(await usersRes.json());
      if (resRes.ok) setReservations(await resRes.json());
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

  // Grouper les réservations par user_id pour le bonus achats
  const purchasesByUser = reservations.reduce((acc, r) => {
    const uid = r.user_id;
    if (!acc[uid]) acc[uid] = [];
    acc[uid].push(r);
    return acc;
  }, {});

  const toggleExpand = (uid) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });
  };

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
            const userPurchases = purchasesByUser[u.id] || [];
            const totalAmount = userPurchases.reduce((s, r) => s + (r.amount || 0), 0);
            const isExpanded = expandedUsers.has(u.id);
            return (
              <li key={u.id} style={{
                display: "flex", flexDirection: "column",
                gap: "0.5rem", padding: "0.65rem 0.8rem",
                border: "1px solid var(--border)", borderRadius: "10px",
              }}>
                {/* Ligne principale : email + rôle + boutons */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
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
                </div>

                {/* Bonus achats */}
                {userPurchases.length > 0 && (
                  <div style={{ paddingTop: "0.4rem", borderTop: "1px solid var(--border)" }}>
                    <button
                      type="button"
                      onClick={() => toggleExpand(u.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "0.78rem", color: "var(--primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}
                    >
                      🛒 {userPurchases.length} achat{userPurchases.length > 1 ? "s" : ""} · {fmtPrice(totalAmount)}
                      <span style={{ fontSize: "0.65rem", color: "var(--text-soft)" }}>{isExpanded ? "▲" : "▼"}</span>
                    </button>
                    {isExpanded && (
                      <ul style={{ marginTop: "0.4rem", paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                        {userPurchases.map((r) => (
                          <li key={r.id} style={{ fontSize: "0.78rem", color: "var(--text)" }}>
                            <strong>{r.property?.title ?? `Bien #${r.property_id}`}</strong>
                            {" — "}
                            <span style={{ color: "var(--text-soft)" }}>acompte {fmtPrice(r.amount)}</span>
                            {" · "}
                            <span className={`badge badge-${r.status === "sold" ? "danger" : r.status === "confirmed" ? "success" : "warning"}`} style={{ fontSize: "0.68rem" }}>{r.status}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
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
