import React, { useState } from "react";

export function AnalyticsBox({ overview, onEstimate, estimatedPrice }) {
  const [city, setCity] = useState("Marseille");
  const [area, setArea] = useState(60);
  const [rooms, setRooms] = useState(3);
  const [estimating, setEstimating] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setEstimating(true);
    await onEstimate({ city, area_m2: Number(area), rooms: Number(rooms) });
    setEstimating(false);
  };

  const pricePerM2 = overview.avg_price > 0 && area > 0
    ? Math.round(overview.avg_price / 65)
    : null;

  return (
    <section className="card">
      <h2>Tableau de bord</h2>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">🏡</div>
          <div className="kpi-value">{overview.properties_count}</div>
          <div className="kpi-label">Biens publiés</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">📋</div>
          <div className="kpi-value">{overview.leads_count}</div>
          <div className="kpi-label">Demandes</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">💶</div>
          <div className="kpi-value" style={{ fontSize: "1.05rem" }}>
            {overview.avg_price > 0 ? `${Math.round(overview.avg_price / 1000)}k €` : "—"}
          </div>
          <div className="kpi-label">Prix moyen</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">📐</div>
          <div className="kpi-value" style={{ fontSize: "1.05rem" }}>
            {pricePerM2 ? `${pricePerM2.toLocaleString("fr-FR")} €` : "—"}
          </div>
          <div className="kpi-label">Estim. / m²</div>
        </div>
      </div>

      {/* Estimation */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginTop: "0.25rem" }}>
        <h3>Estimation rapide</h3>
        <form onSubmit={submit} className="estimate-form">
          <div className="field">
            <label htmlFor="est-city">Ville</label>
            <input id="est-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex: Marseille" required />
          </div>
          <div className="field">
            <label htmlFor="est-area">Surface (m²)</label>
            <input id="est-area" type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Ex: 60" required min="1" />
          </div>
          <div className="field">
            <label htmlFor="est-rooms">Pièces</label>
            <input id="est-rooms" type="number" value={rooms} onChange={(e) => setRooms(e.target.value)} placeholder="Ex: 3" required min="1" />
          </div>
          <div className="form-full">
            <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={estimating}>
              {estimating ? "Estimation en cours..." : "Estimer le prix"}
            </button>
          </div>
        </form>

        {estimatedPrice !== null && (
          <div className="kpi-card" style={{ marginTop: "0.75rem", background: "rgba(47,93,58,0.07)", borderColor: "var(--primary)" }}>
            <div className="kpi-icon">🎯</div>
            <div className="kpi-value">{estimatedPrice.toLocaleString("fr-FR")} €</div>
            <div className="kpi-label">Estimation IA</div>
          </div>
        )}
      </div>
    </section>
  );
}
