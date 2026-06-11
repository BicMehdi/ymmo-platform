import React, { useEffect, useRef, useState } from "react";

const API_URL = "http://localhost:8000";

const STATUS = {
  pending:   { label: "En attente",  cls: "badge-warning" },
  accepted:  { label: "Acceptée",    cls: "badge-success" },
  rejected:  { label: "Refusée",     cls: "badge-muted"   },
  cancelled: { label: "Annulée",     cls: "badge-muted"   },
  sold:      { label: "Vendu",       cls: "badge-danger"  },
  // legacy
  confirmed: { label: "Confirmée",   cls: "badge-success" },
  refunded:  { label: "Remboursée",  cls: "badge-primary" },
};

const TX_STATUS = {
  paid:      { label: "Payé",       cls: "badge-success" },
  cancelled: { label: "Annulé",     cls: "badge-muted"   },
  refunded:  { label: "Remboursé",  cls: "badge-primary" },
  failed:    { label: "Échoué",     cls: "badge-danger"  },
};

const fmt = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n ?? 0);

const fmtDate = (d) =>
  new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function AchatsPanel({ token }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [selected, setSelected]         = useState(null);
  const [actionMsg, setActionMsg]       = useState(null);
  const msgTimer = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/reservations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReservations(data);
        // Rafraîchir le sélectionné si ouvert
        if (selected) {
          const updated = data.find((r) => r.id === selected.id);
          if (updated) setSelected(updated);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (resId, status) => {
    const res = await fetch(`${API_URL}/api/v1/reservations/${resId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      flash("error", "Action impossible.");
      return;
    }
    const updated = await res.json();
    setReservations((prev) => prev.map((r) => (r.id === resId ? updated : r)));
    setSelected(updated);
    const labels = {
      accepted:  "Demande acceptée ✅ — bien marqué réservé",
      sold:      "Bien marqué vendu 🏠",
      rejected:  "Demande refusée",
      cancelled: "Annulation effectuée",
    };
    flash("success", labels[status] || status);
  };

  const flash = (type, msg) => {
    setActionMsg({ type, msg });
    clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setActionMsg(null), 3500);
  };

  useEffect(() => { load(); }, [token]);
  useEffect(() => () => clearTimeout(msgTimer.current), []);

  const totalAcomptes = reservations.reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <section className="card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h2 style={{ margin: 0 }}>🛒 Achats &amp; Réservations</h2>
        {reservations.length > 0 && (
          <span style={{ fontSize: "0.78rem", color: "var(--text-soft)", background: "var(--surface-muted)", padding: "0.2rem 0.6rem", borderRadius: "8px" }}>
            {reservations.length} achat{reservations.length > 1 ? "s" : ""} · <strong>{fmt(totalAcomptes)}</strong> acomptes
          </span>
        )}
      </div>

      {loading && <p className="loading-text">Chargement...</p>}

      {!loading && reservations.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <p>Aucun achat enregistré.</p>
        </div>
      )}

      {reservations.length > 0 && (
        <div className="achats-table-wrap">
          <table className="achats-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Acheteur</th>
                <th>Bien</th>
                <th>Prix bien</th>
                <th>Acompte</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => {
                const sc = STATUS[r.status] || STATUS.pending;
                return (
                  <tr key={r.id} className="achats-row" onClick={() => setSelected(r)} title="Voir le détail">
                    <td style={{ color: "var(--text-soft)", fontWeight: 600 }}>#{r.id}</td>
                    <td style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.user?.email || `#${r.user_id}`}
                    </td>
                    <td style={{ maxWidth: "130px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.property?.title || `Bien #${r.property_id}`}
                    </td>
                    <td>{fmt(r.property?.price)}</td>
                    <td>{fmt(r.amount)}</td>
                    <td><span className={`badge ${sc.cls}`}>{sc.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {actionMsg && (
        <p
          className={`status-bar ${actionMsg.type === "success" ? "success" : "error"}`}
          role="alert"
          style={{ marginTop: "0.75rem" }}
        >
          {actionMsg.msg}
        </p>
      )}

      {/* ═══ MODAL DÉTAIL ═══ */}
      {selected && (
        <div
          className="achat-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div className="achat-modal">
            {/* Header */}
            <div className="achat-modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Achat #{selected.id}</h3>
                <span className={`badge ${STATUS[selected.status]?.cls}`}>
                  {STATUS[selected.status]?.label}
                </span>
              </div>
              <button className="achat-modal-close" onClick={() => setSelected(null)} aria-label="Fermer">✕</button>
            </div>

            {/* Body — 3 sections */}
            <div className="achat-modal-body">

              {/* Acheteur */}
              <div className="achat-section">
                <div className="achat-section-title">👤 Acheteur</div>
                <div className="achat-detail-grid">
                  <div>
                    <span className="tx-label">Email</span>
                    <strong>{selected.user?.email ?? "—"}</strong>
                  </div>
                  <div>
                    <span className="tx-label">Rôle</span>
                    <strong style={{ textTransform: "capitalize" }}>{selected.user?.role ?? "—"}</strong>
                  </div>
                  <div>
                    <span className="tx-label">Membre depuis</span>
                    <strong>{selected.user?.created_at ? fmtDate(selected.user.created_at) : "—"}</strong>
                  </div>
                </div>
              </div>

              {/* Bien */}
              <div className="achat-section">
                <div className="achat-section-title">🏠 Bien immobilier</div>
                <div className="achat-detail-grid">
                  <div>
                    <span className="tx-label">Titre</span>
                    <strong>{selected.property?.title ?? "—"}</strong>
                  </div>
                  <div>
                    <span className="tx-label">Ville</span>
                    <strong>{selected.property?.city ?? "—"}</strong>
                  </div>
                  <div>
                    <span className="tx-label">Prix affiché</span>
                    <strong style={{ color: "var(--primary)" }}>{fmt(selected.property?.price)}</strong>
                  </div>
                  <div>
                    <span className="tx-label">Type</span>
                    <strong style={{ textTransform: "capitalize" }}>{selected.property?.property_type ?? "—"}</strong>
                  </div>
                  <div>
                    <span className="tx-label">Surface</span>
                    <strong>{selected.property?.area_m2 ?? "—"} m²</strong>
                  </div>
                  <div>
                    <span className="tx-label">Statut bien</span>
                    <strong style={{ textTransform: "capitalize" }}>{selected.property?.status ?? "—"}</strong>
                  </div>
                </div>
              </div>

              {/* Transaction */}
              <div className="achat-section">
                <div className="achat-section-title">💳 Transaction</div>
                <div className="achat-detail-grid">
                  <div>
                    <span className="tx-label">Date</span>
                    <strong>{fmtDate(selected.created_at)}</strong>
                  </div>
                  <div>
                    <span className="tx-label">Acompte versé</span>
                    <strong style={{ color: "var(--success)" }}>{fmt(selected.amount)}</strong>
                  </div>
                  {selected.transaction && (
                    <>
                      <div>
                        <span className="tx-label">Paiement</span>
                        <span className={`badge ${TX_STATUS[selected.transaction.status]?.cls}`}>
                          {TX_STATUS[selected.transaction.status]?.label ?? selected.transaction.status}
                        </span>
                      </div>
                      <div>
                        <span className="tx-label">Méthode</span>
                        <strong style={{ textTransform: "uppercase" }}>{selected.transaction.payment_method}</strong>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="achat-modal-actions">
              {selected.status !== "accepted" && selected.status !== "sold" && selected.status !== "rejected" && selected.status !== "cancelled" && (
                <button
                  className="btn-primary"
                  style={{ fontSize: "0.82rem", height: "34px", background: "var(--primary)" }}
                  onClick={() => updateStatus(selected.id, "accepted")}
                >
                  ✅ Accepter la demande
                </button>
              )}
              {selected.status !== "sold" && selected.status !== "rejected" && selected.status !== "cancelled" && (
                <button
                  className="btn-primary"
                  style={{ fontSize: "0.82rem", height: "34px", background: "var(--success)" }}
                  onClick={() => updateStatus(selected.id, "sold")}
                >
                  🏠 Marquer vendu
                </button>
              )}
              {selected.status === "pending" && (
                <button
                  className="btn-ghost"
                  style={{ fontSize: "0.82rem", height: "34px" }}
                  onClick={() => updateStatus(selected.id, "rejected")}
                >
                  ✕ Refuser
                </button>
              )}
              {(selected.status === "pending" || selected.status === "accepted") && (
                <button
                  className="btn-primary"
                  style={{ fontSize: "0.82rem", height: "34px", background: "var(--danger)" }}
                  onClick={() => updateStatus(selected.id, "cancelled")}
                >
                  🗑 Annuler
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
