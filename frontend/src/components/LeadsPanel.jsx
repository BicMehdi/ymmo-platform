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
        <p>Connecte-toi pour voir les demandes.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Demandes {canManage ? "agence" : "client"}</h2>
      {canManage && (
        <div className="inline-actions">
          <button type="button" onClick={() => setStatusFilter("")}>Toutes</button>
          <button type="button" onClick={() => setStatusFilter("new")}>Nouvelles</button>
          <button type="button" onClick={() => setStatusFilter("in_progress")}>En cours</button>
          <button type="button" onClick={() => setStatusFilter("closed")}>Cloturees</button>
        </div>
      )}

      {leads.length === 0 ? (
        <p>Aucune demande.</p>
      ) : (
        <ul className="property-list">
          {leads.map((lead) => (
            <li key={lead.id}>
              <h3>Demande #{lead.id}</h3>
              <p>Bien: {lead.property_id}</p>
              <p>Statut: {lead.status}</p>
              <p>{lead.message}</p>
              {canManage && (
                <div className="inline-actions">
                  <button type="button" onClick={() => updateStatus(lead.id, "in_progress")}>Passer en cours</button>
                  <button type="button" onClick={() => updateStatus(lead.id, "closed")}>Clore</button>
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
