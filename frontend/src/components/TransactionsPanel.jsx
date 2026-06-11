import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:8000";

const STATUS_RES = {
  confirmed:  { label: "Confirmée",  cls: "badge-success"  },
  pending:    { label: "En attente", cls: "badge-warning"  },
  cancelled:  { label: "Annulée",    cls: "badge-muted"    },
  refunded:   { label: "Remboursée", cls: "badge-primary"  },
  sold:       { label: "Vendu",      cls: "badge-danger"   },
};

const STATUS_TX = {
  paid:       { label: "Payé",        cls: "badge-success" },
  pending:    { label: "En attente",  cls: "badge-warning" },
  cancelled:  { label: "Annulé",      cls: "badge-muted"   },
  refunded:   { label: "Remboursé",   cls: "badge-primary" },
  failed:     { label: "Échoué",      cls: "badge-danger"  },
};

export function TransactionsPanel({ token }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [actionMsg, setActionMsg]       = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/reservations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setReservations(await res.json());
    } finally { setLoading(false); }
  };

  const updateStatus = async (resId, status) => {
    const res = await fetch(`${API_URL}/api/v1/reservations/${resId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) { setActionMsg({ type: "error", msg: "Action impossible." }); return; }
    const labels = { sold: "bien marqué vendu", cancelled: "réservation annulée", refunded: "remboursement effectué" };
    setActionMsg({ type: "success", msg: `✅ ${labels[status] || status}` });
    await load();
  };

  useEffect(() => { load(); }, [token]);

  return (
    <section className="card">
      <h2>💳 Transactions &amp; Réservations</h2>

      {loading && <p className="loading-text">Chargement...</p>}

      {!loading && reservations.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🧾</div>
          <p>Aucune réservation pour l'instant.</p>
        </div>
      )}

      {reservations.length > 0 && (
        <div className="transactions-list">
          {reservations.map((r) => {
            const rs = STATUS_RES[r.status] || STATUS_RES.pending;
            const tx = r.transaction ? (STATUS_TX[r.transaction.status] || STATUS_TX.pending) : null;
            return (
              <div key={r.id} className="transaction-item">
                <div className="tx-header">
                  <div>
                    <span className="tx-id">#{r.id}</span>
                    <span className={`badge ${rs.cls}`}>{rs.label}</span>
                    {tx && <span className={`badge ${tx.cls}`}>Paiement : {tx.label}</span>}
                  </div>
                  <div className="tx-date">{new Date(r.created_at).toLocaleDateString("fr-FR")}</div>
                </div>

                <div className="tx-details">
                  <div><span className="tx-label">Bien ID</span><strong>#{r.property_id}</strong></div>
                  <div><span className="tx-label">Client ID</span><strong>#{r.user_id}</strong></div>
                  <div><span className="tx-label">Acompte</span><strong style={{ color: "var(--primary)" }}>{r.amount.toLocaleString("fr-FR")} €</strong></div>
                  {r.transaction && (
                    <div><span className="tx-label">Méthode</span><strong>{r.transaction.payment_method}</strong></div>
                  )}
                </div>

                {/* Actions admin */}
                {r.status !== "sold" && r.status !== "refunded" && r.status !== "cancelled" && (
                  <div className="tx-actions">
                    {r.status === "confirmed" && (
                      <button
                        type="button" className="btn-primary"
                        style={{ fontSize: "0.78rem", height: "30px", padding: "0 0.75rem" }}
                        onClick={() => updateStatus(r.id, "sold")}
                      >
                        ✅ Marquer vendu
                      </button>
                    )}
                    <button
                      type="button" className="btn-secondary"
                      style={{ fontSize: "0.78rem", height: "30px", padding: "0 0.75rem" }}
                      onClick={() => updateStatus(r.id, "refunded")}
                    >
                      ↩ Rembourser
                    </button>
                    <button
                      type="button"
                      style={{ fontSize: "0.78rem", height: "30px", padding: "0 0.75rem", background: "#f8d7da", color: "#721c24", border: "1px solid #f5c6cb", borderRadius: "8px", cursor: "pointer" }}
                      onClick={() => updateStatus(r.id, "cancelled")}
                    >
                      ✕ Annuler
                    </button>
                  </div>
                )}
              </div>
            );
          })}
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
