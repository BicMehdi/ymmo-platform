import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:8000";

const STATUS = {
  pending:   { label: "En attente", cls: "badge-warning" },
  accepted:  { label: "Acceptée",   cls: "badge-success" },
  rejected:  { label: "Refusée",    cls: "badge-muted"   },
  cancelled: { label: "Annulée",    cls: "badge-muted"   },
  sold:      { label: "Vendu",      cls: "badge-danger"  },
  confirmed: { label: "Confirmée",  cls: "badge-success" },
};

const fmt = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n ?? 0);

const fmtDate = (d) =>
  new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function AgentReservationsPanel({ token }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [actionMsg, setActionMsg]       = useState(null);

  const load = () => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_URL}/api/v1/reservations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : [])
      .then(setReservations)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const updateStatus = async (resId, status) => {
    const res = await fetch(`${API_URL}/api/v1/reservations/${resId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setActionMsg({ type: "error", msg: err.detail || "Action impossible." });
      return;
    }
    const labels = { confirmed: "Réservation confirmée ✅", sold: "Bien marqué vendu 🏠" };
    setActionMsg({ type: "success", msg: labels[status] || status });
    load();
    setTimeout(() => setActionMsg(null), 3000);
  };

  useEffect(() => { load(); }, [token]);

  const totalAcomptes = reservations.reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <section className="card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h2 style={{ margin: 0 }}>📋 Réservations sur mes biens</h2>
        {reservations.length > 0 && (
          <span style={{ fontSize: "0.78rem", color: "var(--text-soft)", background: "var(--surface-muted)", padding: "0.2rem 0.6rem", borderRadius: "8px" }}>
            {reservations.length} · {fmt(totalAcomptes)} acomptes
          </span>
        )}
      </div>

      {loading && <p className="loading-text">Chargement...</p>}

      {!loading && reservations.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p>Aucune réservation sur vos biens.</p>
        </div>
      )}

      {reservations.length > 0 && (
        <div className="achats-table-wrap">
          <table className="achats-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Bien</th>
                <th>Acompte</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => {
                const sc = STATUS[r.status] || STATUS.pending;
                return (
                  <tr key={r.id}>
                    <td style={{ maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.82rem" }}>
                      {r.user?.email ?? `#${r.user_id}`}
                    </td>
                    <td style={{ maxWidth: "130px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.82rem" }}>
                      {r.property?.title ?? `Bien #${r.property_id}`}
                    </td>
                    <td style={{ fontWeight: 600, fontSize: "0.82rem" }}>{fmt(r.amount)}</td>
                    <td><span className={`badge ${sc.cls}`}>{sc.label}</span></td>
                    <td style={{ fontSize: "0.78rem", color: "var(--text-soft)" }}>{fmtDate(r.created_at)}</td>
                    <td>
                      <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                        {r.status === "pending" && (
                          <>
                            <button
                              type="button"
                              style={{ height: "26px", fontSize: "0.72rem", padding: "0 0.5rem", borderRadius: "6px", background: "#d4edda", color: "#155724", border: "1px solid #28a745", cursor: "pointer" }}
                              onClick={() => updateStatus(r.id, "accepted")}
                            >
                              ✅ Accepter
                            </button>
                            <button
                              type="button"
                              style={{ height: "26px", fontSize: "0.72rem", padding: "0 0.5rem", borderRadius: "6px", background: "#f8d7da", color: "#721c24", border: "1px solid #f5c6cb", cursor: "pointer" }}
                              onClick={() => updateStatus(r.id, "rejected")}
                            >
                              ✕ Refuser
                            </button>
                          </>
                        )}
                        {r.status === "accepted" && (
                          <button
                            type="button"
                            style={{ height: "26px", fontSize: "0.72rem", padding: "0 0.5rem", borderRadius: "6px", background: "#fff3cd", color: "#856404", border: "1px solid #ffc107", cursor: "pointer" }}
                            onClick={() => updateStatus(r.id, "sold")}
                          >
                            🏠 Marquer vendu
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {actionMsg && (
        <p className={`status-bar ${actionMsg.type === "success" ? "success" : "error"}`} role="alert" style={{ marginTop: "0.75rem" }}>
          {actionMsg.msg}
        </p>
      )}
    </section>
  );
}
