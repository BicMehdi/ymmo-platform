import React, { useState } from "react";

export function AnalyticsBox({ overview, onEstimate }) {
  const [city, setCity] = useState("Marseille");
  const [area, setArea] = useState(60);
  const [rooms, setRooms] = useState(3);

  const submit = async (event) => {
    event.preventDefault();
    onEstimate({ city, area_m2: Number(area), rooms: Number(rooms) });
  };

  return (
    <section className="card">
      <h2>Dashboard</h2>
      <div className="stat-row">
        <div className="stat-item">
          <span className="stat-label">Biens publiés</span>
          <strong>{overview.properties_count}</strong>
        </div>
        <div className="stat-item">
          <span className="stat-label">Demandes</span>
          <strong>{overview.leads_count}</strong>
        </div>
        <div className="stat-item">
          <span className="stat-label">Prix moyen</span>
          <strong>{overview.avg_price.toLocaleString("fr-FR")} €</strong>
        </div>
      </div>

      <form onSubmit={submit} className="estimate-form">
        <h3>Estimation rapide</h3>
        <div className="field">
          <label htmlFor="est-city">Ville *</label>
          <input id="est-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex: Marseille" required />
        </div>
        <div className="field">
          <label htmlFor="est-area">Surface (m²) *</label>
          <input id="est-area" type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Ex: 60" required />
        </div>
        <div className="field">
          <label htmlFor="est-rooms">Pièces *</label>
          <input id="est-rooms" type="number" value={rooms} onChange={(e) => setRooms(e.target.value)} placeholder="Ex: 3" required />
        </div>
        <button type="submit">Estimer</button>
      </form>
    </section>
  );
}
