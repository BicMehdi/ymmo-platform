import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:8000";

const STATUS = {
  confirmed: { label: "Confirmée",  cls: "badge-success" },
  pending:   { label: "En attente", cls: "badge-warning" },
  cancelled: { label: "Annulée",    cls: "badge-muted"   },
  refunded:  { label: "Remboursée", cls: "badge-primary" },
  sold:      { label: "Vendu",      cls: "badge-danger"  },
};

const fmt = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n ?? 0);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

export function AgentReservationsPanel({ token }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading]           = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_URL}/api/v1/reservations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : [])
      .then(setReservations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
