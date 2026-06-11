import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:8000";

const STATUS = {
  confirmed: { label: "Confirmée",  cls: "badge-success", icon: "✅" },
  pending:   { label: "En attente", cls: "badge-warning",  icon: "⏳" },
  cancelled: { label: "Annulée",    cls: "badge-muted",    icon: "✕"  },
  refunded:  { label: "Remboursée", cls: "badge-primary",  icon: "↩"  },
  sold:      { label: "Vendu",      cls: "badge-danger",   icon: "🏠" },
};

const fmt = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n ?? 0);

const fmtDate = (d) =>
  new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function MesAchatsPanel({ token, onOpenDetail }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [expanded, setExpanded]         = useState(null);

  useEffect(() => {
    if (!token) { setReservations([]); return; }
    setLoading(true);
    fetch(`${API_URL}/api/v1/reservations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : [])
      .then(setReservations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) return null;

  const totalAcomptes = reservations.reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <section className="card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h2 style={{ margin: 0 }}>🛒 Mes achats</h2>
        {reservations.length > 0 && (
          <span style={{ fontSize: "0.78rem", color: "var(--text-soft)", background: "var(--surface-muted)", padding: "0.2rem 0.6rem", borderRadius: "8px" }}>
            {reservations.length} achat{reservations.length > 1 ? "s" : ""} · {fmt(totalAcomptes)} acomptes
          </span>
        )}
      </div>

      {loading && <p className="loading-text">Chargement...</p>}

      {!loading && reservations.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <p>Vous n'avez pas encore réservé de bien.</p>
        </div>
      )}

      {reservations.map((r) => {
        const sc = STATUS[r.status] || STATUS.pending;
        const isOpen = expanded === r.id;
        return (
          <div key={r.id} className="mes-achat-card">
            {/* En-tête cliquable */}
            <button
              type="button"
              className="mes-achat-header"
              onClick={() => setExpanded(isOpen ? null : r.id)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "1.4rem" }}>{sc.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.property?.title ?? `Bien #${r.property_id}`}
                  </div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-soft)" }}>
                    📍 {r.property?.city ?? "—"} · {fmtDate(r.created_at)}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                <span className={`badge ${sc.cls}`}>{sc.label}</span>
                <span style={{ fontSize: "0.65rem", color: "var(--text-soft)" }}>{isOpen ? "▲" : "▼"}</span>
              </div>
            </button>

            {/* Détail dépliable */}
            {isOpen && (
              <div className="mes-achat-detail">
                <div className="achat-detail-grid">
                  <div>
                    <span className="tx-label">Prix du bien</span>
                    <strong style={{ color: "var(--primary)" }}>{fmt(r.property?.price)}</strong>
                  </div>
                  <div>
                    <span className="tx-label">Acompte versé</span>
                    <strong style={{ color: "var(--success)" }}>{fmt(r.amount)}</strong>
                  </div>
                  <div>
                    <span className="tx-label">Type</span>
                    <strong style={{ textTransform: "capitalize" }}>{r.property?.property_type ?? "—"}</strong>
                  </div>
                  <div>
                    <span className="tx-label">Surface</span>
                    <strong>{r.property?.area_m2 ?? "—"} m²</strong>
                  </div>
                  {r.transaction && (
                    <div>
                      <span className="tx-label">Paiement</span>
                      <strong style={{ textTransform: "uppercase" }}>{r.transaction.payment_method} · {r.transaction.status}</strong>
                    </div>
                  )}
                  <div>
                    <span className="tx-label">Réf.</span>
                    <strong>#{r.id}</strong>
                  </div>
                </div>

                {onOpenDetail && r.property_id && (
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ marginTop: "0.75rem", fontSize: "0.82rem", height: "34px" }}
                    onClick={() => onOpenDetail(r.property_id)}
                  >
                    🏠 Voir la fiche du bien
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
