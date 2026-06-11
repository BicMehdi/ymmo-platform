import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:8000";

export function LeadsPanel({ token, userRole }) {
  const [leads, setLeads] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [message, setMessage] = useState("");

  const canManage = userRole === "agent" || userRole === "admin";
  const canViewOwn = userRole === "client";

  const loadLeads = async () => {
    if (!token || (!canManage && !canViewOwn)) {
      setLeads([]);
      return;
    }

    const url = canManage
      ? `${API_URL}/api/v1/leads/agent${statusFilter ? `?status=${statusFilter}` : ""}`
      : `${API_URL}/api/v1/leads/me`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      setMessage("Impossible de charger les demandes");
      return;
    }

    const data = await response.json();
    setLeads(data);
  };

  const updateStatus = async (leadId, status) => {
    const response = await fetch(`${API_URL}/api/v1/leads/${leadId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      setMessage("Mise a jour impossible");
      return;
    }

    setMessage("Statut mis a jour");
    await loadLeads();
  };

  useEffect(() => {
    loadLeads();
  }, [token, userRole, statusFilter]);

  if (!token) {
    return (
      <section className="card">
        <h2>Demandes</h2>
        <div className="empty-state">
          <div className="empty-state-icon">🔐</div>
          <p>Connectez-vous pour voir les demandes.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Demandes {canManage ? "agence" : "client"}</h2>
      {canManage && (
        <div className="filter-tabs">
          <button type="button" className={statusFilter === "" ? "active" : ""} onClick={() => setStatusFilter("")}>Toutes</button>
          <button type="button" className={statusFilter === "new" ? "active" : ""} onClick={() => setStatusFilter("new")}>Nouvelles</button>
          <button type="button" className={statusFilter === "in_progress" ? "active" : ""} onClick={() => setStatusFilter("in_progress")}>En cours</button>
          <button type="button" className={statusFilter === "closed" ? "active" : ""} onClick={() => setStatusFilter("closed")}>Clôturées</button>
        </div>
      )}

      {leads.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <p>Aucune demande.</p>
        </div>
      ) : (
        <ul className="property-list">
          {leads.map((lead) => (
            <li key={lead.id} className="lead-item">
              <h3>Demande #{lead.id} — Bien #{lead.property_id}</h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-soft)" }}>{lead.message}</p>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.25rem", flexWrap: "wrap" }}>
                <span className={`badge ${
                  lead.status === "new" ? "badge-primary" :
                  lead.status === "in_progress" ? "badge-warning" : "badge-muted"
                }`}>
                  {lead.status === "new" ? "Nouvelle" : lead.status === "in_progress" ? "En cours" : "Clôturée"}
                </span>
              </div>
              {canManage && (
                <div className="lead-actions">
                  <button type="button" className="btn-ghost" onClick={() => updateStatus(lead.id, "in_progress")}>En cours</button>
                  <button type="button" className="btn-ghost" onClick={() => updateStatus(lead.id, "closed")}>Clore</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {message && <p>{message}</p>}
    </section>
  );
}
